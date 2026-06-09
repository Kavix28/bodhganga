package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    boolean existsBySourceFileId(String sourceFileId);
    boolean existsByS3Key(String s3Key);
    List<Product> findByStateSlugAndPublishedTrue(String stateSlug);
}
