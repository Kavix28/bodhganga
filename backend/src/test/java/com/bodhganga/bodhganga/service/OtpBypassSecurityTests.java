package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.SignupRequestDTO;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;

@SpringBootTest(classes = com.bodhganga.bodhganga.BodhgangaApplication.class)
@ActiveProfiles("test")
public class OtpBypassSecurityTests {

    @SpyBean
    private AuthService authService;

    @Autowired
    private UserRepo userRepo;

    private SignupRequestDTO testSignupData;

    @BeforeEach
    void setUp() {
        // Clean up any previous test user
        userRepo.findByPhoneNo("9876543210").ifPresent(user -> userRepo.delete(user));
        userRepo.findByPhoneNo("9999999999").ifPresent(user -> userRepo.delete(user));

        testSignupData = new SignupRequestDTO();
        testSignupData.setName("Arjun Sharma");
        testSignupData.setEmail("arjun@domain.com");
        testSignupData.setPhoneNo("9876543210");
        testSignupData.setPassword("SecurePass123");
        testSignupData.setCity("Jaipur");
        testSignupData.setState("Rajasthan");
        testSignupData.setCountry("India");
    }

    @Test
    void testCase1_InvalidToken() throws Exception {
        System.out.println("=== TEST CASE 1: Invalid Token ===");
        long beforeCount = userRepo.count();
        System.out.println("Users count BEFORE: " + beforeCount);

        // Mock MSG91 to fail
        doReturn(null).when(authService).getMobileFromMsg91("invalid_token");

        ApiResponseDTO response = authService.verifyMsg91Token("invalid_token", "9876543210", testSignupData);

        long afterCount = userRepo.count();
        System.out.println("Users count AFTER: " + afterCount);

        assertFalse(response.isSuccess(), "Registration should fail");
        assertEquals("MSG91 verification failed", response.getMessage());
        assertEquals(beforeCount, afterCount, "User count must not change");
        System.out.println("Test Case 1 PASSED.\n");
    }

    @Test
    void testCase2_ExpiredToken() throws Exception {
        System.out.println("=== TEST CASE 2: Expired Token ===");
        long beforeCount = userRepo.count();
        System.out.println("Users count BEFORE: " + beforeCount);

        // Mock MSG91 to fail
        doReturn(null).when(authService).getMobileFromMsg91("expired_token");

        ApiResponseDTO response = authService.verifyMsg91Token("expired_token", "9876543210", testSignupData);

        long afterCount = userRepo.count();
        System.out.println("Users count AFTER: " + afterCount);

        assertFalse(response.isSuccess(), "Registration should fail");
        assertEquals("MSG91 verification failed", response.getMessage());
        assertEquals(beforeCount, afterCount, "User count must not change");
        System.out.println("Test Case 2 PASSED.\n");
    }

    @Test
    void testCase3_RandomToken() throws Exception {
        System.out.println("=== TEST CASE 3: Random Token ===");
        long beforeCount = userRepo.count();
        System.out.println("Users count BEFORE: " + beforeCount);

        // Mock MSG91 to fail
        doReturn(null).when(authService).getMobileFromMsg91("random_token");

        ApiResponseDTO response = authService.verifyMsg91Token("random_token", "9876543210", testSignupData);

        long afterCount = userRepo.count();
        System.out.println("Users count AFTER: " + afterCount);

        assertFalse(response.isSuccess(), "Registration should fail");
        assertEquals("MSG91 verification failed", response.getMessage());
        assertEquals(beforeCount, afterCount, "User count must not change");
        System.out.println("Test Case 3 PASSED.\n");
    }

    @Test
    void testCase4_PhoneMismatch() throws Exception {
        System.out.println("=== TEST CASE 4: Phone Mismatch ===");
        long beforeCount = userRepo.count();
        System.out.println("Users count BEFORE: " + beforeCount);

        // Mock MSG91 to verify and return a different phone number
        doReturn("9876543210").when(authService).getMobileFromMsg91("valid_token_for_different_phone");

        ApiResponseDTO response = authService.verifyMsg91Token("valid_token_for_different_phone", "9999999999", testSignupData);

        long afterCount = userRepo.count();
        System.out.println("Users count AFTER: " + afterCount);

        assertFalse(response.isSuccess(), "Registration should fail due to mismatch");
        assertEquals("Verified phone number does not match the registration phone number", response.getMessage());
        assertEquals(beforeCount, afterCount, "User count must not change");
        System.out.println("Test Case 4 PASSED.\n");
    }

    @Test
    void testCase5_ValidOtp() throws Exception {
        System.out.println("=== TEST CASE 5: Valid OTP ===");
        long beforeCount = userRepo.count();
        System.out.println("Users count BEFORE: " + beforeCount);

        // Mock MSG91 to succeed and return matching phone number
        doReturn("9876543210").when(authService).getMobileFromMsg91("valid_otp_token");

        ApiResponseDTO response = authService.verifyMsg91Token("valid_otp_token", "9876543210", testSignupData);

        long afterCount = userRepo.count();
        System.out.println("Users count AFTER: " + afterCount);

        assertTrue(response.isSuccess(), "Registration should succeed with valid OTP and matching phone");
        assertEquals(beforeCount + 1, afterCount, "User count must increase by 1");
        assertNotNull(response.getData(), "Response should return data");
        System.out.println("Test Case 5 PASSED.\n");
    }
}
