package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface OrderRepo extends MongoRepository<Order, String> {
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
    List<Order> findByUserId(String userId);
}
