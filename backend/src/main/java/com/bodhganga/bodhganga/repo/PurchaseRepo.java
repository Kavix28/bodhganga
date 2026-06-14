package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Purchase;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface PurchaseRepo extends MongoRepository<Purchase, String> {
    List<Purchase> findByUserId(String userId);
    Optional<Purchase> findByUserIdAndProductId(String userId, String productId);
    List<Purchase> findByUserIdAndDistrictSlugNotNull(String userId);
}
