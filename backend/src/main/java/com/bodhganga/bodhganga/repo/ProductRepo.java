package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepo extends MongoRepository<Product, String> {
    List<Product> findByStateSlugAndIsPublishedTrue(String stateSlug);
    List<Product> findByIsPublishedTrue();
}
