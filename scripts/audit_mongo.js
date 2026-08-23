const fs = require('fs');
const { MongoClient } = require('mongodb');

let uri = 'mongodb://localhost:27017/bodhganga';
if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  const u = (envText.match(/MONGO_ROOT_USER=(.*)/) || [])[1];
  const p = (envText.match(/MONGO_ROOT_PASS=(.*)/) || [])[1];
  if (u && p) {
    uri = `mongodb://${encodeURIComponent(u.trim())}:${encodeURIComponent(p.trim())}@localhost:27017/bodhganga?authSource=admin`;
  }
}

async function audit() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const products = await db.collection('products').find({}).toArray();
  fs.writeFileSync('audit_mongo_results.json', JSON.stringify(products, null, 2));

  console.log(`Audited ${products.length} products. Details saved to audit_mongo_results.json.`);

  // Aggregate stats per state
  const stateStats = {};
  products.forEach(p => {
    const st = p.stateSlug || p.state || 'UNKNOWN_STATE';
    if (!stateStats[st]) {
      stateStats[st] = { state: st, total: 0, free: 0, paid: 0, unknown: 0, published: 0, products: [] };
    }
    const stat = stateStats[st];
    stat.total++;
    if (p.isPublished || p.published) stat.published++;

    const isF = (p.isFree === true || p.free === true);
    const isP = (p.isFree === false && p.free === false) || (p.price && p.price > 0);
    if (p.isFree === undefined && p.free === undefined) {
      stat.unknown++;
    } else if (isF) {
      stat.free++;
    } else {
      stat.paid++;
    }

    stat.products.push({
      id: p._id,
      title: p.title || p.displayTitle,
      district: p.districtSlug || p.district,
      isFree: p.isFree,
      free: p.free,
      price: p.price,
      s3Key: p.s3Key || p.storageKey,
      gdriveId: p.googleDriveFileId
    });
  });

  console.log("\n=== STATE SUMMARY TABLE ===");
  console.table(Object.values(stateStats).map(s => ({
    STATE: s.state,
    TOTAL: s.total,
    FREE: s.free,
    PAID: s.paid,
    UNKNOWN: s.unknown,
    PUBLISHED: s.published
  })));

  await client.close();
}

audit().catch(console.error);
