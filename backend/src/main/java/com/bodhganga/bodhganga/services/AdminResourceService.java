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
import java.util.ArrayList;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminResourceService {

    private static final Logger log = LoggerFactory.getLogger(AdminResourceService.class);
    private static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024L; // 50 MB
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            "pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "mp3", "wav", "m4a", "aac", "ogg", "mp4");

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
        return uploadResource(file, stateSlugInput, districtSlugInput, null, isFree, categoryInput, titleInput, descriptionInput, publish);
    }

    public ResourceUploadResult uploadResource(
            MultipartFile file,
            String stateSlugInput,
            String districtSlugInput,
            String resourceScopeInput,
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

        // 3. Scope & District Validation
        String cleanDistrictSlug = Product.generateSlug(districtSlugInput);
        boolean isStateScope;
        if (resourceScopeInput != null && !resourceScopeInput.isBlank()) {
            String trimmedScope = resourceScopeInput.trim().toUpperCase();
            if ("STATE".equals(trimmedScope)) {
                isStateScope = true;
                cleanDistrictSlug = "general";
            } else if ("DISTRICT".equals(trimmedScope)) {
                if (cleanDistrictSlug == null || cleanDistrictSlug.isBlank() || "general".equalsIgnoreCase(cleanDistrictSlug) || "state".equalsIgnoreCase(cleanDistrictSlug)) {
                    throw new IllegalArgumentException("INVALID_DISTRICT_SCOPE: District content requires a valid district slug, not 'general'.");
                }
                isStateScope = false;
            } else {
                throw new IllegalArgumentException("INVALID_RESOURCE_SCOPE: Resource scope must be either 'STATE' or 'DISTRICT'. Received: '" + resourceScopeInput + "'");
            }
        } else {
            isStateScope = cleanDistrictSlug == null || cleanDistrictSlug.isBlank() || "general".equalsIgnoreCase(cleanDistrictSlug) || "state".equalsIgnoreCase(cleanDistrictSlug);
            if (isStateScope) {
                cleanDistrictSlug = "general";
            }
        }

        String canonicalDistrictName;
        if (isStateScope) {
            cleanDistrictSlug = "general";
            canonicalDistrictName = "general";
        } else {
            canonicalDistrictName = findCanonicalDistrict(canonicalState, cleanDistrictSlug);
            if (canonicalDistrictName == null) {
                throw new IllegalArgumentException("INVALID_DISTRICT: District '" + districtSlugInput
                        + "' does not belong to state '" + canonicalState.getName() + "'");
            }
        }

        // 3.5 Validation of Category based on Scope
        String rawCat = categoryInput != null ? categoryInput.trim() : "";
        String finalCategory;
        String finalCategorySlug;
        String finalSectionSlug;

        if (isStateScope) {
            String lowerCat = rawCat.toLowerCase();
            if (lowerCat.equals("free") || lowerCat.equals("paid") || lowerCat.contains("free") || lowerCat.contains("paid")) {
                throw new IllegalArgumentException("INVALID_STATE_CATEGORY: State-level resources cannot be catalogued as Free or Paid. Allowed categories ONLY: Art & Culture, History, Heritage & Sites, Geography.");
            }
            String canonical = Product.resolveCanonicalCategory(rawCat);
            if (canonical == null) {
                throw new IllegalArgumentException("INVALID_STATE_CATEGORY: State-level resources must belong ONLY to 'Art & Culture', 'History', 'Heritage & Sites', or 'Geography'. Received: '" + categoryInput + "'");
            }
            finalCategory = canonical;
            finalCategorySlug = Product.resolveCanonicalCategorySlug(rawCat);
            finalSectionSlug = finalCategorySlug;
            isFree = true;
        } else {
            // District Scope: Only Free or Paid allowed
            String lowerCat = rawCat.toLowerCase();
            if (lowerCat.contains("history") || lowerCat.contains("heritage") || lowerCat.contains("geography") || lowerCat.contains("art") || lowerCat.contains("culture") || lowerCat.contains("monument") || lowerCat.contains("site")) {
                throw new IllegalArgumentException("INVALID_DISTRICT_CATEGORY: District-level resources cannot use state categories ('" + categoryInput + "'). Content at district level must belong ONLY to 'Free' or 'Paid' sections.");
            }
            if (lowerCat.equals("free")) {
                finalCategory = "Free";
                finalCategorySlug = "free";
                finalSectionSlug = "free";
                isFree = true;
            } else if (lowerCat.equals("paid")) {
                finalCategory = "Paid";
                finalCategorySlug = "paid";
                finalSectionSlug = "paid";
                isFree = false;
            } else if (isFree) {
                finalCategory = "Free";
                finalCategorySlug = "free";
                finalSectionSlug = "free";
            } else {
                finalCategory = "Paid";
                finalCategorySlug = "paid";
                finalSectionSlug = "paid";
            }
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

        // 7. Destination-Aware Duplicate Identity Check & Metadata Healing
        // Logical Resource Identity:
        // STATE: contentHash + stateSlug + resourceScope(STATE) + districtSlug(general) + categorySlug
        // DISTRICT: contentHash + stateSlug + resourceScope(DISTRICT) + districtSlug + accessTier(isFree)
        String finalContentArea = isStateScope ? "STATE_CONTENT" : (isFree ? "FREE_DISTRICT_CONTENT" : "PAID_DISTRICT_RESOURCES");
        String finalResourceScope = isStateScope ? Product.SCOPE_STATE : Product.SCOPE_DISTRICT;

        List<Product> hashMatches = productRepo.findAllByContentHash(contentHash);
        if (hashMatches == null) {
            hashMatches = new ArrayList<>();
        } else {
            hashMatches = new ArrayList<>(hashMatches);
        }

        Product byChecksum = productRepo.findByChecksum(contentHash);
        if (byChecksum != null) {
            boolean alreadyInList = hashMatches.stream().anyMatch(p -> p != null && p.getId() != null && p.getId().equals(byChecksum.getId()));
            if (!alreadyInList) {
                hashMatches.add(byChecksum);
            }
        }

        // Filter hash matches belonging to the current target state
        List<Product> stateMatches = hashMatches.stream()
                .filter(p -> p != null && cleanStateSlug.equalsIgnoreCase(Product.generateSlug(p.getStateSlug())))
                .collect(Collectors.toList());

        // Step A: Check for EXACT DUPLICATE (Active document matching this exact logical destination)
        Product exactDuplicate = null;
        for (Product candidate : stateMatches) {
            if (isExactDestinationMatch(
                    candidate,
                    cleanStateSlug,
                    cleanDistrictSlug,
                    finalResourceScope,
                    finalCategorySlug,
                    finalSectionSlug,
                    finalContentArea,
                    isFree)) {
                exactDuplicate = candidate;
                break;
            }
        }

        if (exactDuplicate != null) {
            boolean needsUpdate = false;
            if (isStateScope) {
                if (!"general".equalsIgnoreCase(exactDuplicate.getDistrictSlug())) {
                    exactDuplicate.setDistrictSlug("general");
                    needsUpdate = true;
                }
                if (!"general".equalsIgnoreCase(exactDuplicate.getDistrict())) {
                    exactDuplicate.setDistrict("general");
                    needsUpdate = true;
                }
                if (!Product.SCOPE_STATE.equalsIgnoreCase(exactDuplicate.getResourceScope())) {
                    exactDuplicate.setResourceScope(Product.SCOPE_STATE);
                    needsUpdate = true;
                }
                if (!"STATE_CONTENT".equalsIgnoreCase(exactDuplicate.getContentArea())) {
                    exactDuplicate.setContentArea("STATE_CONTENT");
                    needsUpdate = true;
                }
                if (!finalCategory.equals(exactDuplicate.getCategory())) {
                    exactDuplicate.setCategory(finalCategory);
                    needsUpdate = true;
                }
                if (!finalCategorySlug.equals(exactDuplicate.getCategorySlug())) {
                    exactDuplicate.setCategorySlug(finalCategorySlug);
                    needsUpdate = true;
                }
                if (!finalSectionSlug.equals(exactDuplicate.getSectionSlug())) {
                    exactDuplicate.setSectionSlug(finalSectionSlug);
                    needsUpdate = true;
                }
            } else {
                if (!cleanDistrictSlug.equalsIgnoreCase(exactDuplicate.getDistrictSlug())) {
                    exactDuplicate.setDistrictSlug(cleanDistrictSlug);
                    needsUpdate = true;
                }
                if (canonicalDistrictName != null && !canonicalDistrictName.equalsIgnoreCase(exactDuplicate.getDistrict())) {
                    exactDuplicate.setDistrict(canonicalDistrictName);
                    needsUpdate = true;
                }
                if (!Product.SCOPE_DISTRICT.equalsIgnoreCase(exactDuplicate.getResourceScope())) {
                    exactDuplicate.setResourceScope(Product.SCOPE_DISTRICT);
                    needsUpdate = true;
                }
            }
            if (exactDuplicate.isArchived()) {
                exactDuplicate.setArchived(false);
                needsUpdate = true;
            }
            if (Boolean.TRUE.equals(exactDuplicate.getIsDeleted())) {
                exactDuplicate.setIsDeleted(false);
                needsUpdate = true;
            }
            if (!Boolean.TRUE.equals(exactDuplicate.isPublished())) {
                exactDuplicate.setPublished(true);
                exactDuplicate.setPublishedField(true);
                needsUpdate = true;
            }
            if (needsUpdate) {
                exactDuplicate.setUpdatedAt(new Date());
                exactDuplicate = productRepo.save(exactDuplicate);
            }

            String currentLoc = formatDestination(exactDuplicate);
            log.info("ADMIN_RESOURCE_DUPLICATE: Destination match found for hash={}, state={}, scope={}, district={}, categorySlug={}. Idempotent return ID={}",
                    contentHash, cleanStateSlug, finalResourceScope, cleanDistrictSlug, finalCategorySlug, exactDuplicate.getId());
            return new ResourceUploadResult(
                    exactDuplicate,
                    true,
                    false,
                    "Resource already exists in the selected destination.",
                    null,
                    null,
                    currentLoc);
        }

        // Step B: Check for a LEGACY / ARCHIVED document at THIS SAME LOGICAL SCOPE to heal / reactivate
        Product documentToHeal = null;
        for (Product candidate : stateMatches) {
            if (isStateScope) {
                // Must be at the general/state scope of this state
                String distSlug = Product.generateSlug(candidate.getDistrictSlug());
                boolean isGeneralScope = "general".equalsIgnoreCase(distSlug) || distSlug == null || distSlug.isBlank() || "state".equalsIgnoreCase(distSlug);
                boolean isExplicitDistrict = candidate.getResourceScope() != null && Product.SCOPE_DISTRICT.equalsIgnoreCase(candidate.getResourceScope())
                        && !isGeneralScope;

                // District-scoped resources must NEVER be mutated or stolen by state-level uploads
                if (!isExplicitDistrict && isGeneralScope) {
                    boolean isArchivedOrUnpub = candidate.isArchived() || !candidate.isPublished() || Boolean.TRUE.equals(candidate.getIsDeleted());
                    boolean hasLegacyScope = candidate.getRawResourceScope() == null || !Product.SCOPE_STATE.equalsIgnoreCase(candidate.getRawResourceScope());
                    boolean hasLegacyCategory = !Product.isStrictCanonicalCategory(candidate.getCategory()) || !Product.isStrictCanonicalSlug(candidate.getCategorySlug());
                    boolean isSameCategoryLegacyName = finalCategory.equalsIgnoreCase(Product.resolveCanonicalCategory(candidate.getCategory()))
                            && (!finalCategory.equalsIgnoreCase(candidate.getCategory()) || !finalCategorySlug.equalsIgnoreCase(candidate.getCategorySlug()));

                    if (isArchivedOrUnpub || hasLegacyScope || hasLegacyCategory || isSameCategoryLegacyName) {
                        documentToHeal = candidate;
                        break;
                    }
                }
            } else {
                // District scope: must be for this specific district and access tier, but archived/unpublished
                String distSlug = Product.generateSlug(candidate.getDistrictSlug());
                if (cleanDistrictSlug.equalsIgnoreCase(distSlug) && candidate.isFree() == isFree) {
                    if (candidate.isArchived() || !candidate.isPublished() || Boolean.TRUE.equals(candidate.getIsDeleted())) {
                        documentToHeal = candidate;
                        break;
                    }
                }
            }
        }

        if (documentToHeal != null) {
            Product existing = documentToHeal;
            String prevLocation = formatDestination(existing);
            String newLocation = formatDestination(canonicalState.getName(), cleanDistrictSlug, finalResourceScope, finalCategory);

            String healMessage = existing.isArchived()
                    ? "Archived resource reactivated and cataloged successfully."
                    : "Existing resource reclassified into the selected state category.";

            log.info("ADMIN_RESOURCE_HEAL: Healing/reactivating resource ID={} from '{}' to '{}'",
                    existing.getId(), prevLocation, newLocation);

            existing.setResourceScope(finalResourceScope);
            existing.setDistrictSlug(cleanDistrictSlug);
            existing.setDistrict(canonicalDistrictName);
            existing.setState(canonicalState.getName());
            existing.setStateSlug(cleanStateSlug);
            existing.setContentArea(finalContentArea);
            existing.setCategory(finalCategory);
            existing.setCategorySlug(finalCategorySlug);
            existing.setSectionSlug(finalSectionSlug);
            existing.setFree(isFree);
            existing.setPrice(price);
            existing.setPublished(publish);
            existing.setArchived(false);
            existing.setIsDeleted(false);
            existing.setUpdatedAt(new Date());

            if (effectiveTitle != null && !effectiveTitle.isBlank()) {
                existing.setTitle(effectiveTitle);
                existing.setDisplayTitle(Product.stripExtension(effectiveTitle));
            }

            if (descriptionInput != null && !descriptionInput.isBlank()) {
                existing.setDescription(descriptionInput.trim());
            }

            if (existing.getContentHash() == null || existing.getContentHash().isBlank()) {
                existing.setContentHash(contentHash);
            }
            if (existing.getFileSize() == null || existing.getFileSize() == 0) {
                existing.setFileSize((long) fileBytes.length);
            }
            if (existing.getFileExtension() == null || existing.getFileExtension().isBlank()) {
                existing.setFileExtension(ext);
            }
            if (existing.getMimeType() == null || existing.getMimeType().isBlank()) {
                existing.setMimeType(mimeType);
            }
            if (existing.getContentType() == null || existing.getContentType().isBlank()) {
                existing.setContentType(contentType);
                existing.setType(contentType);
            }
            if (existing.getIngestionStatus() == null) {
                existing.setIngestionStatus(IngestionStatus.COMPLETED);
            }

            String targetS3Key = existing.getS3Key();
            if (targetS3Key == null || targetS3Key.isBlank()) {
                String sanitizedFilename = sanitizeFilename(originalFilename);
                String tier = isFree ? "free" : "paid";
                targetS3Key = "states/" + cleanStateSlug + "/" + cleanDistrictSlug + "/" + tier + "/" + sanitizedFilename;
                try {
                    if (s3Service.objectExists(targetS3Key) || productRepo.existsByS3Key(targetS3Key)) {
                        String nameWithoutExt = Product.stripExtension(sanitizedFilename);
                        targetS3Key = "states/" + cleanStateSlug + "/" + cleanDistrictSlug + "/" + tier + "/" + nameWithoutExt + "_"
                                + System.currentTimeMillis() + "." + ext;
                    }
                    try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
                        s3Service.uploadFileWithKey(inputStream, fileBytes.length, targetS3Key, mimeType);
                    }
                } catch (Exception e) {
                    log.warn("S3 upload for missing key on healed resource encountered warning: {}", e.getMessage());
                }
                existing.setS3Key(targetS3Key);
                existing.setStorageKey(targetS3Key);
                try {
                    existing.setS3Url(s3Service.getS3Url(targetS3Key));
                } catch (Exception e) {
                    // fallback URL
                }
            } else if (existing.getS3Url() == null || existing.getS3Url().isBlank()) {
                try {
                    existing.setS3Url(s3Service.getS3Url(targetS3Key));
                } catch (Exception e) {
                    // fallback URL
                }
            }

            existing = productRepo.save(existing);
            return new ResourceUploadResult(existing, false, true, healMessage, prevLocation, newLocation, null);
        }

        // Step C: BRAND NEW CATALOG ENTRY (Distinct destination or new content)

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
        product.setCategory(finalCategory);
        product.setCategorySlug(finalCategorySlug);
        product.setSectionSlug(finalSectionSlug);
        product.setContentArea(isStateScope ? "STATE_CONTENT" : (isFree ? "FREE_DISTRICT_CONTENT" : "PAID_DISTRICT_RESOURCES"));
        product.setResourceScope(isStateScope ? Product.SCOPE_STATE : Product.SCOPE_DISTRICT);
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

        List<Product> stateProducts = productRepo.findByStateSlug(cleanStateSlug);
        if (stateProducts == null || stateProducts.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        boolean isStateLevel = cleanDistrictSlug == null || cleanDistrictSlug.isBlank()
                || "general".equalsIgnoreCase(cleanDistrictSlug) || "state".equalsIgnoreCase(cleanDistrictSlug);

        if (isStateLevel) {
            return stateProducts.stream()
                    .filter(p -> p != null
                            && p.isStateScope()
                            && !Boolean.TRUE.equals(p.isArchived())
                            && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .collect(Collectors.toList());
        } else {
            return stateProducts.stream()
                    .filter(p -> p != null
                            && !p.isStateScope()
                            && !Product.SCOPE_STATE.equalsIgnoreCase(p.getResourceScope())
                            && cleanDistrictSlug.equalsIgnoreCase(Product.generateSlug(p.getDistrictSlug()))
                            && !Boolean.TRUE.equals(p.isArchived())
                            && !Boolean.TRUE.equals(p.getIsDeleted()))
                    .collect(Collectors.toList());
        }
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
                    + "' is not supported. Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP, MP3, WAV, M4A, AAC, OGG, MP4.");
        }

        String mimeType = file.getContentType();
        if (mimeType != null && !mimeType.isBlank()) {
            String lowerMime = mimeType.toLowerCase();
            boolean mimeValid = lowerMime.startsWith("image/") ||
                    lowerMime.startsWith("audio/") ||
                    lowerMime.startsWith("video/") ||
                    lowerMime.equals("application/pdf") ||
                    lowerMime.equals("application/msword") ||
                    lowerMime.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
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

    public static boolean isExactDestinationMatch(
            Product existing,
            String targetStateSlug,
            String targetDistrictSlug,
            String targetResourceScope,
            String targetCategorySlug,
            String targetSectionSlug,
            String targetContentArea,
            boolean targetIsFree) {
        if (existing == null) {
            return false;
        }

        if (existing.isArchived() || Boolean.TRUE.equals(existing.getIsDeleted()) || !Boolean.TRUE.equals(existing.isPublished())) {
            return false;
        }

        // 1. State Slug Normalization & Match
        String normExistingState = Product.generateSlug(existing.getStateSlug());
        String normTargetState = Product.generateSlug(targetStateSlug);
        if (normExistingState == null || !normExistingState.equalsIgnoreCase(normTargetState)) {
            return false;
        }

        // 2. Resource Scope Normalization & Match
        String rawScope = existing.getRawResourceScope();
        if (rawScope == null || rawScope.isBlank()) {
            return false; // Legacy/missing scope must be healed
        }
        String existingScope = existing.getResourceScope();
        if (existingScope == null || existingScope.isBlank()) {
            return false; // Legacy/missing scope must be healed
        }
        String normExistingScope = existingScope.trim().toUpperCase();
        String normTargetScope = targetResourceScope != null ? targetResourceScope.trim().toUpperCase() : "";
        if (!normExistingScope.equalsIgnoreCase(normTargetScope)) {
            return false;
        }

        // 3. District Slug Normalization & Match
        boolean isStateScope = Product.SCOPE_STATE.equalsIgnoreCase(normTargetScope);
        String normTargetDistrict = isStateScope ? "general" : Product.generateSlug(targetDistrictSlug);
        String existingDistSlug = Product.generateSlug(existing.getDistrictSlug());
        String normExistingDistrict = isStateScope ? (existingDistSlug == null || existingDistSlug.isBlank() ? "general" : existingDistSlug) : existingDistSlug;
        if (normExistingDistrict == null || !normExistingDistrict.equalsIgnoreCase(normTargetDistrict)) {
            return false;
        }

        // 4. Category Slug Normalization & Match
        if (isStateScope && (!Product.isStrictCanonicalCategory(existing.getCategory()) || !Product.isStrictCanonicalSlug(existing.getCategorySlug()))) {
            return false; // Legacy category must be healed to canonical name
        }
        String normTargetCategorySlug = isStateScope
                ? Product.resolveCanonicalCategorySlug(targetCategorySlug)
                : (targetIsFree ? "free" : "paid");
        String normExistingCategorySlug = isStateScope
                ? Product.resolveCanonicalCategorySlug(existing.getCategorySlug() != null ? existing.getCategorySlug() : existing.getCategory())
                : (existing.isFree() ? "free" : "paid");
        if (normTargetCategorySlug == null || !normTargetCategorySlug.equalsIgnoreCase(normExistingCategorySlug)) {
            return false;
        }

        // 5. Section Slug Match (for state-level content)
        if (isStateScope) {
            String normTargetSectionSlug = Product.resolveCanonicalCategorySlug(
                    targetSectionSlug != null && !targetSectionSlug.isBlank() ? targetSectionSlug : targetCategorySlug);
            String rawExistingSection = existing.getSectionSlug() != null && !existing.getSectionSlug().isBlank()
                    ? existing.getSectionSlug()
                    : (existing.getCategorySlug() != null && !existing.getCategorySlug().isBlank() ? existing.getCategorySlug() : existing.getCategory());
            String normExistingSectionSlug = Product.resolveCanonicalCategorySlug(rawExistingSection);
            if (normTargetSectionSlug == null || !normTargetSectionSlug.equalsIgnoreCase(normExistingSectionSlug)) {
                return false;
            }
        }

        // 6. Content Area Match
        String normTargetContentArea = targetContentArea != null ? targetContentArea.trim() : "";
        String normExistingContentArea = existing.getContentArea() != null ? existing.getContentArea().trim() : "";
        if (!normExistingContentArea.isBlank() && !normTargetContentArea.equalsIgnoreCase(normExistingContentArea)) {
            return false;
        }

        // 7. Free / Paid Access Tier Match
        if (existing.isFree() != targetIsFree) {
            return false;
        }

        return true;
    }

    public static String formatDestination(String state, String districtSlug, String scope, String category) {
        String stateDisplay = (state != null && !state.isBlank()) ? state : "State";
        boolean isState = Product.SCOPE_STATE.equalsIgnoreCase(scope) || "general".equalsIgnoreCase(districtSlug);
        if (isState) {
            String catDisplay = (category != null && !category.isBlank()) ? category : "State Materials";
            return stateDisplay + " → " + catDisplay;
        } else {
            String distDisplay = (districtSlug != null && !districtSlug.isBlank()) ? districtSlug : "District";
            String tierDisplay = (category != null && !category.isBlank()) ? category : "Materials";
            return stateDisplay + " → " + distDisplay + " (" + tierDisplay + ")";
        }
    }

    public static String formatDestination(Product p) {
        if (p == null) return "Unknown";
        String stateDisplay = p.getState() != null && !p.getState().isBlank() ? p.getState() : p.getStateSlug();
        boolean isState = p.isStateScope() || "general".equalsIgnoreCase(p.getDistrictSlug()) || Product.SCOPE_STATE.equalsIgnoreCase(p.getResourceScope());
        if (isState) {
            String cat = p.getCategory() != null && !p.getCategory().isBlank() ? p.getCategory() : p.getCategorySlug();
            return (stateDisplay != null ? stateDisplay : "") + " → " + (cat != null ? cat : "State Materials");
        } else {
            String dist = p.getDistrict() != null && !p.getDistrict().isBlank() ? p.getDistrict() : p.getDistrictSlug();
            String tier = p.getCategory() != null && !p.getCategory().isBlank() ? p.getCategory() : (p.isFree() ? "Free" : "Paid");
            return (stateDisplay != null ? stateDisplay : "") + " → " + (dist != null ? dist : "District") + " (" + tier + ")";
        }
    }

    public static class ResourceUploadResult {
        private final Product product;
        private final boolean isDuplicate;
        private final boolean isReclassified;
        private final String message;
        private final String previousDestination;
        private final String newDestination;
        private final String currentDestination;

        public ResourceUploadResult(Product product, boolean isDuplicate, String message) {
            this(product, isDuplicate, false, message, null, null, null);
        }

        public ResourceUploadResult(Product product, boolean isDuplicate, boolean isReclassified, String message) {
            this(product, isDuplicate, isReclassified, message, null, null, null);
        }

        public ResourceUploadResult(Product product, boolean isDuplicate, boolean isReclassified, String message,
                                    String previousDestination, String newDestination, String currentDestination) {
            this.product = product;
            this.isDuplicate = isDuplicate;
            this.isReclassified = isReclassified;
            this.message = message;
            this.previousDestination = previousDestination;
            this.newDestination = newDestination;
            this.currentDestination = currentDestination;
        }

        public Product getProduct() {
            return product;
        }

        public boolean isDuplicate() {
            return isDuplicate;
        }

        public boolean isReclassified() {
            return isReclassified;
        }

        public String getMessage() {
            return message;
        }

        public String getPreviousDestination() {
            return previousDestination;
        }

        public String getNewDestination() {
            return newDestination;
        }

        public String getCurrentDestination() {
            return currentDestination;
        }
    }
}
