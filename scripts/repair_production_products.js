const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// ── Environment Variable Loading ─────────────────────────────────────────────
function loadEnv() {
    if (fs.existsSync('.env')) {
        const envText = fs.readFileSync('.env', 'utf-8');
        const lines = envText.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                let val = trimmed.substring(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    }
}

loadEnv();

// ── S3 SDK Resolution ────────────────────────────────────────────────────────
let S3Client, CopyObjectCommand, HeadObjectCommand, DeleteObjectCommand;
try {
    const s3Sdk = require('@aws-sdk/client-s3');
    S3Client = s3Sdk.S3Client;
    CopyObjectCommand = s3Sdk.CopyObjectCommand;
    HeadObjectCommand = s3Sdk.HeadObjectCommand;
    DeleteObjectCommand = s3Sdk.DeleteObjectCommand;
} catch (e) {
    // S3 SDK missing - S3 operations will fail-fast with clear error
}

// ── Environment Configuration ────────────────────────────────────────────────
let MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI && process.env.MONGO_ROOT_USER && process.env.MONGO_ROOT_PASS) {
    const u = process.env.MONGO_ROOT_USER.trim();
    const p = process.env.MONGO_ROOT_PASS.trim();
    MONGO_URI = `mongodb://${encodeURIComponent(u)}:${encodeURIComponent(p)}@localhost:27017/bodhganga?authSource=admin`;
}
if (!MONGO_URI) {
    MONGO_URI = 'mongodb://localhost:27017/bodhganga';
}

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.QB_S3_BUCKET_NAME || 'bodhganga-pdf-storage-prod';
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';

// ── CLI Arguments Parsing ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');
const runS3Check = args.includes('--s3-check');

function getArgValue(flag) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) {
        return args[idx + 1];
    }
    return null;
}

const filterState = getArgValue('--state');
const filterDistrict = getArgValue('--district');

// ── S3 Client Factory ────────────────────────────────────────────────────────
function getS3Client() {
    if (!S3Client) {
        return null;
    }
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = AWS_REGION;

    if (accessKeyId && secretAccessKey) {
        return new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
    }
    try {
        return new S3Client({ region });
    } catch (e) {
        return null;
    }
}

