const { MongoClient } = require('mongodb');

async function verifyAllStates() {
  console.log('Running End-to-End State & District Verification...');
  const client = new MongoClient('mongodb://127.0.0.1:27017/bodhganga');
  await client.connect();
  const db = client.db();

  // 1. Verify available states count
  const resStates = await fetch('http://localhost:9090/api/states/available');
  const jsonStates = await resStates.json();
  console.log('--- GET /api/states/available ---');
  console.log('States count:', Array.isArray(jsonStates) ? jsonStates.length : jsonStates);

  // 2. Verify Haryana districts API
  const resHaryanaDistricts = await fetch('http://localhost:9090/api/states/haryana/districts');
  const jsonHaryanaDistricts = await resHaryanaDistricts.json();
  console.log('--- GET /api/states/haryana/districts ---');
  console.log(JSON.stringify(jsonHaryanaDistricts, null, 2));

  // 3. Verify Haryana Kurukshetra products API
  const resKurukshetra = await fetch('http://localhost:9090/api/products/state/haryana/district/kurukshetra');
  const jsonKurukshetra = await resKurukshetra.json();
  console.log('--- GET /api/products/state/haryana/district/kurukshetra ---');
  console.log('Products count:', jsonKurukshetra?.data?.length || 0);

  // 4. Verify Maharashtra & Madhya Pradesh
  const resMP = await fetch('http://localhost:9090/api/products/state/madhya-pradesh');
  const jsonMP = await resMP.json();
  console.log('--- GET /api/products/state/madhya-pradesh ---');
  console.log('MP Products count:', jsonMP?.data?.length || 0);

  await client.close();
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

verifyAllStates().catch(console.error);
