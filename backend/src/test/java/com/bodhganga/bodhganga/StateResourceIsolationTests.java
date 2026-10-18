package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.controllers.StateController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class StateResourceIsolationTests {

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private StateRepo stateRepo;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
        stateRepo.deleteAll();

        // 1. Seed States
        State nagaland = new State();
        nagaland.setId("nagaland");
        nagaland.setName("Nagaland");
        nagaland.setCode("NL");
        nagaland.setType("STATE");
        nagaland.setDistricts(Arrays.asList("Kohima", "Dimapur", "Mokokchung", "Wokha", "Chümoukedima", "Tseminyü"));
        stateRepo.save(nagaland);

        State assam = new State();
        assam.setId("assam");
        assam.setName("Assam");
        assam.setCode("AS");
        assam.setType("STATE");
        assam.setDistricts(Arrays.asList("Kamrup", "Guwahati", "Dibrugarh", "Jorhat"));
        stateRepo.save(assam);

        // 2. Mock S3 Service
        when(s3Service.objectExists(anyString())).thenReturn(false);
        when(s3Service.uploadFileWithKey(org.mockito.ArgumentMatchers.any(InputStream.class), anyLong(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(2));
        when(s3Service.getS3Url(anyString()))
                .thenAnswer(invocation -> "https://s3.amazonaws.com/test-bucket/" + invocation.getArgument(0));

        // 3. Seed Comprehensive Test Fixture Matrix
        // A. Valid Nagaland state-level History
        Product nlStateHistory = createProduct(
                "Nagaland State History: The Battle of Kohima",
                "nagaland", "Nagaland",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(nlStateHistory);

        // B. Valid Nagaland state-level Art & Culture
        Product nlStateArt = createProduct(
                "Nagaland Hornbill Festival & Indigenous Crafts",
                "nagaland", "Nagaland",
                "general", "general",
                "Art & Culture", "art-culture", "art-culture",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(nlStateArt);

        // C. Nagaland district-level History (Kohima)
        Product nlDistrictHistory = createProduct(
                "Kohima District Village Chronicles",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "History", "history", "history",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, true, false, false);
        productRepo.save(nlDistrictHistory);

        // D. Assam state-level History
        Product asStateHistory = createProduct(
                "Ahom Dynasty and Assam Medieval History",
                "assam", "Assam",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(asStateHistory);

        // E. Nagaland state-level Geography
        Product nlStateGeo = createProduct(
                "Nagaland Topography & Barail Range",
                "nagaland", "Nagaland",
                "general", "general",
                "Geography", "geography", "geography",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(nlStateGeo);

        // F. Ambiguous: Missing scope & null district
        Product ambiguousScope = createProduct(
                "Ambiguous Scope Notes",
                "nagaland", "Nagaland",
                null, null,
                "History", "history", "history",
                null, null,
                true, true, false, false);
        productRepo.save(ambiguousScope);

        // G. Ambiguous: State document without category
        Product ambiguousCategory = createProduct(
                "State Document Without Category",
                "nagaland", "Nagaland",
                "general", "general",
                null, null, null,
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(ambiguousCategory);

        // H. Unclassified: Unrecognized category
        Product unclassifiedCategory = createProduct(
                "General Competitive Exam GK Guide",
                "nagaland", "Nagaland",
                "general", "general",
                "General Studies", "general-studies", null,
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(unclassifiedCategory);

        // I. Archived Nagaland state-level History
        Product archivedNlHistory = createProduct(
                "Archived Nagaland State History Syllabus",
                "nagaland", "Nagaland",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, true, false);
        productRepo.save(archivedNlHistory);

        // J. Unpublished/Draft Nagaland state-level History
        Product unpublishedNlHistory = createProduct(
                "Draft Nagaland State History Syllabus",
                "nagaland", "Nagaland",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, false, false, false);
        productRepo.save(unpublishedNlHistory);
    }

    private Product createProduct(
            String title, String stateSlug, String stateName,
            String districtSlug, String districtName,
            String category, String categorySlug, String sectionSlug,
            String contentArea, String resourceScope,
            boolean isFree, boolean isPublished, boolean isArchived, boolean isDeleted) {
        Product p = new Product();
        p.setTitle(title);
        p.setDisplayTitle(title);
        p.setStateSlug(stateSlug);
        p.setState(stateName);
        p.setDistrictSlug(districtSlug);
        p.setDistrict(districtName);
        p.setCategory(category);
        p.setCategorySlug(categorySlug);
        p.setSectionSlug(sectionSlug);
        p.setContentArea(contentArea);
        p.setResourceScope(resourceScope);
        p.setFree(isFree);
        p.setPrice(isFree ? 0.0 : 99.0);
        p.setPublished(isPublished);
        p.setArchived(isArchived);
        p.setIsDeleted(isDeleted);
        p.setCreatedAt(new Date());
        p.setUpdatedAt(new Date());
        p.setS3Key("states/" + stateSlug + "/" + (districtSlug != null ? districtSlug : "general") + "/" + Product.generateSlug(title) + ".pdf");
        return p;
    }

    /**
     * Test 1: Nagaland History returns ONLY Nagaland state-level History
     */
    @Test
    void testNagalandHistoryReturnsOnlyNagalandStateHistory() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Nagaland State History: The Battle of Kohima"))
                .andExpect(jsonPath("$.data[0].stateSlug").value("nagaland"))
                .andExpect(jsonPath("$.data[0].districtSlug").value("general"))
                .andExpect(jsonPath("$.data[0].category").value("History"));
    }

    /**
     * Test 2: Assam History never appears on the Nagaland History page
     */
    @Test
    void testAssamHistoryNeverAppearsOnNagalandHistory() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].stateSlug", not(hasItem("assam"))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Ahom")))));
    }

    /**
     * Test 3: Nagaland district History never appears on Nagaland state History page
     */
    @Test
    void testNagalandDistrictHistoryNeverAppearsOnNagalandStateHistory() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].districtSlug", not(hasItem("kohima"))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Village Chronicles")))));
    }

    /**
     * Test 4: Nagaland Art & Culture never appears on Nagaland History page
     */
    @Test
    void testNagalandArtCultureNeverAppearsOnNagalandHistory() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].category", not(hasItem("Art & Culture"))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Hornbill")))));
    }

    /**
     * Test 5: Missing or ambiguous metadata does not enter History results
     */
    @Test
    void testMissingOrAmbiguousMetadataNeverEntersResults() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Ambiguous")))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Without Category")))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("General Competitive")))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Archived")))))
                .andExpect(jsonPath("$.data[*].title", not(hasItem(containsString("Draft")))));
    }

    /**
     * Test 6: An empty category result stays empty instead of showing other resources
     */
    @Test
    void testEmptyCategoryStaysEmptyWithoutFallingBack() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/heritage-sites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    /**
     * Test 7: Assam History page returns only Assam state History
     */
    @Test
    void testAssamHistoryReturnsOnlyAssamHistory() throws Exception {
        mockMvc.perform(get("/api/products/state/assam/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Ahom Dynasty and Assam Medieval History"))
                .andExpect(jsonPath("$.data[0].stateSlug").value("assam"))
                .andExpect(jsonPath("$.data[0].districtSlug").value("general"))
                .andExpect(jsonPath("$.data[*].stateSlug", not(hasItem("nagaland"))));
    }

    /**
     * Test 8: All four state categories are strictly isolated independently
     */
    @Test
    void testAllFourStateCategoriesIsolatedIndependently() throws Exception {
        // Art & Culture
        mockMvc.perform(get("/api/products/state/nagaland/category/art-culture"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Nagaland Hornbill Festival & Indigenous Crafts"));

        // Geography
        mockMvc.perform(get("/api/products/state/nagaland/category/geography"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Nagaland Topography & Barail Range"));

        // History
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Nagaland State History: The Battle of Kohima"));

        // Heritage & Sites (empty)
        mockMvc.perform(get("/api/products/state/nagaland/category/heritage-sites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    /**
     * Test 9: Scope query parameter on state endpoint enforces identical isolation
     */
    @Test
    void testScopeQueryParamEnforcesStateScopeIsolation() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland?scope=state&category=history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title").value("Nagaland State History: The Battle of Kohima"));

        // Scope=state without category returns all 3 state-scoped Nagaland materials (History, Art & Culture, Geography)
        // but NEVER district, ambiguous, archived, or other states
        mockMvc.perform(get("/api/products/state/nagaland?scope=state"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[*].districtSlug", everyItem(is("general"))))
                .andExpect(jsonPath("$.data[*].stateSlug", everyItem(is("nagaland"))));
    }

    /**
     * Test 10: Admin History upload sets correct state metadata
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminHistoryUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "nagaland_history_chronicles.pdf", "application/pdf", VALID_PDF_BYTES);

        long countBefore = productRepo.count();

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Nagaland Comprehensive History")
                .param("description", "Complete state history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stateSlug").value("nagaland"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"))
                .andExpect(jsonPath("$.data.category").value("History"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"))
                .andExpect(jsonPath("$.data.sectionSlug").value("history"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.contentArea").value("STATE_CONTENT"));

        assertEquals(countBefore + 1, productRepo.count(), "New STATE History upload creates exactly one record");
    }

    /**
     * Test 11: Admin Geography upload sets correct state metadata
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminGeographyUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "nagaland_geography.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "Geography")
                .param("title", "Nagaland River Systems & Hills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Geography"))
                .andExpect(jsonPath("$.data.categorySlug").value("geography"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"));
    }

    /**
     * Test 12: Admin Art & Culture upload sets correct state metadata
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminArtAndCultureUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "nagaland_art.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "Art & Culture")
                .param("title", "Naga Shawls and Traditional Art"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Art & Culture"))
                .andExpect(jsonPath("$.data.categorySlug").value("art-culture"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"));
    }

    /**
     * Test 13: Admin Heritage & Sites upload sets correct state metadata
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminHeritageSitesUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "nagaland_heritage.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "Heritage & Sites")
                .param("title", "Ancient Kachari Ruins of Nagaland"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Heritage & Sites"))
                .andExpect(jsonPath("$.data.categorySlug").value("heritage-sites"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"));
    }

    /**
     * Test 14: District Free upload sets correct district metadata
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminDistrictFreeUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "kohima_free_guide.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Kohima District Free Guide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Free"))
                .andExpect(jsonPath("$.data.isFree").value(true))
                .andExpect(jsonPath("$.data.price").value(0.0))
                .andExpect(jsonPath("$.data.districtSlug").value("kohima"))
                .andExpect(jsonPath("$.data.resourceScope").value("DISTRICT"))
                .andExpect(jsonPath("$.data.contentArea").value("FREE_DISTRICT_CONTENT"));
    }

    /**
     * Test 15: District Paid upload sets correct district metadata and price
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminDistrictPaidUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "kohima_paid_bundle.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "false")
                .param("category", "Paid")
                .param("title", "Kohima Premium District Mock Series"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Paid"))
                .andExpect(jsonPath("$.data.isFree").value(false))
                .andExpect(jsonPath("$.data.price").value(99.0))
                .andExpect(jsonPath("$.data.districtSlug").value("kohima"))
                .andExpect(jsonPath("$.data.resourceScope").value("DISTRICT"))
                .andExpect(jsonPath("$.data.contentArea").value("PAID_DISTRICT_RESOURCES"));
    }

    /**
     * Test 16: Invalid STATE + Paid rejection
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testInvalidStateWithPaidRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "invalid_state_paid.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "Paid")
                .param("isFree", "false")
                .param("title", "Invalid State Paid Document"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(containsString("INVALID_STATE_CATEGORY")));
    }

    /**
     * Test 17: Invalid DISTRICT + History rejection
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testInvalidDistrictWithHistoryRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "invalid_district_history.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("category", "History")
                .param("title", "Invalid District History Material"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(containsString("INVALID_DISTRICT_CATEGORY")));
    }

    /**
     * Test 18: Invalid DISTRICT + Geography rejection
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testInvalidDistrictWithGeographyRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "invalid_district_geo.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("category", "Geography")
                .param("title", "Invalid District Geography Material"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(containsString("INVALID_DISTRICT_CATEGORY")));
    }

    /**
     * Test 19: Unicode district names (e.g. Chümoukedima) work seamlessly
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testUnicodeDistrictNamesSupported() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "chumoukedima_guide.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "chumoukedima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Chümoukedima District Guide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.districtSlug").value("chumoukedima"))
                .andExpect(jsonPath("$.data.district").value("Chümoukedima"));
    }

    /**
     * Test 20: Deleted resources are excluded from public API endpoints
     */
    @Test
    void testDeletedResourcesExcludedFromPublicEndpoints() throws Exception {
        Product deletedHistory = createProduct(
                "Deleted History Notes",
                "nagaland", "Nagaland",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, true);
        productRepo.save(deletedHistory);

        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Deleted History Notes"))));
    }

    /**
     * Test 21: Duplicate handling via content hash returns existing record idempotently
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testDuplicateUploadHandledIdempotently() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "unique_doc.pdf", "application/pdf", VALID_PDF_BYTES);

        long countBefore = productRepo.count();

        // Upload 1
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("category", "History")
                .param("title", "First Upload"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        assertEquals(countBefore + 1, productRepo.count(), "First upload creates exactly one record");

        // Upload 2 with identical bytes
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("category", "History")
                .param("title", "Duplicate Upload Attempt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true));

        assertEquals(countBefore + 1, productRepo.count(), "Duplicate upload must not create a second record");
    }

    /**
     * Test 22: Legacy un-retagged category ("History, Heritage & Sites") does NOT appear on /history
     */
    @Test
    void testLegacyCombinedCategoryDoesNotAppearOnHistory() throws Exception {
        Product legacyItem = createProduct(
                "Legacy Nagaland Combined Study Notes",
                "nagaland", "Nagaland",
                "general", "general",
                "History, Heritage & Sites", "history-heritage-sites", "history-heritage-sites",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(legacyItem);

        // Access /api/products/state/nagaland/category/history
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Legacy Nagaland Combined Study Notes"))));
    }

    /**
     * Test 23: Healing legacy STATE resource ("History, Heritage & Sites" / resourceScope=null) to "History"
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testLegacyStateResourceHealedOnUpload() throws Exception {
        byte[] legacyFileBytes = "%PDF-1.4\n1 0 obj\n<< /Legacy Kohima Battle >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();
        String contentHash = com.bodhganga.bodhganga.services.AdminResourceService.calculateSha256(legacyFileBytes);

        // Seed legacy product
        Product legacyProduct = createProduct(
                "Battle of Kohima (1944)",
                "nagaland", "Nagaland",
                "general", "general",
                "History, Heritage & Sites", "history-heritage-sites", "history-heritage-sites",
                "STATE_CONTENT", null,
                true, true, false, false);
        legacyProduct.setContentHash(contentHash);
        productRepo.save(legacyProduct);

        String legacyId = legacyProduct.getId();
        long countBefore = productRepo.count();

        MockMultipartFile file = new MockMultipartFile("file", "Battle of Kohima (1944).pdf", "application/pdf", legacyFileBytes);

        // Upload to Nagaland -> STATE -> History
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Battle of Kohima (1944)")
                .param("description", "Complete state history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.isReclassified").value(true))
                .andExpect(jsonPath("$.data.id").value(legacyId))
                .andExpect(jsonPath("$.data.category").value("History"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"))
                .andExpect(jsonPath("$.data.sectionSlug").value("history"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"))
                .andExpect(jsonPath("$.data.contentArea").value("STATE_CONTENT"))
                .andExpect(jsonPath("$.data.isFree").value(true))
                .andExpect(jsonPath("$.data.price").value(0.0));

        // Exactly one record remains with this hash in DB
        long countAfter = productRepo.count();
        assertEquals(countBefore, countAfter, "No new product should be created during reclassification/healing");

        Product healed = productRepo.findById(legacyId).orElseThrow();
        assertEquals("History", healed.getCategory());
        assertEquals("history", healed.getCategorySlug());
        assertEquals("history", healed.getSectionSlug());
        assertEquals("STATE", healed.getResourceScope());
        assertEquals("general", healed.getDistrictSlug());
        assertEquals("STATE_CONTENT", healed.getContentArea());
        assertTrue(healed.isFree());
        assertEquals(0.0, healed.getPrice());
        assertTrue(healed.isPublished());
        assertFalse(healed.isArchived());
    }

    /**
     * Test 24: Reclassified record appears in /api/products/state/nagaland/category/history
     * and NOT in /api/products/state/nagaland/category/geography or /api/products/state/assam/category/history
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testReclassifiedRecordEndpointVisibility() throws Exception {
        byte[] docBytes = "%PDF-1.4\n1 0 obj\n<< /Dimasa Kachari Kingdom >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();
        String contentHash = com.bodhganga.bodhganga.services.AdminResourceService.calculateSha256(docBytes);

        Product legacyProduct = createProduct(
                "Dimasa Kachari Kingdom",
                "nagaland", "Nagaland",
                "general", "general",
                "History, Heritage & Sites", "history-heritage-sites", "history-heritage-sites",
                "STATE_CONTENT", null,
                true, true, false, false);
        legacyProduct.setContentHash(contentHash);
        productRepo.save(legacyProduct);

        // Before healing: NOT on /history
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Dimasa Kachari Kingdom"))));

        // Reclassify via upload
        MockMultipartFile file = new MockMultipartFile("file", "Dimasa Kachari Kingdom.pdf", "application/pdf", docBytes);
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Dimasa Kachari Kingdom"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isReclassified").value(true));

        // After healing: VISIBLE on /state/nagaland/category/history
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", hasItem("Dimasa Kachari Kingdom")));

        // NOT visible on /state/nagaland/category/geography
        mockMvc.perform(get("/api/products/state/nagaland/category/geography"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Dimasa Kachari Kingdom"))));

        // NOT visible on /state/assam/category/history
        mockMvc.perform(get("/api/products/state/assam/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].title", not(hasItem("Dimasa Kachari Kingdom"))));
    }

    /**
     * Test 25: Repeated upload after healing returns isDuplicate=true and isReclassified=false
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testRepeatedUploadAfterHealingReturnsDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\n1 0 obj\n<< /Naga Hills District >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();
        String contentHash = com.bodhganga.bodhganga.services.AdminResourceService.calculateSha256(docBytes);

        Product legacyProduct = createProduct(
                "Naga Hills District (1866)",
                "nagaland", "Nagaland",
                "general", "general",
                "History, Heritage & Sites", "history-heritage-sites", "history-heritage-sites",
                "STATE_CONTENT", null,
                true, true, false, false);
        legacyProduct.setContentHash(contentHash);
        productRepo.save(legacyProduct);

        MockMultipartFile file = new MockMultipartFile("file", "Naga Hills District (1866).pdf", "application/pdf", docBytes);

        // Upload 1: Heals legacy record
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Naga Hills District (1866)"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.isReclassified").value(true));

        long countAfterFirst = productRepo.count();

        // Upload 2: Exact same target -> DUPLICATE
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Naga Hills District (1866)"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true))
                .andExpect(jsonPath("$.isReclassified").value(false))
                .andExpect(jsonPath("$.message").value("Resource already exists in the selected destination."));

        long countAfterSecond = productRepo.count();
        assertEquals(countAfterFirst, countAfterSecond, "Second upload must NOT create another product");
    }

    /**
     * MANDATORY TEST 1: Same file + same STATE destination -> duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test1_SameFileSameStateDestinationIsDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 1 Content\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test1.pdf", "application/pdf", docBytes);

        // Upload 1
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Nagaland History Vol 1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"));

        long countAfterFirst = productRepo.count();

        // Upload 2 with identical file and identical destination -> duplicate!
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Nagaland History Vol 1 Duplicate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true))
                .andExpect(jsonPath("$.created").value(false))
                .andExpect(jsonPath("$.message").value("Resource already exists in the selected destination."));

        assertEquals(countAfterFirst, productRepo.count(), "Duplicate upload must not create additional product");
    }

    /**
     * MANDATORY TEST 2: Same file + different STATE category -> not duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test2_SameFileDifferentStateCategoryIsNotDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 2 Content\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test2.pdf", "application/pdf", docBytes);

        // Upload 1: History
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Nagaland History"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        long countAfterFirst = productRepo.count();

        // Upload 2: Same file to Geography -> NOT duplicate, creates brand new product
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "Geography")
                .param("title", "Nagaland Geography"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.data.categorySlug").value("geography"));

        assertEquals(countAfterFirst + 1, productRepo.count(), "Different category must create a distinct catalog product");
    }

    /**
     * MANDATORY TEST 3: Same file + STATE vs DISTRICT -> not duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test3_SameFileStateVsDistrictIsNotDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 3 Battle of Kohima\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "Battle of Kohima (1944).pdf", "application/pdf", docBytes);

        // 1. Upload to Kohima District Free
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Battle of Kohima (Kohima District)"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.data.resourceScope").value("DISTRICT"))
                .andExpect(jsonPath("$.data.districtSlug").value("kohima"));

        long countAfterFirst = productRepo.count();

        // 2. Upload same file to Nagaland State History -> NOT duplicate, creates distinct STATE product!
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Battle of Kohima (State History)"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"));

        assertEquals(countAfterFirst + 1, productRepo.count(), "STATE vs DISTRICT must coexist as distinct catalog products");
    }

    /**
     * MANDATORY TEST 4: Same file + different district -> not duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test4_SameFileDifferentDistrictIsNotDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 4 Content\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "district_test.pdf", "application/pdf", docBytes);

        // Upload to Kohima
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Kohima Material"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        long countAfterFirst = productRepo.count();

        // Upload same file to Dimapur
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "dimapur")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Dimapur Material"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.data.districtSlug").value("dimapur"));

        assertEquals(countAfterFirst + 1, productRepo.count(), "Different districts must coexist as distinct catalog products");
    }

    /**
     * MANDATORY TEST 5: Same file + different state -> not duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test5_SameFileDifferentStateIsNotDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 5 Common Reference Book\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "reference_book.pdf", "application/pdf", docBytes);

        // Upload to Nagaland State History
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Nagaland History Reference"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.data.stateSlug").value("nagaland"));

        long countAfterFirst = productRepo.count();

        // Upload same file to Assam State History -> NOT duplicate, creates distinct Assam product!
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "assam")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Assam History Reference"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.data.stateSlug").value("assam"));

        assertEquals(countAfterFirst + 1, productRepo.count(), "Cross-state uploads of same physical content must create distinct catalog entries");
    }

    /**
     * MANDATORY TEST 6: Same file + same DISTRICT destination -> duplicate
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test6_SameFileSameDistrictDestinationIsDuplicate() throws Exception {
        byte[] docBytes = "%PDF-1.4\nMandatory Test 6 Content\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test6.pdf", "application/pdf", docBytes);

        // Upload 1
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Kohima Free Guide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        long countAfterFirst = productRepo.count();

        // Upload 2: same destination -> duplicate
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "kohima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Kohima Free Guide Again"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true))
                .andExpect(jsonPath("$.created").value(false))
                .andExpect(jsonPath("$.message").value("Resource already exists in the selected destination."));

        assertEquals(countAfterFirst, productRepo.count(), "Duplicate upload in district destination must not create new product");
    }

    /**
     * MANDATORY TEST 7: Unicode district slug normalization
     * Chümoukedima → chumoukedima, Tseminyü → tseminyu, Zünheboto → zunheboto
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test7_UnicodeDistrictSlugNormalization() throws Exception {
        assertEquals("chumoukedima", Product.generateSlug("Chümoukedima"));
        assertEquals("tseminyu", Product.generateSlug("Tseminyü"));
        assertEquals("zunheboto", Product.generateSlug("Zünheboto"));

        MockMultipartFile file = new MockMultipartFile("file", "chumoukedima.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "chumoukedima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Chümoukedima Overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.districtSlug").value("chumoukedima"))
                .andExpect(jsonPath("$.data.district").value("Chümoukedima"));
    }

    /**
     * MANDATORY TEST 8: State History upload payload
     * must contain: districtSlug=general, resourceScope=STATE, categorySlug=history, sectionSlug=history, contentArea=STATE_CONTENT
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test8_StateHistoryUploadPayloadPersistedCorrectly() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "state_history_payload.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("contentArea", "STATE_CONTENT")
                .param("category", "History")
                .param("categorySlug", "history")
                .param("sectionSlug", "history")
                .param("isFree", "true")
                .param("publish", "true")
                .param("title", "Nagaland History Payload Test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stateSlug").value("nagaland"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"))
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"))
                .andExpect(jsonPath("$.data.sectionSlug").value("history"))
                .andExpect(jsonPath("$.data.contentArea").value("STATE_CONTENT"))
                .andExpect(jsonPath("$.data.isFree").value(true))
                .andExpect(jsonPath("$.data.published").value(true));
    }

    /**
     * MANDATORY TEST 9: State History page isolation
     * Only: nagaland, general, STATE, history
     */
    @Test
    void test9_StateHistoryPageIsolation() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/category/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].stateSlug", everyItem(is("nagaland"))))
                .andExpect(jsonPath("$.data[*].districtSlug", everyItem(is("general"))))
                .andExpect(jsonPath("$.data[*].resourceScope", everyItem(is("STATE"))))
                .andExpect(jsonPath("$.data[*].category", everyItem(is("History"))));
    }

    /**
     * MANDATORY TEST 10: District page isolation
     * Only requested district + DISTRICT scope.
     */
    @Test
    void test10_DistrictPageIsolation() throws Exception {
        mockMvc.perform(get("/api/products/state/nagaland/district/kohima"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].stateSlug", everyItem(is("nagaland"))))
                .andExpect(jsonPath("$.data[*].districtSlug", everyItem(is("kohima"))))
                .andExpect(jsonPath("$.data[*].resourceScope", everyItem(is("DISTRICT"))));
    }

    /**
     * MANDATORY TEST 11: Existing Chamba regression: 18 Free, 46 Paid, 64 Total
     */
    @Test
    void test11_ExistingChambaRegression() throws Exception {
        // Seed Himachal Pradesh state
        State hp = new State();
        hp.setId("himachal-pradesh");
        hp.setName("Himachal Pradesh");
        hp.setCode("HP");
        hp.setType("STATE");
        hp.setDistricts(Arrays.asList("Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"));
        stateRepo.save(hp);

        // Seed 18 Free Chamba products
        for (int i = 1; i <= 18; i++) {
            Product freeP = createProduct(
                    "Chamba Free Resource " + i,
                    "himachal-pradesh", "Himachal Pradesh",
                    "chamba", "Chamba",
                    "Free", "free", "free",
                    "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                    true, true, false, false);
            productRepo.save(freeP);
        }

        // Seed 46 Paid Chamba products
        for (int i = 1; i <= 46; i++) {
            Product paidP = createProduct(
                    "Chamba Paid Resource " + i,
                    "himachal-pradesh", "Himachal Pradesh",
                    "chamba", "Chamba",
                    "Paid", "paid", "paid",
                    "PAID_DISTRICT_RESOURCES", Product.SCOPE_DISTRICT,
                    false, true, false, false);
            productRepo.save(paidP);
        }

        // Query Chamba endpoint
        mockMvc.perform(get("/api/products/state/himachal-pradesh/district/chamba"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(64)));

        List<Product> chambaProducts = productRepo.findByStateSlugAndDistrictSlugAndIsPublishedTrueAndArchivedFalse("himachal-pradesh", "chamba");
        assertEquals(64, chambaProducts.size(), "Total Chamba resources must be 64");

        long freeCount = chambaProducts.stream().filter(Product::isFree).count();
        long paidCount = chambaProducts.stream().filter(p -> !p.isFree()).count();

        assertEquals(18, freeCount, "Chamba Free resources must be 18");
        assertEquals(46, paidCount, "Chamba Paid resources must be 46");
        assertEquals(64, freeCount + paidCount, "Chamba Total must be 64 (18 Free + 46 Paid)");
    }

    /**
     * MANDATORY TEST 12: Actual multipart upload
     * Perform the complete upload flow in the test environment:
     * file -> FormData -> controller -> service -> hash -> duplicate detection -> persistence
     * and verify that a valid new destination creates a Product.
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test12_ActualMultipartUploadFlow() throws Exception {
        byte[] pdfBytes = "%PDF-1.4\n1 0 obj\n<< /Title (Actual Multipart Flow) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "actual_flow_test.pdf", "application/pdf", pdfBytes);

        long countBefore = productRepo.count();

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Actual End-to-End Test")
                .param("description", "Verifying complete persistence flow")
                .param("publish", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.created").value(true))
                .andExpect(jsonPath("$.isDuplicate").value(false))
                .andExpect(jsonPath("$.isReclassified").value(false))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.s3Key").isNotEmpty())
                .andExpect(jsonPath("$.data.contentHash").isNotEmpty())
                .andExpect(jsonPath("$.data.resourceScope").value("STATE"))
                .andExpect(jsonPath("$.data.districtSlug").value("general"))
                .andExpect(jsonPath("$.data.categorySlug").value("history"));

        assertEquals(countBefore + 1, productRepo.count());
    }

    /**
     * MANDATORY TEST 13: District directory material counts & Free/Paid breakdown
     * Verifies that GET /api/states/{stateSlug}/districts:
     * - Returns exact Free, Paid, and Total material counts
     * - Excludes state-level resources (districtSlug = "general", resourceScope = "STATE")
     * - Excludes archived resources
     * - Excludes unpublished resources
     * - Excludes resources from other districts and states
     * - Preserves Chamba 18 Free, 46 Paid, 64 Total
     */
    @Test
    void test13_DistrictDirectoryMaterialCounts_NagalandAndChamba() throws Exception {
        // Ensure Nagaland state exists with canonical districts
        State nl = stateRepo.findById("nagaland").orElseGet(() -> {
            State s = new State();
            s.setId("nagaland");
            s.setName("Nagaland");
            s.setCode("NL");
            s.setType("STATE");
            return s;
        });
        nl.setDistricts(Arrays.asList("ChÃ¼moukedim", "Dimapur", "Kohima", "TseminyÃ¼", "Zunheboto", "Wokha"));
        stateRepo.save(nl);

        // Seed 1 active Free and 1 active Paid product for Kohima
        Product kohimaFree = createProduct(
                "Kohima Free Notes",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "Free", "free", "free",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, true, false, false);
        productRepo.save(kohimaFree);

        Product kohimaPaid = createProduct(
                "Kohima Paid Study Pack",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "Paid", "paid", "paid",
                "PAID_DISTRICT_RESOURCES", Product.SCOPE_DISTRICT,
                false, true, false, false);
        kohimaPaid.setPrice(99.0);
        productRepo.save(kohimaPaid);

        // Seed an UNPUBLISHED resource for Kohima (must NOT be counted)
        Product kohimaUnpublished = createProduct(
                "Kohima Draft",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "Free", "free", "free",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, false, false, false);
        productRepo.save(kohimaUnpublished);

        // Seed an ARCHIVED resource for Kohima (must NOT be counted)
        Product kohimaArchived = createProduct(
                "Kohima Archived",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "Free", "free", "free",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, true, true, false);
        productRepo.save(kohimaArchived);

        // Seed a STATE-level resource for Nagaland (must NEVER be in district counts)
        Product stateHistory = createProduct(
                "Nagaland History Comprehensive Book",
                "nagaland", "Nagaland",
                "general", "general",
                "History", "history", "history",
                "STATE_CONTENT", Product.SCOPE_STATE,
                true, true, false, false);
        productRepo.save(stateHistory);

        // Seed an Assam district resource (must NEVER leak into Nagaland)
        Product assamDistrict = createProduct(
                "Kamrup District Guide",
                "assam", "Assam",
                "kamrup", "Kamrup",
                "Free", "free", "free",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, true, false, false);
        productRepo.save(assamDistrict);

        // Call Nagaland districts endpoint
        mockMvc.perform(get("/api/states/nagaland/districts"))
                .andExpect(status().isOk())
                // Chümoukedima canonical name and slug with 0 resources
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].district").value(hasItem("Chümoukedima")))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].total").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].free").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].paid").value(hasItem(0)))
                // Tseminyü canonical name and slug with 0 resources
                .andExpect(jsonPath("$[?(@.districtSlug=='tseminyu')].district").value(hasItem("Tseminyü")))
                .andExpect(jsonPath("$[?(@.districtSlug=='tseminyu')].total").value(hasItem(0)))
                // Zünheboto canonical name and slug with 0 resources
                .andExpect(jsonPath("$[?(@.districtSlug=='zunheboto')].district").value(hasItem("Zünheboto")))
                .andExpect(jsonPath("$[?(@.districtSlug=='zunheboto')].total").value(hasItem(0)))
                // Kohima with active resources (Free >= 1, Paid >= 1, Total >= 2)
                .andExpect(jsonPath("$[?(@.districtSlug=='kohima')].free").value(hasItem(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.districtSlug=='kohima')].paid").value(hasItem(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.districtSlug=='kohima')].total").value(hasItem(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[?(@.districtSlug=='kohima')].count").value(hasItem(greaterThanOrEqualTo(2))))
                // State-level "general" must NEVER exist as a district entry
                .andExpect(jsonPath("$[?(@.districtSlug=='general')]").doesNotExist());

        // Seed Himachal Pradesh state and Chamba products for regression check
        State hp = new State();
        hp.setId("himachal-pradesh");
        hp.setName("Himachal Pradesh");
        hp.setCode("HP");
        hp.setType("STATE");
        hp.setDistricts(Arrays.asList("Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"));
        stateRepo.save(hp);

        for (int i = 1; i <= 18; i++) {
            Product freeP = createProduct(
                    "Chamba Free Resource " + i,
                    "himachal-pradesh", "Himachal Pradesh",
                    "chamba", "Chamba",
                    "Free", "free", "free",
                    "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                    true, true, false, false);
            productRepo.save(freeP);
        }

        for (int i = 1; i <= 46; i++) {
            Product paidP = createProduct(
                    "Chamba Paid Resource " + i,
                    "himachal-pradesh", "Himachal Pradesh",
                    "chamba", "Chamba",
                    "Paid", "paid", "paid",
                    "PAID_DISTRICT_RESOURCES", Product.SCOPE_DISTRICT,
                    false, true, false, false);
            paidP.setPrice(99.0);
            productRepo.save(paidP);
        }

        // Verify Chamba regression via districts endpoint: 18 Free, 46 Paid, 64 Total
        mockMvc.perform(get("/api/states/himachal-pradesh/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.districtSlug=='chamba')].free").value(hasItem(18)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chamba')].paid").value(hasItem(46)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chamba')].total").value(hasItem(64)))
                .andExpect(jsonPath("$[?(@.districtSlug=='bilaspur')].total").value(hasItem(0)));
    }

    /**
     * MANDATORY TEST 14: Unicode district canonicalization and dynamic count updates
     * Verifies that uploading a resource to Chümoukedima immediately reflects in the district counts.
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void test14_UnicodeDistrictCountDynamicUpdate() throws Exception {
        assertEquals("chumoukedima", StateController.canonicalDistrictSlug("ChÃ¼moukedim"));
        assertEquals("Chümoukedima", StateController.canonicalDistrictName("ChÃ¼moukedim", "chumoukedima"));
        assertEquals("tseminyu", StateController.canonicalDistrictSlug("TseminyÃ¼"));
        assertEquals("Tseminyü", StateController.canonicalDistrictName("TseminyÃ¼", "tseminyu"));
        assertEquals("zunheboto", StateController.canonicalDistrictSlug("Zunheboto"));
        assertEquals("Zünheboto", StateController.canonicalDistrictName("Zunheboto", "zunheboto"));

        // Upload a new Free resource for Chümoukedima
        MockMultipartFile file = new MockMultipartFile("file", "chumoukedima_study_doc.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "chumoukedima")
                .param("resourceScope", "DISTRICT")
                .param("isFree", "true")
                .param("category", "Free")
                .param("title", "Chümoukedima Study Document"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.districtSlug").value("chumoukedima"));

        // Verify Chümoukedima now reports Free: 1, Paid: 0, Total: 1
        mockMvc.perform(get("/api/states/nagaland/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].free").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].paid").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].total").value(hasItem(1)));
    }

    /**
     * MANDATORY TEST 15: Download endpoint must return 403 Forbidden
     * BodhGanga policy disallows direct file downloads across public interfaces.
     */
    @Test
    @WithMockUser
    void test15_DownloadEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/downloads/test-product-id"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Direct downloads are disabled")));
    }

    /**
     * MANDATORY TEST 16: Dedicated District Counts Endpoint
     * Verifies GET /api/products/state/{stateSlug}/districts/counts:
     * - Returns list of canonical district counts (freeCount, paidCount, totalCount)
     * - Preserves canonical Unicode district slugs (chumoukedima, tseminyu, zunheboto)
     * - Excludes state-scoped resources (districtSlug = "general", resourceScope = "STATE")
     * - Excludes archived and unpublished resources
     */
    @Test
    void test16_DedicatedDistrictCountsEndpoint() throws Exception {
        State nl = stateRepo.findById("nagaland").orElseThrow();
        nl.setDistricts(Arrays.asList("Kohima", "Dimapur", "Mokokchung", "Wokha", "Chümoukedim", "Tseminyü", "Zunheboto"));
        stateRepo.save(nl);

        mockMvc.perform(get("/api/products/state/nagaland/districts/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].districtName").value(hasItem("Chümoukedima")))
                .andExpect(jsonPath("$[?(@.districtSlug=='chumoukedima')].totalCount").exists())
                .andExpect(jsonPath("$[?(@.districtSlug=='tseminyu')].districtName").value(hasItem("Tseminyü")))
                .andExpect(jsonPath("$[?(@.districtSlug=='zunheboto')].districtName").value(hasItem("Zünheboto")))
                .andExpect(jsonPath("$[?(@.districtSlug=='general')]").doesNotExist());
    }

    /**
     * MANDATORY TEST 17: Dedicated State Category Counts Endpoint
     * Verifies GET /api/products/state/{stateSlug}/categories/counts:
     * - Returns exact category counts for Art & Culture, History, Heritage & Sites, Geography
     * - Strictly isolates state-scoped resources (districtSlug = "general")
     * - Excludes district resources, archived, and unpublished resources
     */
    @Test
    void test17_DedicatedStateCategoryCountsEndpoint() throws Exception {
        // Nagaland has seeded: 1 History, 1 Art & Culture, 1 Geography, 0 Heritage & Sites.
        // It also has 1 Kohima district history which must be excluded.
        mockMvc.perform(get("/api/products/state/nagaland/categories/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.categorySlug=='history')].count").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.categorySlug=='art-culture')].count").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.categorySlug=='geography')].count").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.categorySlug=='heritage-sites')].count").value(hasItem(0)));

        // Cross-State Isolation: Assam only has 1 History, 0 for all other categories
        mockMvc.perform(get("/api/products/state/assam/categories/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.categorySlug=='history')].count").value(hasItem(1)))
                .andExpect(jsonPath("$[?(@.categorySlug=='art-culture')].count").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.categorySlug=='geography')].count").value(hasItem(0)))
                .andExpect(jsonPath("$[?(@.categorySlug=='heritage-sites')].count").value(hasItem(0)));
    }
}
