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

    /**
     * This scheduled task runs every 10 minutes to sync files.
     * Ensure you add @EnableScheduling to your BodhgangaApplication.java
     */
    @Scheduled(fixedDelay = 600000) // 10 minutes in milliseconds
    public void syncDriveToS3() {
        if (!pipelineEnabled || !googleDriveSyncService.isConfigured() || sourceFolderId == null) {
            return;
        }

        log.info("Starting Google Drive to S3 Sync Pipeline...");
        try {
            traverseAndSync(sourceFolderId, "BodhGanga", new java.util.ArrayList<>());
        } catch (Exception e) {
            log.error("Error during Drive to S3 sync", e);
        }
        log.info("Google Drive to S3 Sync Pipeline completed.");
    }

    private void traverseAndSync(String folderId, String folderName, List<String> folderPath) {
        log.info("Scanning folder: {}", folderName);
        try {
            List<File> items = googleDriveSyncService.listFilesInFolder(folderId);
            if (items == null) {
                log.info("Google Drive returned 0 items");
                return;
            }
            log.info("Google Drive returned {} items", items.size());

            for (File item : items) {
                if ("application/vnd.google-apps.folder".equals(item.getMimeType())) {
                    // It's a folder!
                    List<String> nextPath = new java.util.ArrayList<>(folderPath);
                    nextPath.add(item.getName());
                    
                    String normalizedName = normalizeName(item.getName());
                    if (nextPath.size() == 1) {
                        log.info("Found state folder: {}", normalizedName);
                    } else if (nextPath.size() >= 2) {
                        log.info("Found district folder: {}", normalizedName);
                    }
                    
                    traverseAndSync(item.getId(), item.getName(), nextPath);
                } else {
                    // It's a file!
                    log.info("Found file: {}", item.getName());
                    
                    try {
                        processFile(item, folderId, folderPath);
                    } catch (Exception e) {
                        log.error("Failed processing file {}", item.getName(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning folder: " + folderName, e);
        }
    }

    private void processFile(File file, String parentFolderId, List<String> folderPath) throws Exception {
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

                // Construct slugs for S3 path hierarchy
                String stateSlug = state != null ? state.replace(" ", "-") : "general";
                String districtSlug = district != null ? district.replace(" ", "-") : "general";
                String s3Key = stateSlug + "/" + districtSlug + "/" + file.getName();
                
                log.info("Uploading to S3: {}", s3Key);
                
                // S3 Upload
                String returnedKey = s3Service.uploadFileWithKey(inputStream, size, s3Key, file.getMimeType());
                String s3Url = s3Service.getS3Url(returnedKey);
                
                log.info("Successfully uploaded: {}", s3Url);
                
                // MongoDB Save
                Product product = new Product();
                String fileNameNoExt = file.getName().replace(".pdf", "").replace(".PDF", "");
                product.setTitle(fileNameNoExt);
                product.setType("PDF");
                product.setS3Key(returnedKey);
                product.setStorageKey(returnedKey);
                product.setFileName(file.getName());
                product.setFileSize(size);
                product.setImportedFromDrive(true);
                product.setPublished(true); // Automatically publish newly synced documents
                product.setPrice(price);
                product.setFree(isFree);
                product.setCategory(category);
                
                // Ingestion specific metadata
                product.setState(state);
                product.setDistrict(district);
                product.setMimeType(file.getMimeType());
                product.setS3Url(s3Url);
                product.setSource("Google Drive");
                product.setStateSlug(stateSlug.toLowerCase() + "-" + districtSlug.toLowerCase());

                Product savedProduct = productRepo.save(product);
                log.info("Product saved: {}", savedProduct.getId());

                // Archive movement (only after S3 and MongoDB operations succeed)
                if (archiveFolderId != null) {
                    googleDriveSyncService.moveFileToArchive(file.getId(), parentFolderId, archiveFolderId);
                    log.info("Moved file to archive: {}", file.getName());
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
        for (String f : folderPath) {
            String norm = normalizeName(f);
            if (!norm.isEmpty()) {
                normalizedList.add(norm);
            }
        }
        
        if (normalizedList.isEmpty()) {
            return new FolderMetadata("general", "general");
        }
        
        String state = normalizedList.get(0);
        String district = "general";
        
        // Find last element that is different from state, or if only 1 unique element, it's just the state
        for (int i = normalizedList.size() - 1; i >= 0; i--) {
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
