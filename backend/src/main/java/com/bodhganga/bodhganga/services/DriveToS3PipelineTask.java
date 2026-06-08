package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class DriveToS3PipelineTask {

    private static final Logger log = LoggerFactory.getLogger(DriveToS3PipelineTask.class);

    private final GoogleDriveSyncService googleDriveSyncService;
    private final S3Service s3Service;
    private final ProductRepo productRepo;

    public DriveToS3PipelineTask(GoogleDriveSyncService googleDriveSyncService, S3Service s3Service, ProductRepo productRepo) {
        this.googleDriveSyncService = googleDriveSyncService;
        this.s3Service = s3Service;
        this.productRepo = productRepo;
    }

    @Value("${google.drive.source-folder-id:#{null}}")
    private String sourceFolderId;

    @Value("${google.drive.archive-folder-id:#{null}}")
    private String archiveFolderId;

    @Value("${google.drive.pipeline.enabled:false}")
    private boolean pipelineEnabled;

    @jakarta.annotation.PostConstruct
    public void validateStartup() {
        log.info("Startup Google Drive to S3 Ingestion Pipeline Validation Check:");
        log.info("  - Ingestion Pipeline Enabled: {}", pipelineEnabled);
        log.info("  - Source Folder ID: {}", sourceFolderId);
        log.info("  - Archive Folder ID: {}", archiveFolderId);
        log.info("  - AWS S3 Bucket: {}", s3Service != null ? s3Service.getBucketName() : "N/A");
    }

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

        log.info("Starting Google Drive to S3 Sync Pipeline (forced={})...", force);
        try {
            traverseAndSync(sourceFolderId, "BodhGanga", new java.util.ArrayList<>());
        } catch (Exception e) {
            log.error("Error during Drive to S3 sync", e);
            if (force) {
                throw new RuntimeException("Error during manual Drive to S3 sync: " + e.getMessage(), e);
            }
        }
        log.info("Google Drive to S3 Sync Pipeline completed.");
    }

    private void traverseAndSync(String folderId, String folderName, List<String> folderPath) {
        log.info("Recursion level - Folder ID: {}, Folder Name: {}", folderId, folderName);
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
        log.info("Found file: {}", file.getName());
        log.info("Uploading file: {}", file.getName());

        try (InputStream inputStream = googleDriveSyncService.downloadFile(file.getId())) {
            if (inputStream != null) {
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

                // Construct clean hierarchical S3 key using folder path slugs
                StringBuilder s3KeyBuilder = new StringBuilder();
                if (folderPath != null && !folderPath.isEmpty()) {
                    for (String folder : folderPath) {
                        String folderSlug = Product.generateSlug(folder);
                        if (!folderSlug.equals("general") && !folderSlug.isEmpty()) {
                            s3KeyBuilder.append(folderSlug).append("/");
                        }
                    }
                }
                s3KeyBuilder.append(file.getName());
                String s3Key = s3KeyBuilder.toString();
                
                log.info("Uploading file: {} to S3 key: {}", file.getName(), s3Key);
                
                // S3 Upload
                String returnedKey = s3Service.uploadFileWithKey(inputStream, size, s3Key, file.getMimeType());
                String s3Url = s3Service.getS3Url(returnedKey);
                
                log.info("Uploaded file: {}", file.getName());
                
                // MongoDB Save
                log.info("Saving product: {}", file.getName());
                Product product = new Product();
                String displayTitle = Product.stripExtension(file.getName());
                product.setTitle(displayTitle);
                product.setDisplayTitle(displayTitle);
                product.setOriginalFileName(file.getName());
                product.setFileName(file.getName());
                
                String fileMimeType = file.getMimeType() != null ? file.getMimeType() : Product.determineMimeType(file.getName());
                String contentType = Product.determineContentType(fileMimeType, file.getName());
                
                product.setType(contentType);
                product.setContentType(contentType);
                product.setMimeType(fileMimeType);
                
                product.setS3Key(returnedKey);
                product.setStorageKey(returnedKey);
                product.setFileSize(size);
                product.setImportedFromDrive(true);
                product.setPublished(true); // Automatically publish newly synced documents
                product.setPrice(price);
                product.setFree(isFree);
                product.setCategory(category);
                
                // Ingestion specific metadata
                product.setState(state);
                product.setStateSlug(Product.generateSlug(state)); // Must only contain state slug
                product.setDistrict(district);
                product.setDistrictSlug(Product.generateSlug(district)); // Must only contain district slug
                product.setS3Url(s3Url);
                product.setSource("Google Drive");

                Product savedProduct = productRepo.save(product);
                log.info("Product saved: {}", savedProduct.getId());

                // Archive movement (only after S3 and MongoDB operations succeed)
                if (archiveFolderId != null) {
                    googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
                    log.info("Archived file: {}", file.getName());
                }
            }
        }
    }

    private String normalizeName(String name) {
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
        
        String state = normalizedList.get(0);
        String district = "general";
        
        // Find the first unique element after state in nesting path
        for (int i = 1; i < normalizedList.size(); i++) {
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
