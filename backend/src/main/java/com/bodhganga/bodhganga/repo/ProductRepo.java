package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductRepo extends MongoRepository<Product, String> {

    // Published product queries (used by frontend APIs - fail-closed: excludes
    // deleted, quarantined, failed)
    @Query("{ '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByIsPublishedTrue();

    @Query("{ 'stateSlug': ?0, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndIsPublishedTrue(String stateSlug);

    @Query("{ 'stateSlug': ?0, 'category': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndCategoryAndIsPublishedTrue(String stateSlug, String category);

    @Query("{ 'stateSlug': ?0, 'categorySlug': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndCategorySlugAndIsPublishedTrue(String stateSlug, String categorySlug);

    @Query("{ 'stateSlug': ?0, 'navbarSlug': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndNavbarSlugAndIsPublishedTrue(String stateSlug, String navbarSlug);

    @Query("{ 'stateSlug': ?0, 'navbarCategory': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndNavbarCategoryAndIsPublishedTrue(String stateSlug, String navbarCategory);

    @Query("{ 'stateSlug': ?0, 'districtSlug': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);

    @Query("{ 'stateSlug': ?0, 'districtSlug': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndDistrictSlugAndPublishedTrue(String stateSlug, String districtSlug);

    @Query("{ 'stateSlug': ?0, 'category': { '$regex': ?1, '$options': 'i' }, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndCategoryRegexAndIsPublishedTrue(String stateSlug, String categoryRegex);

    @Query("{ 'stateSlug': ?0, 'district': { '$regex': ?1, '$options': 'i' }, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByStateSlugAndDistrictIgnoreCaseAndIsPublishedTrue(String stateSlug, String district);

    @Query("{ 'districtSlug': ?0, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByDistrictSlugAndIsPublishedTrue(String districtSlug);

    @Query("{ 'isFree': true, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }")
    List<Product> findByIsFreeTrueAndIsPublishedTrue();

    // Duplicate & Versioning detection queries
    Product findByGoogleDriveFileId(String googleDriveFileId);

    List<Product> findByGoogleDriveFileIdOrderByVersionDesc(String googleDriveFileId);

    Optional<Product> findByGoogleDriveFileIdAndIsLatestVersionTrue(String googleDriveFileId);

    Product findBySourceFileId(String sourceFileId);

    Optional<Product> findByS3Key(String s3Key);

    Optional<Product> findByStorageKey(String storageKey);

    @Query("{ '$or': [ { 's3Key': { '$regex': ?0, '$options': 'i' } }, { 'storageKey': { '$regex': ?0, '$options': 'i' } } ] }")
    List<Product> findByS3KeyOrStorageKeyRegex(String regexPattern);

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

    @Query(value = "{ 'stateSlug': ?0, 'districtSlug': ?1, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }", count = true)
    long countByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);

    @Query(value = "{ 'stateSlug': ?0, '$or': [ { 'isPublished': true }, { 'published': true } ], 'isDeleted': { '$ne': true }, 'ingestionStatus': { '$nin': ['QUARANTINED', 'FAILED', 'DELETED'] } }", count = true)
    long countByStateSlugAndIsPublishedTrue(String stateSlug);
}
