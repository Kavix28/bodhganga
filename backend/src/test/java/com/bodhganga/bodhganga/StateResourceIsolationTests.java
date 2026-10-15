package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import com.bodhganga.bodhganga.services.S3Service;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
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

        // Upload 1
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("category", "History")
                .param("title", "First Upload"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        // Upload 2 with identical bytes
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("category", "History")
                .param("title", "Duplicate Upload Attempt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true));
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
     * Test 26: District resource cannot be mutated into state scope
     */
    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testDistrictResourceCannotMutateToStateScope() throws Exception {
        byte[] docBytes = "%PDF-1.4\n1 0 obj\n<< /District Free Guide >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();
        String contentHash = com.bodhganga.bodhganga.services.AdminResourceService.calculateSha256(docBytes);

        Product districtDoc = createProduct(
                "Kohima Local Guide",
                "nagaland", "Nagaland",
                "kohima", "Kohima",
                "Free", "free", "free",
                "FREE_DISTRICT_CONTENT", Product.SCOPE_DISTRICT,
                true, true, false, false);
        districtDoc.setContentHash(contentHash);
        productRepo.save(districtDoc);

        MockMultipartFile file = new MockMultipartFile("file", "Kohima Local Guide.pdf", "application/pdf", docBytes);

        // Uploading to state scope creates a state resource, never mutates the district resource
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "nagaland")
                .param("districtSlug", "general")
                .param("resourceScope", "STATE")
                .param("category", "History")
                .param("title", "Kohima Historical Context"))
                .andExpect(status().isOk());

        Product districtProductAfter = productRepo.findById(districtDoc.getId()).orElseThrow();
        assertEquals("kohima", districtProductAfter.getDistrictSlug());
        assertEquals(Product.SCOPE_DISTRICT, districtProductAfter.getResourceScope());
        assertEquals("Free", districtProductAfter.getCategory());
    }
}
