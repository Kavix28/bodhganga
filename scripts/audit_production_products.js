const fs = require('fs');
const { MongoClient } = require('mongodb');

let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';
if (!process.env.MONGO_URI && fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  const u = (envText.match(/MONGO_ROOT_USER=(.*)/) || [])[1];
  const p = (envText.match(/MONGO_ROOT_PASS=(.*)/) || [])[1];
  if (u && p) {
    uri = `mongodb://${encodeURIComponent(u.trim())}:${encodeURIComponent(p.trim())}@localhost:27017/bodhganga?authSource=admin`;
  }
}

async function audit() {
  console.log('[AUDIT] Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const products = await db.collection('products').find({}).toArray();
  console.log(`[AUDIT] Retreived ${products.length} product records.`);

  const anomalies = {
    isFreeTrueWithPaidPath: [],
    isFreeFalseWithFreePath: [],
    priceZeroWithPaidPath: [],
    paidPathWithPriceZero: [],
    missingIsFree: [],
    missingPrice: [],
    missingS3Key: [],
    missingStorageKey: [],
    s3KeyMismatchStorageKey: [],
    duplicateDriveIds: {},
    duplicateChecksums: {},
    duplicateS3Keys: {},
    unknownTierPaths: [],
    malformedPaths: [],
    outsideTierFolders: []
  };

  const driveIdMap = {};
  const checksumMap = {};
  const s3KeyMap = {};

  products.forEach(p => {
    const idStr = p._id.toString();
    const s3 = p.s3Key || '';
    const storage = p.storageKey || '';
    const isFree = p.isFree;
    const price = p.price;
    const driveId = p.googleDriveFileId;
    const checksum = p.checksum;
    const s3Lower = s3.toLowerCase();

    // 1. Path analysis
    const hasPaidInPath = s3Lower.includes('/paid/') || s3Lower.includes('paid-resources');
    const hasFreeInPath = s3Lower.includes('/free/') || s3Lower.includes('free-resources');
    const isMalformed = s3Lower.includes('paid-resources/free') || s3Lower.includes('free/paid');

    if (isMalformed) {
      anomalies.malformedPaths.push({ id: idStr, title: p.title, s3Key: s3 });
    }

    if (!hasPaidInPath && !hasFreeInPath && s3.length > 0) {
      anomalies.outsideTierFolders.push({ id: idStr, title: p.title, s3Key: s3 });
    }

    if (hasPaidInPath && hasFreeInPath && !isMalformed) {
      anomalies.unknownTierPaths.push({ id: idStr, title: p.title, s3Key: s3 });
    }

    // 2. State & Price Mismatches
    if (isFree === true && hasPaidInPath) {
      anomalies.isFreeTrueWithPaidPath.push({ id: idStr, title: p.title, isFree, s3Key: s3 });
    }
    if (isFree === false && hasFreeInPath) {
      anomalies.isFreeFalseWithFreePath.push({ id: idStr, title: p.title, isFree, s3Key: s3 });
    }
    if ((price === 0 || price === 0.0) && hasPaidInPath) {
      anomalies.priceZeroWithPaidPath.push({ id: idStr, title: p.title, price, s3Key: s3 });
    }

    // 3. Missing Fields
    if (isFree === undefined || isFree === null) {
      anomalies.missingIsFree.push({ id: idStr, title: p.title });
    }
    if (price === undefined || price === null) {
      anomalies.missingPrice.push({ id: idStr, title: p.title });
    }
    if (!s3) {
      anomalies.missingS3Key.push({ id: idStr, title: p.title });
    }
    if (!storage) {
      anomalies.missingStorageKey.push({ id: idStr, title: p.title });
    }
    if (s3 && storage && s3 !== storage) {
      anomalies.s3KeyMismatchStorageKey.push({ id: idStr, title: p.title, s3Key: s3, storageKey: storage });
    }

    // 4. Duplicate checks
    if (driveId) {
      if (!driveIdMap[driveId]) driveIdMap[driveId] = [];
      driveIdMap[driveId].push(idStr);
    }
    if (checksum) {
      if (!checksumMap[checksum]) checksumMap[checksum] = [];
      checksumMap[checksum].push(idStr);
    }
    if (s3) {
      if (!s3KeyMap[s3]) s3KeyMap[s3] = [];
      s3KeyMap[s3].push(idStr);
    }
  });

  Object.entries(driveIdMap).forEach(([k, v]) => {
    if (v.length > 1) anomalies.duplicateDriveIds[k] = v;
  });
  Object.entries(checksumMap).forEach(([k, v]) => {
    if (v.length > 1) anomalies.duplicateChecksums[k] = v;
  });
  Object.entries(s3KeyMap).forEach(([k, v]) => {
    if (v.length > 1) anomalies.duplicateS3Keys[k] = v;
  });

  const report = {
    totalAudited: products.length,
    timestamp: new Date().toISOString(),
    anomaliesSummary: {
      isFreeTrueWithPaidPathCount: anomalies.isFreeTrueWithPaidPath.length,
      isFreeFalseWithFreePathCount: anomalies.isFreeFalseWithFreePath.length,
      priceZeroWithPaidPathCount: anomalies.priceZeroWithPaidPath.length,
      missingIsFreeCount: anomalies.missingIsFree.length,
      missingPriceCount: anomalies.missingPrice.length,
      missingS3KeyCount: anomalies.missingS3Key.length,
      missingStorageKeyCount: anomalies.missingStorageKey.length,
      s3KeyMismatchStorageKeyCount: anomalies.s3KeyMismatchStorageKey.length,
      duplicateDriveIdsCount: Object.keys(anomalies.duplicateDriveIds).length,
      duplicateChecksumsCount: Object.keys(anomalies.duplicateChecksums).length,
      duplicateS3KeysCount: Object.keys(anomalies.duplicateS3Keys).length,
      unknownTierPathsCount: anomalies.unknownTierPaths.length,
      malformedPathsCount: anomalies.malformedPaths.length,
      outsideTierFoldersCount: anomalies.outsideTierFolders.length
    },
    anomaliesDetails: anomalies
  };

  fs.writeFileSync('audit_production_products_results.json', JSON.stringify(report, null, 2));

  console.log('\n==================================================');
  console.log('       MONGODB FORENSIC AUDIT SUMMARY TABLE       ');
  console.log('==================================================');
  console.table(report.anomaliesSummary);
  console.log('\nFull detail report written to audit_production_products_results.json.');

  await client.close();
}

audit().catch(err => {
  console.error('[AUDIT ERROR]', err);
  process.exit(1);
});