// ── Tier & Slug Utilities ────────────────────────────────────────────────────
function normalizeFolderName(folderName) {
    if (!folderName) return '';
    return folderName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function generateSlug(name) {
    if (!name || name.trim() === '') return 'general';
    return name.toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function extractFileName(product) {
    if (product.fileName && typeof product.fileName === 'string' && product.fileName.trim() !== '') {
        return product.fileName.trim();
    }
    if (product.originalFileName && typeof product.originalFileName === 'string' && product.originalFileName.trim() !== '') {
        return product.originalFileName.trim();
    }
    const currentKey = product.s3Key || product.storageKey || '';
    if (currentKey) {
        const base = path.basename(currentKey).trim();
        if (base && base !== '.' && base !== '/' && !base.toLowerCase().includes('undefined') && !base.toLowerCase().includes('null')) {
            return base;
        }
    }
    return null;
}

// ── Canonical S3 Key Builder ──────────────────────────────────────────────────
function computeCanonicalS3Key(product, expectedIsFree) {
    const rawState = product.stateSlug || (product.state ? generateSlug(product.state) : null);
    const stateSlug = rawState && rawState !== 'undefined' && rawState !== 'null' ? rawState : 'general';

    const rawDistrict = product.districtSlug || (product.district ? generateSlug(product.district) : null);
    const districtSlug = rawDistrict && rawDistrict !== 'undefined' && rawDistrict !== 'null' ? rawDistrict : null;

    const fileName = extractFileName(product);
    if (!fileName || fileName.includes('undefined') || fileName.includes('null') || fileName.includes('[object Object]')) {
        return null;
    }

    const tier = expectedIsFree ? 'free' : 'paid';

    if (districtSlug && districtSlug !== 'general') {
        return `${stateSlug}/${districtSlug}/${tier}/${fileName}`;
    } else if (product.navbarSlug && product.navbarSlug !== 'general' && product.navbarSlug !== 'undefined') {
        return `${stateSlug}/${product.navbarSlug}/${fileName}`;
    } else {
        return `${stateSlug}/${tier}/${fileName}`;
    }
}

// ── Read-Only S3 Connectivity Check ──────────────────────────────────────────
async function performS3ConnectivityCheck(s3Client, products) {
    console.log('====================================================================');
    console.log('SAFE READ-ONLY S3 CONNECTIVITY CHECK');
    console.log('====================================================================');
    if (!s3Client) {
        console.log('❌ S3 configuration unavailable — NO S3 CLIENT COULD BE INITIALIZED.');
        console.log('S3 configuration unavailable — NO DATA MUTATED.\n');
        return false;
    }

    console.log(`Checking HeadObject against S3 Bucket: '${S3_BUCKET}'...\n`);
    let passCount = 0;
    let failCount = 0;

    for (const p of products) {
        const key = p.s3Key || p.storageKey;
        if (!key) {
            console.log(`  [SKIP] Product ID ${p._id}: missing S3 key.`);
            continue;
        }
        try {
            await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
            console.log(`  [OK]  Key '${key}' EXISTS in bucket.`);
            passCount++;
        } catch (err) {
            console.log(`  [FAIL] Key '${key}' NOT FOUND in bucket or access denied: ${err.message}`);
            failCount++;
        }
    }

    console.log(`\nS3 CHECK RESULTS: ${passCount} keys verified, ${failCount} missing/unreachable.\n`);
    return failCount === 0;
}

// ── Main Repair Execution ────────────────────────────────────────────────────
async function runRepair() {
    console.log('====================================================================');
    console.log('BODHGANGA PRODUCTION DATA REPAIR & RELOCATION TOOL');
    console.log('====================================================================');
    console.log(`MODE: ${isApply ? '⚠️ LIVE APPLY (MUTATING)' : '🔍 DRY RUN (READ ONLY)'}`);
    if (filterState) console.log(`FILTER STATE: ${filterState}`);
    if (filterDistrict) console.log(`FILTER DISTRICT: ${filterDistrict}`);
    console.log(`MONGO URI: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    console.log(`S3 BUCKET: ${S3_BUCKET}`);
    console.log('====================================================================\n');

    const client = new MongoClient(MONGO_URI);
    const s3Client = getS3Client();

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('products');

        const query = {};
        if (filterState) {
            query.$or = [
                { state: { $regex: filterState, $options: 'i' } },
                { stateSlug: { $regex: generateSlug(filterState), $options: 'i' } }
            ];
        }
        if (filterDistrict) {
            query.districtSlug = { $regex: generateSlug(filterDistrict), $options: 'i' };
        }

        const products = await collection.find(query).toArray();
        console.log(`Found ${products.length} product records matching filter.\n`);

        if (products.length === 0) {
            console.log('No records found for repair.');
            return;
        }

        // If explicit S3 check requested
        if (runS3Check) {
            await performS3ConnectivityCheck(s3Client, products);
            if (!isApply && !args.includes('--dry-run')) return;
        }

        // Check S3 readiness before live apply
        if (isApply && !s3Client) {
            console.error('❌ S3 configuration unavailable — NO DATA MUTATED.');
            throw new Error('S3 configuration unavailable — cannot execute live apply.');
        }

        // ── Backup Step (If --apply is set) ───────────────────────────────────
        if (isApply) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `backup_products_${timestamp}.json`;
            const backupPath = path.join(process.cwd(), backupFilename);
            fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
            console.log(`✅ TIMESTAMPED BACKUP SAVED TO: ${backupPath}\n`);
        }

        const report = [];
        let repairedCount = 0;
        let s3RelocatedCount = 0;
        let skippedCount = 0;
        let quarantinedCount = 0;

        for (const p of products) {
            const currentKey = p.s3Key || p.storageKey || '';
            let expectedIsFree = p.isFree;
            let tierReason = 'Existing isFree maintained';

            if (currentKey.includes('/paid/') || currentKey.includes('/paid-resources/')) {
                expectedIsFree = false;
                tierReason = 'Path contains /paid/';
            } else if (currentKey.includes('/free/') || currentKey.includes('/free-resources/')) {
                expectedIsFree = true;
                tierReason = 'Path contains /free/';
            } else if (p.isFree !== undefined) {
                expectedIsFree = Boolean(p.isFree);
            } else if (p.free !== undefined) {
                expectedIsFree = Boolean(p.free);
            } else if (p.price !== undefined) {
                expectedIsFree = (p.price === 0);
            }

            const expectedS3Key = computeCanonicalS3Key(p, expectedIsFree);

            // Guard Check: If S3 key cannot be canonically constructed or contains invalid tokens
            if (!expectedS3Key || expectedS3Key.includes('undefined') || expectedS3Key.includes('null')) {
                quarantinedCount++;
                report.push({
                    id: p._id.toString(),
                    title: p.title || extractFileName(p) || 'N/A',
                    state: p.state || p.stateSlug || 'N/A',
                    district: p.district || p.districtSlug || 'N/A',
                    action: 'QUARANTINE_MISSING_METADATA',
                    currentIsFree: p.isFree,
                    expectedIsFree: expectedIsFree,
                    currentS3Key: currentKey,
                    expectedS3Key: 'QUARANTINED (Missing Metadata)'
                });
                if (isApply) {
                    await collection.updateOne(
                        { _id: p._id },
                        {
                            $set: {
                                ingestionStatus: 'QUARANTINED',
                                published: false,
                                isPublished: false,
                                updatedAt: new Date()
                            }
                        }
                    );
                }
                continue;
            }

            const expectedPrice = expectedIsFree ? 0.0 : (p.price && p.price > 0 ? p.price : 99.0);
            const needsTierFix = (p.isFree !== expectedIsFree) || (p.price !== expectedPrice);
            const needsS3Relocation = currentKey !== expectedS3Key && currentKey !== '';

            let action = 'NO_CHANGE';
            let reason = 'Product metadata and S3 key are already canonical';

            if (needsTierFix || needsS3Relocation) {
                if (needsS3Relocation && needsTierFix) {
                    action = 'RECONCILE_TIER_AND_S3';
                    reason = `Tier fix (${p.isFree} -> ${expectedIsFree}) and S3 relocation ('${currentKey}' -> '${expectedS3Key}')`;
                } else if (needsS3Relocation) {
                    action = 'RELOCATE_S3_KEY';
                    reason = `S3 relocation from '${currentKey}' to '${expectedS3Key}'`;
                } else {
                    action = 'UPDATE_TIER_METADATA';
                    reason = `Tier metadata repair (${p.isFree} -> ${expectedIsFree}, price ${p.price} -> ${expectedPrice})`;
                }

                report.push({
                    id: p._id.toString(),
                    title: p.title || extractFileName(p) || 'N/A',
                    driveId: p.googleDriveFileId || 'N/A',
                    state: p.state || p.stateSlug || 'general',
                    district: p.district || p.districtSlug || 'general',
                    currentIsFree: p.isFree,
                    expectedIsFree: expectedIsFree,
                    currentPrice: p.price,
                    expectedPrice: expectedPrice,
                    currentS3Key: currentKey,
                    expectedS3Key: expectedS3Key,
                    action: action,
                    reason: reason
                });

                if (isApply) {
                    let s3CopySuccessful = false;

                    // Step 1: Verify source object & copy to destination
                    if (needsS3Relocation && currentKey) {
                        try {
                            console.log(`[S3 RELOCATE] Verifying source object existence: '${currentKey}'`);
                            await s3Client.send(new HeadObjectCommand({
                                Bucket: S3_BUCKET,
                                Key: currentKey
                            }));

                            console.log(`[S3 RELOCATE] Copying S3 object '${currentKey}' -> '${expectedS3Key}'`);
                            await s3Client.send(new CopyObjectCommand({
                                Bucket: S3_BUCKET,
                                CopySource: `${S3_BUCKET}/${currentKey}`,
                                Key: expectedS3Key
                            }));

                            // Verify destination object
                            await s3Client.send(new HeadObjectCommand({
                                Bucket: S3_BUCKET,
                                Key: expectedS3Key
                            }));
                            console.log(`[S3 RELOCATE] Verified destination key: '${expectedS3Key}'.`);
                            s3CopySuccessful = true;
                        } catch (s3Err) {
                            console.error(`[S3 RELOCATE ERROR] Failed relocating key '${currentKey}': ${s3Err.message}`);
                            throw s3Err;
                        }
                    }

                    // Step 2: Update Mongo Record
                    await collection.updateOne(
                        { _id: p._id },
                        {
                            $set: {
                                isFree: expectedIsFree,
                                free: expectedIsFree,
                                price: expectedPrice,
                                s3Key: expectedS3Key,
                                storageKey: expectedS3Key,
                                category: p.navbarCategory || (expectedIsFree ? 'Free Resources' : 'Paid Resources'),
                                updatedAt: new Date()
                            }
                        }
                    );
                    repairedCount++;

                    // Step 3: ONLY AFTER successful Mongo persistence, delete old S3 key
                    if (needsS3Relocation && currentKey && s3CopySuccessful) {
                        try {
                            console.log(`[S3 RELOCATE] Mongo update succeeded. Cleaning up old S3 key '${currentKey}'`);
                            await s3Client.send(new DeleteObjectCommand({
                                Bucket: S3_BUCKET,
                                Key: currentKey
                            }));
                            s3RelocatedCount++;
                        } catch (deleteErr) {
                            console.warn(`[S3 DELETE OLD WARNING] Failed to delete old key '${currentKey}' after Mongo update: ${deleteErr.message}`);
                        }
                    }
                } else {
                    repairedCount++;
                    if (needsS3Relocation) s3RelocatedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        console.log('====================================================================');
        console.log('REPAIR & RELOCATION REPORT SUMMARY');
        console.log('====================================================================');
        console.table(report.map(r => ({
            Title: r.title ? r.title.substring(0, 30) : 'N/A',
            State: r.state,
            District: r.district,
            Action: r.action,
            'Old Tier': r.currentIsFree ? 'FREE' : 'PAID',
            'New Tier': r.expectedIsFree ? 'FREE' : 'PAID',
            'Current Key': r.currentS3Key,
            'Expected Key': r.expectedS3Key
        })));

        console.log('\n--------------------------------------------------------------------');
        console.log(`TOTAL AUDITED:    ${products.length}`);
        console.log(`REPAIRS PLANNED: ${repairedCount}`);
        console.log(`S3 RELOCATIONS:  ${s3RelocatedCount}`);
        console.log(`UNCHANGED:       ${skippedCount}`);
        console.log(`QUARANTINED:     ${quarantinedCount}`);
        console.log('--------------------------------------------------------------------');

        if (isDryRun) {
            console.log('\n💡 THIS WAS A DRY RUN. NO DATA WAS MUTATED.');
            console.log('To apply these changes, run with: node scripts/repair_production_products.js --apply');
        } else {
            console.log('\n✅ MUTATIONS APPLIED SUCCESSFULLY TO MONGODB AND S3.');
        }

    } catch (err) {
        console.error('Error during repair execution:', err);
    } finally {
        await client.close();
    }
}

runRepair();
