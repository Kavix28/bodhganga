package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class PipelineTask {
    private static final Logger log = LoggerFactory.getLogger(PipelineTask.class);

    private final CloudSourceTraversalService traversalService;
    private final S3UploadService s3UploadService;
    private final ProductRepository productRepository;
    private final GoogleDriveSyncService googleDriveSyncService;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    @Value("${google.drive.source-folder-id:#{null}}")
    private String sourceFolderId;

    @Value("${google.drive.archive-folder-id:#{null}}")
    private String archiveFolderId;

    @Value("${google.drive.pipeline.enabled:false}")
    private boolean pipelineEnabled;

    public PipelineTask(CloudSourceTraversalService traversalService,
                        S3UploadService s3UploadService,
                        ProductRepository productRepository,
                        GoogleDriveSyncService googleDriveSyncService) {
        this.traversalService = traversalService;
        this.s3UploadService = s3UploadService;
        this.productRepository = productRepository;
        this.googleDriveSyncService = googleDriveSyncService;
    }

    /**
     * Scheduled sync task running every 10 minutes.
     */
    public void runPipeline() {
        runPipeline(false);
    }

    /**
     * Core orchestrator method to execute traversal, upload, persistence, and archiving.
     */
    public void runPipeline(boolean force) {
        if (!force && (!pipelineEnabled || sourceFolderId == null)) {
            log.info("[PipelineTask] Ingestion pipeline is disabled or sourceFolderId is null. Skipping execution.");
            return;
        }

        if (force && sourceFolderId == null) {
            log.warn("[PipelineTask] Cannot execute manually: sourceFolderId is null.");
            throw new IllegalStateException("sourceFolderId is missing. Configure google.drive.source-folder-id in env.");
        }

        if (!isRunning.compareAndSet(false, true)) {
            log.warn("[PipelineTask] Ingestion pipeline is already running. Skipping execution.");
            if (force) {
                throw new IllegalStateException("Ingestion pipeline is already running.");
            }
            return;
        }

        log.info("[PipelineTask] INGESTION PIPELINE STARTED (force={})", force);

        try {
            List<CloudSourceTraversalService.CloudFileMetadata> files = traversalService.discoverFiles(sourceFolderId);
            log.info("[PipelineTask] Discovered {} files to process.", files.size());

            int processedCount = 0;
            int importedCount = 0;
            int skippedCount = 0;

            for (CloudSourceTraversalService.CloudFileMetadata file : files) {
                processedCount++;
                boolean success = processFile(file);
                if (success) {
                    importedCount++;
                } else {
                    skippedCount++;
                }
            }

            log.info("[PipelineTask] INGESTION PIPELINE COMPLETED. Total processed: {}, Imported: {}, Skipped: {}",
                    processedCount, importedCount, skippedCount);

        } catch (Exception e) {
            log.error("[PipelineTask] Ingestion pipeline failed: {}", e.getMessage(), e);
            if (force) {
                throw new RuntimeException("Error during pipeline run: " + e.getMessage(), e);
            }
        } finally {
            isRunning.set(false);
        }
    }

    /**
     * Processes a single file: deduplicates, uploads to S3, persists to Mongo, and archives the file.
     * Returns true if imported, false if skipped or failed.
     */
    private boolean processFile(CloudSourceTraversalService.CloudFileMetadata file) {
        String sourceFileId = file.getSourceFileId();
        String fileName = file.getFileName();

        // 1. Check sourceFileId -> skip if exists
        if (productRepository.existsBySourceFileId(sourceFileId)) {
            log.info("[PipelineTask] [DUPLICATE SKIP] File '{}' (sourceFileId={}) already exists in MongoDB.", fileName, sourceFileId);
            return false;
        }

        // Generate slugs
        String stateSlug = Product.generateSlug(file.getStateName());
        String districtSlug = Product.generateSlug(file.getDistrictName());
        String s3KeyPrefix = stateSlug + "/" + districtSlug;
        String s3Key = s3KeyPrefix + "/" + fileName;

        // 2. Check s3Key -> skip if exists
        if (productRepository.existsByS3Key(s3Key)) {
            log.info("[PipelineTask] [DUPLICATE SKIP] S3 key '{}' (file={}) already exists in MongoDB.", s3Key, fileName);
            return false;
        }

        log.info("[PipelineTask] Importing new file: {} (State: {}, District: {})", fileName, file.getStateName(), file.getDistrictName());

        // 3. Download from Google Drive and upload to S3
        try (InputStream inputStream = googleDriveSyncService.downloadFile(sourceFileId)) {
            if (inputStream == null) {
                log.error("[PipelineTask] Download failed: InputStream was null for file {}", fileName);
                return false;
            }

            String contentType = file.getMimeType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = s3UploadService.resolveContentType(fileName);
            }

            // Upload to S3
            String uploadedS3Key = s3UploadService.uploadToS3(inputStream, fileName, contentType, s3KeyPrefix);

            // 4. Save to MongoDB with published = false
            Product product = new Product();
            product.setTitle(Product.stripExtension(fileName));
            product.setFileName(fileName);
            product.setOriginalFileName(fileName);
            product.setDisplayTitle(Product.stripExtension(fileName));
            
            // Map fileType in uppercase
            String ext = Product.getFileExtension(fileName).toUpperCase();
            product.setFileType(ext);
            product.setType(Product.determineContentType(contentType, fileName));

            product.setS3Key(uploadedS3Key);
            product.setS3Url(s3UploadService.getS3Url(uploadedS3Key));
            
            // Keep both ID fields synced
            product.setSourceFileId(sourceFileId);
            product.setGoogleDriveFileId(sourceFileId);

            // Keep both state fields synced
            product.setStateName(file.getStateName());
            product.setState(file.getStateName());
            product.setStateSlug(stateSlug);

            // Keep both district fields synced
            product.setDistrictName(file.getDistrictName());
            product.setDistrict(file.getDistrictName());
            product.setDistrictSlug(districtSlug);

            product.setMimeType(contentType);
            product.setContentType(Product.determineContentType(contentType, fileName));
            product.setFileSize(file.getFileSize());
            
            product.setImportedFromDrive(true);
            product.setPublished(false); // Default to false
            product.setPublishedField(false); // Ensure both boolean properties are set to false
            
            product.setFree(true); // Default to free
            product.setPrice(0.0);
            product.setCreatedAt(new Date());
            product.setUpdatedAt(new Date());

            productRepository.save(product);
            log.info("[PipelineTask] [SUCCESS] Saved product to MongoDB: '{}' (s3Key='{}')", fileName, uploadedS3Key);

            // 5. Archive file on Google Drive so it doesn't get processed again
            if (archiveFolderId != null && !archiveFolderId.isEmpty()) {
                try {
                    googleDriveSyncService.moveFileToArchive(sourceFileId, file.getParentFolderId(), archiveFolderId);
                    log.info("[PipelineTask] [ARCHIVED] Archived file '{}' on Google Drive.", fileName);
                } catch (Exception archiveErr) {
                    log.error("[PipelineTask] Failed to archive file '{}' on Google Drive: {}", fileName, archiveErr.getMessage(), archiveErr);
                    // Do not fail the import if S3 and Mongo are already saved, but log it
                }
            }

            return true;

        } catch (Exception e) {
            log.error("[PipelineTask] [FAILED] Process failed for file {}: {}", fileName, e.getMessage(), e);
            return false;
        }
    }
}
