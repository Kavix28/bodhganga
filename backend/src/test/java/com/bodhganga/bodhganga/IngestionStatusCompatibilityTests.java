package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class IngestionStatusCompatibilityTests {

    @Autowired
    private ProductRepo productRepo;

    @Test
    void testIngestionStatusDeletedEnumValue() {
        // Verify enum constant exists and can be parsed from string "DELETED"
        IngestionStatus status = IngestionStatus.valueOf("DELETED");
        assertEquals(IngestionStatus.DELETED, status);
    }

    @Test
    void testProductDeserializationWithDeletedIngestionStatus() {
        // Seed a Product with IngestionStatus.DELETED
        String id = UUID.randomUUID().toString();
        Product product = new Product();
        product.setId(id);
        product.setTitle("Legacy Deleted Document");
        product.setImportedFromDrive(true);
        product.setIngestionStatus(IngestionStatus.DELETED);

        // Save to MongoDB
        productRepo.save(product);

        // Retrieve from MongoDB to verify deserialization succeeds without
        // IllegalArgumentException
        Optional<Product> foundOpt = productRepo.findById(id);
        assertTrue(foundOpt.isPresent());

        Product found = foundOpt.get();
        assertEquals(IngestionStatus.DELETED, found.getIngestionStatus());

        // Cleanup
        productRepo.deleteById(id);
    }
}
