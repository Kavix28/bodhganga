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

import static org.mockito.ArgumentMatchers.*;
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
        when(s3Service.generatePresignedGetUrl(anyString()))
                .thenAnswer(inv -> "https://s3.amazonaws.com/presigned/" + inv.getArgument(0));
        when(s3Service.generatePresignedGetUrl(anyString(), anyInt()))
                .thenAnswer(inv -> "https://s3.amazonaws.com/presigned/" + inv.getArgument(0));
        when(s3Service.getObjectKey(anyString()))
                .thenCallRealMethod();
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

    private Product seedFreeProduct(String key, String stateSlug, String districtSlug) {
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Free Notes " + districtSlug);
        p.setS3Key(key);
        p.setStorageKey(key);
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        p.setStateSlug(stateSlug);
        p.setDistrictSlug(districtSlug);
        return productRepo.save(p);
    }

    @Test
    void testGuestCanAccessFreeResource() throws Exception {
        Product freeProd = seedFreeProduct("states/maharashtra/akola/free/history.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/" + freeProd.getS3Key()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testAuthenticatedUserCanAccessFreeResource() throws Exception {
        Product freeProd = seedFreeProduct("states/maharashtra/akola/free/history.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/" + freeProd.getS3Key()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testGuestDeniedAccessToPaidResource() throws Exception {
        Product paidProd = seedPaidProduct("states/maharashtra/akola/paid/guide.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/" + paidProd.getS3Key()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Authentication required."));
    }

    @Test
    void testGuestPurchasedDistrictsReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/payment/district/purchased"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testAuthenticatedPurchasedDistrictsPreservesBehavior() throws Exception {
        seedPurchase("maharashtra", "akola");

        mockMvc.perform(get("/api/payment/district/purchased"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("akola"));
    }

    @Test
    void testGuestDeniedAccessToAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL, authorities = "ROLE_USER")
    void testNormalUserDeniedAccessToAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminAllowedAccessToAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // CANONICAL RESOURCE ENDPOINT (/api/pdf/resource) TESTS
    // =========================================================================

    @Test
    void testCanonicalEndpointFreePdfSimpleFilename() throws Exception {
        Product p = seedFreeProduct("simple.pdf", "general", "general");
        mockMvc.perform(get("/api/pdf/resource").param("key", "simple.pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointFreePdfNestedS3Key() throws Exception {
        Product p = seedFreeProduct("haryana/kurukshetra/free/history.pdf", "haryana", "kurukshetra");
        mockMvc.perform(get("/api/pdf/resource").param("key", "haryana/kurukshetra/free/history.pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointFilenameWithSpaces() throws Exception {
        String key = "haryana/kurukshetra/free/Kurukshetra Infographic Hindi.png";
        Product p = seedFreeProduct(key, "haryana", "kurukshetra");
        mockMvc.perform(get("/api/pdf/resource").param("key", key))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointFilenameWithUnicodeHindi() throws Exception {
        String key = "haryana/kurukshetra/free/कुरुक्षेत्र_इतिहास_हिंदी.pdf";
        Product p = seedFreeProduct(key, "haryana", "kurukshetra");
        mockMvc.perform(get("/api/pdf/resource").param("key", key))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointFilenameWithParentheses() throws Exception {
        String key = "haryana/kurukshetra/free/Kurukshetra_Notes_(Final_Version).pdf";
        Product p = seedFreeProduct(key, "haryana", "kurukshetra");
        mockMvc.perform(get("/api/pdf/resource").param("key", key))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointLookupById() throws Exception {
        String hexId = "6aa123f5edc2296bdf3a25b6";
        Product p = new Product();
        p.setId(hexId);
        p.setTitle("Hex ID Product");
        p.setS3Key("haryana/kurukshetra/free/sample.pdf");
        p.setStorageKey("haryana/kurukshetra/free/sample.pdf");
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", hexId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testCanonicalEndpointPaidPdfWithValidEntitlement() throws Exception {
        seedPurchase("maharashtra", "akola");
        Product prod = seedPaidProduct("states/maharashtra/akola/paid/guide.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/resource").param("key", prod.getS3Key()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testCanonicalEndpointPaidPdfWithoutAuthentication() throws Exception {
        Product prod = seedPaidProduct("states/maharashtra/akola/paid/guide.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/resource").param("key", prod.getS3Key()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testCanonicalEndpointPaidPdfWithoutEntitlement() throws Exception {
        Product prod = seedPaidProduct("states/maharashtra/akola/paid/guide.pdf", "maharashtra", "akola");

        mockMvc.perform(get("/api/pdf/resource").param("key", prod.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointNonexistentResourceGuestDenied() throws Exception {
        mockMvc.perform(get("/api/pdf/resource").param("key", "private/vault/secret.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointArchivedResourceForbidden() throws Exception {
        Product p = seedFreeProduct("states/maharashtra/akola/free/archived.pdf", "maharashtra", "akola");
        p.setArchived(true);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("key", p.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Material is archived."));
    }

    @Test
    void testCanonicalEndpointDeletedResourceNotFound() throws Exception {
        Product p = seedFreeProduct("states/maharashtra/akola/free/deleted.pdf", "maharashtra", "akola");
        p.setIsDeleted(true);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("key", p.getS3Key()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Material has been removed."));
    }

    @Test
    void testCanonicalEndpointUnpublishedResourceForbidden() throws Exception {
        Product p = seedFreeProduct("states/maharashtra/akola/free/draft.pdf", "maharashtra", "akola");
        p.setPublished(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("key", p.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Material is not published."));
    }

    @Test
    void testCanonicalEndpointMissingKeyAndIdBadRequest() throws Exception {
        mockMvc.perform(get("/api/pdf/resource"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Resource key or id is required."));
    }

    @Test
    void testCanonicalEndpointPathTraversalBlocked() throws Exception {
        mockMvc.perform(get("/api/pdf/resource").param("key", "../../etc/passwd"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid resource path."));
    }

    @Test
    void testCanonicalEndpointKeyWithPlusSignPreserved() throws Exception {
        // Legitimate S3 key containing '+' must NOT be double-decoded into space ' '
        String key = "states/haryana/kurukshetra/free/math+science.pdf";
        mockMvc.perform(get("/api/pdf/resource").param("key", key))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("math+science.pdf")));
    }

    @Test
    void testCanonicalEndpointEncodedTraversalAttemptBlocked() throws Exception {
        // Direct encoded traversal (%2e%2e is ..) must be rejected with 400 Bad Request
        mockMvc.perform(get("/api/pdf/resource").param("key", "%2e%2e/etc/passwd"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid resource path."));

        mockMvc.perform(get("/api/pdf/resource").param("key", "states/%2e%2e/secret.pdf"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointDoubleEncodedTraversalAttemptBlocked() throws Exception {
        // Double-encoded traversal (%252e%252e) must be rejected with 400 Bad Request
        mockMvc.perform(get("/api/pdf/resource").param("key", "%252e%252e/etc/passwd"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid resource path."));

        mockMvc.perform(get("/api/pdf/resource").param("key", "states/%252e%252e/secret.pdf"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // CONTRADICTORY METADATA COMBINATION TESTS (FAIL-CLOSED)
    // =========================================================================

    @Test
    void testContradictoryMetadataPricePositiveOverridesIsFreeTrueDenied() throws Exception {
        // isFree is true, BUT price is 99.0 -> Must FAIL CLOSED (401 for guest)
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Contradictory Product 1");
        p.setS3Key("states/maharashtra/akola/free/sample.pdf");
        p.setStorageKey("states/maharashtra/akola/free/sample.pdf");
        p.setFree(true);
        p.setPrice(99.0);
        p.setStateSlug("maharashtra");
        p.setDistrictSlug("akola");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataPaidKeyOverridesIsFreeTrueDenied() throws Exception {
        // isFree is true, price is 0.0, BUT storage key has /paid/ -> Must FAIL CLOSED
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Contradictory Product 2");
        p.setS3Key("states/maharashtra/akola/paid/exam_blueprint.pdf");
        p.setStorageKey("states/maharashtra/akola/paid/exam_blueprint.pdf");
        p.setFree(true);
        p.setPrice(0.0);
        p.setStateSlug("maharashtra");
        p.setDistrictSlug("akola");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataPaidCategoryOverridesIsFreeTrueDenied() throws Exception {
        // isFree is true, price is 0.0, BUT category is "paid resources" -> Must FAIL CLOSED
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Contradictory Product 3");
        p.setS3Key("states/maharashtra/akola/notes.pdf");
        p.setStorageKey("states/maharashtra/akola/notes.pdf");
        p.setFree(true);
        p.setPrice(0.0);
        p.setCategory("paid resources");
        p.setCategorySlug("paid");
        p.setStateSlug("maharashtra");
        p.setDistrictSlug("akola");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataDistrictGeneralWithPositivePriceDenied() throws Exception {
        // districtSlug is "general", BUT price is 99.0 -> Must FAIL CLOSED
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("General Slug with Price");
        p.setS3Key("nagaland/general/guide.pdf");
        p.setStorageKey("nagaland/general/guide.pdf");
        p.setFree(false);
        p.setPrice(99.0);
        p.setStateSlug("nagaland");
        p.setDistrictSlug("general");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataStateScopeWithNonCanonicalCategoryDenied() throws Exception {
        // resourceScope is "STATE", districtSlug is "general", price is 0.0, BUT category is not a canonical state category
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Non-Canonical State Material");
        p.setS3Key("nagaland/secret_exam/notes.pdf");
        p.setStorageKey("nagaland/secret_exam/notes.pdf");
        p.setFree(false);
        p.setPrice(0.0);
        p.setStateSlug("nagaland");
        p.setDistrictSlug("general");
        p.setResourceScope(Product.SCOPE_STATE);
        p.setCategory("Secret Exam Series");
        p.setCategorySlug("secret-exam-series");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataCategoryFreeWithPositivePriceDenied() throws Exception {
        // category is "free", BUT price is 149.0 -> Must FAIL CLOSED
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Category Free But Paid Price");
        p.setS3Key("states/haryana/kurukshetra/notes.pdf");
        p.setStorageKey("states/haryana/kurukshetra/notes.pdf");
        p.setFree(false);
        p.setPrice(149.0);
        p.setStateSlug("haryana");
        p.setDistrictSlug("kurukshetra");
        p.setCategory("free");
        p.setCategorySlug("free");
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testContradictoryMetadataDistrictResourceWithStateScopeConflictDenied() throws Exception {
        // Product has actual district "dimapur", but claims resourceScope = "STATE" -> Contradictory scope, fail closed
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Conflicting District and State Scope");
        p.setS3Key("nagaland/dimapur/notes.pdf");
        p.setStorageKey("nagaland/dimapur/notes.pdf");
        p.setFree(false);
        p.setPrice(0.0);
        p.setStateSlug("nagaland");
        p.setDistrictSlug("dimapur");
        p.setResourceScope(Product.SCOPE_STATE);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // AUTHORITATIVE PUBLIC RESOURCE TESTS
    // =========================================================================

    @Test
    void testAuthoritativeStateResourceHistoryAllowed() throws Exception {
        // Valid canonical state educational material: Nagaland History
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Battle of Kohima (1944)");
        p.setS3Key("nagaland/history/Battle_of_Kohima.pdf");
        p.setStorageKey("nagaland/history/Battle_of_Kohima.pdf");
        p.setStateSlug("nagaland");
        p.setDistrictSlug("general");
        p.setResourceScope(Product.SCOPE_STATE);
        p.setContentArea("STATE_CONTENT");
        p.setCategory(Product.CATEGORY_HISTORY);
        p.setCategorySlug(Product.SLUG_HISTORY);
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testAuthoritativeDistrictFreeResourceAllowed() throws Exception {
        // Valid district free resource: Dimapur free sample notes
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Dimapur Free Sample Notes");
        p.setS3Key("states/nagaland/dimapur/free/sample_notes.pdf");
        p.setStorageKey("states/nagaland/dimapur/free/sample_notes.pdf");
        p.setStateSlug("nagaland");
        p.setDistrictSlug("dimapur");
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        mockMvc.perform(get("/api/pdf/resource").param("id", p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    // =========================================================================
    // STRICT SEGMENT-AWARE STORAGE LAYOUT & SECURITY TESTS
    // =========================================================================

    @Test
    void testCanonicalEndpointUncataloguedPaidKeyDeniedForGuest() throws Exception {
        // Any uncataloged key containing a "paid" segment MUST be denied
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/maharashtra/akola/paid/secret_notes.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testCanonicalEndpointUncataloguedPaidKeyDeniedForAuthenticatedUser() throws Exception {
        // Authenticated user without catalog entry must fail closed (403)
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/maharashtra/akola/paid/secret_notes.pdf"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointUncataloguedSampleKeyDenied() throws Exception {
        // Filenames or paths containing "sample" cannot bypass authorization
        mockMvc.perform(get("/api/pdf/resource").param("key", "private/notes/Sample_Paid_Doc.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointUncataloguedUnrelatedFreeSubstringDenied() throws Exception {
        // Broad substring "/free/" in non-approved layout cannot bypass authorization
        mockMvc.perform(get("/api/pdf/resource").param("key", "unrelated/free-for-all/paid_document.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointUncataloguedArbitraryStatesKeyDenied() throws Exception {
        // Arbitrary keys under states/ that do not match an approved public layout MUST fail closed
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/secret_folder/confidential.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testCanonicalEndpointMismatchedIdAndKeyRejected() throws Exception {
        // Legitimate free product ID
        String hexId = "6aa123f5edc2296bdf3a25b7";
        Product p = new Product();
        p.setId(hexId);
        p.setTitle("Free Public Material");
        p.setS3Key("states/haryana/kurukshetra/free/genuine.pdf");
        p.setStorageKey("states/haryana/kurukshetra/free/genuine.pdf");
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        // Attacker attempts parameter mismatch: valid free id with an attacker-chosen paid S3 key
        mockMvc.perform(get("/api/pdf/resource")
                .param("id", hexId)
                .param("key", "states/haryana/kurukshetra/paid/premium_exam.pdf"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Resource identifier does not match the requested storage key."));
    }

    @Test
    void testCanonicalEndpointInvalidIdWithValidKeyRejected() throws Exception {
        // Valid cataloged free product exists
        String validId = "6aa123f5edc2296bdf3a25b8";
        String validKey = "states/haryana/kurukshetra/free/valid_doc.pdf";
        Product p = new Product();
        p.setId(validId);
        p.setTitle("Valid Document");
        p.setS3Key(validKey);
        p.setStorageKey(validKey);
        p.setFree(true);
        p.setPrice(0.0);
        p.setPublished(true);
        p.setArchived(false);
        productRepo.save(p);

        // Caller pairs valid key with an invalid/mismatched ID -> must be rejected
        mockMvc.perform(get("/api/pdf/resource")
                .param("id", "000000000000000000000000")
                .param("key", validKey))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Resource identifier does not match the requested storage key."));
    }

    @Test
    void testCanonicalEndpointIdBelongingToOneDistrictAndKeyBelongingToAnotherRejected() throws Exception {
        // District A Product (Kurukshetra)
        String idA = "6aa123f5edc2296bdf3a25c1";
        String keyA = "states/haryana/kurukshetra/free/kurukshetra_doc.pdf";
        Product pA = new Product();
        pA.setId(idA);
        pA.setTitle("Kurukshetra Doc");
        pA.setS3Key(keyA);
        pA.setStorageKey(keyA);
        pA.setFree(true);
        pA.setPrice(0.0);
        pA.setPublished(true);
        pA.setArchived(false);
        productRepo.save(pA);

        // District B Product (Dimapur)
        String idB = "6aa123f5edc2296bdf3a25c2";
        String keyB = "states/nagaland/dimapur/free/dimapur_doc.pdf";
        Product pB = new Product();
        pB.setId(idB);
        pB.setTitle("Dimapur Doc");
        pB.setS3Key(keyB);
        pB.setStorageKey(keyB);
        pB.setFree(true);
        pB.setPrice(0.0);
        pB.setPublished(true);
        pB.setArchived(false);
        productRepo.save(pB);

        // Caller pairs ID of District A with Key of District B -> must be rejected
        mockMvc.perform(get("/api/pdf/resource")
                .param("id", idA)
                .param("key", keyB))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Resource identifier does not match the requested storage key."));
    }

    @Test
    void testCanonicalEndpointNonexistentIdAloneReturnsNotFound() throws Exception {
        // Request with non-existent ID and no key must return 404
        mockMvc.perform(get("/api/pdf/resource")
                .param("id", "000000000000000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = TEST_USER_EMAIL)
    void testCanonicalEndpointPaidCannotBeOpenedByAnotherUsersPurchase() throws Exception {
        // User owns Akola district purchase
        seedPurchase("maharashtra", "akola");

        // Product belongs to Pune district
        Product puneProduct = seedPaidProduct("states/maharashtra/pune/paid/guide.pdf", "maharashtra", "pune");

        mockMvc.perform(get("/api/pdf/resource").param("key", puneProduct.getS3Key()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testApprovedPublicStorageLayoutCanonicalFreeDistrictAllowed() throws Exception {
        // Layout 2: states/{stateSlug}/{districtSlug}/free/{filename} (5 segments)
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/haryana/kurukshetra/free/infographic.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testApprovedPublicStorageLayoutAdminStateGeneralFreeAllowed() throws Exception {
        // Layout 2: states/{stateSlug}/general/free/{filename} (5 segments, admin state-level free upload)
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/nagaland/general/free/overview.pdf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testApprovedPublicStorageLayoutLegacyFreeDistrictAllowed() throws Exception {
        // Layout 3: {stateSlug}/{districtSlug}/free/{filename} (4 segments)
        mockMvc.perform(get("/api/pdf/resource").param("key", "haryana/kurukshetra/free/infographic.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testRemovedSpeculativeLayoutFailsClosed() throws Exception {
        // Old speculative Layout 4 (states/{stateSlug}/general/{categorySlug}/{filename}) was removed.
        // Uncataloged keys in this format must FAIL CLOSED (401 for guest).
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/nagaland/general/history/battle_of_kohima.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testApprovedPublicStorageLayoutStateImageAllowed() throws Exception {
        // Layout 1: states/{stateSlug}/{imageFilename} (3 segments, valid image extension)
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/haryana/Haryana-cover.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void testApprovedPublicStorageLayoutStateImageNonImageDenied() throws Exception {
        // 3 segments under states/ but NOT an image extension (e.g. .pdf) -> rejected
        mockMvc.perform(get("/api/pdf/resource").param("key", "states/haryana/confidential.pdf"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
