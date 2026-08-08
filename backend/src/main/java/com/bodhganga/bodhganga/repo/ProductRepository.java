package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    boolean existsBySourceFileId(String sourceFileId);
    boolean existsByS3Key(String s3Key);
    List<Product> findByStateSlugAndPublishedTrue(String stateSlug);
    List<Product> findByStateSlugAndDistrictSlugAndIsPublishedTrue(String stateSlug, String districtSlug);
    List<Product> findByStateSlugAndDistrictSlugAndPublishedTrue(String stateSlug, String districtSlug);
    List<Product> findByStateSlugAndNavbarSlugAndIsPublishedTrue(String stateSlug, String navbarSlug);
    List<Product> findByStateSlugAndCategoryAndIsPublishedTrue(String stateSlug, String category);
    List<Product> findByStateSlugAndCategoryRegexAndIsPublishedTrue(String stateSlug, String categoryRegex);
    List<Product> findByStateSlugAndDistrictIgnoreCaseAndIsPublishedTrue(String stateSlug, String district);
}
