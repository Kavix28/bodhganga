package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Idempotent Data Recovery Utility for State Notes Metadata.
 * Rebuilds missing MongoDB Product documents from existing S3 Bucket objects without modifying S3.
 */
@Service
public class S3MetadataRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(S3MetadataRecoveryService.class);

    private final S3Service s3Service;
    private final ProductRepo productRepo;

    @Value("${s3.recovery.enabled:false}")
    private boolean recoveryEnabled;

    public S3MetadataRecoveryService(S3Service s3Service, ProductRepo productRepo) {
        this.s3Service = s3Service;
        this.productRepo = productRepo;
    }

    public Map<String, Object> recoverProductsFromS3Bucket() {
        if (!recoveryEnabled) {
            log.info("[S3 RECOVERY] Recovery utility is disabled. Set s3.recovery.enabled=true to run.");
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("status", "DISABLED");
            res.put("message", "Set s3.recovery.enabled=true in application environment to execute recovery.");
            return res;
        }

        log.info("[S3 RECOVERY] STARTING idempotent metadata recovery from S3 bucket...");
        long startTime = System.currentTimeMillis();

        List<String> allS3Keys = s3Service.listObjects();
        AtomicInteger recoveredCount = new AtomicInteger(0);
        AtomicInteger skippedCount = new AtomicInteger(0);

        for (String s3Key : allS3Keys) {
            // Only process State Notes keys (skip question-bank/ prefix)
            if (s3Key.startsWith("question-bank/") || s3Key.contains("/question-bank/")) {
                skippedCount.incrementAndGet();
                continue;
            }

            // Idempotency check: Skip if Product with s3Key already exists in MongoDB
            Optional<Product> existing = productRepo.findByS3Key(s3Key);
            if (existing.isPresent()) {
                skippedCount.incrementAndGet();
                continue;
            }

            // Infer State Notes metadata from S3 Key structure (e.g., state-slug/category-slug/filename.pdf)
            Product product = inferProductFromS3Key(s3Key);
            if (product != null) {
                productRepo.save(product);
                recoveredCount.incrementAndGet();
                log.info("[S3 RECOVERY] Recovered Product: id='{}', state='{}', s3Key='{}'", product.getId(), product.getState(), s3Key);
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("[S3 RECOVERY] COMPLETED in {} ms - Total S3 Keys: {}, Recovered: {}, Skipped: {}",
                duration, allS3Keys.size(), recoveredCount.get(), skippedCount.get());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SUCCESS");
        result.put("totalS3Objects", allS3Keys.size());
        result.put("recoveredProducts", recoveredCount.get());
        result.put("skippedObjects", skippedCount.get());
        result.put("durationMs", duration);
        return result;
    }

    private Product inferProductFromS3Key(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) return null;

        String[] parts = s3Key.split("/");
        if (parts.length < 2) return null;

        String stateSlug = parts[0];
        String stateName = capitalizeWords(stateSlug.replace("-", " "));
        String rawFileName = parts[parts.length - 1];

        Product p = new Product();
        p.setS3Key(s3Key);
        p.setS3Url(s3Service.getS3Url(s3Key));
        p.setState(stateName);
        p.setStateSlug(stateSlug);
        p.setOriginalFileName(rawFileName);
        p.setFileName(rawFileName);
        p.setTitle(rawFileName.replaceAll("(?i)\\.pdf$", "").replace("_", " "));
        p.setFileExtension(Product.getFileExtension(rawFileName));
        p.setImportedFromDrive(true);
        p.setIngestionStatus(IngestionStatus.COMPLETED);
        p.setPublished(true);
        p.setIsLatestVersion(true);
        p.setVersion(1);
        p.setCreatedAt(new Date());
        p.setUpdatedAt(new Date());
        p.setLastSync(new Date());

        if (parts.length > 2) {
            String catSlug = parts[1];
            p.setNavbarCategory(capitalizeWords(catSlug.replace("-", " ")));
            p.setNavbarSlug(catSlug);
            p.setCategory(p.getNavbarCategory());
            p.setCategorySlug(catSlug);
        } else {
            p.setNavbarCategory("General Notes");
            p.setNavbarSlug("general-notes");
            p.setCategory("General Notes");
            p.setCategorySlug("general-notes");
        }

        p.setBreadcrumbs(List.of(p.getState(), p.getCategory()));
        return p;
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
