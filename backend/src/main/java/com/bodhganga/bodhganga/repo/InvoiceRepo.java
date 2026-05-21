package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepo extends MongoRepository<Invoice, String> {
    List<Invoice> findByUserId(String userId);
    Optional<Invoice> findByOrderId(String orderId);
}
