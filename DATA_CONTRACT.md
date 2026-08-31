# BodhGanga Data Contract Specification

## 1. Canonical Resource Model

### Item Types (`ItemType`)

- **`RESOURCE`**: Educational learning material (PDFs, videos, podcasts, infographics). Processed into MongoDB `Product` records.
- **`STATE_IMAGE`**: Header/banner images representing states. Skipped from `Product` creation; stored in `states/<stateSlug>/<filename>` when managed.
- **`NON_RESOURCE`**: Administrative or unsupported files (e.g. `.DS_Store`, hidden system files). Skipped during ingestion.

### Access Types (`AccessType`)

- **`FREE`**: Resource located inside an explicit Free tier folder (`Free Resources`, `Free Notes`, etc.).
  - Data Invariants: `isFree = true`, `price = 0.0`.
- **`PAID`**: Resource located inside an explicit Paid tier folder (`Paid Resources`, `Paid Notes`, etc.).
  - Data Invariants: `isFree = false`, `price > 0.0` (default 99.0).
- **`UNKNOWN`**: Resource path lacks any explicit Free or Paid tier folder.
  - Data Invariants: Must **NEVER** be published. Quarantined automatically (`IngestionStatus.QUARANTINED`).
- **`CONFLICT`**: Resource path contains **BOTH** Free and Paid tier folders in its ancestor hierarchy (e.g. `Free Resources/Paid Resources/notes.pdf`).
  - Data Invariants: Must **NEVER** be published. Quarantined automatically (`IngestionStatus.QUARANTINED`).

### Ingestion Status (`IngestionStatus`)

- **`PROCESSING`**: File ingestion / S3 upload in progress.
- **`COMPLETED`**: Successfully reconciled, uploaded to S3, and published.
- **`FAILED`**: Ingestion or upload error encountered; unpublished.
- **`QUARANTINED`**: Ambiguous, conflicting, or unknown tier classification; unpublished and forbidden from frontend access.

## 2. Invalidation Rules & Non-Inference Policy

1. **Hierarchy Only**: Access tier (`FREE` vs `PAID`) **MUST** be derived strictly from explicit folder hierarchy names.
2. **Strict Non-Inference**: Access tier MUST NEVER be inferred from:
   - Filename or file extension.
   - Price alone.
   - Resource title or display name.
   - State or district name.
   - Words such as "Sample", "Notes", "MCQ", "Guide".
   - File size or MIME type.

## 3. S3 Namespace Contract

### Educational Resources

- **Paid Tier**: `<state-slug>/<district-slug>/paid/<filename>`
- **Free Tier**: `<state-slug>/<district-slug>/free/<filename>`
- **Category Fallback**: `<state-slug>/<navbar-slug>/<filename>`

### State Header Images

- `states/<state-slug>/<filename>`

### Quarantined / Ambiguous Objects

- `quarantined/<filename>`

**Rule**: An `UNKNOWN` or `CONFLICT` resource must NEVER be stored under `/free/` or `/paid/`.

## 4. Fundamental Data Invariants

1. **Invariant 1**: No `UNKNOWN` or `CONFLICT` resource may have `published = true` or `isFree = true`.
2. **Invariant 2**: No `PAID` resource may have `isFree = true` or `price = 0.0`.
3. **Invariant 3**: No `FREE` resource may have `isFree = false` or `price > 0.0`.
4. **Invariant 4**: No quarantined resource may be accessible via public or pre-signed PDF endpoints (`PdfController`).
5. **Invariant 5**: Relocation of S3 objects MUST verify destination object existence prior to deleting source objects.
6. **Invariant 6**: MongoDB records MUST NOT point to an S3 key until the object existence at that key has been verified.
7. **Invariant 7**: Identical `googleDriveFileId`, `checksum`, and `metadata` operations MUST be strictly idempotent.
