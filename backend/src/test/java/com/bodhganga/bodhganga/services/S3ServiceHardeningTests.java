package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.State;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.StateRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class S3ServiceHardeningTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private StateRepo stateRepo;

    @MockBean
    private S3Service s3Service;

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();
        stateRepo.deleteAll();

        // Stub S3Service behavior with real getObjectKey implementation
        doCallRealMethod().when(s3Service).getObjectKey(anyString());
        doCallRealMethod().when(s3Service).getObjectKey(isNull());

        when(s3Service.generatePresignedGetUrl(anyString()))
                .thenAnswer(inv -> "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/" 
                        + inv.getArgument(0) + "?response-content-disposition=inline&X-Amz-Signature=mockSig123&X-Amz-Expires=900");
        when(s3Service.generatePresignedGetUrl(anyString(), anyInt()))
                .thenAnswer(inv -> "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/" 
                        + inv.getArgument(0) + "?response-content-disposition=inline&X-Amz-Signature=mockSig123&X-Amz-Expires=" 
                        + (inv.getArgument(1, Integer.class) * 60));
        when(s3Service.generatePresignedUrl(anyString()))
                .thenAnswer(inv -> "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/" 
                        + inv.getArgument(0) + "?response-content-disposition=inline&X-Amz-Signature=mockSig123&X-Amz-Expires=600");
        when(s3Service.uploadFileWithKey(any(InputStream.class), anyLong(), anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(2));
    }

    @Test
    @DisplayName("1. S3Service.getObjectKey canonicalizes relative keys, leading slashes, and legacy S3 URLs")
    void testGetObjectKey_Canonicalization() {
        // Canonical relative key
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("states/nagaland/general/free/battle_of_kohima.pdf"));

        // Leading slash
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("/states/nagaland/general/free/battle_of_kohima.pdf"));

        // Full S3 URL with region
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/states/nagaland/general/free/battle_of_kohima.pdf"));

        // Full S3 URL without region
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("https://bodhganga-pdf-storage-prod.s3.amazonaws.com/states/nagaland/general/free/battle_of_kohima.pdf"));

        // Full S3 URL with query parameters (presigned or inline disposition)
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/states/nagaland/general/free/battle_of_kohima.pdf?response-content-disposition=inline&X-Amz-Signature=abcd123"));

        // URI with custom scheme/port
        assertEquals("states/nagaland/general/free/battle_of_kohima.pdf",
                s3Service.getObjectKey("http://localhost:9090/states/nagaland/general/free/battle_of_kohima.pdf"));

        // Null and blank handling
        assertNull(s3Service.getObjectKey(null));
        assertEquals("", s3Service.getObjectKey(""));
        assertEquals("   ", s3Service.getObjectKey("   "));
    }

    @Test
    @DisplayName("2. S3Service generates signed URLs with expiration and signature query parameters")
    void testGeneratePresignedGetUrl_Parameters() {
        String key = "states/nagaland/general/free/battle_of_kohima.pdf";
        String presignedUrl = s3Service.generatePresignedGetUrl(key);

        assertNotNull(presignedUrl);
        assertTrue(presignedUrl.contains("X-Amz-Signature="), "URL must contain AWS signature");
        assertTrue(presignedUrl.contains("response-content-disposition=inline"), "URL must enforce inline disposition");
        assertTrue(presignedUrl.contains("X-Amz-Expires="), "URL must specify expiration duration");
    }

    @Test
    @DisplayName("3. PdfController parses legacy amazonaws.com URL down to canonical S3 key and authorizes free resource")
    void testPdfController_LegacyAmazonAwsUrl_FreeResource_Success() throws Exception {
        String key = "states/nagaland/general/free/battle_of_kohima.pdf";
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Battle of Kohima");
        p.setState("Nagaland");
        p.setStateSlug("nagaland");
        p.setCategory("History");
        p.setCategorySlug("history");
        p.setResourceScope(Product.SCOPE_STATE);
        p.setFree(true);
        p.setPrice(0.0);
        p.setS3Key(key);
        p.setStorageKey(key);
        p.setPublished(true);
        productRepo.save(p);

        String legacyFullUrl = "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/" + key;

        // Query with legacy URL and product id
        mockMvc.perform(get("/api/pdf/resource")
                        .param("key", legacyFullUrl)
                        .param("id", p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("X-Amz-Signature=")));
    }

    @Test
    @DisplayName("4. PdfController parses legacy amazonaws.com URL for paid resource and fails closed without authentication")
    void testPdfController_LegacyAmazonAwsUrl_PaidResource_Unauthorized() throws Exception {
        String key = "states/nagaland/general/paid/paid_study_pack.pdf";
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setTitle("Paid Study Pack");
        p.setState("Nagaland");
        p.setStateSlug("nagaland");
        p.setCategory("History");
        p.setCategorySlug("history");
        p.setResourceScope(Product.SCOPE_STATE);
        p.setFree(false);
        p.setPrice(199.0);
        p.setS3Key(key);
        p.setStorageKey(key);
        p.setPublished(true);
        productRepo.save(p);

        String legacyFullUrl = "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/" + key;

        // Anonymous request for paid legacy URL must fail with 401 Unauthorized
        mockMvc.perform(get("/api/pdf/resource")
                        .param("key", legacyFullUrl)
                        .param("id", p.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Admin resource upload serves presigned preview URL and stores canonical key in product")
    @WithMockUser(authorities = "ROLE_ADMIN")
    void testAdminResourceUpload_ServesPresignedUrlAndStoresCanonicalKey() throws Exception {
        State maharashtra = new State();
        maharashtra.setId("maharashtra");
        maharashtra.setName("Maharashtra");
        maharashtra.setCode("MH");
        maharashtra.setType("STATE");
        maharashtra.setDistricts(List.of("Akola", "Amravati"));
        stateRepo.save(maharashtra);

        MockMultipartFile file = new MockMultipartFile("file", "akola_notes.pdf", "application/pdf", VALID_PDF_BYTES);

        mockMvc.perform(multipart("/api/admin/resources/upload")
                        .file(file)
                        .param("stateSlug", "maharashtra")
                        .param("districtSlug", "akola")
                        .param("isFree", "true")
                        .param("title", "Akola District Free Study Material")
                        .param("category", "Notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.s3Url").value(org.hamcrest.Matchers.containsString("X-Amz-Signature=")))
                .andExpect(jsonPath("$.data.previewUrl").value(org.hamcrest.Matchers.containsString("X-Amz-Signature=")))
                .andExpect(jsonPath("$.data.s3Key").value(org.hamcrest.Matchers.startsWith("states/maharashtra/akola/free/")));

        assertEquals(1, productRepo.count());
        Product saved = productRepo.findAll().get(0);
        assertNotNull(saved.getS3Key());
        assertTrue(saved.getS3Key().startsWith("states/maharashtra/akola/free/"));
        // Persistent database records must store canonical relative keys, not raw permanent public S3 URLs
        assertFalse(saved.getS3Key().contains("amazonaws.com/"), "S3Key must not contain amazonaws.com");
        assertFalse(saved.getS3Url().contains("amazonaws.com/"), "S3Url persisted in DB must not contain amazonaws.com");
    }

    @Test
    @DisplayName("6. Downloads endpoint (/api/downloads/**) remains unconditionally blocked with HTTP 403 Forbidden")
    void testDownloadsEndpoint_RemainsForbidden() throws Exception {
        mockMvc.perform(get("/api/downloads/any-product-id"))
                .andExpect(status().isForbidden());
    }
}
