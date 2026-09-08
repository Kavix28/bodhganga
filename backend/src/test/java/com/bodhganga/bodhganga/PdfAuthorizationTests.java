package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Date;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PdfAuthorizationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private PurchaseRepo purchaseRepo;

    @Autowired
    private UserRepo userRepo;

    @MockBean
    private S3Service s3Service;

    private static final String TEST_USER_EMAIL = "testuser@bodhganga.com";
    private User testUser;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
        purchaseRepo.deleteAll();
        userRepo.deleteAll();

        // Seed test user
        testUser = new User();
        testUser.setId(UUID.randomUUID().toString());
        testUser.setEmail(TEST_USER_EMAIL);
        testUser.setName("Test User");
        userRepo.save(testUser);

        when(s3Service.generatePresignedUrl(anyString()))
                .thenAnswer(inv -> "https://s3.amazonaws.com/presigned/" + inv.getArgument(0));
    }

    private Product seedPaidProduct(String key, String stateSlug, String districtSlug) {
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Paid Notes " + districtSlug);
        p.setS3Key(key);
        p.setStorageKey(key);
        p.setFree(false);
        p.setPrice(99.0);
        p.setPublished(true);
        p.setArchived(false);
        p.setStateSlug(stateSlug);
        p.setDistrictSlug(districtSlug);
        return productRepo.save(p);
    }

    private Purchase seedPurchase(String stateSlug, String districtSlug) {
        Purchase pur = new Purchase();
        pur.setId(UUID.randomUUID().toString());
        pur.setUserId(testUser.getId());
        pur.setStateSlug(stateSlug);
        pur.setDistrictSlug(districtSlug);
        pur.setPurchaseDate(new Date());
        return purchaseRepo.save(pur);
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testSameStateAndSameDistrictAllowed() throws Exception {
        // Purchase: Maharashtra / Akola
        seedPurchase("maharashtra", "akola");

        // Product: Maharashtra / Akola
        Product prod = seedPaidProduct("states/maharashtra/akola/paid/notes.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/" + prod.getS3Key()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testSameDistrictDifferentStateDenied() throws Exception {
        // Purchase: Himachal Pradesh / Bilaspur
        seedPurchase("himachal-pradesh", "bilaspur");

        // Product: Chhattisgarh / Bilaspur
        Product prod = seedPaidProduct("states/chhattisgarh/bilaspur/paid/notes.pdf", "chhattisgarh", "bilaspur");

        mockMvc.perform(get("/api/pdf/" + prod.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You do not own this document. Please claim or purchase it."));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testDifferentDistrictSameStateDenied() throws Exception {
        // Purchase: Maharashtra / Akola
        seedPurchase("maharashtra", "akola");

        // Product: Maharashtra / Pune
        Product prod = seedPaidProduct("states/maharashtra/pune/paid/notes.pdf", "maharashtra", "pune");

        mockMvc.perform(get("/api/pdf/" + prod.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testDifferentDistrictDifferentStateDenied() throws Exception {
        // Purchase: Maharashtra / Akola
        seedPurchase("maharashtra", "akola");

        // Product: Gujarat / Surat
        Product prod = seedPaidProduct("states/gujarat/surat/paid/notes.pdf", "gujarat", "surat");

        mockMvc.perform(get("/api/pdf/" + prod.getS3Key()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testNullPurchaseStateDenied() throws Exception {
        // Purchase: stateSlug is NULL, districtSlug is akola
        seedPurchase(null, "akola");

        // Product: Maharashtra / Akola
        Product prod = seedPaidProduct("states/maharashtra/akola/paid/notes.pdf", "maharashtra", "akola");

        // Fail closed: access must be DENIED when purchase state identity is missing
        mockMvc.perform(get("/api/pdf/" + prod.getS3Key()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testMultiplePurchasesScopedAccess() throws Exception {
        // User owns Maharashtra/Akola and Gujarat/Surat
        seedPurchase("maharashtra", "akola");
        seedPurchase("gujarat", "surat");

        // Product A: Maharashtra / Akola -> ALLOWED
        Product prodA = seedPaidProduct("states/maharashtra/akola/paid/notes.pdf", "maharashtra", "akola");
        mockMvc.perform(get("/api/pdf/" + prodA.getS3Key()))
                .andExpect(status().isOk());

        // Product B: Gujarat / Akola -> DENIED (User owns Gujarat/Surat and
        // Maharashtra/Akola, but NOT Gujarat/Akola)
        Product prodB = seedPaidProduct("states/gujarat/akola/paid/notes.pdf", "gujarat", "akola");
        mockMvc.perform(get("/api/pdf/" + prodB.getS3Key()))
                .andExpect(status().isForbidden());
    }
}
