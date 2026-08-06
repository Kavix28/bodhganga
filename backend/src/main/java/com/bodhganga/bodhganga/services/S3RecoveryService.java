package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * One-time S3 to MongoDB Product Metadata Recovery Service.
 * Recreates Product documents in MongoDB from existing S3 bucket objects.
 */
@Service
public class S3RecoveryService {

    private static final Logger log = LoggerFactory.getLogger(S3RecoveryService.class);

    private final S3Service s3Service;
    private final ProductRepo productRepo;

    public S3RecoveryService(S3Service s3Service, ProductRepo productRepo) {
        this.s3Service = s3Service;
        this.productRepo = productRepo;
    }

    /**
     * Recovery result summary DTO matching requirements: { scanned, imported, skipped, failed }
     */
    public static class RecoveryResult {
        private int scanned;
        private int imported;
        private int skipped;
        private int failed;

        public RecoveryResult(int scanned, int imported, int skipped, int failed) {
            this.scanned = scanned;
            this.imported = imported;
            this.skipped = skipped;
            this.failed = failed;
        }

        public int getScanned() { return scanned; }
        public int getImported() { return imported; }
        public int getSkipped() { return skipped; }
        public int getFailed() { return failed; }
    }

    /**
     * Executes one-time idempotent recovery of S3 objects to Mongo Product documents.
     */
    public RecoveryResult recoverS3ObjectsToProducts() {
        log.info("[S3 RECOVERY] Starting one-time S3 to Mongo Product recovery...");

        List<String> allKeys = s3Service.listObjects();
        int scanned = allKeys.size();
        int imported = 0;
        int skipped = 0;
        int failed = 0;

        for (String s3Key : allKeys) {
            if (s3Key == null || s3Key.isBlank()) {
                skipped++;
                continue;
            }

            // Ignore folder objects (ending with '/')
            if (s3Key.endsWith("/")) {
                skipped++;
                continue;
            }

            // Skip Question Bank prefix (isolated subsystem)
            if (s3Key.startsWith("question-bank/") || s3Key.contains("/question-bank/")) {
                skipped++;
                continue;
            }

            try {
                // Idempotent check: Skip duplicates using s3Key
                if (productRepo.existsByS3Key(s3Key)) {
                    skipped++;
                    continue;
                }

                // Parse metadata from S3 Key using Product metadata conventions
                Product product = parseMetadataFromS3Key(s3Key);
                if (product != null) {
                    productRepo.save(product);
                    imported++;
                    log.info("[S3 RECOVERY] Created Product for S3 key: {}", s3Key);
                } else {
                    failed++;
                }

            } catch (Exception e) {
                log.error("[S3 RECOVERY ERROR] Failed to import S3 key '{}': {}", s3Key, e.getMessage(), e);
                failed++;
            }
        }

        log.info("[S3 RECOVERY] Completed S3 to Mongo Product recovery. Scanned: {}, Imported: {}, Skipped: {}, Failed: {}",
                scanned, imported, skipped, failed);

        return new RecoveryResult(scanned, imported, skipped, failed);
    }

    /**
     * Parses S3 Key into Product entity using established State Notes metadata conventions.
     */
    private Product parseMetadataFromS3Key(String s3Key) {
        String[] parts = s3Key.split("/");
        if (parts.length == 0) return null;

        String rawFileName = parts[parts.length - 1];
        String stateSlug = parts[0];
        String stateName = capitalizeWords(stateSlug.replace("-", " "));

        String fileExtension = Product.getFileExtension(rawFileName);
        String fileMimeType = Product.determineMimeType(rawFileName);
        String contentType = Product.determineContentType(fileMimeType, rawFileName);
        String title = Product.stripExtension(rawFileName).replace("_", " ");

        Product product = new Product();
        product.setS3Key(s3Key);
        product.setStorageKey(s3Key);
        product.setS3Url(s3Service.getS3Url(s3Key));

        product.setState(stateName);
        product.setStateSlug(stateSlug);

        product.setOriginalFileName(rawFileName);
        product.setFileName(rawFileName);
        product.setTitle(title);
        product.setDisplayTitle(title);

        product.setFileExtension(fileExtension);
        product.setMimeType(fileMimeType);
        product.setContentType(contentType);
        product.setType(contentType);

        product.setImportedFromDrive(true);
        product.setIngestionStatus(IngestionStatus.COMPLETED);
        product.setPublished(true);
        product.setPublishedField(true);
        product.setArchived(false);
        product.setIsDeleted(false);

        product.setIsLatestVersion(true);
        product.setVersion(1);

        Date now = new Date();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        product.setLastSync(now);

        // Derive navbarCategory / category / subcategory / district from path structure
        if (parts.length > 2) {
            String catSlug = parts[1];
            String catName = capitalizeWords(catSlug.replace("-", " "));
            product.setNavbarCategory(catName);
            product.setNavbarSlug(catSlug);
            product.setCategory(catName);
            product.setCategorySlug(catSlug);

            if (parts.length > 3) {
                String distSlug = parts[2];
                String distName = capitalizeWords(distSlug.replace("-", " "));
                product.setDistrict(distName);
                product.setDistrictSlug(distSlug);
            } else {
                product.setDistrict("general");
                product.setDistrictSlug("general");
            }
        } else if (parts.length > 1) {
            String catSlug = parts[1];
            String catName = capitalizeWords(catSlug.replace("-", " "));
            product.setNavbarCategory(catName);
            product.setNavbarSlug(catSlug);
            product.setCategory(catName);
            product.setCategorySlug(catSlug);
            product.setDistrict("general");
            product.setDistrictSlug("general");
        } else {
            product.setNavbarCategory("General Notes");
            product.setNavbarSlug("general-notes");
            product.setCategory("General Notes");
            product.setCategorySlug("general-notes");
            product.setDistrict("general");
            product.setDistrictSlug("general");
        }

        List<String> crumbs = new ArrayList<>();
        if (product.getState() != null) crumbs.add(product.getState());
        if (product.getCategory() != null) crumbs.add(product.getCategory());
        if (product.getDistrict() != null && !"general".equalsIgnoreCase(product.getDistrict())) crumbs.add(product.getDistrict());
        product.setBreadcrumbs(crumbs);

        return product;
    }

    private String capitalizeWords(String text) {
        if (text == null || text.isBlank()) return text;
        String[] words = text.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase()).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
