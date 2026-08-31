package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.HierarchicalMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

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
    private final ProductReconciliationService productReconciliationService;

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
            "zip", "txt");

    public static String normalizeName(String name) {
        return ProductMetadataUtil.normalizeName(name);
    }

    public DriveToS3PipelineTask(GoogleDriveSyncService googleDriveSyncService,
            S3Service s3Service,
            ProductRepo productRepo,
            MongoTemplate mongoTemplate,
            ProductReconciliationService productReconciliationService) {
        this.googleDriveSyncService = googleDriveSyncService;
        this.s3Service = s3Service;
        this.productRepo = productRepo;
        this.mongoTemplate = mongoTemplate;
        this.productReconciliationService = productReconciliationService;
    }

    @Value("${google.drive.source-folder-id:${QB_SOURCE_FOLDER_ID:#{null}}}")
    private String sourceFolderId;

    @Value("${google.drive.archive-folder-id:${QB_ARCHIVE_FOLDER_ID:#{null}}}")
    private String archiveFolderId;

    @Value("${google.drive.pipeline.enabled:${QB_PIPELINE_ENABLED:false}}")
    private boolean pipelineEnabled;

    @jakarta.annotation.PostConstruct
    public void validateStartup() {
        boolean driveConfigured = googleDriveSyncService.isConfigured();
        boolean s3Configured = s3Service != null && s3Service.getBucketName() != null
                && !s3Service.getBucketName().isEmpty();
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
            if (!driveConfigured) {
                log.warn("Google Drive not configured");
                canRun = false;
            }
            if (!s3Configured) {
                log.warn("S3 not configured");
                canRun = false;
            }
            if (!mongoConnected) {
                log.warn("MongoDB not connected");
                canRun = false;
            }
            if (sourceFolderId == null || sourceFolderId.isBlank()) {
                log.warn("Source folder ID missing");
                canRun = false;
            }
            if (archiveFolderId == null || archiveFolderId.isBlank()) {
                log.warn("Archive folder ID missing");
                canRun = false;
            }
            if (!canRun) {
                log.warn("Pipeline prerequisites not met. Pipeline will NOT run automatically.");
                pipelineEnabled = false;
            }
        }
    }

    public boolean isRunning() {
        return isRunning.get();
    }

    public Date getLastRun() {
        return lastRun;
    }

    public int getFilesProcessed() {
        return filesProcessed.get();
    }

    public int getFilesUploaded() {
        return filesUploaded.get();
    }

    public int getFilesFailed() {
        return filesFailed.get();
    }

    public int getFilesSkipped() {
        return filesSkipped.get();
    }

    public int getDuplicatesFound() {
        return duplicatesFound.get();
    }

    public long getSyncDurationMs() {
        return syncDurationMs.get();
    }

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
            throw new IllegalStateException(
                    "Google Drive sync service is not configured or source folder ID is missing.");
        }
        if (!isRunning.compareAndSet(false, true)) {
            log.warn("[GENERIC PIPELINE] Pipeline already running.");
            if (force)
                throw new IllegalStateException("Pipeline sync is already running.");
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("[GENERIC PIPELINE] STARTED - forced={}", force);
        filesProcessed.set(0);
        filesUploaded.set(0);
        filesFailed.set(0);
        filesSkipped.set(0);
        duplicatesFound.set(0);

        Set<String> scannedDriveFileIds = Collections.synchronizedSet(new HashSet<>());

        try {
            traverseAndSync(sourceFolderId, "BodhGanga", new ArrayList<>(), scannedDriveFileIds);

            // Delete Synchronization Pass (soft-delete)
            performDeleteSync(scannedDriveFileIds);

            lastRun = new Date();
            syncDurationMs.set(System.currentTimeMillis() - startTime);
            log.info("[GENERIC PIPELINE] COMPLETED in {} ms - uploaded={}, skipped={}, failed={}, duplicates={}",
                    syncDurationMs.get(), filesUploaded.get(), filesSkipped.get(), filesFailed.get(),
                    duplicatesFound.get());
        } catch (Exception e) {
            log.error("[GENERIC PIPELINE] FAILED: {}", e.getMessage(), e);
            if (force)
                throw new RuntimeException("Error during Drive to S3 sync: " + e.getMessage(), e);
        } finally {
            isRunning.set(false);
        }
    }

    private void performDeleteSync(Set<String> scannedDriveFileIds) {
        log.info("[DELETE SYNC] Checking for deleted Google Drive files...");
        List<Product> activeDriveProducts = productRepo.findByImportedFromDrive(true);
        int deletedCount = 0;

        for (Product p : activeDriveProducts) {
            if (Boolean.TRUE.equals(p.getIsDeleted()))
                continue;
            String driveId = p.getGoogleDriveFileId();
            if (driveId != null && !driveId.isBlank() && !scannedDriveFileIds.contains(driveId)) {
                log.info("[DELETE SYNC] Drive file removed, soft-deleting Mongo record: {} (Drive ID: {})",
                        p.getFileName(), driveId);
                p.setIsDeleted(true);
                p.setPublished(false);
                p.setIngestionStatus(IngestionStatus.DELETED);
                p.setUpdatedAt(new Date());
                productRepo.save(p);
                deletedCount++;
            }
        }
        log.info("[DELETE SYNC] Synchronized {} deletions.", deletedCount);
    }

    private void traverseAndSync(String folderId, String folderName, List<String> folderPath,
            Set<String> scannedDriveFileIds) {
        log.info("[GENERIC PIPELINE] FOLDER: {} ({}) Path: {}", folderName, folderId, folderPath);
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            if (items == null)
                return;

            for (File item : items) {
                String mimeType = item.getMimeType();
                if ("application/vnd.google-apps.folder".equals(mimeType)) {
                    List<String> nextPath = new ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    traverseAndSync(item.getId(), item.getName(), nextPath, scannedDriveFileIds);
                } else {
                    try {
                        scannedDriveFileIds.add(item.getId());
                        processFile(item, folderId, folderPath);
                    } catch (Exception e) {
                        log.error("[GENERIC PIPELINE] Failed processing file {}: {}", item.getName(), e.getMessage());
                        filesFailed.incrementAndGet();
                    }
                }
            }
        } catch (Exception e) {
            log.error("[GENERIC PIPELINE] Error scanning folder {} ({}): {}", folderName, folderId, e.getMessage());
        }
    }

    private void processFile(File file, String parentFolderId, List<String> folderPath) throws Exception {
        filesProcessed.incrementAndGet();
        String fileName = file.getName();
        log.info("[GENERIC PIPELINE] FILE: {} (Drive ID: {})", fileName, file.getId());

        String mimeType = file.getMimeType();
        boolean isGoogleDoc = mimeType != null && (mimeType.equals("application/vnd.google-apps.document") ||
                mimeType.equals("application/vnd.google-apps.spreadsheet") ||
                mimeType.equals("application/vnd.google-apps.presentation"));
        String targetMimeType = isGoogleDoc ? "application/pdf" : mimeType;

        if (isGoogleDoc && fileName != null && !fileName.toLowerCase().endsWith(".pdf")) {
            fileName = fileName + ".pdf";
        }

        String fileExtension = Product.getFileExtension(fileName);
        if (!SUPPORTED_EXTENSIONS.contains(fileExtension)) {
            log.info("[PIPELINE][NON_RESOURCE][SKIPPED] Unsupported extension: {} - skipping: {}", fileExtension,
                    fileName);
            filesSkipped.incrementAndGet();
            return;
        }

        HierarchicalMetadata metadata = ProductMetadataUtil.extractMetadata(folderPath, fileName);

        if (metadata.itemType == ProductMetadataUtil.ItemType.STATE_IMAGE) {
            log.info("[PIPELINE][STATE_IMAGE][SKIPPED] File '{}' (Drive ID: {}) in path {} is a state image. Skipping.",
                    fileName, file.getId(), folderPath);
            filesSkipped.incrementAndGet();
            return;
        }

        if (metadata.itemType == ProductMetadataUtil.ItemType.NON_RESOURCE) {
            log.info(
                    "[PIPELINE][NON_RESOURCE][SKIPPED] File '{}' (Drive ID: {}) in path {} is not an educational resource. Skipping.",
                    fileName, file.getId(), folderPath);
            filesSkipped.incrementAndGet();
            return;
        }

        // Download bytes and compute checksum
        byte[] fileBytes;
        String checksum;
        try (InputStream inputStream = isGoogleDoc
                ? googleDriveSyncService.downloadFile(file.getId(), mimeType)
                : googleDriveSyncService.downloadFile(file.getId())) {

            if (inputStream == null) {
                throw new java.io.IOException("Failed to open stream for Google Drive file: " + fileName);
            }
            fileBytes = inputStream.readAllBytes();
            checksum = calculateSHA256(fileBytes);
        }

        // Delegate to ProductReconciliationService for deterministic decision & S3
        // relocation
        ProductReconciliationService.ReconciliationResult result = productReconciliationService.reconcile(
                file, parentFolderId, folderPath, fileBytes, checksum, fileName, targetMimeType, metadata);

        switch (result.getAction()) {
            case CREATE:
                filesUploaded.incrementAndGet();
                log.info("[PIPELINE][SUCCESS] Created product for file: {}", fileName);
                break;
            case UPDATE_VERSION:
                filesUploaded.incrementAndGet();
                duplicatesFound.incrementAndGet();
                log.info("[PIPELINE][SUCCESS] Versioned product for file: {}", fileName);
                break;
            case RECONCILE_METADATA_AND_S3:
                filesUploaded.incrementAndGet();
                log.info("[PIPELINE][RECONCILED] Reconciled metadata & S3 for file: {}", fileName);
                break;
            case NO_CHANGE:
                filesSkipped.incrementAndGet();
                log.info("[PIPELINE][SKIP] No change for file: {}", fileName);
                break;
            case QUARANTINE:
                filesFailed.incrementAndGet();
                log.error("[PIPELINE][QUARANTINED] Quarantined invalid/conflicting tier file: {}", fileName);
                break;
            case REJECT:
                filesSkipped.incrementAndGet();
                log.info("[PIPELINE][REJECT] Rejected non-resource file: {}", fileName);
                break;
        }

        // Archive ONLY after successful creation/reconciliation
        if ((result.getAction() == ProductReconciliationService.ReconciliationAction.CREATE ||
                result.getAction() == ProductReconciliationService.ReconciliationAction.UPDATE_VERSION) &&
                archiveFolderId != null && !archiveFolderId.isEmpty() && !archiveFolderId.equals("null")) {
            googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
            Product product = result.getProduct();
            if (product != null) {
                product.setArchived(true);
                productRepo.save(product);
            }
            log.info("[GENERIC PIPELINE] Archived in Drive: {}", fileName);
        }
    }

    private String calculateSHA256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
