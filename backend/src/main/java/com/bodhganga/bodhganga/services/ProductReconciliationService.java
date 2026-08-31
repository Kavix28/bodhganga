package com.bodhganga.bodhganga.services;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.AccessType;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.HierarchicalMetadata;
import com.bodhganga.bodhganga.util.ProductMetadataUtil.ItemType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Service
public class ProductReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(ProductReconciliationService.class);

    private final ProductRepo productRepo;
    private final S3Service s3Service;

    public enum ReconciliationAction {
        NO_CHANGE,
        RECONCILE_METADATA_AND_S3,
        UPDATE_VERSION,
        CREATE,
        QUARANTINE,
        REJECT
    }

    public static class ReconciliationResult {
        private final ReconciliationAction action;
        private final Product product;
        private final String message;

        public ReconciliationResult(ReconciliationAction action, Product product, String message) {
            this.action = action;
            this.product = product;
            this.message = message;
        }

        public ReconciliationAction getAction() {
            return action;
        }

        public Product getProduct() {
            return product;
        }

        public String getMessage() {
            return message;
        }
    }

    public ProductReconciliationService(ProductRepo productRepo, S3Service s3Service) {
        this.productRepo = productRepo;
        this.s3Service = s3Service;
    }

    /**
     * Deterministic, metadata-aware reconciliation logic.
     * Enforces that CHECKSUM MATCH != SAFE TO SKIP when metadata or tier location
     * changes.
     */
    public ReconciliationResult reconcile(File driveFile,
            String parentFolderId,
            List<String> folderPath,
            byte[] fileBytes,
            String checksum,
            String targetFileName,
            String targetMimeType,
            HierarchicalMetadata metadata) {

        String fileName = targetFileName != null ? targetFileName : driveFile.getName();
        String fileId = driveFile.getId();

        // 1. REJECT non-resource or state images
        if (metadata.itemType == ItemType.STATE_IMAGE || metadata.itemType == ItemType.NON_RESOURCE) {
            return new ReconciliationResult(ReconciliationAction.REJECT, null,
                    "Item is non-resource or state-image: " + metadata.itemType);
        }

        // 2. QUARANTINE unknown or conflicting tier folder
        if (!metadata.hasTierFolder || metadata.accessType == AccessType.UNKNOWN
                || metadata.accessType == AccessType.CONFLICT) {
            log.error("[RECONCILIATION][QUARANTINE] File '{}' (Drive ID: {}) in path {} has invalid tier access: {}",
                    fileName, fileId, folderPath, metadata.accessType);

            Product existing = productRepo.findByGoogleDriveFileId(fileId);
            if (existing != null) {
                existing.setIngestionStatus(IngestionStatus.QUARANTINED);
                existing.setPublished(false);
                existing.setUpdatedAt(new Date());
                productRepo.save(existing);
            }
            return new ReconciliationResult(ReconciliationAction.QUARANTINE, existing,
                    "Rejected due to invalid/conflicting tier folder: " + metadata.accessType);
        }

        // Look up existing Product primary identity (googleDriveFileId)
        Product existing = productRepo.findByGoogleDriveFileId(fileId);

        String state = metadata.state;
        String stateSlug = metadata.stateSlug;
        String navbarCategory = metadata.navbarCategory;
        String navbarSlug = metadata.navbarSlug;
        String district = metadata.district;
        String districtSlug = metadata.districtSlug;
        boolean isFree = metadata.isFree;
        double price = isFree ? 0.0 : 99.0;
        String expectedS3Key = metadata.buildS3Key(fileName);

        // 3. NEW PRODUCT CREATION
        if (existing == null) {
            log.info("[RECONCILIATION][CREATE] Creating new product record for file '{}' (Drive ID: {}) with key '{}'",
                    fileName, fileId, expectedS3Key);

            Product product = new Product();
            product.setVersion(1);
            product.setIsLatestVersion(true);
            product.setOriginalFileName(fileName);
            product.setFileName(fileName);
            product.setFileExtension(Product.getFileExtension(fileName));
            product.setImportedFromDrive(true);
            product.setCreatedAt(new Date());

            populateProductMetadata(product, driveFile, parentFolderId, fileName, targetMimeType, checksum,
                    metadata, state, stateSlug, navbarCategory, navbarSlug, district, districtSlug, isFree, price);

            // Pre-save with PROCESSING so a FAILED record exists if upload throws
            product.setIngestionStatus(IngestionStatus.PROCESSING);
            product.setUpdatedAt(new Date());
            product = productRepo.save(product);

            // Upload bytes to S3
            if (fileBytes != null && fileBytes.length > 0) {
                String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
                try {
                    String returnedKey = s3Service.uploadFileWithKey(
                            new java.io.ByteArrayInputStream(fileBytes), fileBytes.length, expectedS3Key, fileMimeType);
                    product.setS3Key(returnedKey);
                    product.setStorageKey(returnedKey);
                    product.setS3Url(s3Service.getS3Url(returnedKey));
                } catch (Exception uploadEx) {
                    product.setIngestionStatus(IngestionStatus.FAILED);
                    product.setUpdatedAt(new Date());
                    productRepo.save(product);
                    log.error("[RECONCILIATION][CREATE_FAILED] S3 upload failed for '{}': {}", fileName,
                            uploadEx.getMessage());
                    throw uploadEx;
                }
            }

            product.setIngestionStatus(IngestionStatus.COMPLETED);
            product.setUpdatedAt(new Date());
            product = productRepo.save(product);

            return new ReconciliationResult(ReconciliationAction.CREATE, product,
                    "Created new Product and uploaded to S3");
        }

        // 4. EXISTING PRODUCT DECISION MATRIX
        boolean checksumMatches = checksum != null && checksum.equals(existing.getChecksum());
        boolean metadataMatches = Objects.equals(existing.isFree(), isFree)
                && Objects.equals(existing.getPrice(), price)
                && Objects.equals(existing.getStateSlug(), stateSlug)
                && Objects.equals(existing.getDistrictSlug(), districtSlug)
                && Objects.equals(existing.getNavbarSlug(), navbarSlug);
        boolean s3KeyMatches = Objects.equals(existing.getS3Key(), expectedS3Key)
                && Objects.equals(existing.getStorageKey(), expectedS3Key);

        // CASE A: Same checksum + Same metadata + Same S3 key => NO_CHANGE (SKIP
        // re-upload & re-save)
        if (checksumMatches && metadataMatches && s3KeyMatches && Boolean.TRUE.equals(existing.getIsLatestVersion())) {
            log.info(
                    "[RECONCILIATION][NO_CHANGE] File '{}' (Drive ID: {}) is unchanged and metadata matches. Updating lastSync.",
                    fileName, fileId);
            existing.setLastSync(new Date());
            productRepo.save(existing);
            return new ReconciliationResult(ReconciliationAction.NO_CHANGE, existing, "No change required");
        }

        // CASE B & C: Same checksum BUT metadata or S3 key changed (e.g. Free -> Paid,
        // Drive parent moved, state/district renamed)
        if (checksumMatches) {
            log.info(
                    "[RECONCILIATION][RECONCILE] Metadata or S3 key changed for file '{}' (Drive ID: {}). Old S3 Key: '{}', Expected S3 Key: '{}'",
                    fileName, fileId, existing.getS3Key(), expectedS3Key);

            String oldS3Key = existing.getS3Key() != null ? existing.getS3Key() : existing.getStorageKey();
            boolean relocationDone = false;
            boolean destinationCreated = false;

            // Perform S3 relocation if S3 key changed
            if (oldS3Key != null && !oldS3Key.equals(expectedS3Key)) {
                try {
                    if (s3Service.doesObjectExist(oldS3Key)) {
                        log.info("[RECONCILIATION][S3_RELOCATE] Copying S3 object from '{}' to '{}'", oldS3Key,
                                expectedS3Key);
                        s3Service.copyObject(oldS3Key, expectedS3Key);
                        if (!s3Service.doesObjectExist(expectedS3Key)) {
                            log.error(
                                    "[RECONCILIATION][S3_RELOCATE_ERROR] Destination object verification failed at '{}'. Retaining old key.",
                                    expectedS3Key);
                            throw new IllegalStateException("S3 destination verification failed at " + expectedS3Key);
                        }
                        destinationCreated = true;
                        relocationDone = true;
                    } else if (fileBytes != null && fileBytes.length > 0) {
                        log.warn(
                                "[RECONCILIATION][S3_RELOCATE] Old S3 object '{}' not found. Re-uploading bytes to '{}'",
                                oldS3Key, expectedS3Key);
                        String fileMimeType = targetMimeType != null ? targetMimeType
                                : Product.determineMimeType(fileName);
                        s3Service.uploadFileWithKey(new java.io.ByteArrayInputStream(fileBytes), fileBytes.length,
                                expectedS3Key, fileMimeType);
                        destinationCreated = true;
                        relocationDone = true;
                    } else {
                        log.error(
                                "[RECONCILIATION][S3_RELOCATE_ERROR] Old S3 key '{}' missing and no file bytes available.",
                                oldS3Key);
                        throw new IllegalStateException("Old S3 key missing and no file bytes available");
                    }
                } catch (Exception e) {
                    log.error("[RECONCILIATION][S3_RELOCATE_ERROR] Failed S3 copy/verification from '{}' to '{}': {}",
                            oldS3Key, expectedS3Key, e.getMessage());
                    if (destinationCreated && oldS3Key != null && s3Service.doesObjectExist(oldS3Key)) {
                        try {
                            s3Service.deleteObject(expectedS3Key);
                        } catch (Exception ignored) {
                        }
                    }
                    throw e;
                }
            }

            String s3KeyToSet = relocationDone ? expectedS3Key : oldS3Key;

            populateProductMetadata(existing, driveFile, parentFolderId, fileName, targetMimeType, checksum,
                    metadata, state, stateSlug, navbarCategory, navbarSlug, district, districtSlug, isFree, price);

            existing.setS3Key(s3KeyToSet);
            existing.setStorageKey(s3KeyToSet);
            existing.setS3Url(s3Service.getS3Url(s3KeyToSet));
            existing.setIngestionStatus(IngestionStatus.COMPLETED);
            existing.setUpdatedAt(new Date());

            try {
                existing = productRepo.save(existing);
            } catch (Exception saveEx) {
                log.error("[RECONCILIATION][MONGO_SAVE_ERROR] Failed to update Mongo record for file '{}': {}",
                        fileName, saveEx.getMessage());
                if (relocationDone && destinationCreated && oldS3Key != null && s3Service.doesObjectExist(oldS3Key)) {
                    try {
                        s3Service.deleteObject(expectedS3Key);
                    } catch (Exception ignored) {
                    }
                }
                throw saveEx;
            }

            // ONLY AFTER Mongo save succeeds, clean up old S3 object
            if (relocationDone && oldS3Key != null && !oldS3Key.equals(expectedS3Key)) {
                try {
                    log.info("[RECONCILIATION][S3_RELOCATE] Mongo save succeeded. Cleaning up old S3 key '{}'",
                            oldS3Key);
                    s3Service.deleteObject(oldS3Key);
                } catch (Exception deleteEx) {
                    log.warn(
                            "[RECONCILIATION][S3_DELETE_OLD_WARNING] Failed to delete old key '{}' after successful Mongo save: {}",
                            oldS3Key, deleteEx.getMessage());
                }
            }

            return new ReconciliationResult(ReconciliationAction.RECONCILE_METADATA_AND_S3, existing,
                    "Reconciled product metadata and S3 location");
        }

        // CASE D & E: Checksum changed => Modified file contents on Drive (Versioning)
        log.info("[RECONCILIATION][VERSIONING] File '{}' (Drive ID: {}) content modified on Drive. Creating version {}",
                fileName, fileId, (existing.getVersion() != null ? existing.getVersion() : 1) + 1);

        existing.setIsLatestVersion(false);
        existing.setPublished(false);
        productRepo.save(existing);

        Product newVersion = new Product();
        newVersion.setVersion((existing.getVersion() != null ? existing.getVersion() : 1) + 1);
        newVersion.setPreviousVersionId(existing.getId());
        newVersion.setIsLatestVersion(true);
        newVersion.setOriginalFileName(fileName);
        newVersion.setFileName(fileName);
        newVersion.setFileExtension(Product.getFileExtension(fileName));
        newVersion.setImportedFromDrive(true);
        newVersion.setCreatedAt(new Date());

        populateProductMetadata(newVersion, driveFile, parentFolderId, fileName, targetMimeType, checksum,
                metadata, state, stateSlug, navbarCategory, navbarSlug, district, districtSlug, isFree, price);

        // Pre-save with PROCESSING so a FAILED record exists if upload throws
        newVersion.setIngestionStatus(IngestionStatus.PROCESSING);
        newVersion.setUpdatedAt(new Date());
        newVersion = productRepo.save(newVersion);

        if (fileBytes != null && fileBytes.length > 0) {
            String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
            try {
                String returnedKey = s3Service.uploadFileWithKey(
                        new java.io.ByteArrayInputStream(fileBytes), fileBytes.length, expectedS3Key, fileMimeType);
                newVersion.setS3Key(returnedKey);
                newVersion.setStorageKey(returnedKey);
                newVersion.setS3Url(s3Service.getS3Url(returnedKey));
            } catch (Exception uploadEx) {
                newVersion.setIngestionStatus(IngestionStatus.FAILED);
                newVersion.setUpdatedAt(new Date());
                productRepo.save(newVersion);
                log.error("[RECONCILIATION][VERSION_FAILED] S3 upload failed for '{}': {}", fileName,
                        uploadEx.getMessage());
                throw uploadEx;
            }
        }

        newVersion.setIngestionStatus(IngestionStatus.COMPLETED);
        newVersion.setUpdatedAt(new Date());
        newVersion = productRepo.save(newVersion);

        return new ReconciliationResult(ReconciliationAction.UPDATE_VERSION, newVersion,
                "Created new product version for modified content");
    }

    private void populateProductMetadata(Product product, File driveFile, String parentFolderId, String fileName,
            String targetMimeType, String checksum, HierarchicalMetadata metadata,
            String state, String stateSlug, String navbarCategory, String navbarSlug,
            String district, String districtSlug, boolean isFree, double price) {

        String displayTitle = Product.stripExtension(fileName);
        String fileMimeType = targetMimeType != null ? targetMimeType : Product.determineMimeType(fileName);
        String contentType = Product.determineContentType(fileMimeType, fileName);
        long size = driveFile.getSize() != null ? driveFile.getSize() : 0;

        product.setTitle(displayTitle);
        product.setDisplayTitle(displayTitle);
        product.setType(contentType);
        product.setContentType(contentType);
        product.setMimeType(fileMimeType);
        if (size > 0) {
            product.setFileSize(size);
        }
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
        if (state != null)
            crumbs.add(state);
        if (navbarCategory != null)
            crumbs.add(navbarCategory);
        if (metadata.subcategory != null)
            crumbs.add(metadata.subcategory);
        product.setBreadcrumbs(crumbs);

        product.setGoogleDriveFileId(driveFile.getId());
        product.setGoogleDriveParentId(parentFolderId);
        product.setChecksum(checksum);
        product.setLastSync(new Date());
        product.setSource("Google Drive");
        product.setPublished(true);
        product.setFree(isFree);
        product.setPrice(price);
        product.setCategory(navbarCategory != null ? navbarCategory : (isFree ? "Free Resources" : "Paid Resources"));
    }
}
