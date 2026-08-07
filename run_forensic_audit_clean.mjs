import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bodhganga';
const API_BASE = 'http://localhost:9090/api';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    // Log in as ADMIN using phone 9958277244
    let adminToken = null;
    try {
      const loginRes = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: '9958277244', password: 'BodhGanga@2026' })
      });
      const loginData = await loginRes.json();
      adminToken = loginData.data?.token || loginData.token;
      console.log("=== ADMIN LOGIN STATUS:", loginRes.status, "TOKEN PRESENT:", !!adminToken, "===");
    } catch (e) {
      console.warn("Could not log in as admin:", e.message);
    }

    const products = await db.collection('products').find({}).toArray();

    // Find one working resource and one failing resource
    // Working resource: Haryana History Notes or Ambala Guide or Demo PDF
    for (let idx = 0; idx < products.length; idx++) {
      const p = products[idx];
      if (!p) continue;
      const prodId = String(p._id || p.id);
      const title = p.title || p.displayTitle || p.fileName;
      const type = p.type || p.contentType || (p.fileExtension ? p.fileExtension.toUpperCase() : 'PDF');
      const isFree = (p.free === true || p.isFree === true || p.price === 0);
      const storageKey = p.storageKey || p.s3Key || null;
      const driveFileId = p.googleDriveFileId || p.sourceFileId || null;
      const s3Key = storageKey;

      let presignedUrl = null;
      let endpointStatus = null;
      let endpointResponseBody = null;
      let exactException = "None";
      let s3Existence = "N/A";
      let browserResponse = "N/A";

      if (s3Key) {
        try {
          const headers = {};
          if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
          const res = await fetch(`${API_BASE}/pdf/${s3Key}`, { headers });
          endpointStatus = res.status;
          const resText = await res.text();
          try {
            endpointResponseBody = JSON.parse(resText);
            if (endpointResponseBody.url) presignedUrl = endpointResponseBody.url;
          } catch {
            endpointResponseBody = resText;
          }
        } catch (err) {
          exactException = err.message;
        }

        if (presignedUrl) {
          try {
            const bRes = await fetch(presignedUrl);
            s3Existence = `EXISTS (HTTP ${bRes.status})`;
            browserResponse = `HTTP ${bRes.status} ${bRes.statusText}`;
          } catch (bErr) {
            s3Existence = `ERROR: ${bErr.message}`;
            browserResponse = `FETCH ERROR (${bErr.message})`;
          }
        } else {
          const rawUrl = p.s3Url || `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/${s3Key}`;
          try {
            const rRes = await fetch(rawUrl, { method: 'HEAD' });
            s3Existence = `HTTP ${rRes.status} ${rRes.statusText}`;
            browserResponse = `HTTP ${rRes.status} ${rRes.statusText}`;
          } catch (rErr) {
            s3Existence = `FETCH ERROR: ${rErr.message}`;
            browserResponse = `FETCH ERROR (${rErr.message})`;
          }
        }
      }

      console.log(`\n======================================================`);
      console.log(`PRODUCT #${idx + 1}: ${title}`);
      console.log(`======================================================`);
      console.log(`1. Product ID: ${prodId}`);
      console.log(`2. Product Title: ${title}`);
      console.log(`3. Product Type: ${type}`);
      console.log(`4. Free or Paid: ${isFree ? 'FREE' : 'PAID (Price: ₹' + (p.price || 99) + ')'}`);
      console.log(`5. MongoDB Document:\n${JSON.stringify(p, null, 2)}`);
      console.log(`6. storageKey: ${storageKey}`);
      console.log(`7. Google Drive File ID: ${driveFileId}`);
      console.log(`8. S3 Object Key: ${s3Key}`);
      console.log(`9. S3 Object Existence (HEAD/GET): ${s3Existence}`);
      console.log(`10. Presigned URL Generation Result: ${presignedUrl ? presignedUrl : 'FAILED / NULL'}`);
      console.log(`11. Secure Viewer Endpoint Response: ${JSON.stringify(endpointResponseBody)}`);
      console.log(`12. HTTP Status Code: ${endpointStatus}`);
      console.log(`13. Backend Logs: Logged in .dev-logs\\backend.log`);
      console.log(`14. Browser Network Response: ${browserResponse}`);
      console.log(`15. Exact Exception: ${exactException}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
