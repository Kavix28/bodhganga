package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.CartItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepo extends MongoRepository<CartItem, String> {
    List<CartItem> findByUserId(String userId);
    Optional<CartItem> findByUserIdAndProductId(String userId, String productId);
    void deleteByUserId(String userId);
    void deleteByUserIdAndProductId(String userId, String productId);
    long countByUserId(String userId);
}
