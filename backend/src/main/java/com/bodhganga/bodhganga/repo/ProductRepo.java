package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepo extends MongoRepository<Product, String> {

    // Published product queries (used by frontend APIs)
    List<Product> findByIsPublishedTrue();
    List<Product> findByStateSlugAndIsPublishedTrue(String stateSlug);
    List<Product> findByStateSlugAndCategoryAndIsPublishedTrue(String stateSlug, String category);
    List<Product> findByStateSlugAndCategorySlugAndIsPublishedTrue(String stateSlug, String categorySlug);
    List<Product> findByStateSlugAndNavbarSlugAndIsPublishedTrue(String stateSlug, String navbarSlug);
    List<Product> findByStateSlugAndNavbarCategoryAndIsPublishedTrue(String stateSlug, String navbarCategory);
    List<Product> findByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);
    List<Product> findByDistrictSlugAndIsPublishedTrue(String districtSlug);
    List<Product> findByIsFreeTrueAndIsPublishedTrue();

    // Duplicate & Versioning detection queries
    Product findByGoogleDriveFileId(String googleDriveFileId);
    List<Product> findByGoogleDriveFileIdOrderByVersionDesc(String googleDriveFileId);
    Optional<Product> findByGoogleDriveFileIdAndIsLatestVersionTrue(String googleDriveFileId);
    Product findBySourceFileId(String sourceFileId);
    Optional<Product> findByS3Key(String s3Key);
    Optional<Product> findByStorageKey(String storageKey);
    Optional<Product> findByChecksum(String checksum);
    Product findByStateSlugAndDistrictSlugAndFileName(String stateSlug, String districtSlug, String fileName);

    // Existence checks (fast, index-backed)
    boolean existsByGoogleDriveFileId(String googleDriveFileId);
    boolean existsBySourceFileId(String sourceFileId);
    boolean existsByS3Key(String s3Key);
    boolean existsByFileName(String fileName);

    // Import, version & publish status queries
    List<Product> findByImportedFromDrive(Boolean importedFromDrive);
    List<Product> findByIsPublishedFalseAndImportedFromDriveTrue();
    List<Product> findByStateSlug(String stateSlug);
    List<Product> findByIsDeletedFalse();

    // Aggregate counts for audit reports
    long countByImportedFromDriveTrue();
    long countByIsPublishedTrue();
    long countByIngestionStatus(IngestionStatus ingestionStatus);
    long countByArchivedTrue();
    long countByIsDeletedTrue();
    long countByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);
    long countByStateSlugAndIsPublishedTrue(String stateSlug);
}
