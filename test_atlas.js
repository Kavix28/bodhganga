import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://bodh:ganga@test-bodhganga.30wadid.mongodb.net/bodhganga';
console.log('Testing connection to Atlas MongoDB with credentials bodh:ganga...');
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB Atlas!');
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('Collections present:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count} documents`);
        }
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await client.close();
    }
}

run();
