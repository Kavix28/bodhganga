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

    // Hardened pipeline running metrics
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private volatile Date lastRun;
    private final AtomicInteger filesProcessed = new AtomicInteger(0);
    private final AtomicInteger filesUploaded = new AtomicInteger(0);
    private final AtomicInteger filesFailed = new AtomicInteger(0);
    private final AtomicInteger filesSkipped = new AtomicInteger(0);

    private static final List<String> SUPPORTED_EXTENSIONS = List.of(
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "png", "jpg", "jpeg", "webp", "mp3", "m4a", "wav", "zip", "txt"
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
            if (!driveConfigured) {
                throw new IllegalStateException("Google Drive configuration missing or invalid but pipeline is enabled!");
            }
            if (!s3Configured) {
                throw new IllegalStateException("AWS S3 configuration missing or invalid but pipeline is enabled!");
            }
            if (!mongoConnected) {
                throw new IllegalStateException("MongoDB connection is not established but pipeline is enabled!");
            }
            if (sourceFolderId == null || sourceFolderId.isBlank()) {
                throw new IllegalStateException("Source folder ID is missing but pipeline is enabled!");
            }
            if (archiveFolderId == null || archiveFolderId.isBlank()) {
                throw new IllegalStateException("Archive folder ID is missing but pipeline is enabled!");
            }
        }
    }

    public boolean isRunning() { return isRunning.get(); }
    public Date getLastRun() { return lastRun; }
    public int getFilesProcessed() { return filesProcessed.get(); }
    public int getFilesUploaded() { return filesUploaded.get(); }
    public int getFilesFailed() { return filesFailed.get(); }
    public int getFilesSkipped() { return filesSkipped.get(); }

    /**
     * This scheduled task runs every 10 minutes to sync files.
     * Ensure you add @EnableScheduling to your BodhgangaApplication.java
     */
    @Scheduled(fixedDelay = 600000) // 10 minutes in milliseconds
    public void syncDriveToS3() {
        syncDriveToS3(false);
    }

    public void syncDriveToS3(boolean force) {
        if (!force && (!pipelineEnabled || !googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            log.info("Pipeline sync skipped: enabled={}, configured={}, sourceFolderId={}",
                    pipelineEnabled, googleDriveSyncService.isConfigured(), sourceFolderId);
            return;
        }

        if (force && (!googleDriveSyncService.isConfigured() || sourceFolderId == null)) {
            log.warn("Cannot run pipeline sync: configured={}, sourceFolderId={}",
                    googleDriveSyncService.isConfigured(), sourceFolderId);
            throw new IllegalStateException("Google Drive sync service is not configured or source folder ID is missing.");
        }

        if (!isRunning.compareAndSet(false, true)) {
            log.warn("Pipeline sync is already running. Skipping execution.");
            if (force) {
                throw new IllegalStateException("Pipeline sync is already running.");
            }
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
            log.info("[INGESTION] PIPELINE COMPLETED");
        } catch (Exception e) {
            log.error("[INGESTION] PIPELINE FAILED - Error: {}", e.getMessage(), e);
            if (force) {
                throw new RuntimeException("Error during manual Drive to S3 sync: " + e.getMessage(), e);
            }
        } finally {
            isRunning.set(false);
        }
    }

    private void traverseAndSync(String folderId, String folderName, List<String> folderPath) {
        log.info("[INGESTION] CURRENT FOLDER - Name: {}, ID: {}", folderName, folderId);
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            int itemCount = (items != null) ? items.size() : 0;
            log.info("Recursion level - Folder ID: {}, Folder Name: {}, Item Count: {}", folderId, folderName, itemCount);
            if (items == null) {
                return;
            }

            for (File item : items) {
                log.info("Recursion level - Item Name: {}, Item Mime Type: {}, Item ID: {}", item.getName(), item.getMimeType(), item.getId());

                String mimeType = item.getMimeType();
                if ("application/vnd.google-apps.folder".equals(mimeType)) {
                    // It's a folder! Support arbitrary nesting depth
                    List<String> nextPath = new java.util.ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    
                    traverseAndSync(item.getId(), item.getName(), nextPath);
                } else {
                    // It's a file! Detect files by: mimeType != application/vnd.google-apps.folder
                    try {
                        processFile(item, folderId, folderPath);
                    } catch (Exception e) {
                        log.error("Failed processing file {}", item.getName(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning folder: " + folderName + " (ID: " + folderId + ")", e);
        }
    }


    private void processFile(File file, String parentFolderId, List<String> folderPath) throws Exception {
        filesProcessed.incrementAndGet();
        log.info("[INGESTION] CURRENT FILE - Name: {}", file.getName());

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
            log.info("Unsupported file extension: {} - skipping file: {}", fileExtension, fileName);
            filesSkipped.incrementAndGet();
            return;
        }

        // Construct clean hierarchical S3 key using folder path slugs.
        // Deduplicate consecutive identical slugs: the real production Drive structure has
        // "State 1- Andhra Pradesh" → "1- Andhra Pradesh" which both normalise to
        // "andhra-pradesh". Without deduplication the key would contain the segment twice.
        StringBuilder s3KeyBuilder = new StringBuilder();
        String lastSlug = null;
        if (folderPath != null && !folderPath.isEmpty()) {
            for (String folder : folderPath) {
                String folderSlug = Product.generateSlug(normalizeName(folder));
                if (!folderSlug.equals("general") && !folderSlug.isEmpty()
                        && !folderSlug.equals(lastSlug)) {
                    s3KeyBuilder.append(folderSlug).append("/");
                    lastSlug = folderSlug;
                }
            }
        }
        s3KeyBuilder.append(fileName);
        String s3Key = s3KeyBuilder.toString();

        long size = file.getSize() != null ? file.getSize() : 0;
        boolean isFree = false;
        String category = "Notes";
        String state = null;
        String district = null;
        Double price = 99.0;

        // Check if folderPath contains "Free Resources"
        boolean hasFreeResources = false;
        if (folderPath != null && !folderPath.isEmpty()) {
            for (String folderName : folderPath) {
                if (folderName.equalsIgnoreCase("Free Resources") || folderName.equalsIgnoreCase("Free-Resources")) {
                    hasFreeResources = true;
                    break;
                }
            }
        }

        if (hasFreeResources) {
            isFree = true;
            price = 0.0;
            int freeIndex = -1;
            for (int i = 0; i < folderPath.size(); i++) {
                if (folderPath.get(i).equalsIgnoreCase("Free Resources") || folderPath.get(i).equalsIgnoreCase("Free-Resources")) {
                    freeIndex = i;
                    break;
                }
            }
            if (freeIndex != -1 && folderPath.size() > freeIndex + 1) {
                category = normalizeName(folderPath.get(freeIndex + 1));
            } else {
                category = "Free Resources";
            }
            state = "general";
            district = "general";
        } else {
            FolderMetadata metadata = extractMetadata(folderPath);
            state = metadata.state;
            district = metadata.district;
        }

        String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
        String contentType = Product.determineContentType(fileMimeType, fileName);

        log.info("[INGESTION] FILE TYPE - Type: {}", contentType);
        log.info("[INGESTION] FILE SIZE - Size: {}", size);
        log.info("[INGESTION] S3 KEY - Key: {}", s3Key);

        // Check for duplicates before upload and save
        Product existing = productRepo.findByGoogleDriveFileId(file.getId());
        if (existing == null) {
            existing = productRepo.findByS3Key(s3Key).orElse(null);
        }
        if (existing == null && fileName != null) {
            List<Product> matches = productRepo.findByImportedFromDrive(true);
            for (Product p : matches) {
                if (fileName.equals(p.getFileName())) {
                    existing = p;
                    break;
                }
            }
        }

        if (existing != null) {
            log.info("Existing product found.");
            log.info("Updating existing record.");
            log.info("Skipping duplicate upload.");

            if (existing.getGoogleDriveFileId() == null || existing.getGoogleDriveFileId().isEmpty()) {
                existing.setGoogleDriveFileId(file.getId());
            }

            String displayTitle = Product.stripExtension(fileName);
            existing.setTitle(displayTitle);
            existing.setDisplayTitle(displayTitle);
            existing.setMimeType(fileMimeType);
            existing.setState(state);
            existing.setDistrict(district);
            existing.setStateSlug(Product.generateSlug(state));
            existing.setDistrictSlug(Product.generateSlug(district));
            
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

        // Create product record in Mongo with status PROCESSING first (generates ID)
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
        product.setPublished(true); // Auto-publish
        product.setPrice(price);
        product.setFree(isFree);
        product.setCategory(category);
        product.setState(state);
        product.setStateSlug(Product.generateSlug(state));
        product.setDistrict(district);
        product.setDistrictSlug(Product.generateSlug(district));
        product.setGoogleDriveFileId(file.getId());
        product.setSource("Google Drive");
        product.setIngestionStatus(IngestionStatus.PROCESSING);
        product.setCreatedAt(new Date());
        product.setUpdatedAt(new Date());

        product = productRepo.save(product);
        String productId = product.getId();
        log.info("[INGESTION] PRODUCT ID - Id: {}", productId);

        try (InputStream inputStream = isGoogleDoc
                ? googleDriveSyncService.downloadFile(file.getId(), mimeType)
                : googleDriveSyncService.downloadFile(file.getId())) {
            if (inputStream != null) {
                // S3 Upload
                String returnedKey = s3Service.uploadFileWithKey(inputStream, size, s3Key, fileMimeType);
                String s3Url = s3Service.getS3Url(returnedKey);
                log.info("[INGESTION] S3 URL - Url: {}", s3Url);

                product.setS3Key(returnedKey);
                product.setStorageKey(returnedKey);
                product.setS3Url(s3Url);
                product.setIngestionStatus(IngestionStatus.COMPLETED);
                product.setUpdatedAt(new Date());

                product = productRepo.save(product);
                log.info("[INGESTION] MONGO SAVE SUCCESS - Product saved: {}", product.getId());

                // Enterprise-grade structured logging format
                log.info("[INGESTION]\nState={}\nDistrict={}\nFile={}\nType={}\nSize={} bytes\nS3Key={}\nMongoId={}",
                        state, district, fileName, contentType, size, returnedKey, product.getId());

                // Archive movement (only after S3 and MongoDB operations succeed)
                if (archiveFolderId != null && !archiveFolderId.isEmpty() && !archiveFolderId.equals("null")) {
                    googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
                    product.setArchived(true);
                    product = productRepo.save(product);
                    log.info("[INGESTION] ARCHIVE SUCCESS - File archived: {}", fileName);
                }
                filesUploaded.incrementAndGet();
            } else {
                throw new java.io.IOException("Failed to download file from Google Drive (InputStream was null)");
            }
        } catch (Exception e) {
            filesFailed.incrementAndGet();
            product.setIngestionStatus(IngestionStatus.FAILED);
            product.setUpdatedAt(new Date());
            productRepo.save(product);
            log.error("[INGESTION] PIPELINE FAILED - Error: {}", e.getMessage(), e);
            throw e;
        }
    }

    public static String normalizeName(String name) {
        if (name == null) return "";
        // 1. Remove prefixes like "State 1 - ", "State- ", "1- ", "State 1 ", "1 " (case-insensitive)
        String cleaned = name.replaceAll("(?i)^(State\\s*\\d+\\s*-\\s*|State\\s*-\\s*|State\\s+\\d+\\s+|\\d+\\s*-\\s*|\\d+\\s+)", "").trim();
        // 2. Remove " District" or " district" at the end
        cleaned = cleaned.replaceAll("(?i)\\s+District$", "").trim();
        return cleaned;
    }

    private FolderMetadata extractMetadata(List<String> folderPath) {
        List<String> normalizedList = new java.util.ArrayList<>();
        if (folderPath != null) {
            for (String f : folderPath) {
                String norm = normalizeName(f);
                if (!norm.isEmpty()) {
                    normalizedList.add(norm);
                }
            }
        }
        
        if (normalizedList.isEmpty()) {
            return new FolderMetadata("general", "general");
        }
        
        // Known state slugs to identify the state regardless of folder depth
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

        // Traverse folders to find the state
        for (int i = 0; i < normalizedList.size(); i++) {
            String folder = normalizedList.get(i);
            String slug = Product.generateSlug(folder);
            if (knownStates.contains(slug)) {
                state = folder;
                stateIndex = i;
                break;
            }
        }

        // Fallback to first element if no exact state match
        if (state == null) {
            state = normalizedList.get(0);
            stateIndex = 0;
        }

        String district = "general";
        
        // Find the first unique element after state in nesting path
        for (int i = stateIndex + 1; i < normalizedList.size(); i++) {
            String current = normalizedList.get(i);
            if (!current.equalsIgnoreCase(state)) {
                district = current;
                break;
            }
        }
        
        return new FolderMetadata(state, district);
    }

    private static class FolderMetadata {
        public final String state;
        public final String district;
        
        public FolderMetadata(String state, String district) {
            this.state = state;
            this.district = district;
        }
    }
}
