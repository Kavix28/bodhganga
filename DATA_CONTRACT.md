# BODHGANGA DIGITAL LEARNING — CANONICAL DATA CONTRACT

---

## 1. Educational Resource Domain Specification

Every educational resource ingested into or served by BodhGanga MUST satisfy the following strict data contract:

### A. Classification Properties

- **`itemType`**: MUST be `RESOURCE`.
- **`accessType`**: MUST be explicitly resolved to `FREE` or `PAID`. (An `UNKNOWN` access type violates the contract and is rejected by fail-closed guards).
- **`hasTierFolder`**: MUST be `true` (indicating an explicit ancestor folder matching a recognized tier name was found in Google Drive).

### B. Product Entity Field Alignments

| Property              | `FREE` Resource | `PAID` Resource                        |
| :-------------------- | :-------------- | :------------------------------------- |
| **`isFree`**          | `true`          | `false`                                |
| **`price`**           | `0.0`           | `99.0` (or configured non-zero amount) |
| **`isPublished`**     | `true`          | `true`                                 |
| **`isLatestVersion`** | `true`          | `true`                                 |

---

## 2. Canonical S3 Key & Directory Architecture

### A. Canonical Key Format

Educational PDF documents in the S3 bucket (`bodhganga-pdf-storage-prod`) MUST follow the canonical key path format:

```text
<state-slug>/<district-slug>/<district-slug>/<tier-slug>/<filename>
```

**Examples:**

- **Free Resource:** `maharashtra/akola/akola/free/Akola_General_Notes.pdf`
- **Paid Resource:** `manipur/chandel/chandel/paid/Chandel_Infographic_Hindi.png`

### B. Forbidden & Malformed Key Formats

The system MUST NOT allow or persist keys with malformed structures such as:

- `paid-resources/free/file.pdf`
- `free/paid/file.pdf`
- `maharashtra/akola/file.pdf` (Missing explicit tier folder)
- `ambiguous/file.pdf`

---

## 3. Non-Resource & State Image Ingestion Rules

### A. State Header Images

- **`itemType`**: `STATE_IMAGE`.
- Files inside `"State images"` folders (e.g. `Haryana-image.png`, `Maharashtra-image.png`) are treated exclusively as state branding headers.
- **Database Action:** NO Product document is created in MongoDB.
- **Storage Action:** NO upload to the educational PDF S3 namespace occurs.
- **Pipeline Logging:** Emits `[PIPELINE][STATE_IMAGE][SKIPPED]` and increments `filesSkipped` metric.

### B. Non-Resource Files

- **`itemType`**: `NON_RESOURCE`.
- System files (`.DS_Store`, `desktop.ini`, `.txt` logs, admin notes) are filtered out.
- **Pipeline Logging:** Emits `[PIPELINE][NON_RESOURCE][SKIPPED]` and increments `filesSkipped` metric.
