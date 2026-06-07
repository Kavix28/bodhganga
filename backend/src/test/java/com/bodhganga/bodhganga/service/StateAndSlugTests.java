package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class)
@ActiveProfiles("test")
public class StateAndSlugTests {

    @Autowired
    private ProductRepo productRepo;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
    }

    @Test
    void testSlugGeneration() {
        assertEquals("andhra-pradesh", Product.generateSlug("Andhra Pradesh"));
        assertEquals("madhya-pradesh", Product.generateSlug("Madhya Pradesh"));
        assertEquals("alluri-sitharama-raju", Product.generateSlug("Alluri Sitharama Raju"));
        assertEquals("general", Product.generateSlug(null));
        assertEquals("general", Product.generateSlug(""));
        assertEquals("general", Product.generateSlug("   "));
        assertEquals("jammu-kashmir", Product.generateSlug("Jammu & Kashmir"));
    }

    @Test
    void testStateLookupAndPageRetrieval() {
        // Save test products
        Product p1 = new Product();
        p1.setTitle("Notes 1");
        p1.setState("Andhra Pradesh");
        p1.setStateSlug(Product.generateSlug(p1.getState()));
        p1.setDistrict("Chittoor");
        p1.setDistrictSlug(Product.generateSlug(p1.getDistrict()));
        p1.setPublished(true);
        p1.setPrice(99.0);
        productRepo.save(p1);

        Product p2 = new Product();
        p2.setTitle("Notes 2");
        p2.setState("Madhya Pradesh");
        p2.setStateSlug(Product.generateSlug(p2.getState()));
        p2.setDistrict("Bhopal");
        p2.setDistrictSlug(Product.generateSlug(p2.getDistrict()));
        p2.setPublished(true);
        p2.setPrice(99.0);
        productRepo.save(p2);

        // Fetch products by state slug
        List<Product> apProducts = productRepo.findByStateSlugAndIsPublishedTrue("andhra-pradesh");
        assertEquals(1, apProducts.size());
        assertEquals("Notes 1", apProducts.get(0).getTitle());
        assertEquals("chittoor", apProducts.get(0).getDistrictSlug());

        List<Product> mpProducts = productRepo.findByStateSlugAndIsPublishedTrue("madhya-pradesh");
        assertEquals(1, mpProducts.size());
        assertEquals("Notes 2", mpProducts.get(0).getTitle());
        assertEquals("bhopal", mpProducts.get(0).getDistrictSlug());
    }
}
