package com.bodhganga.bodhganga;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import com.bodhganga.bodhganga.services.AdminResourceService;
import com.bodhganga.bodhganga.services.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminResourceSystemTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private StateRepo stateRepo;

    @Autowired
    private AdminResourceService adminResourceService;

    @MockBean
    private S3Service s3Service;

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
            .getBytes();
    private static final byte[] INVALID_PDF_BYTES = "THIS IS PLAIN TEXT NOT A PDF DOCUMENT".getBytes();

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
        stateRepo.deleteAll();

        // Seed test state (Maharashtra with Akola & Amravati)
        State mh = new State();
        mh.setId("maharashtra");
        mh.setName("Maharashtra");
        mh.setCode("MH");
        mh.setType("STATE");
        mh.setDistricts(Arrays.asList("Akola", "Amravati", "Nagpur", "Pune"));
        stateRepo.save(mh);

        // Seed test state (Madhya Pradesh with Bhopal)
        State mp = new State();
        mp.setId("madhya-pradesh");
        mp.setName("Madhya Pradesh");
        mp.setCode("MP");
        mp.setType("STATE");
        mp.setDistricts(Arrays.asList("Bhopal", "Indore"));
        stateRepo.save(mp);

        // Default mock S3 behavior
        when(s3Service.objectExists(anyString())).thenReturn(false);
        when(s3Service.uploadFileWithKey(any(InputStream.class), anyLong(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(2));
        when(s3Service.getS3Url(anyString()))
                .thenAnswer(invocation -> "https://s3.amazonaws.com/test-bucket/" + invocation.getArgument(0));
    }

    @Test
    void testNonAdminAccessForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Test File"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminAccessAllowedWithValidData() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "akola_notes.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Akola District Free Notes")
                .param("category", "Notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stateSlug").value("maharashtra"))
                .andExpect(jsonPath("$.data.districtSlug").value("akola"))
                .andExpect(jsonPath("$.data.isFree").value(true))
                .andExpect(jsonPath("$.data.price").value(0.0))
                .andExpect(jsonPath("$.data.published").value(true))
                .andExpect(jsonPath("$.data.contentHash").exists());

        assertEquals(1, productRepo.count());
        Product p = productRepo.findAll().get(0);
        assertEquals("Maharashtra", p.getState());
        assertEquals("Akola", p.getDistrict());
        assertEquals(0.0, p.getPrice());
        assertNotNull(p.getContentHash());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testInvalidStateRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "atlantis")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Invalid State Test"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("INVALID_STATE")));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testDistrictNotBelongingToStateRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", VALID_PDF_BYTES);

        // Bhopal is in MP, not Maharashtra
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "bhopal")
                .param("isFree", "true")
                .param("title", "Invalid District Test"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("INVALID_DISTRICT")));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testInvalidPdfBytesRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "fake.pdf", "application/pdf", INVALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Fake PDF Header Test"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("INVALID_PDF")));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testEmptyFileRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Empty File Test"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("INVALID_PDF")));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testPaidPriceSemanticsEnforced() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "paid_notes.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "false")
                .param("title", "Akola Premium Paid Bundle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFree").value(false))
                .andExpect(jsonPath("$.data.price").value(99.0));

        Product p = productRepo.findAll().get(0);
        assertFalse(p.isFree());
        assertEquals(99.0, p.getPrice());
    }

    @Test
    void testFilenameSanitizationAndS3KeyFormat() {
        String inputFilename = "../../../etc/passwd_malicious document!!.pdf";
        String cleanName = AdminResourceService.sanitizeFilename(inputFilename);
        assertFalse(cleanName.contains(".."));
        assertFalse(cleanName.contains("/"));
        assertFalse(cleanName.contains("\\"));
        assertTrue(cleanName.endsWith(".pdf"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testSha256IdempotentDuplicateDetection() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("file", "file1.pdf", "application/pdf", VALID_PDF_BYTES);

        // First Upload
        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file1)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Original Resource"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(false));

        assertEquals(1, productRepo.count());
        Product first = productRepo.findAll().get(0);

        // Second Upload with exact same file bytes, state, district, and isFree
        MockMultipartFile file2 = new MockMultipartFile("file", "different_name.pdf", "application/pdf",
                VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                .file(file2)
                .param("stateSlug", "maharashtra")
                .param("districtSlug", "akola")
                .param("isFree", "true")
                .param("title", "Duplicate Resource Title"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDuplicate").value(true))
                .andExpect(jsonPath("$.data.id").value(first.getId()));

        // Ensure Mongo still contains exactly 1 product (no duplicate document created)
        assertEquals(1, productRepo.count());
        verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
    }

    @Test
    void testS3CompensationOnMongoFailure() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", VALID_PDF_BYTES);

        ProductRepo mockProductRepo = mock(ProductRepo.class);
        StateRepo mockStateRepo = mock(StateRepo.class);
        S3Service mockS3Service = mock(S3Service.class);

        State mh = new State();
        mh.setId("maharashtra");
        mh.setName("Maharashtra");
        mh.setDistricts(List.of("Akola"));

        when(mockStateRepo.findById("maharashtra")).thenReturn(Optional.of(mh));
        when(mockStateRepo.findAll()).thenReturn(List.of(mh));
        when(mockProductRepo.findByStateSlugAndDistrictSlugAndIsFreeAndContentHash(anyString(), anyString(),
                anyBoolean(), anyString()))
                .thenReturn(Optional.empty());
        when(mockS3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                .thenReturn("states/maharashtra/akola/free/test.pdf");

        // Simulate Mongo save throwing a Database Exception
        when(mockProductRepo.save(any())).thenThrow(new RuntimeException("Mongo connection dropped"));

        AdminResourceService service = new AdminResourceService(mockProductRepo, mockStateRepo, mockS3Service);

        assertThrows(RuntimeException.class, () -> service.uploadResource(
                file, "maharashtra", "akola", true, "Notes", "Test Title", "Desc", true));

        // Verify compensation deletion was triggered
        verify(mockS3Service, times(1)).deleteObject(anyString());
    }

    @Test
    void testStateRemainsVisibleWithZeroProducts() throws Exception {
        // No products in productRepo
        assertEquals(0, productRepo.count());

        mockMvc.perform(get("/api/states/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.stateSlug == 'maharashtra')].notesCount").value(0))
                .andExpect(jsonPath("$[?(@.stateSlug == 'madhya-pradesh')].notesCount").value(0));
    }
}
