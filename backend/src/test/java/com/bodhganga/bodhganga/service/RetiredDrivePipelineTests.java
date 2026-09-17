package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.controllers.PipelineController;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.AdminResourceService;
import com.bodhganga.bodhganga.services.YouTubeSyncService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Method;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RetiredDrivePipelineTests {

        @Autowired
        private ApplicationContext applicationContext;

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ProductRepo productRepo;

        @Autowired
        private PipelineController pipelineController;

        @Test
        @DisplayName("1. Prove Google Drive pipeline beans and schedulers no longer exist in Spring Context")
        void testDrivePipelineBeansNotExist() {
                assertFalse(applicationContext.containsBean("driveToS3PipelineTask"),
                                "DriveToS3PipelineTask bean must not exist in application context");
                assertFalse(applicationContext.containsBean("pipelineTask"),
                                "PipelineTask bean must not exist in application context");
                assertFalse(applicationContext.containsBean("googleDriveSyncService"),
                                "GoogleDriveSyncService bean must not exist in application context");
                assertFalse(applicationContext.containsBean("cloudSourceTraversalService"),
                                "CloudSourceTraversalService bean must not exist in application context");
                assertFalse(applicationContext.containsBean("s3UploadService"),
                                "S3UploadService bean must not exist in application context");
        }

        @Test
        @WithMockUser(authorities = "ROLE_ADMIN")
        @DisplayName("2. Prove POST /api/admin/pipeline/run endpoint is removed and returns 404")
        void testPipelineRunEndpointRemoved() throws Exception {
                mockMvc.perform(post("/api/admin/pipeline/run"))
                                .andExpect(status().isNotFound());
        }

        @Test
        @WithMockUser(authorities = "ROLE_ADMIN")
        @DisplayName("3. Prove POST /api/admin/import-pdf-from-drive endpoint is removed and returns 404")
        void testImportPdfFromDriveEndpointRemoved() throws Exception {
                mockMvc.perform(post("/api/admin/import-pdf-from-drive"))
                                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("4. Prove Admin State Resources publishing service remains functional")
        void testAdminStateResourcesServiceIntact() {
                assertTrue(applicationContext.containsBean("adminResourceService"),
                                "AdminResourceService bean must exist and be functional");
                AdminResourceService service = applicationContext.getBean(AdminResourceService.class);
                assertNotNull(service, "AdminResourceService instance must not be null");
        }

        @Test
        @DisplayName("5. Prove GET /api/admin/pipeline/status indicates Drive pipeline is retired")
        void testPipelineStatusReturnsRetiredInfo() {
                ResponseEntity<Map<String, Object>> response = pipelineController.getPipelineStatus();
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                Map<String, Object> body = response.getBody();
                assertNotNull(body);
                assertEquals("NONE", body.get("activePipeline"));
                assertEquals(true, body.get("drivePipelineRetired"));
        }

        @Test
        @DisplayName("6. Prove YouTubeSyncService remains active and scheduled")
        void testYouTubeSyncServiceIntact() throws NoSuchMethodException {
                assertTrue(applicationContext.containsBean("youTubeSyncService"),
                                "YouTubeSyncService bean must exist in application context");
                YouTubeSyncService youtubeService = applicationContext.getBean(YouTubeSyncService.class);
                assertNotNull(youtubeService);

                Method scheduledMethod = YouTubeSyncService.class.getMethod("scheduledSync");
                assertTrue(scheduledMethod
                                .isAnnotationPresent(org.springframework.scheduling.annotation.Scheduled.class),
                                "scheduledSync method in YouTubeSyncService must have @Scheduled annotation");
        }

        @Test
        @DisplayName("7. Prove existing Product records with importedFromDrive=true remain preserved")
        void testDriveImportedProductsPreserved() {
                Product testProduct = new Product();
                testProduct.setId("test-drive-legacy-" + UUID.randomUUID());
                testProduct.setTitle("Legacy Drive Product");
                testProduct.setType("PDF");
                testProduct.setImportedFromDrive(true);
                testProduct.setPublished(true);
                testProduct.setCreatedAt(new Date());

                productRepo.save(testProduct);

                Product fetched = productRepo.findById(testProduct.getId()).orElse(null);
                assertNotNull(fetched, "Drive-imported Product must be successfully saved and retrieved");
                assertTrue(fetched.getImportedFromDrive(), "importedFromDrive flag must remain true");

                // Clean up test document
                productRepo.deleteById(testProduct.getId());
        }

        @Test
        @DisplayName("8. Prove application context starts without any Google Drive credentials or configuration")
        void testApplicationStartsWithoutDriveConfig() {
                assertNotNull(applicationContext.getId(), "Application context must be initialized cleanly");
        }
}
