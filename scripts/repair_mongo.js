const fs = require('fs');
const { MongoClient } = require('mongodb');

let uri = 'mongodb://admin:CHANGE_THIS_STRONG_PASSWORD@localhost:27017/bodhganga?authSource=admin';

async function repair() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const collection = db.collection('products');

  const products = await collection.find({}).toArray();
  console.log(`Loaded ${products.length} products for forensic repair...`);

  let repairedCount = 0;
  let manualReviewCount = 0;

  for (const p of products) {
    const s3Key = p.s3Key || p.storageKey || '';
    const price = p.price;
    let newIsFree = p.isFree;
    let updateFields = {};

    // 1. Determine Tier based on S3 key path or price
    if (s3Key.toLowerCase().includes('/paid/') || (price !== undefined && price > 0)) {
      newIsFree = false;
    } else if (s3Key.toLowerCase().includes('/free/') || price === 0) {
      newIsFree = true;
    } else if (p.isFree !== undefined) {
      newIsFree = p.isFree;
    } else {
      console.warn(`[MANUAL REVIEW NEEDED] Product '${p.title}' (ID: ${p._id}) tier cannot be proven.`);
      manualReviewCount++;
      continue;
    }

    updateFields.isFree = newIsFree;
    updateFields.free = newIsFree;

    // Ensure s3Key and storageKey are set consistently
    if (!p.s3Key && p.storageKey) updateFields.s3Key = p.storageKey;
    if (!p.storageKey && p.s3Key) updateFields.storageKey = p.s3Key;

    await collection.updateOne({ _id: p._id }, { $set: updateFields });
    repairedCount++;
    console.log(`Repaired product '${p.title}' (${p._id}): isFree=${newIsFree}`);
  }

  console.log(`\nRepair Summary: ${repairedCount} repaired, ${manualReviewCount} required manual review.`);
  await client.close();
}

repair().catch(console.error);
