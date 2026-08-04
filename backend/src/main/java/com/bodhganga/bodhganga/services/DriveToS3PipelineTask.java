package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DriveToS3PipelineTask {

    private static final Logger log = LoggerFactory.getLogger(DriveToS3PipelineTask.class);

    private final GoogleDriveSyncService googleDriveSyncService;
    private final S3Service s3Service;
    private final ProductRepo productRepo;
    private final MongoTemplate mongoTemplate;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private volatile Date lastRun;
    private final AtomicInteger filesProcessed = new AtomicInteger(0);
    private final AtomicInteger filesUploaded = new AtomicInteger(0);
    private final AtomicInteger filesFailed = new AtomicInteger(0);
    private final AtomicInteger filesSkipped = new AtomicInteger(0);
    private final AtomicInteger duplicatesFound = new AtomicInteger(0);
    private final AtomicLong syncDurationMs = new AtomicLong(0);

    private static final List<String> SUPPORTED_EXTENSIONS = List.of(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "png", "jpg", "jpeg", "webp",
        "mp3", "m4a", "wav", "ogg", "aac", "flac",
        "mp4", "avi", "mkv", "mov",
        "zip", "txt"
    );

    public DriveToS3PipelineTask(GoogleDriveSyncService googleDriveSyncService,
                                S3Service s3Service,
                                ProductRepo productRepo,
                                MongoTemplate mongoTemplate) {
        this.googleDriveSyncService = googleDriveSyncService;
        this.s3Service = s3Service;
        this.productRepo = productRepo;
        this.mongoTemplate = mongoTemplate;
    }

    @Value("${google.drive.source-folder-id:#{null}}")
    private String sourceFolderId;

    @Value("${google.drive.archive-folder-id:#{null}}")
    private String archiveFolderId;

    @Value("${google.drive.pipeline.enabled:false}")
    private boolean pipelineEnabled;

    @jakarta.annotation.PostConstruct
    public void validateStartup() {
        boolean driveConfigured = googleDriveSyncService.isConfigured();
        boolean s3Configured = s3Service != null && s3Service.getBucketName() != null && !s3Service.getBucketName().isEmpty();
        boolean mongoConnected = false;
        try {
            mongoTemplate.executeCommand("{ping: 1}");
            mongoConnected = true;
        } catch (Exception e) {
            log.error("MongoDB connection check failed: {}", e.getMessage());
        }

        log.info("[GENERIC PIPELINE] Google Drive configured: {}", driveConfigured);
        log.info("[GENERIC PIPELINE] S3 configured: {}", s3Configured);
        log.info("[GENERIC PIPELINE] Mongo connected: {}", mongoConnected);
        log.info("[GENERIC PIPELINE] Pipeline enabled: {}", pipelineEnabled);
        log.info("[GENERIC PIPELINE] Source folder ID: {}", sourceFolderId);
        log.info("[GENERIC PIPELINE] Archive folder ID: {}", archiveFolderId);

        if (pipelineEnabled) {
            boolean canRun = true;
            if (!driveConfigured) { log.warn("Google Drive not configured"); canRun = false; }
            if (!s3Configured) { log.warn("S3 not configured"); canRun = false; }
            if (!mongoConnected) { log.warn("MongoDB not connected"); canRun = false; }
            if (sourceFolderId == null || sourceFolderId.isBlank()) { log.warn("Source folder ID missing"); canRun = false; }
            if (archiveFolderId == null || archiveFolderId.isBlank()) { log.warn("Archive folder ID missing"); canRun = false; }
            if (!canRun) {
                log.warn("Pipeline prerequisites not met. Pipeline will NOT run automatically.");
                pipelineEnabled = false;
            }
        }
    }

    public boolean isRunning() { return isRunning.get(); }
    public Date getLastRun() { return lastRun; }
    public int getFilesProcessed() { return filesProcessed.get(); }
    public int getFilesUploaded() { return filesUploaded.get(); }
    public int getFilesFailed() { return filesFailed.get(); }
    public int getFilesSkipped() { return filesSkipped.get(); }
    public int getDuplicatesFound() { return duplicatesFound.get(); }
    public long getSyncDurationMs() { return syncDurationMs.get(); }

    @Scheduled(fixedDelay = 600000)
    public void syncDriveToS3() {
        syncDriveToS3(false);
    }

    public void syncDriveToS3(boolean force) {
        if (!force && (!pipelineEnabled || !googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            log.info("[GENERIC PIPELINE] Sync skipped.");
            return;
        }
        if (force && (!googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            throw new IllegalStateException("Google Drive sync service is not configured or source folder ID is missing.");
        }
        if (!isRunning.compareAndSet(false, true)) {
            log.warn("[GENERIC PIPELINE] Pipeline already running.");
            if (force) throw new IllegalStateException("Pipeline sync is already running.");
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("[GENERIC PIPELINE] STARTED - forced={}", force);
        filesProcessed.set(0);
        filesUploaded.set(0);
        filesFailed.set(0);
        filesSkipped.set(0);
        duplicatesFound.set(0);

        try {
            traverseAndSync(sourceFolderId, "BodhGanga", new ArrayList<>());
            lastRun = new Date();
            syncDurationMs.set(System.currentTimeMillis() - startTime);
            log.info("[GENERIC PIPELINE] COMPLETED in {} ms - uploaded={}, skipped={}, failed={}, duplicates={}",
                syncDurationMs.get(), filesUploaded.get(), filesSkipped.get(), filesFailed.get(), duplicatesFound.get());
        } catch (Exception e) {
            log.error("[GENERIC PIPELINE] FAILED: {}", e.getMessage(), e);
            if (force) throw new RuntimeException("Error during Drive to S3 sync: " + e.getMessage(), e);
        } finally {
            isRunning.set(false);
        }
    }

    /**
     * Recursive folder traversal with unlimited depth & pagination.
     */
    private void traverseAndSync(String folderId, String folderName, List<String> folderPath) {
        log.info("[GENERIC PIPELINE] FOLDER: {} ({}) Path: {}", folderName, folderId, folderPath);
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            if (items == null) return;

            for (File item : items) {
                String mimeType = item.getMimeType();
                if ("application/vnd.google-apps.folder".equals(mimeType)) {
                    List<String> nextPath = new ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    traverseAndSync(item.getId(), item.getName(), nextPath);
                } else {
                    try {
                        processFile(item, folderId, folderPath);
                    } catch (Exception e) {
                        log.error("[GENERIC PIPELINE] Failed processing file {}: {}", item.getName(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("[GENERIC PIPELINE] Error scanning folder {} ({}): {}", folderName, folderId, e.getMessage());
        }
    }

    private boolean isFreeFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("free") || lower.equals("free resources") || lower.equals("free-resources");
    }

    private boolean isPaidFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("paid") || lower.equals("paid resources") || lower.equals("paid-resources");
    }

    private void processFile(File file, String parentFolderId, List<String> folderPath) throws Exception {
        filesProcessed.incrementAndGet();
        String fileName = file.getName();
        log.info("[GENERIC PIPELINE] FILE: {} (Drive ID: {})", fileName, file.getId());

        String mimeType = file.getMimeType();
        boolean isGoogleDoc = mimeType != null && (
            mimeType.equals("application/vnd.google-apps.document") ||
            mimeType.equals("application/vnd.google-apps.spreadsheet") ||
            mimeType.equals("application/vnd.google-apps.presentation")
        );
        String targetMimeType = isGoogleDoc ? "application/pdf" : mimeType;

        if (isGoogleDoc && fileName != null && !fileName.toLowerCase().endsWith(".pdf")) {
            fileName = fileName + ".pdf";
        }

        String fileExtension = Product.getFileExtension(fileName);
        if (!SUPPORTED_EXTENSIONS.contains(fileExtension)) {
            log.info("[GENERIC PIPELINE] Unsupported extension: {} - skipping: {}", fileExtension, fileName);
            filesSkipped.incrementAndGet();
            return;
        }

        // ── Extract Hierarchical Metadata (State, NavbarCategory, District, Tier) ───────────
        HierarchicalMetadata metadata = extractMetadata(folderPath, fileName);
        String state = metadata.state;
        String stateSlug = metadata.stateSlug;
        String navbarCategory = metadata.navbarCategory;
        String navbarSlug = metadata.navbarSlug;
        String district = metadata.district;
        String districtSlug = metadata.districtSlug;
        boolean isFree = metadata.isFree;
        double price = isFree ? 0.0 : 99.0;

        // ── Construct S3 Key ────────────────────────────────────────────────────────
        // Generic structure: state-slug/navbar-slug/filename.pdf
        // District structure: state-slug/category-slug/district-slug/tier/filename.pdf
        String s3Key = metadata.buildS3Key(fileName);
        long size = file.getSize() != null ? file.getSize() : 0;
        String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
        String contentType = Product.determineContentType(fileMimeType, fileName);

        log.info("[GENERIC PIPELINE] state={} navbarCategory={} district={} s3Key={}",
            state, navbarCategory, district, s3Key);

        // ── Step 1: Download & Compute Checksum ──────────────────────────────
        byte[] fileBytes;
        String checksum;
        try (InputStream inputStream = isGoogleDoc
                ? googleDriveSyncService.downloadFile(file.getId(), mimeType)
                : googleDriveSyncService.downloadFile(file.getId())) {

            if (inputStream == null) {
                throw new java.io.IOException("Failed to open stream for Google Drive file: " + fileName);
            }
            fileBytes = inputStream.readAllBytes();
            if (size <= 0) {
                size = fileBytes.length;
            }
            checksum = calculateSHA256(fileBytes);
        }

        // ── Step 2: Idempotent Duplicate Detection ───────────────────────────
        Product existing = productRepo.findByGoogleDriveFileId(file.getId());
        if (existing == null) existing = productRepo.findByS3Key(s3Key).orElse(null);
        if (existing == null && checksum != null) existing = productRepo.findByChecksum(checksum).orElse(null);
        if (existing == null && fileName != null) {
            List<Product> matches = productRepo.findByImportedFromDrive(true);
            for (Product p : matches) {
                if (fileName.equals(p.getFileName())) { existing = p; break; }
            }
        }

        Product product = existing;
        if (product != null) {
            log.info("[GENERIC PIPELINE] Found existing database record for: {}", fileName);
            duplicatesFound.incrementAndGet();
            if (product.getGoogleDriveFileId() == null || product.getGoogleDriveFileId().isEmpty()) {
                product.setGoogleDriveFileId(file.getId());
            }
        } else {
            product = new Product();
            product.setOriginalFileName(fileName);
            product.setFileName(fileName);
            product.setFileExtension(fileExtension);
            product.setImportedFromDrive(true);
            product.setCreatedAt(new Date());
            log.info("[GENERIC PIPELINE] Creating new product record for: {}", fileName);
        }

        // ── Step 3: Populate Metadata ────────────────────────────────────────
        String displayTitle = Product.stripExtension(fileName);
        product.setTitle(displayTitle);
        product.setDisplayTitle(displayTitle);
        product.setType(contentType);
        product.setContentType(contentType);
        product.setMimeType(fileMimeType);
        product.setFileSize(size);
        product.setState(normalizeName(state));
        product.setStateSlug(stateSlug);
        product.setDistrict(normalizeName(district));
        product.setDistrictSlug(districtSlug);
        product.setNavbarCategory(navbarCategory);
        product.setNavbarSlug(navbarSlug);
        product.setCategorySlug(navbarSlug);
        product.setSubcategory(metadata.subcategory);
        product.setSubcategorySlug(metadata.subcategorySlug);
        product.setSubfolderPath(metadata.subfolderPath);
        product.setGoogleDriveFileId(file.getId());
        product.setGoogleDriveParentId(parentFolderId);
        product.setChecksum(checksum);
        product.setLastSync(new Date());
        product.setSource("Google Drive");
        product.setPublished(true);
        product.setFree(isFree);
        product.setPrice(price);
        product.setCategory(navbarCategory != null ? navbarCategory : (isFree ? "Free Resources" : "Paid Resources"));
        product.setIngestionStatus(IngestionStatus.PROCESSING);
        product.setUpdatedAt(new Date());

        product = productRepo.save(product);

        // ── Step 4: Atomic S3 Upload ─────────────────────────────────────────
        try (InputStream uploadStream = new java.io.ByteArrayInputStream(fileBytes)) {
            String returnedKey = s3Service.uploadFileWithKey(uploadStream, size, s3Key, fileMimeType);
            String s3Url = s3Service.getS3Url(returnedKey);

            product.setS3Key(returnedKey);
            product.setStorageKey(returnedKey);
            product.setS3Url(s3Url);
            product.setIngestionStatus(IngestionStatus.COMPLETED);
            product.setUpdatedAt(new Date());
            product = productRepo.save(product);

            log.info("[GENERIC PIPELINE] SUCCESS state={} navbarCategory={} s3Url={}",
                state, navbarCategory, s3Url);

            // ── Step 5: Archive ONLY After S3 + Mongo Success ─────────────────────
            if (archiveFolderId != null && !archiveFolderId.isEmpty() && !archiveFolderId.equals("null")) {
                googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
                product.setArchived(true);
                productRepo.save(product);
                log.info("[GENERIC PIPELINE] Archived in Drive: {}", fileName);
            }

            if (existing != null) {
                filesSkipped.incrementAndGet();
            } else {
                filesUploaded.incrementAndGet();
            }
        } catch (Exception e) {
            filesFailed.incrementAndGet();
            product.setIngestionStatus(IngestionStatus.FAILED);
            product.setUpdatedAt(new Date());
            productRepo.save(product);
            log.error("[GENERIC PIPELINE] FAILED file={} error={}", fileName, e.getMessage());
            throw e;
        }
    }

    private String calculateSHA256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    public static String normalizeName(String name) {
        if (name == null) return "";
        String cleaned = name.replaceAll("(?i)^(State\\s*\\d+\\s*-\\s*|State\\s*-\\s*|State\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+District$", "").trim();
        return cleaned;
    }

    /**
     * Generic & Backward-Compatible Folder Metadata Extractor
     */
    private HierarchicalMetadata extractMetadata(List<String> folderPath, String fileName) {
        if (folderPath == null || folderPath.isEmpty()) {
            return new HierarchicalMetadata("General", "general", "General Notes", "general-notes", null, null, null, "general", "general", true);
        }

        List<String> cleanedPath = new ArrayList<>();
        boolean isFree = false;
        boolean hasTierFolder = false;

        for (String folder : folderPath) {
            if (isFreeFolder(folder)) { isFree = true; hasTierFolder = true; continue; }
            if (isPaidFolder(folder)) { isFree = false; hasTierFolder = true; continue; }
            String norm = normalizeName(folder);
            if (!norm.isEmpty()) cleanedPath.add(norm);
        }

        if (cleanedPath.isEmpty()) {
            return new HierarchicalMetadata("General", "general", "General Notes", "general-notes", null, null, null, "general", "general", isFree);
        }

        // Folder 0 is State
        String state = cleanedPath.get(0);
        String stateSlug = Product.generateSlug(state);

        String navbarCategory = "General Notes";
        String district = "general";
        String subcategory = null;
        String subcategorySlug = null;
        String subfolderPath = null;

        if (cleanedPath.size() > 1) {
            String segment1 = cleanedPath.get(1);
            navbarCategory = segment1;

            if (cleanedPath.size() > 2) {
                // If folder 2 is a known district folder pattern or district ingestion
                district = cleanedPath.get(2);

                // Build subcategory path for unlimited nesting
                List<String> subList = cleanedPath.subList(2, cleanedPath.size());
                subcategory = subList.get(0);
                subcategorySlug = Product.generateSlug(subcategory);
                subfolderPath = String.join("/", subList);
            }
        }

        String navbarSlug = Product.generateSlug(navbarCategory);
        String districtSlug = Product.generateSlug(district);

        if (!hasTierFolder) {
            isFree = true;
        }

        return new HierarchicalMetadata(
            state, stateSlug,
            navbarCategory, navbarSlug,
            subcategory, subcategorySlug, subfolderPath,
            district, districtSlug, isFree
        );
    }

    private static class HierarchicalMetadata {
        public final String state;
        public final String stateSlug;
        public final String navbarCategory;
        public final String navbarSlug;
        public final String subcategory;
        public final String subcategorySlug;
        public final String subfolderPath;
        public final String district;
        public final String districtSlug;
        public final boolean isFree;

        public HierarchicalMetadata(String state, String stateSlug,
                                    String navbarCategory, String navbarSlug,
                                    String subcategory, String subcategorySlug, String subfolderPath,
                                    String district, String districtSlug,
                                    boolean isFree) {
            this.state = state;
            this.stateSlug = stateSlug;
            this.navbarCategory = navbarCategory;
            this.navbarSlug = navbarSlug;
            this.subcategory = subcategory;
            this.subcategorySlug = subcategorySlug;
            this.subfolderPath = subfolderPath;
            this.district = district;
            this.districtSlug = districtSlug;
            this.isFree = isFree;
        }

        public String buildS3Key(String fileName) {
            if (district != null && !district.equals("general") && (subcategory == null || subcategory.equals(district))) {
                // Backward compatible district S3 path: state-slug/navbar-slug/district-slug/free|paid/filename.pdf
                return String.format("%s/%s/%s/%s/%s",
                    stateSlug, navbarSlug, districtSlug, (isFree ? "free" : "paid"), fileName);
            } else if (subfolderPath != null && !subfolderPath.isEmpty()) {
                // Generic nested subcategory S3 path: state-slug/navbar-slug/subfolder-slugs/filename.pdf
                String[] segments = subfolderPath.split("/");
                StringBuilder sb = new StringBuilder(stateSlug).append("/").append(navbarSlug);
                for (String seg : segments) {
                    sb.append("/").append(Product.generateSlug(seg));
                }
                sb.append("/").append(fileName);
                return sb.toString();
            } else {
                // Generic category S3 path: state-slug/navbar-slug/filename.pdf
                return String.format("%s/%s/%s", stateSlug, navbarSlug, fileName);
            }
        }
    }
}
