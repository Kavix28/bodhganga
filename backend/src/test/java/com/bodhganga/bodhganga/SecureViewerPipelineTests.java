package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.util.JwtUtil;
import com.bodhganga.bodhganga.services.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecureViewerPipelineTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private PurchaseRepo purchaseRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private S3Service s3Service;

    private String validToken;
    private User testUser;

    @BeforeEach
    void setUp() {
        purchaseRepo.deleteAll();
        productRepo.deleteAll();
        userRepo.deleteAll();

        testUser = User.builder()
                .name("Test Student")
                .email("student@bodhganga.in")
                .phoneNo("9876543210")
                .hashedPassword("hashedpass")
                .role("USER")
                .isActive(true)
                .isVerified(true)
                .build();
        testUser = userRepo.save(testUser);

        validToken = jwtUtil.generateToken(testUser.getEmail(), testUser.getId(), testUser.getRole());
    }

    @Test
    @DisplayName("1. Free PDF - Authenticated user gets presigned URL successfully")
    void testFreePdf_SuccessPresignedUrl() throws Exception {
        Product freeProd = new Product();
        freeProd.setTitle("Free Haryana History Notes");
        freeProd.setType("PDF");
        freeProd.setFree(true);
        freeProd.setPrice(0.0);
        freeProd.setStorageKey("haryana/free_history.pdf");
        freeProd.setPublished(true);
        productRepo.save(freeProd);

        Mockito.when(s3Service.doesObjectExist("haryana/free_history.pdf")).thenReturn(true);
        Mockito.when(s3Service.generatePresignedUrl("haryana/free_history.pdf"))
                .thenReturn("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/haryana/free_history.pdf?X-Amz-Signature=test1234");

        mockMvc.perform(get("/api/pdf/haryana/free_history.pdf")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists())
                .andExpect(jsonPath("$.url").value("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/haryana/free_history.pdf?X-Amz-Signature=test1234"));
    }

    @Test
    @DisplayName("2. Paid PDF - User without purchase receives 403 Access Denied")
    void testPaidPdf_UserNotPurchased_Forbidden() throws Exception {
        Product paidProd = new Product();
        paidProd.setTitle("Premium Bihar GK Guide");
        paidProd.setType("PDF");
        paidProd.setFree(false);
        paidProd.setPrice(199.0);
        paidProd.setStorageKey("bihar/paid_gk.pdf");
        paidProd.setPublished(true);
        productRepo.save(paidProd);

        mockMvc.perform(get("/api/pdf/bihar/paid_gk.pdf")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You do not own this document. Please claim or purchase it."));
    }

    @Test
    @DisplayName("3. Paid PDF - User with purchase receives presigned URL")
    void testPaidPdf_UserPurchased_Success() throws Exception {
        Product paidProd = new Product();
        paidProd.setTitle("Premium Bihar GK Guide");
        paidProd.setType("PDF");
        paidProd.setFree(false);
        paidProd.setPrice(199.0);
        paidProd.setStorageKey("bihar/paid_gk.pdf");
        paidProd.setPublished(true);
        paidProd = productRepo.save(paidProd);

        Purchase purchase = new Purchase();
        purchase.setUserId(testUser.getId());
        purchase.setProductId(paidProd.getId());
        purchase.setAmountPaid(199.0);
        purchase.setPurchaseDate(new Date());
        purchaseRepo.save(purchase);

        Mockito.when(s3Service.doesObjectExist("bihar/paid_gk.pdf")).thenReturn(true);
        Mockito.when(s3Service.generatePresignedUrl("bihar/paid_gk.pdf"))
                .thenReturn("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/bihar/paid_gk.pdf?X-Amz-Signature=purchased123");

        mockMvc.perform(get("/api/pdf/bihar/paid_gk.pdf")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/bihar/paid_gk.pdf?X-Amz-Signature=purchased123"));
    }

    @Test
    @DisplayName("4. Missing S3 Object - Returns 404 with Missing S3 object message")
    void testMissingS3Object_NotFound() throws Exception {
        Product freeProd = new Product();
        freeProd.setTitle("Missing File Product");
        freeProd.setType("PDF");
        freeProd.setFree(true);
        freeProd.setStorageKey("nonexistent/missing.pdf");
        freeProd.setPublished(true);
        productRepo.save(freeProd);

        Mockito.when(s3Service.doesObjectExist("nonexistent/missing.pdf")).thenReturn(false);

        mockMvc.perform(get("/api/pdf/nonexistent/missing.pdf")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Missing S3 object: The requested document file is not available in storage."));
    }

    @Test
    @DisplayName("5. Invalid Storage Key - Key not in DB catalog returns 403 Document not found")
    void testInvalidStorageKey_NotFound() throws Exception {
        mockMvc.perform(get("/api/pdf/unknown/random-invalid-key.pdf")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Document not found in catalog or unauthorized."));
    }

    @Test
    @DisplayName("6. Guest User Free PDF - Returns 200 OK and presigned URL without JWT")
    void testGuestUserFreePdf_Success() throws Exception {
        Product freeProd = new Product();
        freeProd.setTitle("Free Punjab History Notes");
        freeProd.setType("PDF");
        freeProd.setFree(true);
        freeProd.setPrice(0.0);
        freeProd.setStorageKey("punjab/free_history.pdf");
        freeProd.setPublished(true);
        productRepo.save(freeProd);

        Mockito.when(s3Service.doesObjectExist("punjab/free_history.pdf")).thenReturn(true);
        Mockito.when(s3Service.generatePresignedUrl("punjab/free_history.pdf"))
                .thenReturn("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/punjab/free_history.pdf?X-Amz-Signature=guest1234");

        mockMvc.perform(get("/api/pdf/punjab/free_history.pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://s3.eu-north-1.amazonaws.com/bodhganga-pdf-storage-prod/punjab/free_history.pdf?X-Amz-Signature=guest1234"));
    }

    @Test
    @DisplayName("7. Guest User Paid PDF - Returns 401 Unauthorized without JWT")
    void testGuestUserPaidPdf_Unauthorized() throws Exception {
        Product paidProd = new Product();
        paidProd.setTitle("Premium Punjab Notes");
        paidProd.setType("PDF");
        paidProd.setFree(false);
        paidProd.setPrice(299.0);
        paidProd.setStorageKey("punjab/paid_notes.pdf");
        paidProd.setPublished(true);
        productRepo.save(paidProd);

        mockMvc.perform(get("/api/pdf/punjab/paid_notes.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Authentication required to access paid document."));
    }

    @Test
    @DisplayName("8. Guest User Purchased Districts - Returns 403 Forbidden from Spring Security")
    void testGuestUserPurchasedDistricts_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/payment/district/purchased"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Authenticated User Purchased Districts - Resolves email/phone and returns 200 OK with unlocked district list")
    void testAuthenticatedUserPurchasedDistricts_Success() throws Exception {
        Purchase purchase = new Purchase();
        purchase.setUserId(testUser.getId());
        purchase.setDistrictSlug("kurukshetra");
        purchase.setAmountPaid(299.0);
        purchase.setPurchaseDate(new Date());
        purchaseRepo.save(purchase);

        mockMvc.perform(get("/api/payment/district/purchased")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("kurukshetra"));
    }
}
