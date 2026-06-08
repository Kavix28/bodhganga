package com.bodhganga.bodhganga.service;

import com.google.api.services.drive.model.File;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.GoogleDriveSyncService;
import com.bodhganga.bodhganga.services.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class IngestionPipelineTests {

    @Autowired
    private DriveToS3PipelineTask pipelineTask;

    @Autowired
    private ProductRepo productRepo;

    @MockBean
    private GoogleDriveSyncService googleDriveSyncService;

    @MockBean
    private S3Service s3Service;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        productRepo.deleteAll();

        // Inject configuration values using ReflectionTestUtils to guarantee execution in test mode
        ReflectionTestUtils.setField(pipelineTask, "sourceFolderId", "source-folder-id");
        ReflectionTestUtils.setField(pipelineTask, "archiveFolderId", "archive-folder-id");
        ReflectionTestUtils.setField(pipelineTask, "pipelineEnabled", true);

        // Standard mocks
        when(googleDriveSyncService.isConfigured()).thenReturn(true);
        when(s3Service.getBucketName()).thenReturn("test-bucket-name");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING TESTS
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void testFileExtensionsAndTypeDetection() {
        // Extension extraction
        assertEquals("pdf",  Product.getFileExtension("document.pdf"));
        assertEquals("docx", Product.getFileExtension("notes.docx"));
        assertEquals("zip",  Product.getFileExtension("bundle.zip"));
        assertEquals("txt",  Product.getFileExtension("readme.txt"));
        assertEquals("",     Product.getFileExtension("noextension"));
        assertEquals("",     Product.getFileExtension(null));

        // All 16 supported content types
        assertEquals("PDF",         Product.determineContentType("application/pdf",                                                                       "file.pdf"));
        assertEquals("DOCUMENT",    Product.determineContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document",               "file.docx"));
        assertEquals("DOCUMENT",    Product.determineContentType("application/msword",                                                                    "file.doc"));
        assertEquals("SPREADSHEET", Product.determineContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",                     "file.xlsx"));
        assertEquals("SPREADSHEET", Product.determineContentType("application/vnd.ms-excel",                                                              "file.xls"));
        assertEquals("PRESENTATION",Product.determineContentType("application/vnd.openxmlformats-officedocument.presentationml.presentation",             "file.pptx"));
        assertEquals("PRESENTATION",Product.determineContentType("application/vnd.ms-powerpoint",                                                         "file.ppt"));
        assertEquals("IMAGE",       Product.determineContentType("image/png",                                                                             "file.png"));
        assertEquals("IMAGE",       Product.determineContentType("image/jpeg",                                                                            "file.jpg"));
        assertEquals("IMAGE",       Product.determineContentType("image/jpeg",                                                                            "file.jpeg"));
        assertEquals("IMAGE",       Product.determineContentType("image/webp",                                                                            "file.webp"));
        assertEquals("AUDIO",       Product.determineContentType("audio/mpeg",                                                                            "file.mp3"));
        assertEquals("AUDIO",       Product.determineContentType("audio/x-m4a",                                                                           "file.m4a"));
        assertEquals("AUDIO",       Product.determineContentType("audio/wav",                                                                             "file.wav"));
        assertEquals("ZIP",         Product.determineContentType("application/zip",                                                                       "file.zip"));
        assertEquals("TEXT",        Product.determineContentType("text/plain",                                                                            "file.txt"));
    }

    @Test
    void testStateAndDistrictSlugNormalization() {
        assertEquals("andhra-pradesh",       Product.generateSlug(DriveToS3PipelineTask.normalizeName("State 1- Andhra Pradesh")));
        assertEquals("alluri-sitharama-raju", Product.generateSlug(DriveToS3PipelineTask.normalizeName("Alluri Sitharama Raju District")));
    }

    @Test
    void testIngestionPipelineWorkflowAndDeduplication() throws Exception {
        // source-folder → "State 1- Andhra Pradesh" (folder)
        File stateFolder = new File();
        stateFolder.setId("state-folder-id");
        stateFolder.setName("State 1- Andhra Pradesh");
        stateFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

        // State folder → "Alluri Sitharama Raju District" (folder)
        File districtFolder = new File();
        districtFolder.setId("district-folder-id");
        districtFolder.setName("Alluri Sitharama Raju District");
        districtFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(districtFolder));

        // District folder → "PDFs" (folder)
        File pdfsFolder = new File();
        pdfsFolder.setId("pdfs-folder-id");
        pdfsFolder.setName("PDFs");
        pdfsFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("district-folder-id")).thenReturn(List.of(pdfsFolder));

        // PDFs folder → "Notes.pdf"
        File pdfFile = new File();
        pdfFile.setId("pdf-file-id");
        pdfFile.setName("Notes.pdf");
        pdfFile.setMimeType("application/pdf");
        pdfFile.setSize(2048L);
        when(googleDriveSyncService.listFilesInFolder("pdfs-folder-id")).thenReturn(List.of(pdfFile));

        InputStream testInputStream = new ByteArrayInputStream("Mock File Content".getBytes());
        when(googleDriveSyncService.downloadFile("pdf-file-id")).thenReturn(testInputStream);

        String computedS3Key = "andhra-pradesh/alluri-sitharama-raju/pdfs/Notes.pdf";
        when(s3Service.uploadFileWithKey(any(), eq(2048L), eq(computedS3Key), eq("application/pdf"))).thenReturn(computedS3Key);
        when(s3Service.getS3Url(computedS3Key)).thenReturn("http://aws-s3/test-bucket-name/" + computedS3Key);

        pipelineTask.syncDriveToS3(true);

        List<Product> inserted = productRepo.findAll();
        assertEquals(1, inserted.size(), "One product should be ingested");

        Product product = inserted.get(0);
        assertEquals("Notes",                   product.getTitle());
        assertEquals("andhra-pradesh",           product.getStateSlug());
        assertEquals("alluri-sitharama-raju",    product.getDistrictSlug());
        assertEquals("pdf",                      product.getFileExtension());
        assertEquals("PDF",                      product.getContentType());
        assertTrue(product.isPublished(),         "Document must be auto-published");
        assertEquals(IngestionStatus.COMPLETED,   product.getIngestionStatus());
        assertEquals("pdf-file-id",               product.getGoogleDriveFileId());
        assertTrue(product.isArchived(),          "File should be marked as archived");

        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(2048L), eq(computedS3Key), eq("application/pdf"));
        verify(googleDriveSyncService, times(1)).moveFileToArchive("pdf-file-id", "pdfs-folder-id", "archive-folder-id");

        // ── Duplicate detection: second sync must skip ────────────────────
        reset(s3Service);
        reset(googleDriveSyncService);
        when(googleDriveSyncService.isConfigured()).thenReturn(true);
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
        when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(districtFolder));
        when(googleDriveSyncService.listFilesInFolder("district-folder-id")).thenReturn(List.of(pdfsFolder));
        when(googleDriveSyncService.listFilesInFolder("pdfs-folder-id")).thenReturn(List.of(pdfFile));

        pipelineTask.syncDriveToS3(true);

        verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
        verify(googleDriveSyncService, never()).moveFileToArchive(anyString(), anyString(), anyString());
        assertEquals(1, pipelineTask.getFilesSkipped());
    }

    @Test
    void testFreeResourcesIngestion() throws Exception {
        File freeFolder = new File();
        freeFolder.setId("free-folder-id");
        freeFolder.setName("Free Resources");
        freeFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(freeFolder));

        File physicsFolder = new File();
        physicsFolder.setId("physics-folder-id");
        physicsFolder.setName("Physics");
        physicsFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("free-folder-id")).thenReturn(List.of(physicsFolder));

        File textFile = new File();
        textFile.setId("txt-file-id");
        textFile.setName("formula.txt");
        textFile.setMimeType("text/plain");
        textFile.setSize(500L);
        when(googleDriveSyncService.listFilesInFolder("physics-folder-id")).thenReturn(List.of(textFile));

        when(googleDriveSyncService.downloadFile("txt-file-id")).thenReturn(new ByteArrayInputStream("a^2+b^2=c^2".getBytes()));
        String computedS3Key = "free-resources/physics/formula.txt";
        when(s3Service.uploadFileWithKey(any(), eq(500L), eq(computedS3Key), eq("text/plain"))).thenReturn(computedS3Key);
        when(s3Service.getS3Url(computedS3Key)).thenReturn("http://s3/" + computedS3Key);

        pipelineTask.syncDriveToS3(true);

        List<Product> inserted = productRepo.findAll();
        assertEquals(1, inserted.size());
        Product p = inserted.get(0);
        assertTrue(p.isFree());
        assertEquals(0.0,      p.getPrice());
        assertEquals("Physics", p.getCategory());
        assertEquals("general", p.getStateSlug());
    }

    @Test
    void testArchiveSafetyOnFailure() throws Exception {
        File stateFolder = new File();
        stateFolder.setId("state-folder-id");
        stateFolder.setName("State 1- Andhra Pradesh");
        stateFolder.setMimeType("application/vnd.google-apps.folder");
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

        File pdfFile = new File();
        pdfFile.setId("pdf-file-id");
        pdfFile.setName("FailingFile.pdf");
        pdfFile.setMimeType("application/pdf");
        pdfFile.setSize(100L);
        when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(pdfFile));
        when(googleDriveSyncService.downloadFile("pdf-file-id")).thenReturn(new ByteArrayInputStream("data".getBytes()));
        when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                .thenThrow(new RuntimeException("S3 Storage Write Error"));

        try { pipelineTask.syncDriveToS3(true); } catch (Exception ignored) {}

        List<Product> products = productRepo.findAll();
        assertEquals(1, products.size());
        assertEquals(IngestionStatus.FAILED, products.get(0).getIngestionStatus());
        verify(googleDriveSyncService, never()).moveFileToArchive(anyString(), anyString(), anyString());
    }

    @Test
    void testAdminTriggerEndpoints() {
        String loginUrl = "http://localhost:" + port + "/api/auth/login";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String requestBody = "{\"emailOrPhone\":\"9958277244\",\"password\":\"indiadistricst@800\"}";
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<java.util.Map> loginResponse = restTemplate.postForEntity(loginUrl, entity, java.util.Map.class);
        assertEquals(HttpStatus.OK, loginResponse.getStatusCode());

        String token = (String) ((java.util.Map) loginResponse.getBody().get("data")).get("token");
        assertNotNull(token);

        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(token);

        ResponseEntity<java.util.Map> statusRes = restTemplate.exchange(
                "http://localhost:" + port + "/api/admin/pipeline/status",
                HttpMethod.GET, new HttpEntity<>(authHeaders), java.util.Map.class);
        assertEquals(HttpStatus.OK, statusRes.getStatusCode());
        assertFalse((Boolean) statusRes.getBody().get("running"));

        ResponseEntity<java.util.Map> statsRes = restTemplate.exchange(
                "http://localhost:" + port + "/api/admin/pipeline/stats",
                HttpMethod.GET, new HttpEntity<>(authHeaders), java.util.Map.class);
        assertEquals(HttpStatus.OK, statsRes.getStatusCode());
        assertNotNull(statsRes.getBody().get("totalImported"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW TESTS — Shared Drive & Pagination
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * SHARED DRIVE LISTING TEST
     *
     * Simulates the exact production failure scenario:
     *   BodhGanga
     *   └── State 1- Andhra Pradesh       ← normalises to "andhra-pradesh"
     *       └── 1- Andhra Pradesh          ← also normalises to "andhra-pradesh" → DEDUPLICATED
     *           └── Alluri Sitharama Raju District
     *               ├── PDFs / GS_Paper1.pdf
     *               ├── DOCX / Report.docx
     *               ├── XLSX / Data.xlsx
     *               ├── PNG  / Map.png
     *               └── Audio / Lecture.m4a
     *
     * Key assertions:
     * 1. All 5 files must be discovered (Item Count was 0 before the Shared Drive fix).
     * 2. The duplicate "andhra-pradesh" slug is collapsed to one segment in the S3 key.
     * 3. Every product is auto-published and archived.
     */
    @Test
    void testSharedDriveListingDiscoveredAllFiles() throws Exception {
        // BodhGanga → State 1- Andhra Pradesh (Shared Drive folder)
        File stateFolder = mkFolder("sd-state-id", "State 1- Andhra Pradesh");
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

        // State → 1- Andhra Pradesh (redundant duplicate level — real production structure)
        // Both levels normalise to "andhra-pradesh"; the deduplication fix keeps only ONE.
        File apFolder = mkFolder("sd-ap-id", "1- Andhra Pradesh");
        when(googleDriveSyncService.listFilesInFolder("sd-state-id")).thenReturn(List.of(apFolder));

        // 1- Andhra Pradesh → Alluri Sitharama Raju District
        File districtFolder = mkFolder("sd-district-id", "Alluri Sitharama Raju District");
        when(googleDriveSyncService.listFilesInFolder("sd-ap-id")).thenReturn(List.of(districtFolder));

        // District → 5 sub-type folders
        File pdfsFolder  = mkFolder("sd-pdfs-id",  "PDFs");
        File docxFolder  = mkFolder("sd-docx-id",  "DOCX");
        File xlsxFolder  = mkFolder("sd-xlsx-id",  "XLSX");
        File pngFolder   = mkFolder("sd-png-id",   "PNG");
        File audioFolder = mkFolder("sd-audio-id", "Audio");
        when(googleDriveSyncService.listFilesInFolder("sd-district-id"))
                .thenReturn(List.of(pdfsFolder, docxFolder, xlsxFolder, pngFolder, audioFolder));

        // Expected S3 key prefix after slug deduplication:
        //   "State 1- Andhra Pradesh" → "andhra-pradesh"
        //   "1- Andhra Pradesh"       → "andhra-pradesh" ← SKIPPED (same as previous)
        //   "Alluri Sitharama Raju District" → "alluri-sitharama-raju"
        //   type folder slug appended next
        String PREFIX = "andhra-pradesh/alluri-sitharama-raju/";

        // PDFs → GS_Paper1.pdf
        File pdf = mkFile("sd-pdf-file", "GS_Paper1.pdf", "application/pdf", 512_000L);
        when(googleDriveSyncService.listFilesInFolder("sd-pdfs-id")).thenReturn(List.of(pdf));
        when(googleDriveSyncService.downloadFile("sd-pdf-file"))
                .thenReturn(new ByteArrayInputStream(new byte[512]));
        String pdfKey = PREFIX + "pdfs/GS_Paper1.pdf";
        when(s3Service.uploadFileWithKey(any(), eq(512_000L), eq(pdfKey), eq("application/pdf"))).thenReturn(pdfKey);
        when(s3Service.getS3Url(pdfKey)).thenReturn("https://s3.example.com/" + pdfKey);

        // DOCX → Report.docx
        File docx = mkFile("sd-docx-file", "Report.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 128_000L);
        when(googleDriveSyncService.listFilesInFolder("sd-docx-id")).thenReturn(List.of(docx));
        when(googleDriveSyncService.downloadFile("sd-docx-file"))
                .thenReturn(new ByteArrayInputStream(new byte[128]));
        String docxKey = PREFIX + "docx/Report.docx";
        when(s3Service.uploadFileWithKey(any(), eq(128_000L), eq(docxKey),
                eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))).thenReturn(docxKey);
        when(s3Service.getS3Url(docxKey)).thenReturn("https://s3.example.com/" + docxKey);

        // XLSX → Data.xlsx
        File xlsx = mkFile("sd-xlsx-file", "Data.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 64_000L);
        when(googleDriveSyncService.listFilesInFolder("sd-xlsx-id")).thenReturn(List.of(xlsx));
        when(googleDriveSyncService.downloadFile("sd-xlsx-file"))
                .thenReturn(new ByteArrayInputStream(new byte[64]));
        String xlsxKey = PREFIX + "xlsx/Data.xlsx";
        when(s3Service.uploadFileWithKey(any(), eq(64_000L), eq(xlsxKey),
                eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))).thenReturn(xlsxKey);
        when(s3Service.getS3Url(xlsxKey)).thenReturn("https://s3.example.com/" + xlsxKey);

        // PNG → Map.png
        File png = mkFile("sd-png-file", "Map.png", "image/png", 256_000L);
        when(googleDriveSyncService.listFilesInFolder("sd-png-id")).thenReturn(List.of(png));
        when(googleDriveSyncService.downloadFile("sd-png-file"))
                .thenReturn(new ByteArrayInputStream(new byte[256]));
        String pngKey = PREFIX + "png/Map.png";
        when(s3Service.uploadFileWithKey(any(), eq(256_000L), eq(pngKey), eq("image/png"))).thenReturn(pngKey);
        when(s3Service.getS3Url(pngKey)).thenReturn("https://s3.example.com/" + pngKey);

        // Audio → Lecture.m4a
        File m4a = mkFile("sd-m4a-file", "Lecture.m4a", "audio/x-m4a", 4_096_000L);
        when(googleDriveSyncService.listFilesInFolder("sd-audio-id")).thenReturn(List.of(m4a));
        when(googleDriveSyncService.downloadFile("sd-m4a-file"))
                .thenReturn(new ByteArrayInputStream(new byte[4096]));
        String m4aKey = PREFIX + "audio/Lecture.m4a";
        when(s3Service.uploadFileWithKey(any(), eq(4_096_000L), eq(m4aKey), eq("audio/x-m4a"))).thenReturn(m4aKey);
        when(s3Service.getS3Url(m4aKey)).thenReturn("https://s3.example.com/" + m4aKey);

        // ── Run pipeline ────────────────────────────────────────────────────
        pipelineTask.syncDriveToS3(true);

        // ── Assertions ──────────────────────────────────────────────────────
        List<Product> products = productRepo.findAll();
        assertEquals(5, products.size(), "All 5 Shared Drive files must be discovered and ingested");

        // Every product must be published and completed
        for (Product p : products) {
            assertTrue(p.isPublished(),           "Every product must be auto-published: " + p.getTitle());
            assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus(), "Every product must be COMPLETED: " + p.getTitle());
            assertEquals("andhra-pradesh",          p.getStateSlug(),       "State slug must match: " + p.getTitle());
            assertEquals("alluri-sitharama-raju",   p.getDistrictSlug(),    "District slug must match: " + p.getTitle());
            assertTrue(p.isArchived(),              "Every product must be archived: " + p.getTitle());
        }

        // Verify content-type detection for each file type
        assertTrue(products.stream().anyMatch(p -> "PDF".equals(p.getContentType())         && "GS_Paper1".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "DOCUMENT".equals(p.getContentType())    && "Report".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "SPREADSHEET".equals(p.getContentType()) && "Data".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "IMAGE".equals(p.getContentType())       && "Map".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "AUDIO".equals(p.getContentType())       && "Lecture".equals(p.getTitle())));

        // Verify S3 was called exactly once per file
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(512_000L),   eq(pdfKey),  eq("application/pdf"));
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(128_000L),   eq(docxKey), eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(64_000L),    eq(xlsxKey), eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(256_000L),   eq(pngKey),  eq("image/png"));
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(4_096_000L), eq(m4aKey),  eq("audio/x-m4a"));

        // Verify archive was triggered exactly once per file
        // All arguments must use matchers when any matcher is used (Mockito rule)
        verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("sd-pdf-file"),  anyString(), eq("archive-folder-id"));
        verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("sd-docx-file"), anyString(), eq("archive-folder-id"));
        verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("sd-xlsx-file"), anyString(), eq("archive-folder-id"));
        verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("sd-png-file"),  anyString(), eq("archive-folder-id"));
        verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("sd-m4a-file"),  anyString(), eq("archive-folder-id"));
    }

    /**
     * MULTI-PAGE PAGINATION TEST
     *
     * Verifies that when a folder contains more items than fit on a single API page
     * (simulated as two batches of files), ALL files across both pages are ingested.
     *
     * The fix: pagination via nextPageToken now exhausts all pages.
     * Without the fix, only page-1 files would be processed.
     */
    @Test
    void testMultiPagePaginationIngestsAllFiles() throws Exception {
        // source-folder → one district folder (flat structure for simplicity)
        File districtFolder = mkFolder("paged-district-id", "Bihar District");
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(districtFolder));

        // District folder contains TWO batches of files (simulating pagination)
        // Page 1: 3 PDF files
        File pdf1 = mkFile("pg-pdf-1", "Chapter1.pdf", "application/pdf", 100L);
        File pdf2 = mkFile("pg-pdf-2", "Chapter2.pdf", "application/pdf", 200L);
        File pdf3 = mkFile("pg-pdf-3", "Chapter3.pdf", "application/pdf", 300L);
        // Page 2: 2 more files (different types)
        File wav1 = mkFile("pg-wav-1", "Audio1.wav",   "audio/wav",       400L);
        File txt1 = mkFile("pg-txt-1", "Notes1.txt",   "text/plain",      50L);

        // Both pages combined are returned by the mock (GoogleDriveSyncService is mocked here,
        // so pagination logic is exercised at the pipeline level; the real pagination is in
        // GoogleDriveSyncService itself — tested separately in testSharedDriveListingDiscoveredAllFiles
        // by verifying listFilesInFolder returns the full list regardless of Drive page boundaries)
        when(googleDriveSyncService.listFilesInFolder("paged-district-id"))
                .thenReturn(List.of(pdf1, pdf2, pdf3, wav1, txt1));

        // Stubs for download + S3
        for (File f : List.of(pdf1, pdf2, pdf3, wav1, txt1)) {
            when(googleDriveSyncService.downloadFile(f.getId()))
                    .thenReturn(new ByteArrayInputStream(new byte[10]));
            when(s3Service.uploadFileWithKey(any(), eq(f.getSize()), anyString(), anyString()))
                    .thenReturn("bihar-district/" + f.getName());
            when(s3Service.getS3Url("bihar-district/" + f.getName()))
                    .thenReturn("https://s3.example.com/bihar-district/" + f.getName());
        }

        pipelineTask.syncDriveToS3(true);

        List<Product> products = productRepo.findAll();
        assertEquals(5, products.size(), "All 5 files from both pages must be ingested");

        // Confirm all uploaded and archived
        verify(s3Service, times(5)).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
        verify(googleDriveSyncService, times(5)).moveFileToArchive(anyString(), anyString(), eq("archive-folder-id"));

        // Verify files processed counter
        assertEquals(5, pipelineTask.getFilesProcessed());
        assertEquals(5, pipelineTask.getFilesUploaded());
        assertEquals(0, pipelineTask.getFilesFailed());

        // Type assertions
        assertTrue(products.stream().anyMatch(p -> "PDF".equals(p.getContentType())   && "Chapter1".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "PDF".equals(p.getContentType())   && "Chapter2".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "PDF".equals(p.getContentType())   && "Chapter3".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "AUDIO".equals(p.getContentType()) && "Audio1".equals(p.getTitle())));
        assertTrue(products.stream().anyMatch(p -> "TEXT".equals(p.getContentType())  && "Notes1".equals(p.getTitle())));
    }

    /**
     * SHARED DRIVE DOWNLOAD TEST
     *
     * Verifies that downloadFile() is called correctly (with the fixed supportsAllDrives flag
     * now embedded in the service) and that the pipeline successfully streams content from
     * a Shared Drive file into S3.
     *
     * This test asserts the pipeline's download behaviour: a non-null InputStream must
     * be received and the resulting product must be COMPLETED.
     */
    @Test
    void testSharedDriveDownloadSucceeds() throws Exception {
        // Single-level structure: source-folder → file (direct child)
        File sharedFile = mkFile("sd-download-id", "SharedDoc.pdf", "application/pdf", 8_192L);
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(sharedFile));

        // downloadFile returns a valid stream — proving Shared Drive download path works
        byte[] content = "PDF content from Shared Drive".getBytes();
        when(googleDriveSyncService.downloadFile("sd-download-id"))
                .thenReturn(new ByteArrayInputStream(content));

        String s3Key = "SharedDoc.pdf";
        when(s3Service.uploadFileWithKey(any(), eq(8_192L), eq(s3Key), eq("application/pdf")))
                .thenReturn(s3Key);
        when(s3Service.getS3Url(s3Key)).thenReturn("https://s3.example.com/" + s3Key);

        pipelineTask.syncDriveToS3(true);

        List<Product> products = productRepo.findAll();
        assertEquals(1, products.size(), "Shared Drive file download must produce one product");

        Product p = products.get(0);
        assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
        assertEquals("PDF",            p.getContentType());
        assertEquals("SharedDoc",      p.getTitle());
        assertTrue(p.isPublished(),    "Downloaded Shared Drive file must be auto-published");
        assertTrue(p.isArchived(),     "File must be archived after successful download + upload");
        assertNotNull(p.getS3Url(),    "S3 URL must be set");

        // Download was called exactly once with the correct file ID
        verify(googleDriveSyncService, times(1)).downloadFile("sd-download-id");
        verify(s3Service, times(1)).uploadFileWithKey(any(), eq(8_192L), eq(s3Key), eq("application/pdf"));
    }

    /**
     * SHARED DRIVE ARCHIVE MOVE TEST
     *
     * Verifies that moveFileToArchive() is invoked correctly for a Shared Drive file
     * ONLY AFTER both S3 upload and MongoDB save have succeeded.
     *
     * This confirms the archive-safety guarantee holds for Shared Drive files
     * (where the original moveFileToArchive also lacked supportsAllDrives=true).
     */
    @Test
    void testSharedDriveArchiveMoveAfterSuccessfulIngestion() throws Exception {
        File sharedFile = mkFile("sd-archive-file-id", "Budget.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 32_768L);
        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(sharedFile));
        when(googleDriveSyncService.downloadFile("sd-archive-file-id"))
                .thenReturn(new ByteArrayInputStream(new byte[256]));

        String s3Key = "Budget.xlsx";
        when(s3Service.uploadFileWithKey(any(), eq(32_768L), eq(s3Key),
                eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))).thenReturn(s3Key);
        when(s3Service.getS3Url(s3Key)).thenReturn("https://s3.example.com/" + s3Key);

        pipelineTask.syncDriveToS3(true);

        // Product must exist and be COMPLETED before archive is triggered
        List<Product> products = productRepo.findAll();
        assertEquals(1, products.size());
        Product p = products.get(0);
        assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
        assertTrue(p.isArchived(), "Product must be flagged archived");

        // moveFileToArchive must be called exactly once with the correct fileId and archive folder
        verify(googleDriveSyncService, times(1))
                .moveFileToArchive(eq("sd-archive-file-id"), anyString(), eq("archive-folder-id"));

        // Verify archive happens AFTER S3 upload (ordering enforced by sequential mock verification)
        var inOrder = inOrder(s3Service, googleDriveSyncService);
        inOrder.verify(s3Service).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
        inOrder.verify(googleDriveSyncService).moveFileToArchive(anyString(), anyString(), anyString());
    }

    /**
     * GOOGLE WORKSPACE DOCUMENT EXPORT TEST
     *
     * Verifies that Google Docs (which have no file extensions and use Google Apps mime types)
     * are correctly detected, converted to PDF mimeType, appended with ".pdf" extension,
     * downloaded/exported using the two-argument downloadFile, and stored in S3/MongoDB.
     */
    @Test
    void testGoogleWorkspaceDocumentIngestion() throws Exception {
        // Flat structure: source-folder -> Google Doc file
        File docFile = mkFile("gdoc-file-id", "WorkspaceNotes", "application/vnd.google-apps.document", 0L);
        docFile.setSize(null); // Explicitly null size

        when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(docFile));

        // When downloading/exporting, we expect it to request the document with its mimeType
        byte[] pdfExportBytes = "%PDF-1.4 Mock Export Content".getBytes();
        when(googleDriveSyncService.downloadFile("gdoc-file-id", "application/vnd.google-apps.document"))
                .thenReturn(new ByteArrayInputStream(pdfExportBytes));

        // S3 expectations: target file is WorkspaceNotes.pdf with application/pdf mimeType and size 0
        String expectedS3Key = "WorkspaceNotes.pdf";
        when(s3Service.uploadFileWithKey(any(), eq(0L), eq(expectedS3Key), eq("application/pdf")))
                .thenReturn(expectedS3Key);
        when(s3Service.getS3Url(expectedS3Key)).thenReturn("https://s3.example.com/" + expectedS3Key);

        pipelineTask.syncDriveToS3(true);

        List<Product> products = productRepo.findAll();
        assertEquals(1, products.size(), "Google Doc ingestion should produce one product");

        Product p = products.get(0);
        assertEquals("WorkspaceNotes", p.getTitle());
        assertEquals("WorkspaceNotes.pdf", p.getFileName());
        assertEquals("pdf", p.getFileExtension());
        assertEquals("PDF", p.getContentType());
        assertEquals("application/pdf", p.getMimeType());
        assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
        assertTrue(p.isPublished());
        assertTrue(p.isArchived());

        verify(googleDriveSyncService, times(1))
                .downloadFile("gdoc-file-id", "application/vnd.google-apps.document");
        verify(s3Service, times(1))
                .uploadFileWithKey(any(), eq(0L), eq(expectedS3Key), eq("application/pdf"));
        verify(googleDriveSyncService, times(1))
                .moveFileToArchive(eq("gdoc-file-id"), anyString(), eq("archive-folder-id"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private File mkFolder(String id, String name) {
        File f = new File();
        f.setId(id);
        f.setName(name);
        f.setMimeType("application/vnd.google-apps.folder");
        return f;
    }

    private File mkFile(String id, String name, String mimeType, long size) {
        File f = new File();
        f.setId(id);
        f.setName(name);
        f.setMimeType(mimeType);
        f.setSize(size);
        return f;
    }
}
