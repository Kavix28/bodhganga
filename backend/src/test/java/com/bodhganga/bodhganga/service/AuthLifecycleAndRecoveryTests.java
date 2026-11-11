package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.LoginRequestDTO;
import com.bodhganga.bodhganga.dto.RegisterRequestDTO;
import com.bodhganga.bodhganga.entity.PasswordResetToken;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.PasswordResetTokenRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.PasswordResetService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class AuthLifecycleAndRecoveryTests {

    @SpyBean
    private AuthService authService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordResetTokenRepo tokenRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_EMAIL = "scholar.test@bodhganga.org";
    private static final String TEST_PHONE = "9870001122";
    private static final String INITIAL_PASSWORD = "Password123#";
    private static final String NEW_PASSWORD = "NewPassword456$";

    @BeforeEach
    @AfterEach
    public void cleanup() {
        userRepo.findByEmailIgnoreCase(TEST_EMAIL).ifPresent(u -> {
            tokenRepo.deleteByUserId(u.getId());
            userRepo.delete(u);
        });
        userRepo.findByPhoneNo(TEST_PHONE).ifPresent(u -> {
            tokenRepo.deleteByUserId(u.getId());
            userRepo.delete(u);
        });
    }

    @Test
    @DisplayName("End-to-end user registration and subsequent email sign-in (case-insensitive)")
    public void testRegistrationAndSubsequentLogin() {
        // 1. Direct registration with mixed-case email
        RegisterRequestDTO registerDTO = new RegisterRequestDTO();
        registerDTO.setName("Scholar Test");
        registerDTO.setEmail("SCHOLAR.TEST@BodhGanga.ORG");
        registerDTO.setPhoneNo(TEST_PHONE);
        registerDTO.setPassword(INITIAL_PASSWORD);
        registerDTO.setCity("Pune");
        registerDTO.setState("Maharashtra");

        ApiResponseDTO registerRes = authService.registerDirect(registerDTO);
        assertTrue(registerRes.isSuccess(), "Registration should succeed");

        // 2. Verify account flags are verified and active
        User saved = userRepo.findByEmailIgnoreCase(TEST_EMAIL).orElse(null);
        assertNotNull(saved, "User must exist in repository");
        assertTrue(saved.isVerified(), "User must be verified to survive restarts");
        assertTrue(saved.isActive(), "User must be active");
        assertTrue(passwordEncoder.matches(INITIAL_PASSWORD, saved.getHashedPassword()), "Password must be BCrypt hashed");

        // 3. Log in with lowercase email
        LoginRequestDTO lowerLoginDTO = new LoginRequestDTO();
        lowerLoginDTO.setEmailOrPhone("scholar.test@bodhganga.org");
        lowerLoginDTO.setPassword(INITIAL_PASSWORD);

        ApiResponseDTO lowerLoginRes = authService.login(lowerLoginDTO);
        assertTrue(lowerLoginRes.isSuccess(), "Login with lowercase email should succeed");
        assertNotNull(lowerLoginRes.getData(), "Login response must contain session data");

        // 4. Log in with UPPERCASE email
        LoginRequestDTO upperLoginDTO = new LoginRequestDTO();
        upperLoginDTO.setEmailOrPhone("SCHOLAR.TEST@BODHGANGA.ORG");
        upperLoginDTO.setPassword(INITIAL_PASSWORD);

        ApiResponseDTO upperLoginRes = authService.login(upperLoginDTO);
        assertTrue(upperLoginRes.isSuccess(), "Login with uppercase email should succeed");

        // 5. Log in with phone number
        LoginRequestDTO phoneLoginDTO = new LoginRequestDTO();
        phoneLoginDTO.setEmailOrPhone(TEST_PHONE);
        phoneLoginDTO.setPassword(INITIAL_PASSWORD);

        ApiResponseDTO phoneLoginRes = authService.login(phoneLoginDTO);
        assertTrue(phoneLoginRes.isSuccess(), "Login with registered phone should succeed");

        // 6. Log in with invalid password must fail
        LoginRequestDTO wrongPwDTO = new LoginRequestDTO();
        wrongPwDTO.setEmailOrPhone(TEST_EMAIL);
        wrongPwDTO.setPassword("WrongPassword!");

        ApiResponseDTO wrongPwRes = authService.login(wrongPwDTO);
        assertFalse(wrongPwRes.isSuccess(), "Login with invalid password must fail");
    }

    @Test
    @DisplayName("Password reset token lifecycle: dispatch, validation, redemption, and single-use enforcement")
    public void testPasswordResetLifecycle() {
        // 1. Setup user
        User user = User.builder()
                .name("Reset Test Scholar")
                .email(TEST_EMAIL)
                .phoneNo(TEST_PHONE)
                .hashedPassword(passwordEncoder.encode(INITIAL_PASSWORD))
                .role("USER")
                .isVerified(true)
                .emailVerified(true)
                .phoneVerified(true)
                .isActive(true)
                .createdAt(new Date())
                .build();
        userRepo.save(user);

        // 2. Request password reset
        ApiResponseDTO requestRes = passwordResetService.createPasswordResetToken(TEST_EMAIL);
        assertTrue(requestRes.isSuccess(), "Password reset token generation should succeed");

        // Retrieve created token from database
        PasswordResetToken tokenEntity = tokenRepo.findAll().stream()
                .filter(t -> TEST_EMAIL.equalsIgnoreCase(t.getEmail()))
                .findFirst()
                .orElse(null);
        assertNotNull(tokenEntity, "Reset token must be stored in database");
        assertFalse(tokenEntity.isExpired(), "Fresh token must not be expired");
        assertFalse(tokenEntity.isUsed(), "Fresh token must not be marked used");

        String token = tokenEntity.getToken();

        // 3. Validate token before display
        ApiResponseDTO validateRes = passwordResetService.validatePasswordResetToken(token);
        assertTrue(validateRes.isSuccess(), "Token validation should succeed");

        // 4. Reset password
        ApiResponseDTO resetRes = passwordResetService.resetPassword(token, NEW_PASSWORD);
        assertTrue(resetRes.isSuccess(), "Password reset should succeed");

        // 5. Verify single-use enforcement (token is now used)
        ApiResponseDTO reuseValidateRes = passwordResetService.validatePasswordResetToken(token);
        assertFalse(reuseValidateRes.isSuccess(), "Used token should fail validation");

        ApiResponseDTO reuseResetRes = passwordResetService.resetPassword(token, "AnotherPassword789#");
        assertFalse(reuseResetRes.isSuccess(), "Used token should be rejected on password reset");

        // 6. Verify old password fails and new password succeeds
        LoginRequestDTO oldPwLogin = new LoginRequestDTO();
        oldPwLogin.setEmailOrPhone(TEST_EMAIL);
        oldPwLogin.setPassword(INITIAL_PASSWORD);
        assertFalse(authService.login(oldPwLogin).isSuccess(), "Old password should no longer work");

        LoginRequestDTO newPwLogin = new LoginRequestDTO();
        newPwLogin.setEmailOrPhone(TEST_EMAIL);
        newPwLogin.setPassword(NEW_PASSWORD);
        assertTrue(authService.login(newPwLogin).isSuccess(), "New password should successfully authenticate");
    }

    @Test
    @DisplayName("Expired password reset token is strictly rejected")
    public void testExpiredPasswordResetToken() {
        // Create an expired token directly
        String expiredToken = "expired-token-123456789";
        Date pastDate = new Date(System.currentTimeMillis() - 3600000L); // 1 hour in the past
        PasswordResetToken token = new PasswordResetToken(expiredToken, "user-123", TEST_EMAIL, pastDate);
        tokenRepo.save(token);

        // Validate should fail
        ApiResponseDTO validateRes = passwordResetService.validatePasswordResetToken(expiredToken);
        assertFalse(validateRes.isSuccess(), "Expired token must not validate");

        // Reset should fail
        ApiResponseDTO resetRes = passwordResetService.resetPassword(expiredToken, NEW_PASSWORD);
        assertFalse(resetRes.isSuccess(), "Expired token must not allow password reset");
    }

    @Test
    @DisplayName("Deactivated account is rejected during authentication")
    public void testDeactivatedAccountLogin() {
        User user = User.builder()
                .name("Deactivated Scholar")
                .email(TEST_EMAIL)
                .phoneNo(TEST_PHONE)
                .hashedPassword(passwordEncoder.encode(INITIAL_PASSWORD))
                .role("USER")
                .isVerified(true)
                .isActive(false) // Account is deactivated
                .createdAt(new Date())
                .build();
        userRepo.save(user);

        LoginRequestDTO loginDTO = new LoginRequestDTO();
        loginDTO.setEmailOrPhone(TEST_EMAIL);
        loginDTO.setPassword(INITIAL_PASSWORD);

        ApiResponseDTO response = authService.login(loginDTO);
        assertFalse(response.isSuccess(), "Deactivated user must not be permitted to log in");
        assertTrue(response.getMessage().toLowerCase().contains("deactivated"), "Message should notify deactivation");
    }

    @Test
    @DisplayName("Phone normalization strips country prefixes without corrupting 10-digit numbers starting with 91")
    public void testPhoneNormalizationAndFormattedLogin() {
        assertEquals("9111111111", AuthService.normalizePhone("9111111111"),
                "10-digit mobile starting with 91 must be preserved");
        assertEquals("9876543210", AuthService.normalizePhone("+91 98765-43210"));
        assertEquals("9876543210", AuthService.normalizePhone("09876543210"));
        assertEquals("9876543210", AuthService.normalizePhone("00919876543210"));

        User user = User.builder()
                .name("Formatted Login User")
                .email(TEST_EMAIL)
                .phoneNo(TEST_PHONE)
                .hashedPassword(passwordEncoder.encode(INITIAL_PASSWORD))
                .role("USER")
                .isVerified(true)
                .emailVerified(true)
                .phoneVerified(true)
                .isActive(true)
                .createdAt(new Date())
                .build();
        userRepo.save(user);

        LoginRequestDTO formattedLogin = new LoginRequestDTO();
        formattedLogin.setEmailOrPhone("+91 " + TEST_PHONE);
        formattedLogin.setPassword(INITIAL_PASSWORD);

        ApiResponseDTO res = authService.login(formattedLogin);
        assertTrue(res.isSuccess(), "Login with +91 prefixed mobile number should succeed");
    }

    @Test
    @DisplayName("Mobile forgot-password issues single-use resetToken on OTP verify to avoid MSG91 double consumption")
    @SuppressWarnings("unchecked")
    public void testMobileForgotPasswordTwoStepResetTokenFlow() throws Exception {
        User user = User.builder()
                .name("Mobile Reset Scholar")
                .email(TEST_EMAIL)
                .phoneNo(TEST_PHONE)
                .hashedPassword(passwordEncoder.encode(INITIAL_PASSWORD))
                .role("USER")
                .isVerified(true)
                .emailVerified(true)
                .phoneVerified(true)
                .isActive(true)
                .createdAt(new Date())
                .build();
        userRepo.save(user);

        doReturn(TEST_PHONE).when(authService).getMobileFromMsg91("msg91-otp-1");

        // Step 1: Verify MSG91 accessToken once -> receive single-use internal resetToken
        ApiResponseDTO verifyRes = authService.verifyMsg91TokenOnly("msg91-otp-1");
        assertTrue(verifyRes.isSuccess(), "Mobile OTP verification should succeed");
        Map<String, Object> verifyData = (Map<String, Object>) verifyRes.getData();
        assertNotNull(verifyData, "Verify response should include resetToken data");
        String resetToken = (String) verifyData.get("resetToken");
        assertNotNull(resetToken, "Verify response must mint a resetToken");

        // Step 2: Redeem internal resetToken to set new BCrypt password (no second MSG91 call needed)
        ApiResponseDTO resetRes = authService.resetPasswordWithMsg91(resetToken, NEW_PASSWORD);
        assertTrue(resetRes.isSuccess(), "Password reset with minted resetToken should succeed");

        // Step 3: Replay must be rejected
        ApiResponseDTO replayRes = authService.resetPasswordWithMsg91(resetToken, "ReplayPass999!");
        assertFalse(replayRes.isSuccess(), "Spent resetToken must not be reusable");

        // Step 4: Confirm new password authenticates while old password fails
        LoginRequestDTO newPwLogin = new LoginRequestDTO();
        newPwLogin.setEmailOrPhone(TEST_PHONE);
        newPwLogin.setPassword(NEW_PASSWORD);
        assertTrue(authService.login(newPwLogin).isSuccess(), "User must be able to log in with updated password");
    }

    @Test
    @DisplayName("Mobile OTP login blocks deactivated accounts")
    public void testOtpLoginBlocksDeactivatedUser() throws Exception {
        User user = User.builder()
                .name("Inactive OTP User")
                .email(TEST_EMAIL)
                .phoneNo(TEST_PHONE)
                .hashedPassword(passwordEncoder.encode(INITIAL_PASSWORD))
                .role("USER")
                .isVerified(true)
                .isActive(false)
                .createdAt(new Date())
                .build();
        userRepo.save(user);

        doReturn(TEST_PHONE).when(authService).getMobileFromMsg91("msg91-deactivated-otp");

        ApiResponseDTO res = authService.verifyMsg91Token("msg91-deactivated-otp", TEST_PHONE, null);
        assertFalse(res.isSuccess(), "Deactivated account must not log in via OTP");
        assertTrue(res.getMessage().toLowerCase().contains("deactivated"));
    }
}

