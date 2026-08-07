import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB at", uri);
    const db = client.db();

    const collections = await db.listCollections().toArray();
    console.log("Collection list:", collections.map(c => c.name));

    for (const col of collections) {
      const docs = await db.collection(col.name).find({}).toArray();
      console.log(`\n================ Collection: ${col.name} (Count: ${docs.length}) ================`);
      docs.forEach((doc, i) => {
        console.log(`\n--- Document ${i + 1} ---`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

  } catch (err) {
    console.error("Error querying MongoDB:", err);
  } finally {
    await client.close();
  }
}

main();
