package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.HierarchicalMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * One-time S3 to MongoDB Product Metadata Recovery Service.
 * Recreates Product documents in MongoDB from existing S3 bucket objects using ProductMetadataUtil.
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
        private final int scanned;
        private final int imported;
        private final int skipped;
        private final int failed;

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
            if (s3Key.startsWith("question-bank/") || s3Key.contains("/question-bank/") ||
                s3Key.startsWith("qb/") || s3Key.contains("/qb/")) {
                skipped++;
                continue;
            }

            String[] parts = s3Key.split("/");
            if (parts.length == 0) {
                skipped++;
                continue;
            }

            String fileName = parts[parts.length - 1];

            // Ignore hidden files and temporary files
            if (fileName.startsWith(".") || fileName.startsWith("~$") ||
                fileName.endsWith(".tmp") || fileName.endsWith(".crdownload") ||
                fileName.equalsIgnoreCase(".DS_Store")) {
                skipped++;
                continue;
            }

            try {
                // Idempotent check: Skip duplicates using s3Key
                if (productRepo.existsByS3Key(s3Key)) {
                    skipped++;
                    continue;
                }

                // Reconstruct folderPath from S3 key segments (excluding the filename)
                List<String> folderPath = new ArrayList<>();
                for (int i = 0; i < parts.length - 1; i++) {
                    folderPath.add(parts[i]);
                }

                // Extract metadata via central production utility
                HierarchicalMetadata metadata = ProductMetadataUtil.extractMetadata(folderPath, fileName);

                Product product = buildProductFromMetadata(s3Key, fileName, metadata);
                productRepo.save(product);
                imported++;
                log.info("[S3 RECOVERY] Created Product for S3 key: {}", s3Key);

            } catch (Exception e) {
                log.error("[S3 RECOVERY ERROR] Failed to import S3 key '{}': {}", s3Key, e.getMessage(), e);
                failed++;
            }
        }

        log.info("[S3 RECOVERY] Completed S3 to Mongo Product recovery. Scanned: {}, Imported: {}, Skipped: {}, Failed: {}",
                scanned, imported, skipped, failed);

        return new RecoveryResult(scanned, imported, skipped, failed);
    }

    private Product buildProductFromMetadata(String s3Key, String fileName, HierarchicalMetadata metadata) {
        String state = metadata.state;
        String stateSlug = metadata.stateSlug;
        String navbarCategory = metadata.navbarCategory;
        String navbarSlug = metadata.navbarSlug;
        String district = metadata.district;
        String districtSlug = metadata.districtSlug;
        boolean isFree = metadata.isFree;
        double price = isFree ? 0.0 : 99.0;

        String displayTitle = Product.stripExtension(fileName);
        String fileExtension = Product.getFileExtension(fileName);
        String fileMimeType = Product.determineMimeType(fileName);
        String contentType = Product.determineContentType(fileMimeType, fileName);

        Product product = new Product();
        product.setVersion(1);
        product.setIsLatestVersion(true);
        product.setOriginalFileName(fileName);
        product.setFileName(fileName);
        product.setFileExtension(fileExtension);
        product.setImportedFromDrive(true);

        Date now = new Date();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        product.setLastSync(now);

        product.setTitle(displayTitle);
        product.setDisplayTitle(displayTitle);
        product.setType(contentType);
        product.setContentType(contentType);
        product.setMimeType(fileMimeType);

        product.setState(ProductMetadataUtil.normalizeName(state));
        product.setStateSlug(stateSlug);
        product.setDistrict(ProductMetadataUtil.normalizeName(district));
        product.setDistrictSlug(districtSlug);
        product.setNavbarCategory(navbarCategory);
        product.setNavbarSlug(navbarSlug);
        product.setCategorySlug(navbarSlug);
        product.setSubcategory(metadata.subcategory);
        product.setSubcategorySlug(metadata.subcategorySlug);
        product.setSubfolderPath(metadata.subfolderPath);

        List<String> crumbs = new ArrayList<>();
        if (state != null) crumbs.add(state);
        if (navbarCategory != null) crumbs.add(navbarCategory);
        if (metadata.subcategory != null) crumbs.add(metadata.subcategory);
        product.setBreadcrumbs(crumbs);

        product.setPublished(true);
        product.setPublishedField(true);
        product.setFree(isFree);
        product.setPrice(price);
        product.setCategory(navbarCategory != null ? navbarCategory : (isFree ? "Free Resources" : "Paid Resources"));

        product.setS3Key(s3Key);
        product.setStorageKey(s3Key);
        product.setS3Url(s3Service.getS3Url(s3Key));
        product.setIngestionStatus(IngestionStatus.COMPLETED);
        product.setArchived(false);
        product.setIsDeleted(false);

        return product;
    }
}
