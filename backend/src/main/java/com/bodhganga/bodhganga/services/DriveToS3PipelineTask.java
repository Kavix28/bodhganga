package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DriveToS3PipelineTask {

    private final GoogleDriveSyncService googleDriveSyncService;
    private final S3Service s3Service;
    private final ProductRepo productRepo;

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
            List<File> files = googleDriveSyncService.listFilesInFolder(sourceFolderId);
            if (files == null || files.isEmpty()) {
                log.info("No new files found in the source folder.");
                return;
            }

            for (File file : files) {
                // Ignore folders
                if ("application/vnd.google-apps.folder".equals(file.getMimeType())) {
                    continue;
                }

                log.info("Processing file: {} (ID: {})", file.getName(), file.getId());

                try (InputStream inputStream = googleDriveSyncService.downloadFile(file.getId())) {
                    if (inputStream != null) {
                        long size = file.getSize() != null ? file.getSize() : 0;
                        
                        // 1. Parse filename to determine S3 folder and state slug
                        // Assuming file name like "UttarPradesh_Lucknow_Notes.pdf"
                        String fileNameNoExt = file.getName().replace(".pdf", "").replace(".PDF", "");
                        String[] parts = fileNameNoExt.split("_");
                        
                        String s3FolderPath = "notes";
                        String stateSlug = "general";
                        
                        if (parts.length >= 2) {
                            String state = parts[0];
                            String city = parts[1];
                            s3FolderPath = "notes/" + state + "/" + city;
                            stateSlug = state.toLowerCase() + "-" + city.toLowerCase();
                        } else if (parts.length == 1 && !parts[0].isEmpty()) {
                            String state = parts[0];
                            s3FolderPath = "notes/" + state;
                            stateSlug = state.toLowerCase();
                        }

                        // 2. Upload to S3 with specific path
                        String s3Key = s3Service.uploadPdf(inputStream, size, file.getName(), s3FolderPath);
                        log.info("Successfully uploaded {} to S3 path {} with key: {}", file.getName(), s3FolderPath, s3Key);

                        // 3. Save metadata to Database
                        Product product = new Product();
                        product.setTitle(fileNameNoExt);
                        product.setType("PDF");
                        product.setS3Key(s3Key);
                        product.setStorageKey(s3Key);
                        product.setFileName(file.getName());
                        product.setFileSize(size);
                        product.setImportedFromDrive(true);
                        product.setPublished(false); // Can be manually reviewed by admin
                        product.setPrice(99.0); // Default price, admin can change
                        product.setStateSlug(stateSlug);

                        productRepo.save(product);
                        log.info("Saved product to database: {}", product.getTitle());

                        // 3. Move to Archive folder so it's not processed again
                        if (archiveFolderId != null) {
                            googleDriveSyncService.moveFileToArchive(file.getId(), sourceFolderId, archiveFolderId);
                            log.info("Moved file {} to Archive folder.", file.getName());
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to process file: " + file.getName(), e);
                }
            }

        } catch (Exception e) {
            log.error("Error during Drive to S3 sync", e);
        }

        log.info("Google Drive to S3 Sync Pipeline completed.");
    }
}
