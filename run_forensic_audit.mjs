import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';
const API_BASE = 'http://localhost:9090/api';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    // 1. Log in as ADMIN via /api/auth/admin/login
    let adminToken = null;
    try {
      const loginRes = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: 'admin@bodhganga.in', password: 'BodhGanga@2026' })
      });
      const loginData = await loginRes.json();
      adminToken = loginData.token || loginData.data?.token || loginData.jwt;
      console.log("Admin Login Status:", loginRes.status, "Token Acquired:", !!adminToken);
    } catch (e) {
      console.warn("Could not log in as admin:", e.message);
    }

    const products = await db.collection('products').find({}).toArray();
    console.log(`\n======================================================`);
    console.log(`FOUND ${products.length} PRODUCTS IN MONGO DATABASE`);
    console.log(`======================================================\n`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const prodId = String(p._id || p.id);
      const title = p.title || p.displayTitle || p.fileName;
      const type = p.type || p.contentType || (p.fileExtension ? p.fileExtension.toUpperCase() : 'UNKNOWN');
      const isFree = (p.free === true || p.isFree === true || p.price === 0);
      const storageKey = p.storageKey || null;
      const driveFileId = p.googleDriveFileId || p.sourceFileId || null;
      const s3Key = p.s3Key || p.storageKey || null;

      console.log(`======================================================`);
      console.log(`RESOURCE #${i + 1}: ${title}`);
      console.log(`======================================================`);
      console.log(`1. Product ID: ${prodId}`);
      console.log(`2. Product Title: ${title}`);
      console.log(`3. Product Type: ${type}`);
      console.log(`4. Access Tier: ${isFree ? 'FREE' : 'PAID (₹' + (p.price || 99) + ')'}`);
      console.log(`5. Raw MongoDB Document:\n${JSON.stringify(p, null, 2)}`);
      console.log(`6. storageKey: ${storageKey}`);
      console.log(`7. Google Drive File ID: ${driveFileId}`);
      console.log(`8. S3 Object Key: ${s3Key}`);

      let presignedUrl = null;
      let endpointStatus = null;
      let endpointResponseBody = null;
      let exactException = null;

      if (s3Key) {
        // Test /api/pdf/{*key} with Admin Token
        try {
          const headers = {};
          if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
          
          const pdfEndpointUrl = `${API_BASE}/pdf/${s3Key}`;
          const res = await fetch(pdfEndpointUrl, { headers });
          endpointStatus = res.status;
          const resText = await res.text();
          try {
            endpointResponseBody = JSON.parse(resText);
            if (endpointResponseBody.url) {
              presignedUrl = endpointResponseBody.url;
            }
          } catch {
            endpointResponseBody = resText;
          }
        } catch (err) {
          exactException = err.message;
        }

        console.log(`10. Presigned URL Generation Result: ${presignedUrl ? presignedUrl : 'FAILED / NULL'}`);
        console.log(`11. Secure Viewer Endpoint (/api/pdf/${s3Key}) Response: ${JSON.stringify(endpointResponseBody)}`);
        console.log(`12. HTTP Status Code: ${endpointStatus}`);

        if (presignedUrl) {
          try {
            const browserFetch = await fetch(presignedUrl, { method: 'GET' });
            console.log(`9. S3 Object Existence (Presigned GET): HTTP ${browserFetch.status}`);
            console.log(`14. Browser Network Response: HTTP ${browserFetch.status} ${browserFetch.statusText}`);
          } catch (bErr) {
            console.log(`9. S3 Object Existence: FAILED (${bErr.message})`);
            console.log(`14. Browser Network Response: FETCH ERROR - ${bErr.message}`);
          }
        } else {
          const rawUrl = p.s3Url || `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/${s3Key}`;
          try {
            const rawFetch = await fetch(rawUrl, { method: 'HEAD' });
            console.log(`9. S3 Object Existence (Direct S3 HEAD): HTTP ${rawFetch.status}`);
            console.log(`14. Browser Network Response (Raw S3): HTTP ${rawFetch.status} ${rawFetch.statusText}`);
          } catch (rErr) {
            console.log(`9. S3 Object Existence: FAILED (${rErr.message})`);
            console.log(`14. Browser Network Response: FETCH ERROR - ${rErr.message}`);
          }
        }
      } else {
        console.log(`9. S3 Object Existence: N/A (No storageKey in MongoDB)`);
        console.log(`10. Presigned URL Generation Result: N/A`);
        console.log(`11. Secure Viewer Endpoint Response: N/A (Frontend cannot call API without key)`);
        console.log(`12. HTTP Status Code: N/A`);
        console.log(`14. Browser Network Response: FAILED (resource.s3Url is null/undefined)`);
      }

      console.log(`13. Backend Logs: Recorded in .dev-logs\\backend.log`);
      console.log(`15. Exact Exception: ${exactException || 'None'}\n`);
    }
  } catch (err) {
    console.error("Forensic script error:", err);
  } finally {
    await client.close();
  }
}

main();
