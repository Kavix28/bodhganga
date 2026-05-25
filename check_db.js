const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017/bodhganga';
const ATLAS_URI = 'mongodb+srv://bodh:ganga@test-bodhganga.30wadid.mongodb.net/bodhganga';

async function checkDb(uri, label) {
    console.log(`Checking ${label}...`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log(`Collections in ${label}:`);
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`  - ${col.name}: ${count} documents`);
        }
    } catch(err) {
        console.error(`Error checking ${label}:`, err.message);
    } finally {
        await client.close();
    }
}

async function run() {
    await checkDb(MONGO_URI, 'Local MongoDB');
    await checkDb(ATLAS_URI, 'Atlas MongoDB');
}

run();
