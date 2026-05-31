package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepo extends MongoRepository<Payment, String> {
    Optional<Payment> findByOrderId(String orderId);
    List<Payment> findByUserIdAndStatus(String userId, String status);
}
