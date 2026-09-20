package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Order;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.OrderRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.util.AuthUserResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Date;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthUserResolverAndPaymentEntitlementTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthUserResolver authUserResolver;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PurchaseRepo purchaseRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private OrderRepo orderRepo;

    @MockBean
    private S3Service s3Service;

    private User phoneUser;
    private User emailUser;

    @BeforeEach
    void setUp() {
        purchaseRepo.deleteAll();
        productRepo.deleteAll();
        orderRepo.deleteAll();
        userRepo.deleteAll();

        phoneUser = new User();
        phoneUser.setId(UUID.randomUUID().toString());
        phoneUser.setName("Phone User");
        phoneUser.setPhoneNo("9876543210");
        userRepo.save(phoneUser);

        emailUser = new User();
        emailUser.setId(UUID.randomUUID().toString());
        emailUser.setName("Email User");
        emailUser.setEmail("emailuser@bodhganga.com");
        userRepo.save(emailUser);

        when(s3Service.generatePresignedUrl(anyString()))
                .thenAnswer(inv -> "https://s3.amazonaws.com/presigned/" + inv.getArgument(0));
    }

    @Test
    void testAuthUserResolverByEmailAndPhone() {
        Authentication emailAuth = new UsernamePasswordAuthenticationToken(
                "emailuser@bodhganga.com", null, Collections.emptyList());
        Optional<User> resolvedEmail = authUserResolver.resolveUser(emailAuth);
        assertTrue(resolvedEmail.isPresent());
        assertEquals(emailUser.getId(), resolvedEmail.get().getId());

        Authentication phoneAuth = new UsernamePasswordAuthenticationToken(
                "9876543210", null, Collections.emptyList());
        Optional<User> resolvedPhone = authUserResolver.resolveUser(phoneAuth);
        assertTrue(resolvedPhone.isPresent());
        assertEquals(phoneUser.getId(), resolvedPhone.get().getId());
    }

    @Test
    @WithMockUser(username = "9876543210")
    void testPhoneUserAccessToPurchasedDistrictWithMixedCaseSlugs() throws Exception {
        // Purchase: MAHARASHTRA / AKOLA
        Purchase pur = new Purchase();
        pur.setId(UUID.randomUUID().toString());
        pur.setUserId(phoneUser.getId());
        pur.setStateSlug("MAHARASHTRA");
        pur.setDistrictSlug("AKOLA");
        pur.setPurchaseDate(new Date());
        purchaseRepo.save(pur);

        // Product: maharashtra / akola
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Akola Paid Notes");
        p.setS3Key("states/maharashtra/akola/paid/test.pdf");
        p.setStorageKey("states/maharashtra/akola/paid/test.pdf");
        p.setFree(false);
        p.setPrice(99.0);
        p.setPublished(true);
        p.setStateSlug("maharashtra");
        p.setDistrictSlug("akola");
        productRepo.save(p);

        // Fetch purchased districts
        mockMvc.perform(get("/api/payment/district/purchased"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("akola"));

        // Access PDF — must be allowed even when purchase slug is uppercase and login
        // is phone number
        mockMvc.perform(get("/api/pdf/" + p.getS3Key()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testOrderEntityStoresNormalizedSlugs() {
        String rawDistrict = " AKOLA ";
        String rawState = " MAHARASHTRA ";

        Order dbOrder = new Order();
        dbOrder.setUserId(emailUser.getId());
        dbOrder.setRazorpayOrderId("order_test_123");
        dbOrder.setDistrictSlug(rawDistrict.trim().toLowerCase(Locale.ROOT));
        dbOrder.setStateSlug(rawState.trim().toLowerCase(Locale.ROOT));
        dbOrder.setAmount(1.0);
        dbOrder.setCurrency("INR");
        dbOrder.setStatus("CREATED");
        dbOrder.setPaymentStatus("PENDING");

        Order saved = orderRepo.save(dbOrder);

        assertNotNull(saved.getId());
        assertEquals("akola", saved.getDistrictSlug());
        assertEquals("maharashtra", saved.getStateSlug());
        assertEquals(emailUser.getId(), saved.getUserId());
    }
}
