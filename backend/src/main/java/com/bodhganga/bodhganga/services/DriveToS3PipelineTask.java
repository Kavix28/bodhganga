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

import java.io.InputStream;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Date;

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

    private static final List<String> SUPPORTED_EXTENSIONS = List.of(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "png", "jpg", "jpeg", "webp",
        "mp3", "m4a", "wav", "ogg", "aac", "flac",
        "mp4", "avi", "mkv", "mov",
        "zip", "txt"
    );

    public DriveToS3PipelineTask(GoogleDriveSyncService googleDriveSyncService, S3Service s3Service, ProductRepo productRepo, MongoTemplate mongoTemplate) {
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

        log.info("Google Drive configured: {}", driveConfigured);
        log.info("S3 configured: {}", s3Configured);
        log.info("Mongo connected: {}", mongoConnected);
        log.info("Pipeline enabled: {}", pipelineEnabled);
        log.info("Source folder id: {}", sourceFolderId);
        log.info("Archive folder id: {}", archiveFolderId);

        if (pipelineEnabled) {
            boolean canRun = true;
            if (!driveConfigured) { log.warn("Google Drive not configured"); canRun = false; }
            if (!s3Configured) { log.warn("S3 not configured"); canRun = false; }
            if (!mongoConnected) { log.warn("MongoDB not connected"); canRun = false; }
            if (sourceFolderId == null || sourceFolderId.isBlank()) { log.warn("Source folder ID missing"); canRun = false; }
            if (archiveFolderId == null || archiveFolderId.isBlank()) { log.warn("Archive folder ID missing"); canRun = false; }
            if (!canRun) {
                log.warn("Pipeline prerequisites not met. Pipeline will NOT run.");
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

    @Scheduled(fixedDelay = 600000)
    public void syncDriveToS3() {
        syncDriveToS3(false);
    }

    public void syncDriveToS3(boolean force) {
        if (!force && (!pipelineEnabled || !googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            log.info("Pipeline sync skipped.");
            return;
        }
        if (force && (!googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            throw new IllegalStateException("Google Drive sync service is not configured or source folder ID is missing.");
        }
        if (!isRunning.compareAndSet(false, true)) {
            log.warn("Pipeline already running.");
            if (force) throw new IllegalStateException("Pipeline sync is already running.");
            return;
        }

        log.info("[INGESTION] PIPELINE STARTED - forced={}", force);
        filesProcessed.set(0);
        filesUploaded.set(0);
        filesFailed.set(0);
        filesSkipped.set(0);

        try {
            traverseAndSync(sourceFolderId, "BodhGanga", new java.util.ArrayList<>());
            lastRun = new Date();
            log.info("[INGESTION] PIPELINE COMPLETED - uploaded={}, skipped={}, failed={}",
                filesUploaded.get(), filesSkipped.get(), filesFailed.get());
        } catch (Exception e) {
            log.error("[INGESTION] PIPELINE FAILED: {}", e.getMessage(), e);
            if (force) throw new RuntimeException("Error during Drive to S3 sync: " + e.getMessage(), e);
        } finally {
            isRunning.set(false);
        }
    }

    private void traverseAndSync(String folderId, String folderName, List<String> folderPath) {
        log.info("[INGESTION] FOLDER: {} ({})", folderName, folderId);
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            if (items == null) return;

            for (File item : items) {
                String mimeType = item.getMimeType();
                if ("application/vnd.google-apps.folder".equals(mimeType)) {
                    List<String> nextPath = new java.util.ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    traverseAndSync(item.getId(), item.getName(), nextPath);
                } else {
                    try {
                        processFile(item, folderId, folderPath);
                    } catch (Exception e) {
                        log.error("Failed processing file {}: {}", item.getName(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning folder {} ({}): {}", folderName, folderId, e.getMessage());
        }
    }

    /**
     * Determines if a folder path segment represents a "free" folder.
     * Supports: "free", "free resources", "free-resources"
     */
    private boolean isFreeFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("free") || lower.equals("free resources") || lower.equals("free-resources");
    }

    /**
     * Determines if a folder path segment represents a "paid" folder.
     * Supports: "paid", "paid resources", "paid-resources"
     */
    private boolean isPaidFolder(String folderName) {
        if (folderName == null) return false;
        String lower = folderName.trim().toLowerCase();
        return lower.equals("paid") || lower.equals("paid resources") || lower.equals("paid-resources");
    }

    private void processFile(File file, String parentFolderId, List<String> folderPath) throws Exception {
        filesProcessed.incrementAndGet();
        log.info("[INGESTION] FILE: {}", file.getName());

        String mimeType = file.getMimeType();
        boolean isGoogleDoc = mimeType != null && (
            mimeType.equals("application/vnd.google-apps.document") ||
            mimeType.equals("application/vnd.google-apps.spreadsheet") ||
            mimeType.equals("application/vnd.google-apps.presentation")
        );
        String targetMimeType = isGoogleDoc ? "application/pdf" : mimeType;

        String fileName = file.getName();
        if (isGoogleDoc && fileName != null && !fileName.toLowerCase().endsWith(".pdf")) {
            fileName = fileName + ".pdf";
        }

        String fileExtension = Product.getFileExtension(fileName);
        if (!SUPPORTED_EXTENSIONS.contains(fileExtension)) {
            log.info("Unsupported extension: {} - skipping: {}", fileExtension, fileName);
            filesSkipped.incrementAndGet();
            return;
        }

        // -- Determine free/paid from folder structure --------------------------
        // New structure: bodhganga/{state}/{district}/free/{files}
        //                bodhganga/{state}/{district}/paid/{files}
        // Legacy:        bodhganga/{state}/{district}/Free Resources/{files}
        //                bodhganga/{state}/{district}/{files}  ? treated as paid
        boolean isFree = false;
        for (String folder : folderPath) {
            if (isFreeFolder(folder)) { isFree = true; break; }
        }
        // If no free/paid folder found explicitly, default to paid
        boolean isPaid = !isFree;
        double price = isFree ? 0.0 : 99.0;

        // -- Extract state and district from folder path ------------------------
        FolderMetadata metadata = extractMetadata(folderPath);
        String state = metadata.state;
        String district = metadata.district;

        // -- Build S3 key: {state}/{district}/{free|paid}/{filename} -----------
        String stateSlug = Product.generateSlug(normalizeName(state));
        String districtSlug = Product.generateSlug(normalizeName(district));
        String tier = isFree ? "free" : "paid";

        // Skip "general" entries (misconfigured paths)
        if (stateSlug.equals("general") || districtSlug.equals("general")) {
            log.warn("[INGESTION] Skipping file with general state/district: {}", fileName);
            filesSkipped.incrementAndGet();
            return;
        }

        String s3Key = stateSlug + "/" + districtSlug + "/" + tier + "/" + fileName;
        long size = file.getSize() != null ? file.getSize() : 0;

        String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
        String contentType = Product.determineContentType(fileMimeType, fileName);

        log.info("[INGESTION] state={} district={} tier={} file={} s3Key={}",
            state, district, tier, fileName, s3Key);

        // -- Deduplication ------------------------------------------------------
        Product existing = productRepo.findByGoogleDriveFileId(file.getId());
        if (existing == null) existing = productRepo.findByS3Key(s3Key).orElse(null);
        if (existing == null && fileName != null) {
            List<Product> matches = productRepo.findByImportedFromDrive(true);
            for (Product p : matches) {
                if (fileName.equals(p.getFileName())) { existing = p; break; }
            }
        }

        if (existing != null) {
            log.info("[INGESTION] Updating existing record for: {}", fileName);
            if (existing.getGoogleDriveFileId() == null || existing.getGoogleDriveFileId().isEmpty())
                existing.setGoogleDriveFileId(file.getId());
            String displayTitle = Product.stripExtension(fileName);
            existing.setTitle(displayTitle);
            existing.setDisplayTitle(displayTitle);
            existing.setMimeType(fileMimeType);
            existing.setState(normalizeName(state));
            existing.setDistrict(normalizeName(district));
            existing.setStateSlug(stateSlug);
            existing.setDistrictSlug(districtSlug);
            existing.setFree(isFree);
            existing.setPrice(price);
            if (existing.getS3Key() == null || existing.getS3Key().isEmpty()) {
                existing.setS3Key(s3Key);
                existing.setStorageKey(s3Key);
            }
            existing.setS3Url(s3Service.getS3Url(existing.getS3Key()));
            existing.setPublished(true);
            existing.setImportedFromDrive(true);
            existing.setIngestionStatus(IngestionStatus.COMPLETED);
            existing.setUpdatedAt(new Date());
            productRepo.save(existing);
            filesSkipped.incrementAndGet();
            return;
        }

        // -- Create new product record ------------------------------------------
        Product product = new Product();
        String displayTitle = Product.stripExtension(fileName);
        product.setTitle(displayTitle);
        product.setDisplayTitle(displayTitle);
        product.setOriginalFileName(fileName);
        product.setFileName(fileName);
        product.setFileExtension(fileExtension);
        product.setType(contentType);
        product.setContentType(contentType);
        product.setMimeType(fileMimeType);
        product.setFileSize(size);
        product.setImportedFromDrive(true);
        product.setPublished(true);
        product.setPrice(price);
        product.setFree(isFree);
        product.setCategory(isFree ? "Free Resources" : "Paid Resources");
        product.setState(normalizeName(state));
        product.setStateSlug(stateSlug);
        product.setDistrict(normalizeName(district));
        product.setDistrictSlug(districtSlug);
        product.setGoogleDriveFileId(file.getId());
        product.setSource("Google Drive");
        product.setIngestionStatus(IngestionStatus.PROCESSING);
        product.setCreatedAt(new Date());
        product.setUpdatedAt(new Date());
        product = productRepo.save(product);
        log.info("[INGESTION] Created product: {}", product.getId());

        // -- Upload to S3 -------------------------------------------------------
        try (InputStream inputStream = isGoogleDoc
                ? googleDriveSyncService.downloadFile(file.getId(), mimeType)
                : googleDriveSyncService.downloadFile(file.getId())) {
            if (inputStream != null) {
                String returnedKey = s3Service.uploadFileWithKey(inputStream, size, s3Key, fileMimeType);
                String s3Url = s3Service.getS3Url(returnedKey);
                product.setS3Key(returnedKey);
                product.setStorageKey(returnedKey);
                product.setS3Url(s3Url);
                product.setIngestionStatus(IngestionStatus.COMPLETED);
                product.setUpdatedAt(new Date());
                product = productRepo.save(product);
                log.info("[INGESTION] SUCCESS state={} district={} tier={} file={} s3Url={}",
                    state, district, tier, fileName, s3Url);

                if (archiveFolderId != null && !archiveFolderId.isEmpty() && !archiveFolderId.equals("null")) {
                    googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
                    product.setArchived(true);
                    productRepo.save(product);
                    log.info("[INGESTION] Archived: {}", fileName);
                }
                filesUploaded.incrementAndGet();
            } else {
                throw new java.io.IOException("Failed to download from Google Drive: " + fileName);
            }
        } catch (Exception e) {
            filesFailed.incrementAndGet();
            product.setIngestionStatus(IngestionStatus.FAILED);
            product.setUpdatedAt(new Date());
            productRepo.save(product);
            log.error("[INGESTION] FAILED file={} error={}", fileName, e.getMessage());
            throw e;
        }
    }

    public static String normalizeName(String name) {
        if (name == null) return "";
        String cleaned = name.replaceAll("(?i)^(State\\s*\\d+\\s*-\\s*|State\\s*-\\s*|State\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+District$", "").trim();
        return cleaned;
    }

    private FolderMetadata extractMetadata(List<String> folderPath) {
        List<String> normalizedList = new java.util.ArrayList<>();
        if (folderPath != null) {
            for (String f : folderPath) {
                // Skip free/paid tier folders from state/district extraction
                if (isFreeFolder(f) || isPaidFolder(f)) continue;
                String norm = normalizeName(f);
                if (!norm.isEmpty()) normalizedList.add(norm);
            }
        }

        if (normalizedList.isEmpty()) return new FolderMetadata("general", "general");

        java.util.List<String> knownStates = java.util.Arrays.asList(
            "andhra-pradesh", "arunachal-pradesh", "assam", "bihar", "chhattisgarh", "goa",
            "gujarat", "haryana", "himachal-pradesh", "jharkhand", "karnataka", "kerala",
            "madhya-pradesh", "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland",
            "odisha", "punjab", "rajasthan", "sikkim", "tamil-nadu", "telangana", "tripura",
            "uttar-pradesh", "uttarakhand", "west-bengal", "delhi", "jammu-and-kashmir",
            "ladakh", "puducherry", "chandigarh", "lakshadweep", "andaman-and-nicobar-islands"
        );

        String state = null;
        int stateIndex = -1;
        for (int i = 0; i < normalizedList.size(); i++) {
            String slug = Product.generateSlug(normalizedList.get(i));
            if (knownStates.contains(slug)) { state = normalizedList.get(i); stateIndex = i; break; }
        }
        if (state == null) { state = normalizedList.get(0); stateIndex = 0; }

        String district = "general";
        for (int i = stateIndex + 1; i < normalizedList.size(); i++) {
            String current = normalizedList.get(i);
            if (!current.equalsIgnoreCase(state)) { district = current; break; }
        }

        return new FolderMetadata(state, district);
    }

    private static class FolderMetadata {
        public final String state;
        public final String district;
        public FolderMetadata(String state, String district) { this.state = state; this.district = district; }
    }
}
