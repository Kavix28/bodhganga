# PRODUCTION FORENSIC AUDIT — BODHGANGA DIGITAL LEARNING PIPELINE

---

## 1. System & Architectural Inventory

### A. Frontend Architecture

- **Framework:** React 18 + Vite.
- **Public Domain:** `https://bodhganga.in` (and `https://www.bodhganga.in`) hosted on **Vercel**.
- **API Configuration:** Resolved via `import.meta.env.VITE_API_BASE_URL` in `src/utils/constants.js`.
  - **Development:** Defaults to `http://localhost:9090/api`.
  - **Production:** Configured on Vercel to point directly to AWS EC2 backend API endpoints (`https://bodhganga.in/api`).
- **PDF Viewer:** `SecurePdfViewer.jsx` and `SecurePdfViewerModal.jsx` render PDF pages on HTML5 Canvas using bundled `pdfjs-dist` worker.
  - Right-click and keyboard print/save shortcuts (`Ctrl+P`, `Ctrl+S`, `F12`) disabled.
  - Direct array buffer fetching prevents signature mismatches on S3 presigned URLs.
  - Security watermarking overlaid on vector canvas.

### B. Backend Architecture

- **Framework:** Spring Boot 3.x running on Java 17 inside Docker containers on **AWS EC2**.
- **Key Components:**
  - `PdfController`: Serves `GET /api/pdf/{*key}`. Handles authorization (Free resources open to all, Paid resources require JWT authentication and purchase verification). Returns S3 presigned URLs or HTTP 302 redirects.
  - `ProductMetadataUtil`: Core metadata parsing engine. Employs fail-closed classification using explicit tier folder recognition (`FREE`, `PAID`, `UNKNOWN`) and item type categorization (`RESOURCE`, `STATE_IMAGE`, `NON_RESOURCE`). Includes `normalizeFolderName()` for whitespace collapsing.
  - `DriveToS3PipelineTask`: Google Drive → S3 scheduled sync engine. Validates explicit tier folders, skips state header images, and logs structured metrics (`INGESTED_FREE`, `INGESTED_PAID`, `SKIPPED_STATE_IMAGE`, `REJECTED_UNKNOWN_TIER`).
  - `QuestionBankDriveService` & `GoogleDriveSyncService`: Google Drive client wrappers with directory/missing file guards to prevent startup exceptions when credential files are unmounted.
  - `SecurityConfig`: Manages CORS origins explicitly allowing `https://bodhganga.in` and `https://www.bodhganga.in` with credentials.

### C. Database Architecture

- **Database:** MongoDB 7.0 running in Docker (`bodhganga-mongo`).
- **Main Collection:** `products`
- **Schema Fields Audited:**
  - `isFree` (Boolean): Master indicator of resource tier (`true` for Free, `false` for Paid).
  - `price` (Double): Price in INR (`0.0` for Free, `>0` for Paid).
  - `s3Key` & `storageKey` (String): Storage location in S3 bucket `bodhganga-pdf-storage-prod`.
  - `googleDriveFileId` (String): Google Drive source item identifier.
  - `checksum` (String): SHA-256 content checksum for idempotency.
  - `state`, `stateSlug`, `district`, `districtSlug` (String): Territorial categorization.
  - `isPublished`, `isLatestVersion`, `importedFromDrive` (Boolean): Catalog lifecycle flags.

### D. Cloud Infrastructure & Storage

- **AWS S3 Bucket:** `bodhganga-pdf-storage-prod` (`eu-north-1`).
- **S3 Namespace:** Canonical key format: `<state-slug>/<district-slug>/<district-slug>/<tier>/<filename>`.

---

## 2. Forensic Audit Findings & Resolved Issues

### Issue 1: Folder Whitespace Insensitivity (Resolved)

- **Finding:** Folder names in Google Drive like `[15-Manipur, District 51- Chandel District, Paid  Resources]` contained consecutive spaces (`"Paid  Resources"`).
- **Impact:** Previously failed string comparison `equals("paid resources")`, causing valid paid resources to evaluate as `UNKNOWN` tier and be rejected cleanly by fail-closed rules.
- **Resolution:** Implemented `ProductMetadataUtil.normalizeFolderName()` using `.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT)` across all folder detection methods.

### Issue 2: State Header Images Ingestion Noise (Resolved)

- **Finding:** Non-educational folders like `"State images"` contained state header images (e.g. `Haryana-image.png`) that entered the resource pipeline stream.
- **Impact:** Generated false-positive error logs when tier folders were missing.
- **Resolution:** Added `ItemType.STATE_IMAGE` classification in `ProductMetadataUtil` and `processFile()` skip handling in `DriveToS3PipelineTask`.

### Issue 3: Docker Secret Mount Directory Pitfall (Resolved)

- **Finding:** When host files `./secrets/google-qb-credentials.json` were absent, Docker Compose automatically created a directory with that name on the host, causing Java `FileInputStream` to throw `(Is a directory)` exception.
- **Resolution:** Updated `QuestionBankDriveService.java` and `GoogleDriveSyncService.java` with explicit `f.isDirectory() || !f.exists()` pre-flight checks, logging clean warning messages and cleanly disabling the client when unconfigured.

---

## 3. Data Integrity & Safety Guarantee

1. **No Destructive Operations:** All audit scripts (`scripts/audit_production_products.js`) execute in **READ-ONLY** mode.
2. **Fail-Closed Architecture:** No fallback or default to `FREE` or `PAID` exists for ambiguous paths.
3. **Idempotency:** Idempotency is enforced via `googleDriveFileId` and SHA-256 `checksum` matching, preserving original MongoDB document `_id` values.
