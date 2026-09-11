package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class AdminResourceService {

    private static final Logger log = LoggerFactory.getLogger(AdminResourceService.class);
    private static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024L; // 50 MB
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            "pdf", "png", "jpg", "jpeg", "webp", "mp3", "wav", "m4a", "aac", "ogg", "mp4");

    private final ProductRepo productRepo;
    private final StateRepo stateRepo;
    private final S3Service s3Service;

    public AdminResourceService(ProductRepo productRepo, StateRepo stateRepo, S3Service s3Service) {
        this.productRepo = productRepo;
        this.stateRepo = stateRepo;
        this.s3Service = s3Service;
    }

    public ResourceUploadResult uploadResource(
            MultipartFile file,
            String stateSlugInput,
            String districtSlugInput,
            boolean isFree,
            String categoryInput,
            String titleInput,
            String descriptionInput,
            boolean publish) throws IOException {

        // 1. Validate inputs
        String effectiveTitle = titleInput != null ? titleInput.trim() : "";
        if (effectiveTitle.isBlank()) {
            String orig = file != null ? file.getOriginalFilename() : null;
            if (orig != null && !orig.isBlank()) {
                effectiveTitle = Product.stripExtension(orig.trim());
            }
        }
        if (effectiveTitle.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }

        // 2. State Validation
        String cleanStateSlug = Product.generateSlug(stateSlugInput);
        State canonicalState = findCanonicalState(cleanStateSlug);
        if (canonicalState == null) {
            throw new IllegalArgumentException("INVALID_STATE: State does not exist for slug '" + stateSlugInput + "'");
        }

        // 3. District Validation
        String cleanDistrictSlug = Product.generateSlug(districtSlugInput);
        String canonicalDistrictName = findCanonicalDistrict(canonicalState, cleanDistrictSlug);
        if (canonicalDistrictName == null) {
            throw new IllegalArgumentException("INVALID_DISTRICT: District '" + districtSlugInput
                    + "' does not belong to state '" + canonicalState.getName() + "'");
        }

        // 4. Multi-format File & MIME Validation
        validateFile(file);

        byte[] fileBytes = file.getBytes();
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = titleInput.trim();
        }

        String ext = Product.getFileExtension(originalFilename);
        if (ext.isBlank()) {
            ext = "pdf";
        }

        String mimeType = file.getContentType();
        if (mimeType == null || mimeType.isBlank() || "application/octet-stream".equalsIgnoreCase(mimeType)) {
            mimeType = Product.determineMimeType(originalFilename);
        }

        String contentType = Product.determineContentType(mimeType, originalFilename);

        // 5. Calculate SHA-256 Content Hash
        String contentHash = calculateSha256(fileBytes);

        // 6. Free / Paid Semantics
        double price = isFree ? 0.0 : 99.0;

        // 7. Duplicate / Idempotency Check
        Optional<Product> existingOpt = productRepo.findByStateSlugAndDistrictSlugAndIsFreeAndContentHash(
                cleanStateSlug, cleanDistrictSlug, isFree, contentHash);
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            if (existing.isArchived()) {
                log.info("ADMIN_RESOURCE_REACTIVATE: Reactivating archived {} resource ID={}, state={}, district={}",
                        isFree ? "FREE" : "PAID", existing.getId(), cleanStateSlug, cleanDistrictSlug);
                existing.setArchived(false);
                existing.setPublished(publish);
                existing.setUpdatedAt(new Date());

                if (effectiveTitle != null && !effectiveTitle.isBlank()) {
                    existing.setTitle(effectiveTitle);
                    existing.setDisplayTitle(Product.stripExtension(effectiveTitle));
                }
                if (categoryInput != null && !categoryInput.isBlank()) {
                    existing.setCategory(categoryInput.trim());
                }
                if (descriptionInput != null && !descriptionInput.isBlank()) {
                    existing.setDescription(descriptionInput.trim());
                }

                String targetS3Key = existing.getS3Key();
                if (targetS3Key != null && !targetS3Key.isBlank()) {
                    if (!s3Service.objectExists(targetS3Key)) {
                        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
                            s3Service.uploadFileWithKey(inputStream, fileBytes.length, targetS3Key, mimeType);
                        }
                    }
                }

                existing = productRepo.save(existing);
                return new ResourceUploadResult(existing, false,
                        "Archived resource reactivated and cataloged successfully.");
            }

            log.info(
                    "ADMIN_RESOURCE_DUPLICATE: Identical active content hash {} already exists for state={}, district={}, isFree={}. Idempotent return ID={}",
                    contentHash, cleanStateSlug, cleanDistrictSlug, isFree, existing.getId());
            return new ResourceUploadResult(existing, true, "Resource with exact identical content already exists.");
        }

        // 8. Generate Safe S3 Key
        String sanitizedFilename = sanitizeFilename(originalFilename);
        String tier = isFree ? "free" : "paid";

        String s3Key = "states/" + cleanStateSlug + "/" + cleanDistrictSlug + "/" + tier + "/" + sanitizedFilename;

        // Handle S3 key collision
        if (s3Service.objectExists(s3Key) || productRepo.existsByS3Key(s3Key)) {
            String nameWithoutExt = Product.stripExtension(sanitizedFilename);
            s3Key = "states/" + cleanStateSlug + "/" + cleanDistrictSlug + "/" + tier + "/" + nameWithoutExt + "_"
                    + System.currentTimeMillis() + "." + ext;
        }

        // 9. Upload to S3
        log.info("ADMIN_RESOURCE_UPLOAD_START: Uploading {} to S3 key={}", contentType, s3Key);
        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            s3Service.uploadFileWithKey(inputStream, fileBytes.length, s3Key, mimeType);
        } catch (Exception e) {
            log.error("ADMIN_RESOURCE_S3_FAILURE: Failed to upload file to S3 key={}", s3Key, e);
            throw new RuntimeException("STORAGE_UPLOAD_FAILED: Failed to upload file to S3 storage", e);
        }

        String s3Url = s3Service.getS3Url(s3Key);

        // 10. Create and Save Product Document
        Product product = new Product();
        product.setTitle(effectiveTitle);
        product.setDisplayTitle(Product.stripExtension(effectiveTitle));
        product.setDescription(descriptionInput != null ? descriptionInput.trim() : "");
        product.setState(canonicalState.getName());
        product.setStateSlug(cleanStateSlug);
        product.setDistrict(canonicalDistrictName);
        product.setDistrictSlug(cleanDistrictSlug);
        product.setFree(isFree);
        product.setPrice(price);
        String categoryName = categoryInput != null && !categoryInput.isBlank() ? categoryInput.trim() : "Notes";
        product.setCategory(categoryName);

        product.setContentArea(isFree ? "FREE_DISTRICT_CONTENT" : "PAID_DISTRICT_RESOURCES");
        String catLower = categoryName.toLowerCase();
        if (catLower.contains("heritage") || catLower.contains("monument")) {
            product.setSectionSlug("heritage-monuments");
        } else if (catLower.contains("geography") || catLower.contains("map")) {
            product.setSectionSlug("geography");
        } else if (catLower.contains("art") || catLower.contains("culture")) {
            product.setSectionSlug("art-culture");
        } else if (catLower.contains("history")) {
            product.setSectionSlug("history");
        } else {
            product.setSectionSlug("history");
        }
        product.setS3Key(s3Key);
        product.setStorageKey(s3Key);
        product.setS3Url(s3Url);
        product.setContentHash(contentHash);
        product.setPublished(publish);
        product.setArchived(false);
        product.setSource("Admin Direct Upload");
        product.setOriginalFileName(originalFilename);
        product.setFileName(sanitizedFilename);
        product.setFileSize((long) fileBytes.length);
        product.setFileExtension(ext);
        product.setMimeType(mimeType);
        product.setContentType(contentType);
        product.setType(contentType);
        product.setIngestionStatus(IngestionStatus.COMPLETED);
        product.setCreatedAt(new Date());
        product.setUpdatedAt(new Date());

        try {
            product = productRepo.save(product);
            log.info("ADMIN_RESOURCE_UPLOAD_SUCCESS: Product saved ID={}, s3Key={}, state={}, district={}, type={}",
                    product.getId(), s3Key, cleanStateSlug, cleanDistrictSlug, contentType);
            return new ResourceUploadResult(product, false, "Resource uploaded and cataloged successfully.");
        } catch (Exception mongoEx) {
            log.error(
                    "ADMIN_RESOURCE_MONGO_FAILURE: Failed to save product to MongoDB after S3 upload. Attempting S3 compensation deletion for key={}",
                    s3Key, mongoEx);
            try {
                s3Service.deleteObject(s3Key);
                log.info("ADMIN_RESOURCE_COMPENSATION_SUCCESS: S3 object deleted successfully for key={}", s3Key);
            } catch (Exception compEx) {
                log.error(
                        "ADMIN_RESOURCE_COMPENSATION_FAILURE: CRITICAL - Failed to delete S3 object key '{}' during compensation! stateSlug={}, districtSlug={}, hash={}",
                        s3Key, cleanStateSlug, cleanDistrictSlug, contentHash, compEx);
            }
            throw new RuntimeException("RESOURCE_SAVE_FAILED: Failed to record resource in product catalog", mongoEx);
        }
    }

    public Product updatePublicationStatus(String id, boolean publish) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found for ID: " + id));
        product.setPublished(publish);
        product.setUpdatedAt(new Date());
        return productRepo.save(product);
    }

    public Product archiveResource(String id) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found for ID: " + id));
        product.setArchived(true);
        product.setPublished(false);
        product.setUpdatedAt(new Date());
        return productRepo.save(product);
    }

    public List<Product> getDistrictResources(String stateSlug, String districtSlug) {
        String cleanStateSlug = Product.generateSlug(stateSlug);
        String cleanDistrictSlug = Product.generateSlug(districtSlug);
        return productRepo.findByStateSlugAndDistrictSlugAndArchivedFalse(cleanStateSlug, cleanDistrictSlug);
    }

    public State findCanonicalState(String stateSlug) {
        if (stateSlug == null || stateSlug.isBlank())
            return null;
        String cleanSlug = Product.generateSlug(stateSlug);

        // Direct ID lookup
        Optional<State> byId = stateRepo.findById(cleanSlug);
        if (byId.isPresent())
            return byId.get();

        // Scan all states in repository
        List<State> allStates = stateRepo.findAll();
        for (State s : allStates) {
            if (s.getId() != null && s.getId().equalsIgnoreCase(cleanSlug))
                return s;
            if (s.getName() != null && Product.generateSlug(s.getName()).equals(cleanSlug))
                return s;
            if (s.getCode() != null && s.getCode().equalsIgnoreCase(cleanSlug))
                return s;
        }
        return null;
    }

    public String findCanonicalDistrict(State state, String districtSlug) {
        if (state == null || state.getDistricts() == null || districtSlug == null || districtSlug.isBlank())
            return null;
        String cleanSlug = Product.generateSlug(districtSlug);

        for (String d : state.getDistricts()) {
            if (Product.generateSlug(d).equals(cleanSlug) || d.equalsIgnoreCase(districtSlug)) {
                return d;
            }
        }
        return null;
    }

    public static void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("INVALID_FILE: Uploaded file is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("FILE_TOO_LARGE: File size exceeds maximum limit of 50MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = Product.getFileExtension(originalFilename);
        if (ext.isBlank() || !ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("UNSUPPORTED_FORMAT: Extension '." + ext
                    + "' is not supported. Allowed formats: PDF, PNG, JPG, JPEG, WEBP, MP3, WAV, M4A, AAC, OGG, MP4.");
        }

        String mimeType = file.getContentType();
        if (mimeType != null && !mimeType.isBlank()) {
            String lowerMime = mimeType.toLowerCase();
            boolean mimeValid = lowerMime.startsWith("image/") ||
                    lowerMime.startsWith("audio/") ||
                    lowerMime.startsWith("video/") ||
                    lowerMime.equals("application/pdf") ||
                    lowerMime.equals("application/ogg") ||
                    lowerMime.equals("application/x-zip-compressed") ||
                    lowerMime.equals("application/octet-stream");
            if (!mimeValid) {
                throw new IllegalArgumentException(
                        "UNSUPPORTED_MIME: Content-Type '" + mimeType + "' is not supported.");
            }
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("INVALID_FILE: Unable to read file content.");
        }

        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("INVALID_FILE: Uploaded file content is empty.");
        }

        if (!isValidMagicBytes(bytes, ext)) {
            throw new IllegalArgumentException(
                    "INVALID_FILE_SIGNATURE: File header signature does not match extension '." + ext + "'.");
        }
    }

    public static boolean isValidPdfBytes(byte[] bytes) {
        return isValidMagicBytes(bytes, "pdf");
    }

    public static boolean isValidMagicBytes(byte[] bytes, String ext) {
        if (bytes == null || bytes.length < 4)
            return false;
        String e = ext != null ? ext.toLowerCase() : "";

        switch (e) {
            case "pdf":
                return bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46;

            case "png":
                return (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;

            case "jpg":
            case "jpeg":
                return (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;

            case "webp":
                if (bytes.length < 12)
                    return true;
                return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
                        bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';

            case "wav":
                if (bytes.length < 12)
                    return true;
                return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
                        bytes[8] == 'W' && bytes[9] == 'A' && bytes[10] == 'V' && bytes[11] == 'E';

            case "ogg":
                return bytes[0] == 'O' && bytes[1] == 'g' && bytes[2] == 'g' && bytes[3] == 'S';

            case "mp4":
            case "m4a":
                if (bytes.length >= 8 && bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p') {
                    return true;
                }
                if (bytes[0] == 'I' && bytes[1] == 'D' && bytes[2] == '3') {
                    return true;
                }
                return bytes.length > 16;

            case "mp3":
                if (bytes[0] == 'I' && bytes[1] == 'D' && bytes[2] == '3')
                    return true;
                if ((bytes[0] & 0xFF) == 0xFF && ((bytes[1] & 0xE0) == 0xE0))
                    return true;
                return bytes.length > 16;

            case "aac":
                if (bytes[0] == 'I' && bytes[1] == 'D' && bytes[2] == '3')
                    return true;
                if ((bytes[0] & 0xFF) == 0xFF && ((bytes[1] & 0xF0) == 0xF0))
                    return true;
                return bytes.length > 16;

            default:
                return true;
        }
    }

    public static String calculateSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(bytes);
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank())
            return "document.pdf";

        // Strip path separators to prevent path traversal attacks
        String nameOnly = filename.replaceAll(".*[/\\\\]", "").trim();
        nameOnly = nameOnly.replaceAll("\\.\\.", ""); // strip ..

        int lastDot = nameOnly.lastIndexOf('.');
        String baseName = lastDot > 0 ? nameOnly.substring(0, lastDot) : nameOnly;
        String ext = lastDot > 0 ? nameOnly.substring(lastDot + 1).toLowerCase() : "pdf";
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            ext = "pdf";
        }

        String cleanBase = baseName.replaceAll("[^a-zA-Z0-9.-]", "_").replaceAll("_+", "_");
        if (cleanBase.isBlank())
            cleanBase = "document";

        return cleanBase + "." + ext;
    }

    public static class ResourceUploadResult {
        private final Product product;
        private final boolean isDuplicate;
        private final String message;

        public ResourceUploadResult(Product product, boolean isDuplicate, String message) {
            this.product = product;
            this.isDuplicate = isDuplicate;
            this.message = message;
        }

        public Product getProduct() {
            return product;
        }

        public boolean isDuplicate() {
            return isDuplicate;
        }

        public String getMessage() {
            return message;
        }
    }
}
