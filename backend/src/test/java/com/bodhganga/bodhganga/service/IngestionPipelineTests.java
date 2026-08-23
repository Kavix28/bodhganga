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

                // Inject configuration values using ReflectionTestUtils to guarantee execution
                // in test mode
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
                assertEquals("pdf", Product.getFileExtension("document.pdf"));
                assertEquals("docx", Product.getFileExtension("notes.docx"));
                assertEquals("zip", Product.getFileExtension("bundle.zip"));
                assertEquals("txt", Product.getFileExtension("readme.txt"));
                assertEquals("", Product.getFileExtension("noextension"));
                assertEquals("", Product.getFileExtension(null));

                // All 16 supported content types
                assertEquals("PDF", Product.determineContentType("application/pdf", "file.pdf"));
                assertEquals("DOCUMENT", Product.determineContentType(
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "file.docx"));
                assertEquals("DOCUMENT", Product.determineContentType("application/msword", "file.doc"));
                assertEquals("SPREADSHEET", Product.determineContentType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "file.xlsx"));
                assertEquals("SPREADSHEET", Product.determineContentType("application/vnd.ms-excel", "file.xls"));
                assertEquals("PRESENTATION", Product.determineContentType(
                                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                "file.pptx"));
                assertEquals("PRESENTATION", Product.determineContentType("application/vnd.ms-powerpoint", "file.ppt"));
                assertEquals("IMAGE", Product.determineContentType("image/png", "file.png"));
                assertEquals("IMAGE", Product.determineContentType("image/jpeg", "file.jpg"));
                assertEquals("IMAGE", Product.determineContentType("image/jpeg", "file.jpeg"));
                assertEquals("IMAGE", Product.determineContentType("image/webp", "file.webp"));
                assertEquals("AUDIO", Product.determineContentType("audio/mpeg", "file.mp3"));
                assertEquals("AUDIO", Product.determineContentType("audio/x-m4a", "file.m4a"));
                assertEquals("AUDIO", Product.determineContentType("audio/wav", "file.wav"));
                assertEquals("ZIP", Product.determineContentType("application/zip", "file.zip"));
                assertEquals("TEXT", Product.determineContentType("text/plain", "file.txt"));
        }

        @Test
        void testStateAndDistrictSlugNormalization() {
                assertEquals("andhra-pradesh",
                                Product.generateSlug(DriveToS3PipelineTask.normalizeName("State 1- Andhra Pradesh")));
                assertEquals("alluri-sitharama-raju", Product
                                .generateSlug(DriveToS3PipelineTask.normalizeName("Alluri Sitharama Raju District")));
        }

        @Test
        void testIngestionPipelineWorkflowAndDeduplication() throws Exception {
                // source-folder → "State 1- Andhra Pradesh" (folder)
                File stateFolder = mkFolder("state-folder-id", "State 1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

                // State folder → "Alluri Sitharama Raju District" (folder)
                File districtFolder = mkFolder("district-folder-id", "Alluri Sitharama Raju District");
                when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(districtFolder));

                // District folder → "Paid" (folder)
                File paidFolder = mkFolder("paid-folder-id", "Paid");
                when(googleDriveSyncService.listFilesInFolder("district-folder-id")).thenReturn(List.of(paidFolder));

                // Paid folder → "PDFs" (folder)
                File pdfsFolder = mkFolder("pdfs-folder-id", "PDFs");
                when(googleDriveSyncService.listFilesInFolder("paid-folder-id")).thenReturn(List.of(pdfsFolder));

                // PDFs folder → "Notes.pdf"
                File pdfFile = mkFile("pdf-file-id", "Notes.pdf", "application/pdf", 2048L);
                when(googleDriveSyncService.listFilesInFolder("pdfs-folder-id")).thenReturn(List.of(pdfFile));

                InputStream testInputStream = new ByteArrayInputStream("Mock File Content".getBytes());
                when(googleDriveSyncService.downloadFile("pdf-file-id")).thenReturn(testInputStream);

                String computedS3Key = "andhra-pradesh/alluri-sitharama-raju/paid/Notes.pdf";
                when(s3Service.uploadFileWithKey(any(), eq(2048L), eq(computedS3Key), eq("application/pdf")))
                                .thenReturn(computedS3Key);
                when(s3Service.getS3Url(computedS3Key)).thenReturn("http://aws-s3/test-bucket-name/" + computedS3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> inserted = productRepo.findAll();
                assertEquals(1, inserted.size(), "One product should be ingested");

                Product product = inserted.get(0);
                assertEquals("Notes", product.getTitle());
                assertEquals("andhra-pradesh", product.getStateSlug());
                assertEquals("alluri-sitharama-raju", product.getDistrictSlug());
                assertEquals("pdf", product.getFileExtension());
                assertEquals("PDF", product.getContentType());
                assertTrue(product.isPublished(), "Document must be auto-published");
                assertEquals(IngestionStatus.COMPLETED, product.getIngestionStatus());
                assertEquals("pdf-file-id", product.getGoogleDriveFileId());
                assertTrue(product.isArchived(), "File should be marked as archived");

                verify(s3Service, times(1)).uploadFileWithKey(any(), eq(2048L), eq(computedS3Key),
                                eq("application/pdf"));
                verify(googleDriveSyncService, times(1)).moveFileToArchive(eq("pdf-file-id"), eq("pdfs-folder-id"),
                                eq("archive-folder-id"));

                // ── Duplicate detection: second sync must skip ────────────────────
                reset(s3Service);
                reset(googleDriveSyncService);
                when(googleDriveSyncService.isConfigured()).thenReturn(true);
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("district-folder-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("paid-folder-id")).thenReturn(List.of(pdfsFolder));
                when(googleDriveSyncService.listFilesInFolder("pdfs-folder-id")).thenReturn(List.of(pdfFile));
                when(googleDriveSyncService.downloadFile("pdf-file-id"))
                                .thenReturn(new ByteArrayInputStream("Mock File Content".getBytes()));

                pipelineTask.syncDriveToS3(true);

                verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
                assertEquals(1, pipelineTask.getFilesSkipped());
        }

        @Test
        void testFreeResourcesIngestion() throws Exception {
                File freeFolder = mkFolder("free-folder-id", "Free Resources");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(freeFolder));

                File physicsFolder = mkFolder("physics-folder-id", "Physics");
                when(googleDriveSyncService.listFilesInFolder("free-folder-id")).thenReturn(List.of(physicsFolder));

                File textFile = mkFile("txt-file-id", "formula.txt", "text/plain", 500L);
                when(googleDriveSyncService.listFilesInFolder("physics-folder-id")).thenReturn(List.of(textFile));

                when(googleDriveSyncService.downloadFile("txt-file-id"))
                                .thenReturn(new ByteArrayInputStream("a^2+b^2=c^2".getBytes()));
                String computedS3Key = "free-resources/physics/formula.txt";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(computedS3Key), eq("text/plain")))
                                .thenReturn(computedS3Key);
                when(s3Service.getS3Url(computedS3Key)).thenReturn("http://s3/" + computedS3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> inserted = productRepo.findAll();
                assertEquals(1, inserted.size());
                Product p = inserted.get(0);
                assertTrue(p.isFree());
                assertEquals(0.0, p.getPrice());
                assertEquals("Physics", p.getNavbarCategory());
                assertEquals("general", p.getStateSlug());
        }

        @Test
        void testCategoryFolderMappingAndVariants() throws Exception {
                File stateFolder = mkFolder("state-folder-id", "State 1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

                File categoryFolder = mkFolder("category-folder-id", "Monuments");
                when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(categoryFolder));

                File paidFolder = mkFolder("paid-folder-id", "Paid");
                when(googleDriveSyncService.listFilesInFolder("category-folder-id")).thenReturn(List.of(paidFolder));

                File pdfFile = mkFile("pdf-file-id", "monuments_info.pdf", "application/pdf", 200L);
                when(googleDriveSyncService.listFilesInFolder("paid-folder-id")).thenReturn(List.of(pdfFile));

                when(googleDriveSyncService.downloadFile("pdf-file-id"))
                                .thenReturn(new ByteArrayInputStream("data".getBytes()));
                String computedS3Key = "andhra-pradesh/heritage-sites-monuments/monuments_info.pdf";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(computedS3Key), eq("application/pdf")))
                                .thenReturn(computedS3Key);
                when(s3Service.getS3Url(computedS3Key)).thenReturn("http://s3/" + computedS3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> inserted = productRepo.findAll();
                assertEquals(1, inserted.size());
                Product p = inserted.get(0);
                assertEquals("heritage-sites-monuments", p.getNavbarSlug());
                assertEquals("andhra-pradesh", p.getStateSlug());
                assertEquals("monuments", p.getDistrictSlug());
        }

        @Test
        void testArchiveSafetyOnFailure() throws Exception {
                File stateFolder = mkFolder("state-folder-id", "State 1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

                File districtFolder = mkFolder("district-folder-id", "Alluri");
                when(googleDriveSyncService.listFilesInFolder("state-folder-id")).thenReturn(List.of(districtFolder));

                File paidFolder = mkFolder("paid-folder-id", "Paid");
                when(googleDriveSyncService.listFilesInFolder("district-folder-id")).thenReturn(List.of(paidFolder));

                File pdfFile = mkFile("pdf-file-id", "FailingFile.pdf", "application/pdf", 100L);
                when(googleDriveSyncService.listFilesInFolder("paid-folder-id")).thenReturn(List.of(pdfFile));
                when(googleDriveSyncService.downloadFile("pdf-file-id"))
                                .thenReturn(new ByteArrayInputStream("data".getBytes()));
                when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                                .thenThrow(new RuntimeException("S3 Storage Write Error"));

                try {
                        pipelineTask.syncDriveToS3(true);
                } catch (Exception ignored) {
                }

                List<Product> products = productRepo.findAll();
                assertEquals(1, products.size());
                assertEquals(IngestionStatus.FAILED, products.get(0).getIngestionStatus());
                verify(googleDriveSyncService, never()).moveFileToArchive(anyString(), anyString(), anyString());
        }

        @Test
        void testFailClosedRejectsPathWithoutTierFolder() throws Exception {
                File stateFolder = mkFolder("fc-state-id", "State 1- Andhra Pradesh");
                File districtFolder = mkFolder("fc-district-id", "Alluri Sitharama Raju District");
                File pdfFile = mkFile("fc-pdf-file", "AmbiguousResource.pdf", "application/pdf", 1024L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("fc-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("fc-district-id")).thenReturn(List.of(pdfFile));

                // Sync pipeline execution
                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(0, products.size(),
                                "Ambiguous resource without Free/Paid folder must NOT be created in MongoDB");
                assertEquals(1, pipelineTask.getFilesFailed(), "Fail-closed pipeline must increment filesFailed count");
                verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
        }

        @Test
        void testAdminTriggerEndpoints() {
                String loginUrl = "http://localhost:" + port + "/api/auth/login";
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                String requestBody = "{\"emailOrPhone\":\"9958277244\",\"password\":\"BodhGanga@2026\"}";
                HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

                ResponseEntity<java.util.Map> loginResponse = restTemplate.postForEntity(loginUrl, entity,
                                java.util.Map.class);
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

        @Test
        void testSharedDriveListingDiscoveredAllFiles() throws Exception {
                File stateFolder = mkFolder("sd-state-id", "State 1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

                File apFolder = mkFolder("sd-ap-id", "1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("sd-state-id")).thenReturn(List.of(apFolder));

                File districtFolder = mkFolder("sd-district-id", "Alluri Sitharama Raju District");
                when(googleDriveSyncService.listFilesInFolder("sd-ap-id")).thenReturn(List.of(districtFolder));

                File paidFolder = mkFolder("sd-paid-id", "Paid");
                when(googleDriveSyncService.listFilesInFolder("sd-district-id")).thenReturn(List.of(paidFolder));

                File pdfsFolder = mkFolder("sd-pdfs-id", "PDFs");
                File docxFolder = mkFolder("sd-docx-id", "DOCX");
                File xlsxFolder = mkFolder("sd-xlsx-id", "XLSX");
                File pngFolder = mkFolder("sd-png-id", "PNG");
                File audioFolder = mkFolder("sd-audio-id", "Audio");
                when(googleDriveSyncService.listFilesInFolder("sd-paid-id"))
                                .thenReturn(List.of(pdfsFolder, docxFolder, xlsxFolder, pngFolder, audioFolder));

                String PREFIX = "andhra-pradesh/alluri-sitharama-raju/";

                File pdf = mkFile("sd-pdf-file", "GS_Paper1.pdf", "application/pdf", 512_000L);
                when(googleDriveSyncService.listFilesInFolder("sd-pdfs-id")).thenReturn(List.of(pdf));
                when(googleDriveSyncService.downloadFile("sd-pdf-file"))
                                .thenReturn(new ByteArrayInputStream(new byte[512]));
                String pdfKey = PREFIX + "paid/GS_Paper1.pdf";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(pdfKey), eq("application/pdf")))
                                .thenReturn(pdfKey);
                when(s3Service.getS3Url(pdfKey)).thenReturn("https://s3.example.com/" + pdfKey);

                File docx = mkFile("sd-docx-file", "Report.docx",
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 128_000L);
                when(googleDriveSyncService.listFilesInFolder("sd-docx-id")).thenReturn(List.of(docx));
                when(googleDriveSyncService.downloadFile("sd-docx-file"))
                                .thenReturn(new ByteArrayInputStream(new byte[128]));
                String docxKey = PREFIX + "paid/Report.docx";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(docxKey),
                                eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document")))
                                .thenReturn(docxKey);
                when(s3Service.getS3Url(docxKey)).thenReturn("https://s3.example.com/" + docxKey);

                File xlsx = mkFile("sd-xlsx-file", "Data.xlsx",
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 64_000L);
                when(googleDriveSyncService.listFilesInFolder("sd-xlsx-id")).thenReturn(List.of(xlsx));
                when(googleDriveSyncService.downloadFile("sd-xlsx-file"))
                                .thenReturn(new ByteArrayInputStream(new byte[64]));
                String xlsxKey = PREFIX + "paid/Data.xlsx";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(xlsxKey),
                                eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                                .thenReturn(xlsxKey);
                when(s3Service.getS3Url(xlsxKey)).thenReturn("https://s3.example.com/" + xlsxKey);

                File png = mkFile("sd-png-file", "Map.png", "image/png", 256_000L);
                when(googleDriveSyncService.listFilesInFolder("sd-png-id")).thenReturn(List.of(png));
                when(googleDriveSyncService.downloadFile("sd-png-file"))
                                .thenReturn(new ByteArrayInputStream(new byte[256]));
                String pngKey = PREFIX + "paid/Map.png";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(pngKey), eq("image/png"))).thenReturn(pngKey);
                when(s3Service.getS3Url(pngKey)).thenReturn("https://s3.example.com/" + pngKey);

                File m4a = mkFile("sd-m4a-file", "Lecture.m4a", "audio/x-m4a", 4_096_000L);
                when(googleDriveSyncService.listFilesInFolder("sd-audio-id")).thenReturn(List.of(m4a));
                when(googleDriveSyncService.downloadFile("sd-m4a-file"))
                                .thenReturn(new ByteArrayInputStream(new byte[4096]));
                String m4aKey = PREFIX + "paid/Lecture.m4a";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(m4aKey), eq("audio/x-m4a"))).thenReturn(m4aKey);
                when(s3Service.getS3Url(m4aKey)).thenReturn("https://s3.example.com/" + m4aKey);

                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(5, products.size(), "All 5 Shared Drive files must be discovered and ingested");

                for (Product p : products) {
                        assertTrue(p.isPublished());
                        assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
                        assertEquals("andhra-pradesh", p.getStateSlug());
                        assertEquals("alluri-sitharama-raju", p.getDistrictSlug());
                        assertTrue(p.isArchived());
                }

                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(pdfKey), eq("application/pdf"));
                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(docxKey),
                                eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(xlsxKey),
                                eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(pngKey), eq("image/png"));
                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(m4aKey), eq("audio/x-m4a"));
                verify(googleDriveSyncService, times(5)).moveFileToArchive(anyString(), anyString(),
                                eq("archive-folder-id"));
        }

        @Test
        void testMultiPagePaginationIngestsAllFiles() throws Exception {
                File stateFolder = mkFolder("paged-state-id", "Bihar");
                File districtFolder = mkFolder("paged-district-id", "Patna District");
                File paidFolder = mkFolder("paged-paid-id", "Paid");

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("paged-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("paged-district-id")).thenReturn(List.of(paidFolder));

                File pdf1 = mkFile("pg-pdf-1", "Chapter1.pdf", "application/pdf", 100L);
                File pdf2 = mkFile("pg-pdf-2", "Chapter2.pdf", "application/pdf", 200L);
                File pdf3 = mkFile("pg-pdf-3", "Chapter3.pdf", "application/pdf", 300L);
                File wav1 = mkFile("pg-wav-1", "Audio1.wav", "audio/wav", 400L);
                File txt1 = mkFile("pg-txt-1", "Notes1.txt", "text/plain", 50L);

                when(googleDriveSyncService.listFilesInFolder("paged-paid-id"))
                                .thenReturn(List.of(pdf1, pdf2, pdf3, wav1, txt1));

                for (File f : List.of(pdf1, pdf2, pdf3, wav1, txt1)) {
                        when(googleDriveSyncService.downloadFile(f.getId()))
                                        .thenReturn(new ByteArrayInputStream(
                                                        ("mock byte array content " + f.getId()).getBytes()));
                }
                when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                                .thenAnswer(invocation -> invocation.getArgument(2));
                when(s3Service.getS3Url(anyString()))
                                .thenAnswer(invocation -> "https://s3.example.com/" + invocation.getArgument(0));

                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(5, products.size(), "All 5 files from both pages must be ingested");

                verify(s3Service, times(5)).uploadFileWithKey(any(), anyLong(), anyString(), anyString());

                assertEquals(5, pipelineTask.getFilesProcessed());
                assertEquals(5, pipelineTask.getFilesUploaded());
                assertEquals(0, pipelineTask.getFilesFailed());

                assertTrue(products.stream()
                                .anyMatch(p -> "PDF".equals(p.getContentType()) && "Chapter1".equals(p.getTitle())));
                assertTrue(products.stream()
                                .anyMatch(p -> "PDF".equals(p.getContentType()) && "Chapter2".equals(p.getTitle())));
                assertTrue(products.stream()
                                .anyMatch(p -> "PDF".equals(p.getContentType()) && "Chapter3".equals(p.getTitle())));
                assertTrue(products.stream()
                                .anyMatch(p -> "AUDIO".equals(p.getContentType()) && "Audio1".equals(p.getTitle())));
                assertTrue(products.stream()
                                .anyMatch(p -> "TEXT".equals(p.getContentType()) && "Notes1".equals(p.getTitle())));
        }

        @Test
        void testSharedDriveDownloadSucceeds() throws Exception {
                File stateFolder = mkFolder("sd-state-id", "State 1- Andhra Pradesh");
                File districtFolder = mkFolder("sd-district-id", "Alluri");
                File paidFolder = mkFolder("sd-paid-id", "Paid");
                File sharedFile = mkFile("sd-download-id", "SharedDoc.pdf", "application/pdf", 8_192L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-district-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-paid-id")).thenReturn(List.of(sharedFile));

                byte[] content = "PDF content from Shared Drive".getBytes();
                when(googleDriveSyncService.downloadFile("sd-download-id"))
                                .thenReturn(new ByteArrayInputStream(content));

                String s3Key = "andhra-pradesh/alluri/paid/SharedDoc.pdf";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(s3Key), eq("application/pdf")))
                                .thenReturn(s3Key);
                when(s3Service.getS3Url(s3Key)).thenReturn("https://s3.example.com/" + s3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(1, products.size(), "Shared Drive file download must produce one product");

                Product p = products.get(0);
                assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
                assertEquals("PDF", p.getContentType());
                assertEquals("SharedDoc", p.getTitle());
                assertTrue(p.isPublished());
                assertTrue(p.isArchived());
                assertNotNull(p.getS3Url());

                verify(googleDriveSyncService, times(1)).downloadFile("sd-download-id");
                verify(s3Service, times(1)).uploadFileWithKey(any(), anyLong(), eq(s3Key), eq("application/pdf"));
        }

        @Test
        void testSharedDriveArchiveMoveAfterSuccessfulIngestion() throws Exception {
                File stateFolder = mkFolder("sd-state-id", "State 1- Andhra Pradesh");
                File districtFolder = mkFolder("sd-district-id", "Alluri");
                File paidFolder = mkFolder("sd-paid-id", "Paid");
                File sharedFile = mkFile("sd-archive-file-id", "Budget.xlsx",
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 32_768L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-district-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("sd-paid-id")).thenReturn(List.of(sharedFile));
                when(googleDriveSyncService.downloadFile("sd-archive-file-id"))
                                .thenReturn(new ByteArrayInputStream(new byte[256]));

                String s3Key = "andhra-pradesh/alluri/paid/Budget.xlsx";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(s3Key),
                                eq("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                                .thenReturn(s3Key);
                when(s3Service.getS3Url(s3Key)).thenReturn("https://s3.example.com/" + s3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(1, products.size());
                Product p = products.get(0);
                assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
                assertTrue(p.isArchived());

                verify(googleDriveSyncService, times(1))
                                .moveFileToArchive(eq("sd-archive-file-id"), eq("sd-paid-id"), eq("archive-folder-id"));
        }

        @Test
        void testGoogleWorkspaceDocumentIngestion() throws Exception {
                File stateFolder = mkFolder("gdoc-state-id", "State 1- Andhra Pradesh");
                File districtFolder = mkFolder("gdoc-district-id", "Alluri");
                File paidFolder = mkFolder("gdoc-paid-id", "Paid");
                File docFile = mkFile("gdoc-file-id", "WorkspaceNotes", "application/vnd.google-apps.document", 0L);
                docFile.setSize(null);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("gdoc-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("gdoc-district-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("gdoc-paid-id")).thenReturn(List.of(docFile));

                byte[] pdfExportBytes = "%PDF-1.4 Mock Export Content".getBytes();
                when(googleDriveSyncService.downloadFile("gdoc-file-id", "application/vnd.google-apps.document"))
                                .thenReturn(new ByteArrayInputStream(pdfExportBytes));

                String expectedS3Key = "andhra-pradesh/alluri/paid/WorkspaceNotes.pdf";
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq(expectedS3Key), eq("application/pdf")))
                                .thenReturn(expectedS3Key);
                when(s3Service.getS3Url(expectedS3Key)).thenReturn("https://s3.example.com/" + expectedS3Key);

                pipelineTask.syncDriveToS3(true);

                List<Product> products = productRepo.findAll();
                assertEquals(1, products.size());

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
                                .uploadFileWithKey(any(), anyLong(), eq(expectedS3Key), eq("application/pdf"));
                verify(googleDriveSyncService, times(1))
                                .moveFileToArchive(eq("gdoc-file-id"), eq("gdoc-paid-id"), eq("archive-folder-id"));
        }

        @Test
        void testSchedulerIdempotencyThreeRuns() throws Exception {
                File stateFolder = mkFolder("ap-state-id", "State 1- Andhra Pradesh");
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));

                File districtFolder = mkFolder("alluri-dist-id", "Alluri Sitharama Raju District");
                when(googleDriveSyncService.listFilesInFolder("ap-state-id")).thenReturn(List.of(districtFolder));

                File paidFolder = mkFolder("alluri-paid-id", "Paid");
                when(googleDriveSyncService.listFilesInFolder("alluri-dist-id")).thenReturn(List.of(paidFolder));

                File pdfsFolder = mkFolder("alluri-pdfs-id", "PDFs");
                when(googleDriveSyncService.listFilesInFolder("alluri-paid-id")).thenReturn(List.of(pdfsFolder));

                List<File> files = new ArrayList<>();
                for (int i = 1; i <= 5; i++) {
                        File f = mkFile("file-id-" + i, "Notes_Chapter_" + i + ".pdf", "application/pdf", 1024L * i);
                        files.add(f);

                        when(googleDriveSyncService.downloadFile("file-id-" + i))
                                        .thenReturn(new ByteArrayInputStream(
                                                        ("Chapter " + i + " mock content").getBytes()));

                        String s3Key = "andhra-pradesh/alluri-sitharama-raju/paid/Notes_Chapter_" + i + ".pdf";
                        when(s3Service.uploadFileWithKey(any(), anyLong(), eq(s3Key), eq("application/pdf")))
                                        .thenReturn(s3Key);
                        when(s3Service.getS3Url(s3Key)).thenReturn("https://s3/test-bucket/" + s3Key);
                }
                when(googleDriveSyncService.listFilesInFolder("alluri-pdfs-id")).thenReturn(files);

                // --- FIRST RUN ---
                pipelineTask.syncDriveToS3(true);

                List<Product> productsRun1 = productRepo.findAll();
                assertEquals(5, productsRun1.size());
                for (Product p : productsRun1) {
                        assertEquals(IngestionStatus.COMPLETED, p.getIngestionStatus());
                        assertTrue(p.isPublished());
                        assertTrue(p.getImportedFromDrive());
                        assertNotNull(p.getGoogleDriveFileId());
                        assertTrue(p.isArchived());
                }

                // --- SECOND RUN ---
                reset(s3Service);
                reset(googleDriveSyncService);

                when(googleDriveSyncService.isConfigured()).thenReturn(true);
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("ap-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-dist-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-paid-id")).thenReturn(List.of(pdfsFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-pdfs-id")).thenReturn(files);
                for (int i = 1; i <= 5; i++) {
                        when(googleDriveSyncService.downloadFile("file-id-" + i))
                                        .thenReturn(new ByteArrayInputStream(
                                                        ("Chapter " + i + " mock content").getBytes()));
                }

                pipelineTask.syncDriveToS3(true);

                List<Product> productsRun2 = productRepo.findAll();
                assertEquals(5, productsRun2.size(), "Second run must not create duplicate MongoDB documents");
                verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());

                // --- THIRD RUN ---
                reset(s3Service);
                reset(googleDriveSyncService);
                when(googleDriveSyncService.isConfigured()).thenReturn(true);
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("ap-state-id")).thenReturn(List.of(districtFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-dist-id")).thenReturn(List.of(paidFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-paid-id")).thenReturn(List.of(pdfsFolder));
                when(googleDriveSyncService.listFilesInFolder("alluri-pdfs-id")).thenReturn(files);
                for (int i = 1; i <= 5; i++) {
                        when(googleDriveSyncService.downloadFile("file-id-" + i))
                                        .thenReturn(new ByteArrayInputStream(
                                                        ("Chapter " + i + " mock content").getBytes()));
                }

                pipelineTask.syncDriveToS3(true);

                verify(s3Service, never()).uploadFileWithKey(any(), anyLong(), anyString(), anyString());
        }

        @Test
        void testStateImageIngestionAndAvailableStatesEndpoint() throws Exception {
                File imageFile = mkFile("haryana-img-id", "Haryana-image.png", "image/png", 51200L);
                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(imageFile));
                when(googleDriveSyncService.downloadFile("haryana-img-id"))
                                .thenReturn(new ByteArrayInputStream("mock-png-data".getBytes()));
                when(s3Service.uploadFileWithKey(any(), anyLong(), eq("states/haryana/Haryana-image.png"),
                                eq("image/png")))
                                .thenReturn("states/haryana/Haryana-image.png");
                when(s3Service.getS3Url("states/haryana/Haryana-image.png"))
                                .thenReturn("https://test-bucket-name.s3.eu-north-1.amazonaws.com/states/haryana/Haryana-image.png");

                pipelineTask.syncDriveToS3(true);

                verify(s3Service).uploadFileWithKey(any(), anyLong(), eq("states/haryana/Haryana-image.png"),
                                eq("image/png"));

                Product p = productRepo.findByGoogleDriveFileId("haryana-img-id");
                assertNotNull(p);
                assertEquals("Haryana", p.getState());
                assertEquals("haryana", p.getStateSlug());
                assertEquals("general", p.getDistrict());
                assertEquals("general", p.getDistrictSlug());
                assertEquals("Images", p.getNavbarCategory());
                assertEquals("states/haryana/Haryana-image.png", p.getStorageKey());
                assertTrue(p.isPublished());

                ResponseEntity<List> response = restTemplate
                                .getForEntity("http://localhost:" + port + "/api/states/available", List.class);
                assertEquals(HttpStatus.OK, response.getStatusCode());
                assertNotNull(response.getBody());
                boolean containsHaryana = response.getBody().stream()
                                .anyMatch(m -> "haryana".equals(((java.util.Map<?, ?>) m).get("stateSlug")));
                assertTrue(containsHaryana);
        }

        @Test
        void testMaharashtraAkolaAndHaryanaKurukshetraRegression() throws Exception {
                // Maharashtra -> Akola -> Paid -> File
                File mhState = mkFolder("mh-state-id", "Maharashtra");
                File akolaDist = mkFolder("akola-dist-id", "Akola");
                File mhPaid = mkFolder("mh-paid-id", "Paid");
                File mhFile = mkFile("mh-file-id", "Akola_Polity_Guide.pdf", "application/pdf", 100L);

                // Haryana -> Kurukshetra -> Free -> File
                File hrState = mkFolder("hr-state-id", "Haryana");
                File kuruDist = mkFolder("kuru-dist-id", "Kurukshetra");
                File hrFree = mkFolder("hr-free-id", "Free");
                File hrFile = mkFile("hr-file-id", "Kurukshetra_Notes.pdf", "application/pdf", 100L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id"))
                                .thenReturn(List.of(mhState, hrState));
                when(googleDriveSyncService.listFilesInFolder("mh-state-id")).thenReturn(List.of(akolaDist));
                when(googleDriveSyncService.listFilesInFolder("akola-dist-id")).thenReturn(List.of(mhPaid));
                when(googleDriveSyncService.listFilesInFolder("mh-paid-id")).thenReturn(List.of(mhFile));

                when(googleDriveSyncService.listFilesInFolder("hr-state-id")).thenReturn(List.of(kuruDist));
                when(googleDriveSyncService.listFilesInFolder("kuru-dist-id")).thenReturn(List.of(hrFree));
                when(googleDriveSyncService.listFilesInFolder("hr-free-id")).thenReturn(List.of(hrFile));

                when(googleDriveSyncService.downloadFile("mh-file-id"))
                                .thenReturn(new ByteArrayInputStream("mh content".getBytes()));
                when(googleDriveSyncService.downloadFile("hr-file-id"))
                                .thenReturn(new ByteArrayInputStream("hr content".getBytes()));

                when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                                .thenAnswer(i -> i.getArgument(2));
                when(s3Service.getS3Url(anyString())).thenAnswer(i -> "https://s3.example.com/" + i.getArgument(0));

                pipelineTask.syncDriveToS3(true);

                Product mhProduct = productRepo.findByGoogleDriveFileId("mh-file-id");
                assertNotNull(mhProduct);
                assertEquals("maharashtra", mhProduct.getStateSlug());
                assertEquals("akola", mhProduct.getDistrictSlug());
                assertFalse(mhProduct.isFree());

                Product hrProduct = productRepo.findByGoogleDriveFileId("hr-file-id");
                assertNotNull(hrProduct);
                assertEquals("haryana", hrProduct.getStateSlug());
                assertEquals("kurukshetra", hrProduct.getDistrictSlug());
                assertTrue(hrProduct.isFree());
        }

        @Test
        void testAdditionalStatesRegression() throws Exception {
                // Rajasthan -> Paid
                File rjState = mkFolder("rj-state-id", "Rajasthan");
                File rjDist = mkFolder("rj-dist-id", "Jaipur");
                File rjPaid = mkFolder("rj-paid-id", "Paid");
                File rjFile = mkFile("rj-file-id", "Rajasthan_History.pdf", "application/pdf", 100L);

                // Bihar -> Free
                File brState = mkFolder("br-state-id", "Bihar");
                File brDist = mkFolder("br-dist-id", "Patna");
                File brFree = mkFolder("br-free-id", "Free");
                File brFile = mkFile("br-file-id", "Bihar_Geography.pdf", "application/pdf", 100L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id"))
                                .thenReturn(List.of(rjState, brState));
                when(googleDriveSyncService.listFilesInFolder("rj-state-id")).thenReturn(List.of(rjDist));
                when(googleDriveSyncService.listFilesInFolder("rj-dist-id")).thenReturn(List.of(rjPaid));
                when(googleDriveSyncService.listFilesInFolder("rj-paid-id")).thenReturn(List.of(rjFile));

                when(googleDriveSyncService.listFilesInFolder("br-state-id")).thenReturn(List.of(brDist));
                when(googleDriveSyncService.listFilesInFolder("br-dist-id")).thenReturn(List.of(brFree));
                when(googleDriveSyncService.listFilesInFolder("br-free-id")).thenReturn(List.of(brFile));

                when(googleDriveSyncService.downloadFile("rj-file-id"))
                                .thenReturn(new ByteArrayInputStream("rj content".getBytes()));
                when(googleDriveSyncService.downloadFile("br-file-id"))
                                .thenReturn(new ByteArrayInputStream("br content".getBytes()));

                when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                                .thenAnswer(i -> i.getArgument(2));
                when(s3Service.getS3Url(anyString())).thenAnswer(i -> "https://s3.example.com/" + i.getArgument(0));

                pipelineTask.syncDriveToS3(true);

                Product rj = productRepo.findByGoogleDriveFileId("rj-file-id");
                assertNotNull(rj);
                assertEquals("rajasthan", rj.getStateSlug());
                assertFalse(rj.isFree());

                Product br = productRepo.findByGoogleDriveFileId("br-file-id");
                assertNotNull(br);
                assertEquals("bihar", br.getStateSlug());
                assertTrue(br.isFree());
        }

        @Test
        void testNonThrowingFailClosedSync() throws Exception {
                File stateFolder = mkFolder("nt-state-id", "Haryana");
                File districtFolder = mkFolder("nt-dist-id", "Kurukshetra");
                File paidFolder = mkFolder("nt-paid-id", "Paid");

                File validFile = mkFile("valid-paid-file", "ValidPaidNotes.pdf", "application/pdf", 100L);
                File unknownFile = mkFile("unknown-tier-file", "AmbiguousNotes.pdf", "application/pdf", 100L);

                when(googleDriveSyncService.listFilesInFolder("source-folder-id")).thenReturn(List.of(stateFolder));
                when(googleDriveSyncService.listFilesInFolder("nt-state-id")).thenReturn(List.of(districtFolder));
                // districtFolder contains paidFolder AND direct unknownFile
                when(googleDriveSyncService.listFilesInFolder("nt-dist-id"))
                                .thenReturn(List.of(paidFolder, unknownFile));
                when(googleDriveSyncService.listFilesInFolder("nt-paid-id")).thenReturn(List.of(validFile));

                when(googleDriveSyncService.downloadFile("valid-paid-file"))
                                .thenReturn(new ByteArrayInputStream("valid data".getBytes()));
                when(s3Service.uploadFileWithKey(any(), anyLong(), anyString(), anyString()))
                                .thenAnswer(i -> i.getArgument(2));
                when(s3Service.getS3Url(anyString())).thenAnswer(i -> "https://s3.example.com/" + i.getArgument(0));

                pipelineTask.syncDriveToS3(true);

                // Valid file should be ingested successfully
                Product validProd = productRepo.findByGoogleDriveFileId("valid-paid-file");
                assertNotNull(validProd);
                assertFalse(validProd.isFree());

                // Unknown file should NOT be created
                Product unknownProd = productRepo.findByGoogleDriveFileId("unknown-tier-file");
                assertNull(unknownProd);

                // filesFailed count should be 1
                assertEquals(1, pipelineTask.getFilesFailed());
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
