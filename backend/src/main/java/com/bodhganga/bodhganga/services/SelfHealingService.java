package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SelfHealingService {

    private static final Logger log = LoggerFactory.getLogger(SelfHealingService.class);

    private final ProductRepo productRepo;
    private final S3Service s3Service;

    public SelfHealingService(ProductRepo productRepo, S3Service s3Service) {
        this.productRepo = productRepo;
        this.s3Service = s3Service;
    }

    /**
     * Executes a full self-healing audit and reconciliation pass over MongoDB products.
     */
    public Map<String, Object> runSelfHealingAudit() {
        log.info("[SELF-HEALING] Starting consistency and integrity audit...");
        long startTime = System.currentTimeMillis();

        List<Product> products = productRepo.findAll();
        int repairedSlugs = 0;
        int repairedVersions = 0;
        int orphanRecordsRepaired = 0;
        int duplicatesDisabled = 0;

        // Group products by googleDriveFileId to resolve multiversioning / duplicates
        Map<String, List<Product>> driveGroups = products.stream()
                .filter(p -> p.getGoogleDriveFileId() != null && !p.getGoogleDriveFileId().isBlank())
                .collect(Collectors.groupingBy(Product::getGoogleDriveFileId));

        for (Map.Entry<String, List<Product>> entry : driveGroups.entrySet()) {
            List<Product> group = entry.getValue();
            if (group.size() > 1) {
                // Sort by version descending, then updatedAt descending
                group.sort((a, b) -> {
                    int vComp = Integer.compare(
                        b.getVersion() != null ? b.getVersion() : 1,
                        a.getVersion() != null ? a.getVersion() : 1
                    );
                    if (vComp != 0) return vComp;
                    Date d1 = b.getUpdatedAt() != null ? b.getUpdatedAt() : new Date(0);
                    Date d2 = a.getUpdatedAt() != null ? a.getUpdatedAt() : new Date(0);
                    return d1.compareTo(d2);
                });

                // Top item is latest active version
                Product latest = group.get(0);
                if (!Boolean.TRUE.equals(latest.getIsLatestVersion())) {
                    latest.setIsLatestVersion(true);
                    productRepo.save(latest);
                    repairedVersions++;
                }

                // Deactivate all older duplicates / versions from active frontend search
                for (int i = 1; i < group.size(); i++) {
                    Product oldVer = group.get(i);
                    if (Boolean.TRUE.equals(oldVer.getIsLatestVersion()) || oldVer.isPublished()) {
                        oldVer.setIsLatestVersion(false);
                        oldVer.setPublished(false);
                        productRepo.save(oldVer);
                        duplicatesDisabled++;
                    }
                }
            }
        }

        // Heal missing stateSlug, categorySlug, or breadcrumbs
        for (Product p : products) {
            boolean modified = false;
            if (p.getState() != null && (p.getStateSlug() == null || p.getStateSlug().isBlank())) {
                p.setStateSlug(Product.generateSlug(p.getState()));
                modified = true;
            }
            if (p.getCategory() != null && (p.getCategorySlug() == null || p.getCategorySlug().isBlank())) {
                p.setCategorySlug(Product.generateSlug(p.getCategory()));
                modified = true;
            }
            if (p.getNavbarCategory() != null && (p.getNavbarSlug() == null || p.getNavbarSlug().isBlank())) {
                p.setNavbarSlug(Product.generateSlug(p.getNavbarCategory()));
                modified = true;
            }
            if (p.getBreadcrumbs() == null || p.getBreadcrumbs().isEmpty()) {
                List<String> crumbs = new ArrayList<>();
                if (p.getState() != null) crumbs.add(p.getState());
                if (p.getCategory() != null) crumbs.add(p.getCategory());
                if (p.getSubcategory() != null) crumbs.add(p.getSubcategory());
                p.setBreadcrumbs(crumbs);
                modified = true;
            }

            // Verify S3 key presence on published products
            if (p.isPublished() && (p.getS3Key() == null || p.getS3Key().isBlank())) {
                p.setIngestionStatus(IngestionStatus.FAILED);
                p.setPublished(false);
                orphanRecordsRepaired++;
                modified = true;
            }

            if (modified) {
                productRepo.save(p);
                repairedSlugs++;
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("[SELF-HEALING] COMPLETED in {} ms - repairedSlugs={}, repairedVersions={}, orphanRepaired={}, duplicatesDisabled={}",
            duration, repairedSlugs, repairedVersions, orphanRecordsRepaired, duplicatesDisabled);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("auditDurationMs", duration);
        result.put("repairedSlugs", repairedSlugs);
        result.put("repairedVersions", repairedVersions);
        result.put("orphanRecordsRepaired", orphanRecordsRepaired);
        result.put("duplicatesDisabled", duplicatesDisabled);
        result.put("totalProductsAudited", products.size());
        return result;
    }
}
