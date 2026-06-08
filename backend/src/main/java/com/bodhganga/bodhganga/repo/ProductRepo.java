package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepo extends MongoRepository<Product, String> {
    List<Product> findByStateSlugAndIsPublishedTrue(String stateSlug);
    List<Product> findByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);
    List<Product> findByIsPublishedTrue();
    java.util.Optional<Product> findByS3Key(String s3Key);
    java.util.Optional<Product> findByStorageKey(String storageKey);
    List<Product> findByIsFreeTrueAndIsPublishedTrue();
    List<Product> findByImportedFromDrive(Boolean importedFromDrive);

    // Hardened pipeline duplicate check queries
    Product findByGoogleDriveFileId(String googleDriveFileId);
    boolean existsByFileName(String fileName);
    boolean existsByS3Key(String s3Key);
    boolean existsByGoogleDriveFileId(String googleDriveFileId);

    // Hardened pipeline stats queries
    long countByImportedFromDriveTrue();
    long countByIsPublishedTrue();
    long countByIngestionStatus(IngestionStatus ingestionStatus);
    long countByArchivedTrue();
}
