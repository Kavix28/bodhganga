package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface PaymentRepo extends MongoRepository<Payment, String> {
    Optional<Payment> findByOrderId(String orderId);
    List<Payment> findByUserIdAndStatus(String userId, String status);

    /** All payments with a given status (e.g. SUCCESS, FAILED, PENDING) */
    List<Payment> findByStatus(String status);

    /** Payments with status created after a given date */
    List<Payment> findByStatusAndCreatedAtAfter(String status, Date date);

    /** Payments with status created between two dates */
    List<Payment> findByStatusAndCreatedAtBetween(String status, Date from, Date to);

    /** Count by status */
    long countByStatus(String status);
}
