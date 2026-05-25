import { MongoClient } from 'mongodb';
import { indianStates } from './src/data/states.js';
import { unionTerritories } from './src/data/unionTerritories.js';

async function seed() {
    console.log('Seeding states to mongodb...');
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';
    console.log(`Connecting to: ${uri}`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('states');

        // Insert States
        const allStates = [...indianStates, ...unionTerritories];
        let inserted = 0;
        
        for (const state of allStates) {
            const payload = {
                _id: state.id, // Using string id as _id or keep it as id
                id: state.id,
                name: state.name,
                code: state.code,
                capital: state.capital,
                description: state.description,
                type: state.isUT ? 'UT' : 'STATE',
                status: 'ACTIVE'
            };
            
            // Upsert based on id
            await collection.updateOne(
                { id: state.id },
                { $set: payload },
                { upsert: true }
            );
            inserted++;
        }
        console.log(`Done seeding! Inserted/Updated ${inserted} states and UTs.`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

seed();
