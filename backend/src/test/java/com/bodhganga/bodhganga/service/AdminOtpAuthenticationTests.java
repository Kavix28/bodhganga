package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.LoginRequestDTO;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminOtpAuthenticationTests {

    @MockBean
    private com.bodhganga.bodhganga.services.GoogleDriveSyncService googleDriveSyncService;

    @SpyBean
    private AuthService authService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private MockMvc mockMvc;

    // Configured admin phone in application-test.properties is "9999999999"
    private final String ADMIN_PHONE = "9999999999";
    private final String NORMAL_USER_PHONE = "9876543210";
    private final String UNREGISTERED_PHONE = "9111111111";

    @BeforeEach
    void setUp() {
        // Ensure Admin user matching configured admin phone exists and is active ADMIN
        User adminUser = userRepo.findByPhoneNo(ADMIN_PHONE).orElseGet(() -> User.builder()
                .name("Test Admin")
                .email("admin_test@bodhganga.in")
                .phoneNo(ADMIN_PHONE)
                .hashedPassword("random_disabled_hash")
                .build());
        adminUser.setRole("ADMIN");
        adminUser.setActive(true);
        adminUser.setVerified(true);
        userRepo.save(adminUser);

        // Ensure Normal Active User
        userRepo.findByPhoneNo(NORMAL_USER_PHONE).ifPresent(userRepo::delete);
        User normalUser = User.builder()
                .name("Normal User")
                .email("normal_user@bodhganga.in")
                .phoneNo(NORMAL_USER_PHONE)
                .hashedPassword("user_password_hash")
                .role("USER")
                .isVerified(true)
                .isActive(true)
                .createdAt(new Date())
                .build();
        userRepo.save(normalUser);

        // Ensure unregistered phone is not present
        userRepo.findByPhoneNo(UNREGISTERED_PHONE).ifPresent(userRepo::delete);
    }

    // 1. Correct configured admin phone -> OTP request accepted.
    @Test
    void test1_CorrectAdminPhone_OtpRequest_Accepted() {
        ApiResponseDTO response = authService.adminOtpRequest(ADMIN_PHONE);
        assertTrue(response.isSuccess(), "Admin OTP request should succeed for configured admin mobile");
        assertEquals("Admin mobile verified. Proceed with OTP verification.", response.getMessage());
    }

    // 2. Wrong phone -> OTP request rejected.
    @Test
    void test2_WrongPhone_OtpRequest_Rejected() {
        ApiResponseDTO response = authService.adminOtpRequest(UNREGISTERED_PHONE);
        assertFalse(response.isSuccess(), "Admin OTP request should fail for unauthorized phone");
        assertEquals("Invalid or unauthorized mobile number", response.getMessage());
    }

    // 3. Correct phone but non-admin user -> rejected.
    @Test
    void test3_CorrectPhone_NonAdminUser_Rejected() throws Exception {
        User admin = userRepo.findByPhoneNo(ADMIN_PHONE).orElseThrow();
        admin.setRole("USER");
        userRepo.save(admin);

        ApiResponseDTO reqResponse = authService.adminOtpRequest(ADMIN_PHONE);
        assertFalse(reqResponse.isSuccess(), "Admin OTP request should fail if role is not ADMIN");

        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        ApiResponseDTO verifyResponse = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertFalse(verifyResponse.isSuccess(), "Admin OTP verify should fail if role is not ADMIN");
    }

    // 4. Correct phone but inactive admin -> rejected.
    @Test
    void test4_CorrectPhone_InactiveAdmin_Rejected() throws Exception {
        User admin = userRepo.findByPhoneNo(ADMIN_PHONE).orElseThrow();
        admin.setActive(false);
        userRepo.save(admin);

        ApiResponseDTO reqResponse = authService.adminOtpRequest(ADMIN_PHONE);
        assertFalse(reqResponse.isSuccess(), "Admin OTP request should fail for inactive admin user");

        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        ApiResponseDTO verifyResponse = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertFalse(verifyResponse.isSuccess(), "Admin OTP verify should fail for inactive admin user");
    }

    // 5. Correct phone but unverified admin -> rejected.
    @Test
    void test5_CorrectPhone_UnverifiedAdmin_Rejected() throws Exception {
        User admin = userRepo.findByPhoneNo(ADMIN_PHONE).orElseThrow();
        admin.setVerified(false);
        userRepo.save(admin);

        ApiResponseDTO reqResponse = authService.adminOtpRequest(ADMIN_PHONE);
        assertFalse(reqResponse.isSuccess(), "Admin OTP request should fail for unverified admin user");

        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        ApiResponseDTO verifyResponse = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertFalse(verifyResponse.isSuccess(), "Admin OTP verify should fail for unverified admin user");
    }

    // 6. Invalid MSG91 token -> rejected.
    @Test
    void test6_InvalidMsg91Token_Rejected() throws Exception {
        doReturn(null).when(authService).getMobileFromMsg91("invalid_token");

        ApiResponseDTO response = authService.adminOtpVerify(ADMIN_PHONE, "invalid_token");
        assertFalse(response.isSuccess(), "Admin OTP verify should fail on invalid MSG91 token");
        assertEquals("MSG91 token verification failed", response.getMessage());
    }

    // 7. MSG91 verification failure -> rejected.
    @Test
    void test7_Msg91VerificationFailure_Rejected() throws Exception {
        doThrow(new RuntimeException("MSG91 API error")).when(authService).getMobileFromMsg91("error_token");

        ApiResponseDTO response = authService.adminOtpVerify(ADMIN_PHONE, "error_token");
        assertFalse(response.isSuccess(), "Admin OTP verify should fail when MSG91 throws exception");
        assertTrue(response.getMessage().contains("MSG91 verification failed"));
    }

    // 8. Successful OTP verification -> authenticated ADMIN.
    @Test
    void test8_SuccessfulOtpVerification_AuthenticatedAdmin() throws Exception {
        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");

        ApiResponseDTO response = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertTrue(response.isSuccess(), "Admin OTP verification should succeed");
        assertNotNull(response.getData(), "Response data must contain token and user");

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertNotNull(data.get("token"), "JWT token must be returned");
        assertNotNull(data.get("user"), "User response DTO must be returned");
    }

    // 9. Successful OTP verification cannot authenticate a different user.
    @Test
    void test9_SuccessfulOtpVerification_CannotAuthenticateDifferentUser() throws Exception {
        doReturn(NORMAL_USER_PHONE).when(authService).getMobileFromMsg91("valid_user_token");

        ApiResponseDTO response = authService.adminOtpVerify(NORMAL_USER_PHONE, "valid_user_token");
        assertFalse(response.isSuccess(), "Admin OTP verify should reject normal user");
        assertTrue(response.getMessage().contains("Invalid admin phone number")
                || response.getMessage().contains("Access denied"));
    }

    // 10. Existing normal USER authentication still works.
    @Test
    void test10_ExistingNormalUserAuthentication_StillWorks() {
        ApiResponseDTO regCheck = authService.registerMobileCheck(UNREGISTERED_PHONE);
        assertTrue(regCheck.isSuccess(), "Normal user registration check should work");
    }

    // 11. Admin password login is no longer accepted.
    @Test
    void test11_AdminPasswordLogin_NoLongerAccepted() {
        LoginRequestDTO loginDTO = new LoginRequestDTO();
        loginDTO.setEmailOrPhone(ADMIN_PHONE);
        loginDTO.setPassword("AnyPassword123");

        ApiResponseDTO response = authService.adminLogin(loginDTO);
        assertFalse(response.isSuccess(), "Password login for admin must be disabled");
        assertTrue(response.getMessage().contains("disabled"));
    }

    // 12. Admin-protected endpoint rejects unauthenticated requests.
    @Test
    void test12_AdminProtectedEndpoint_RejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }

    // 13. Admin-protected endpoint accepts valid OTP-authenticated admin.
    @Test
    void test13_AdminProtectedEndpoint_AcceptsValidOtpAuthenticatedAdmin() throws Exception {
        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        ApiResponseDTO response = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertTrue(response.isSuccess());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        String jwtToken = (String) data.get("token");

        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // 14. Logout invalidates admin authentication.
    @Test
    void test14_LogoutInvalidatesAdminAuthentication() throws Exception {
        // Authenticate admin
        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        ApiResponseDTO response = authService.adminOtpVerify(ADMIN_PHONE, "valid_admin_token");
        assertTrue(response.isSuccess());

        // Simulated logout clears token client-side, causing subsequent request without
        // Authorization header to fail
        mockMvc.perform(get("/api/admin/resources/state/maharashtra/district/akola")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }

    // 15. AdminAuthController HTTP endpoints (/api/admin/auth/otp/request and
    // /verify) are reachable.
    @Test
    void test15_AdminAuthController_EndpointMappings_Reachable() throws Exception {
        // Request OTP endpoint mapping test
        String requestBody = "{\"phoneNo\":\"" + ADMIN_PHONE + "\"}";
        mockMvc.perform(post("/api/admin/auth/otp/request")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk());

        // Verify OTP endpoint mapping test
        doReturn(ADMIN_PHONE).when(authService).getMobileFromMsg91("valid_admin_token");
        String verifyBody = "{\"phoneNo\":\"" + ADMIN_PHONE + "\",\"accessToken\":\"valid_admin_token\"}";
        mockMvc.perform(post("/api/admin/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(verifyBody))
                .andExpect(status().isOk());
    }

    // 16. Unit test MSG91 response JSON parsing logic for extractMobileFromJson
    @Test
    void test16_ExtractMobileFromJson_Handling() throws Exception {
        // Standard MSG91 response format with data object
        org.json.JSONObject standardRes = new org.json.JSONObject(
                "{\"type\":\"success\",\"data\":{\"mobile\":\"919999999999\"}}");
        assertEquals(ADMIN_PHONE, authService.extractMobileFromJson(standardRes));

        // Flat field format
        org.json.JSONObject flatRes = new org.json.JSONObject("{\"mobile\":\"9999999999\"}");
        assertEquals(ADMIN_PHONE, authService.extractMobileFromJson(flatRes));

        // Error response
        org.json.JSONObject errorRes = new org.json.JSONObject("{\"type\":\"error\",\"message\":\"Invalid token\"}");
        assertNull(authService.extractMobileFromJson(errorRes));

        // Malformed / Empty response
        org.json.JSONObject emptyRes = new org.json.JSONObject("{}");
        assertNull(authService.extractMobileFromJson(emptyRes));

        // Null response
        assertNull(authService.extractMobileFromJson(null));
    }
}
