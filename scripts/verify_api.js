const { MongoClient } = require('mongodb');

async function testFullMigration() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/bodhganga');
  await client.connect();
  const db = client.db();

  console.log('Seeding products with raw district-44-kurukshetra and districtSlug=general...');
  await db.collection('products').deleteMany({ stateSlug: 'haryana' });

  await db.collection('products').insertMany([
    {
      title: 'Haryana History Notes',
      state: 'Haryana',
      stateSlug: 'haryana',
      district: 'general',
      districtSlug: 'general',
      category: 'district-44-kurukshetra',
      storageKey: 'haryana/district-44-kurukshetra/free/haryana_history.pdf',
      isPublished: true,
      published: true,
      importedFromDrive: true,
      isFree: true,
      price: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _class: 'com.bodhganga.bodhganga.entity.Product'
    },
    {
      title: 'Ambala Administration Guide',
      state: 'Haryana',
      stateSlug: 'haryana',
      district: 'general',
      districtSlug: 'general',
      category: 'district-1-ambala',
      storageKey: 'haryana/district-1-ambala/free/ambala_guide.pdf',
      isPublished: true,
      published: true,
      importedFromDrive: true,
      isFree: true,
      price: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _class: 'com.bodhganga.bodhganga.entity.Product'
    }
  ]);

  console.log('Running automatic migration on MongoDB products...');
  const prods = await db.collection('products').find({ stateSlug: 'haryana' }).toArray();
  for (const p of prods) {
    let dName = 'Kurukshetra';
    let dSlug = 'kurukshetra';
    if (p.storageKey.includes('ambala') || p.category.includes('ambala')) {
      dName = 'Ambala';
      dSlug = 'ambala';
    }
    const updateObj = { "$set": { district: dName, districtSlug: dSlug } };
    await db.collection('products').updateOne({ _id: p._id }, updateObj);
  }

  console.log('Fetching live API response after migration...');
  const res = await fetch('http://localhost:9090/api/states/haryana/districts');
  const json = await res.json();
  console.log('--- GET /api/states/haryana/districts ---');
  console.log(JSON.stringify(json, null, 2));

  const res2 = await fetch('http://localhost:9090/api/products/state/haryana');
  const json2 = await res2.json();
  console.log('--- GET /api/products/state/haryana ---');
  console.log(JSON.stringify(json2, null, 2));

  await client.close();
}
testFullMigration();
