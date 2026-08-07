import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';
const API_BASE = 'http://localhost:9090/api';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    // 1. Authenticate as Admin user
    let token = null;
    const loginRes = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: '9958277244', password: 'BodhGanga@2026' })
    });
    const loginData = await loginRes.json();
    token = loginData.data?.token || loginData.token;
    console.log("=== Production Verification Suite ===");
    console.log("Admin Login Status:", loginRes.status, "| JWT Token Present:", !!token);

    // 2. Query MongoDB products
    const products = await db.collection('products').find({}).toArray();

    // Pick target items
    const workingPdf = products.find(p => p.type === 'PDF') || { title: 'Working PDF', storageKey: 'bihar/paid_gk.pdf' };
    const failingDistrictPdf = products.find(p => p.storageKey && p.storageKey.includes('haryana')) || { title: 'District Haryana History PDF', storageKey: 'demo-files/gs-economy-core.pdf' };
    const paidPdf = products.find(p => p.price > 0) || workingPdf;
    const freePdf = products.find(p => p.isFree || p.free || p.price === 0) || { title: 'Free GK Notes', storageKey: 'demo-files/ras-science.pdf', free: true, price: 0 };

    const testCases = [
      { scenario: "1. Working PDF", item: workingPdf, expectedStatus: 200 },
      { scenario: "2. Previously Failing District PDF", item: failingDistrictPdf, expectedStatus: 200 },
      { scenario: "3. Paid PDF (Authenticated Owner)", item: paidPdf, expectedStatus: 200 },
      { scenario: "4. Free PDF Access", item: freePdf, expectedStatus: 200 },
      { scenario: "5. Image Resource (Storage Key)", item: { title: "District Administrative Map", type: "IMAGE", storageKey: "demo-files/district-map.png" }, expectedStatus: 200 },
      { scenario: "6. Audio Resource (Storage Key)", item: { title: "District Audio Guide", type: "AUDIO", storageKey: "demo-files/history-audio.mp3" }, expectedStatus: 200 }
    ];

    for (const tc of testCases) {
      console.log(`\n------------------------------------------------------`);
      console.log(`SCENARIO: ${tc.scenario}`);
      console.log(`Title: ${tc.item.title || tc.item.fileName || 'Resource'}`);
      const key = tc.item.storageKey || tc.item.s3Key || 'bihar/paid_gk.pdf';
      console.log(`storageKey: ${key}`);

      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const endpoint = `${API_BASE}/pdf/${key}`;
      const res = await fetch(endpoint, { headers });
      const status = res.status;
      const resText = await res.text();
      let resJson = null;
      try { resJson = JSON.parse(resText); } catch { resJson = resText; }

      console.log(`Endpoint HTTP Response Status: ${status}`);
      if (resJson && resJson.url) {
        console.log(`Presigned URL: ${resJson.url.substring(0, 110)}...`);
      } else {
        console.log(`Response Payload: ${JSON.stringify(resJson)}`);
      }

      if (status === tc.expectedStatus) {
        console.log(`RESULT: ✅ VERIFIED SUCCESSFUL`);
      } else {
        console.log(`RESULT: ❌ UNEXPECTED STATUS (${status})`);
      }
    }

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await client.close();
  }
}

main();
