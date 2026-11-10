package com.bodhganga.bodhganga.security;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.GoogleDriveSyncService;
import com.bodhganga.bodhganga.services.S3RecoveryService;
import com.bodhganga.bodhganga.services.S3RecoveryService.RecoveryResult;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.services.YouTubeSyncService;
import com.bodhganga.bodhganga.services.qb.QuestionBankDriveService;
import com.bodhganga.bodhganga.services.qb.QuestionBankPipelineTask;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Production authorization hardening & security regression suite for BodhGanga backend.
 * Verifies that administrative synchronization and S3-to-product recovery operations
 * strictly enforce ROLE_ADMIN at both the HTTP security layer and method-level @PreAuthorize layer.
 * All underlying services are mocked to guarantee zero invocation of actual business logic on unauthorized access.
 */
@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminEndpointAuthorizationSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DriveToS3PipelineTask stateTask;

    @MockBean
    private QuestionBankPipelineTask qbTask;

    @MockBean
    private YouTubeSyncService youTubeSyncService;

    @MockBean
    private S3RecoveryService s3RecoveryService;

    @MockBean
    private S3Service s3Service;

    @MockBean
    private GoogleDriveSyncService genericDriveService;

    @MockBean
    private QuestionBankDriveService qbDriveService;

    @BeforeEach
    void setUp() {
        reset(stateTask, qbTask, youTubeSyncService, s3RecoveryService);
    }

    // =========================================================================
    // 1. POST /api/admin/system/state-sync (State Notes Sync)
    // =========================================================================

    @Test
    @DisplayName("1A. Anonymous request to /api/admin/system/state-sync is rejected with 401/403 and never invokes stateTask")
    void testStateSync_Anonymous_Rejected() throws Exception {
        mockMvc.perform(post("/api/admin/system/state-sync"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(stateTask);
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("1B. Authenticated USER request to /api/admin/system/state-sync is rejected with 403 Forbidden and never invokes stateTask")
    void testStateSync_UserRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/admin/system/state-sync"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(stateTask);
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("1C. Authenticated ADMIN request to /api/admin/system/state-sync is authorized with 200 OK and invokes stateTask")
    void testStateSync_AdminRole_Authorized() throws Exception {
        doNothing().when(stateTask).syncDriveToS3(true);

        mockMvc.perform(post("/api/admin/system/state-sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("State Notes pipeline triggered successfully."));

        verify(stateTask, times(1)).syncDriveToS3(true);
    }

    // =========================================================================
    // 2. POST /api/admin/system/qb-sync (Question Bank Sync)
    // =========================================================================

    @Test
    @DisplayName("2A. Anonymous request to /api/admin/system/qb-sync is rejected with 401/403 and never invokes qbTask")
    void testQbSync_Anonymous_Rejected() throws Exception {
        mockMvc.perform(post("/api/admin/system/qb-sync"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(qbTask);
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("2B. Authenticated USER request to /api/admin/system/qb-sync is rejected with 403 Forbidden and never invokes qbTask")
    void testQbSync_UserRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/admin/system/qb-sync"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(qbTask);
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("2C. Authenticated ADMIN request to /api/admin/system/qb-sync is authorized with 200 OK and invokes qbTask")
    void testQbSync_AdminRole_Authorized() throws Exception {
        when(qbTask.syncQuestionBank(true))
                .thenReturn(new QuestionBankPipelineTask.PipelineRunResult("COMPLETED", "Success", 1, 1, 10));

        mockMvc.perform(post("/api/admin/system/qb-sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Question Bank pipeline triggered successfully."));

        verify(qbTask, times(1)).syncQuestionBank(true);
    }

    // =========================================================================
    // 3. POST /api/admin/system/youtube-sync (YouTube Sync)
    // =========================================================================

    @Test
    @DisplayName("3A. Anonymous request to /api/admin/system/youtube-sync is rejected with 401/403 and never invokes youTubeSyncService")
    void testYouTubeSync_Anonymous_Rejected() throws Exception {
        mockMvc.perform(post("/api/admin/system/youtube-sync"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(youTubeSyncService);
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("3B. Authenticated USER request to /api/admin/system/youtube-sync is rejected with 403 Forbidden and never invokes youTubeSyncService")
    void testYouTubeSync_UserRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/admin/system/youtube-sync"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(youTubeSyncService);
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("3C. Authenticated ADMIN request to /api/admin/system/youtube-sync is authorized with 200 OK and invokes youTubeSyncService")
    void testYouTubeSync_AdminRole_Authorized() throws Exception {
        doNothing().when(youTubeSyncService).syncVideos();

        mockMvc.perform(post("/api/admin/system/youtube-sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("YouTube video sync triggered successfully."));

        verify(youTubeSyncService, times(1)).syncVideos();
    }

    // =========================================================================
    // 4. POST /api/admin/recovery/s3-to-products (S3 Recovery)
    // =========================================================================

    @Test
    @DisplayName("4A. Anonymous request to /api/admin/recovery/s3-to-products is rejected with 401/403 and never invokes s3RecoveryService")
    void testS3Recovery_Anonymous_Rejected() throws Exception {
        mockMvc.perform(post("/api/admin/recovery/s3-to-products"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(s3RecoveryService);
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("4B. Authenticated USER request to /api/admin/recovery/s3-to-products is rejected with 403 Forbidden and never invokes s3RecoveryService")
    void testS3Recovery_UserRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/admin/recovery/s3-to-products"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(s3RecoveryService);
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("4C. Authenticated ADMIN request to /api/admin/recovery/s3-to-products is authorized with 200 OK and invokes s3RecoveryService")
    void testS3Recovery_AdminRole_Authorized() throws Exception {
        when(s3RecoveryService.recoverS3ObjectsToProducts())
                .thenReturn(new RecoveryResult(10, 5, 5, 0));

        mockMvc.perform(post("/api/admin/recovery/s3-to-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scanned").value(10))
                .andExpect(jsonPath("$.imported").value(5))
                .andExpect(jsonPath("$.skipped").value(5))
                .andExpect(jsonPath("$.failed").value(0));

        verify(s3RecoveryService, times(1)).recoverS3ObjectsToProducts();
    }

    // =========================================================================
    // 5. GET /api/admin/system/health (System Diagnostics Route Group Protection)
    // =========================================================================

    @Test
    @DisplayName("5A. Anonymous request to GET /api/admin/system/health is rejected with 401/403")
    void testSystemHealth_Anonymous_Rejected() throws Exception {
        mockMvc.perform(get("/api/admin/system/health"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("5B. Authenticated USER request to GET /api/admin/system/health is rejected with 403 Forbidden")
    void testSystemHealth_UserRole_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/system/health"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("5C. Authenticated ADMIN request to GET /api/admin/system/health is authorized with 200 OK")
    void testSystemHealth_AdminRole_Authorized() throws Exception {
        when(genericDriveService.isConfigured()).thenReturn(true);
        when(qbDriveService.isConfigured()).thenReturn(true);

        mockMvc.perform(get("/api/admin/system/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // =========================================================================
    // 6. Source-Level Security Matcher Regression Assertion
    // =========================================================================

    @Test
    @DisplayName("6. Regression Assertion: SecurityConfig permitAll() matcher does not contain administrative route patterns")
    void testSecurityConfigPermitAllDoesNotContainAdminPatterns() throws IOException {
        Path configPath = Path.of("src/main/java/com/bodhganga/bodhganga/config/SecurityConfig.java");
        if (!Files.exists(configPath)) {
            configPath = Path.of("backend/src/main/java/com/bodhganga/bodhganga/config/SecurityConfig.java");
        }
        assertTrue(Files.exists(configPath), "SecurityConfig.java must exist at: " + configPath);
        String content = Files.readString(configPath);

        // Find the permitAll() block under authorizeHttpRequests
        int permitAllIdx = content.indexOf(".permitAll()");
        assertTrue(permitAllIdx > 0, "permitAll() must exist in SecurityConfig.java");
        String permitAllSection = content.substring(0, permitAllIdx);

        assertFalse(permitAllSection.contains("\"/api/admin/system/**\""),
                "SecurityConfig permitAll matcher must NOT contain /api/admin/system/**");
        assertFalse(permitAllSection.contains("\"/api/admin/recovery/**\""),
                "SecurityConfig permitAll matcher must NOT contain /api/admin/recovery/**");

        // Verify explicit ROLE_ADMIN matcher exists for both route groups
        assertTrue(content.contains(".requestMatchers(\"/api/admin/system/**\").hasAuthority(\"ROLE_ADMIN\")"),
                "SecurityConfig must explicitly require ROLE_ADMIN for /api/admin/system/**");
        assertTrue(content.contains(".requestMatchers(\"/api/admin/recovery/**\").hasAuthority(\"ROLE_ADMIN\")"),
                "SecurityConfig must explicitly require ROLE_ADMIN for /api/admin/recovery/**");
    }
}

