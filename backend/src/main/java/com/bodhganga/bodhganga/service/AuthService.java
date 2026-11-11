package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.*;
import com.bodhganga.bodhganga.entity.PasswordResetToken;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.PasswordResetTokenRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.util.JwtUtil;
import com.bodhganga.bodhganga.services.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

        private static final Logger log = LoggerFactory.getLogger(AuthService.class);
        private static final long MOBILE_RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000L;

        private final UserRepo userRepo;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final EmailService emailService;
        private final PasswordResetTokenRepo passwordResetTokenRepo;
        private final Environment env;

        /**
         * Admin mobile — injected from ADMIN_PHONE env var via application.properties.
         */
        @Value("${admin.phone:}")
        private String configuredAdminPhone;

        @Value("${msg91.auth.key:${MSG91_AUTH_KEY:}}")
        private String msg91AuthKey;

        public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                        EmailService emailService, PasswordResetTokenRepo passwordResetTokenRepo,
                        Environment env) {
                this.userRepo = userRepo;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
                this.emailService = emailService;
                this.passwordResetTokenRepo = passwordResetTokenRepo;
                this.env = env;
        }

        /**
         * Normalize phone number to canonical 10-digit Indian format when prefixed
         * with +91, 91, 0091, or 0 — while preserving genuine 10-digit numbers
         * starting with 91 (e.g., 9111111111).
         */
        public static String normalizePhone(String raw) {
                if (raw == null) {
                        return "";
                }
                String digits = raw.replaceAll("[^0-9]", "");
                if (digits.startsWith("0091") && digits.length() == 14) {
                        return digits.substring(4);
                }
                if (digits.startsWith("91") && digits.length() == 12) {
                        return digits.substring(2);
                }
                if (digits.startsWith("0") && digits.length() == 11) {
                        return digits.substring(1);
                }
                return digits;
        }

        private String resolveMsg91AuthKey() {
                String key = firstNonBlank(
                                msg91AuthKey,
                                env != null ? env.getProperty("msg91.auth.key") : null,
                                env != null ? env.getProperty("MSG91_AUTH_KEY") : null,
                                env != null ? env.getProperty("MSG91_AUTHKEY") : null,
                                System.getenv("MSG91_AUTH_KEY"),
                                System.getenv("MSG91_AUTHKEY"));
                if (key == null || key.isBlank()) {
                        throw new IllegalStateException("MSG91_AUTH_KEY environment variable is not configured.");
                }
                return key.trim();
        }

        /**
         * Register user directly (without OTP verification, e.g. /api/auth/register)
         */
        public ApiResponseDTO registerDirect(RegisterRequestDTO dto) {
                String normalizedPhone = normalizePhone(dto.getPhoneNo());

                // Check if user with same phoneNo already exists
                if (!normalizedPhone.isBlank() && userRepo.existsByPhoneNo(normalizedPhone)) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number already registered")
                                        .build();
                }

                // Double check if email already exists (only if a custom email is provided)
                String rawEmail = dto.getEmail();
                String normalizedEmail = (rawEmail != null && !rawEmail.trim().isBlank()) ? rawEmail.trim().toLowerCase() : null;
                dto.setEmail(normalizedEmail);

                if (normalizedEmail != null) {
                        if (userRepo.existsByEmailIgnoreCase(normalizedEmail)) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Email already registered")
                                                .build();
                        }
                }

                // Generate default email if not provided
                String email = normalizedEmail;
                if (email == null || email.isBlank()) {
                        email = normalizedPhone + "@bodhganga.in";
                }

                // Create new user with hashed password
                User user = User.builder()
                                .name(dto.getName())
                                .email(email)
                                .phoneNo(normalizedPhone.isBlank() ? null : normalizedPhone)
                                .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                                .city(dto.getCity())
                                .state(dto.getState())
                                .country("India") // default
                                .role("USER")
                                .isVerified(true) // Verified on registration so user is recognized upon subsequent logins
                                .emailVerified(true)
                                .phoneVerified(true)
                                .isActive(true)
                                .createdAt(new Date())
                                .build();

                log.info("Saving registered user: {}", user.getPhoneNo());
                User savedUser = userRepo.save(user);

                // Generate JWT token for auto-login
                String jwtSubject = savedUser.getEmail() != null ? savedUser.getEmail().trim().toLowerCase() : savedUser.getPhoneNo();
                String token = jwtUtil.generateToken(jwtSubject, savedUser.getId(), savedUser.getRole());

                // Convert to response DTO
                UserResponseDTO userResponse = mapToUserResponse(savedUser);

                // Create response with token and user data
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("token", token);
                responseData.put("user", userResponse);

                return ApiResponseDTO.builder()
                                .success(true)
                                .message("Account created successfully")
                                .data(responseData)
                                .build();
        }

        /**
         * User Signup - Register new user
         */
        /**
         * Initiate Email Signup - validates details and sends email OTP
         */
        public ApiResponseDTO registerEmailRequest(SignupRequestDTO dto) {
                return ApiResponseDTO.builder()
                                .success(false)
                                .message("Email signup is disabled. Please register using Mobile OTP signup.")
                                .build();
        }

        /**
         * Complete Signup - saves user to DB and generates session (only called after
         * OTP success)
         */
        public ApiResponseDTO completeSignup(SignupRequestDTO dto, boolean emailVerified, boolean phoneVerified) {
                String normalizedPhone = normalizePhone(dto.getPhoneNo());

                // Double check if phone already exists
                if (!normalizedPhone.isBlank() && userRepo.existsByPhoneNo(normalizedPhone)) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number already registered")
                                        .build();
                }

                // Double check if email already exists (only if a custom email is provided)
                String rawEmail = dto.getEmail();
                String normalizedEmail = (rawEmail != null && !rawEmail.trim().isBlank()) ? rawEmail.trim().toLowerCase() : null;
                dto.setEmail(normalizedEmail);

                if (normalizedEmail != null) {
                        if (userRepo.existsByEmailIgnoreCase(normalizedEmail)) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Email already registered")
                                                .build();
                        }
                }

                // Create new user with hashed password
                User user = User.builder()
                                .name(dto.getName())
                                .email(normalizedEmail)
                                .phoneNo(normalizedPhone.isBlank() ? null : normalizedPhone)
                                .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                                .gender(dto.getGender())
                                .dateOfBirth(dto.getDateOfBirth())
                                .city(dto.getCity())
                                .state(dto.getState())
                                .country(dto.getCountry())
                                .role("USER")
                                .isVerified(true) // Set to verified since OTP succeeded
                                .emailVerified(true)
                                .phoneVerified(true)
                                .isActive(true)
                                .createdAt(new Date())
                                .build();

                log.info("Saving verified user: {}", user.getPhoneNo());
                User savedUser = userRepo.save(user);

                // Trigger welcome email asynchronously if a real email is used
                if (savedUser.getEmail() != null && !savedUser.getEmail().endsWith("@bodhganga.in")) {
                        try {
                                emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
                        } catch (Exception e) {
                                log.error("Failed to trigger welcome email: {}", e.getMessage());
                        }
                }

                // Generate JWT token for auto-login (use email or dummy email)
                String jwtSubject = savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getPhoneNo();
                String token = jwtUtil.generateToken(jwtSubject, savedUser.getId(), savedUser.getRole());

                // Convert to response DTO
                UserResponseDTO userResponse = mapToUserResponse(savedUser);

                // Create response with token and user data
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("token", token);
                responseData.put("user", userResponse);

                return ApiResponseDTO.builder()
                                .success(true)
                                .message("User registered successfully")
                                .data(responseData)
                                .build();
        }

        /**
         * Verify Email OTP and Complete Signup
         */
        public ApiResponseDTO verifyAndCompleteSignup(String email, String otp, SignupRequestDTO dto) {
                return ApiResponseDTO.builder()
                                .success(false)
                                .message("Email signup is disabled. Please register using Mobile OTP signup.")
                                .build();
        }

        /**
         * Register mobile user request
         */
        public ApiResponseDTO registerMobileCheck(String phoneNo) {
                String normalizedPhone = normalizePhone(phoneNo);
                if (userRepo.existsByPhoneNo(normalizedPhone)) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number already registered")
                                        .build();
                }
                return ApiResponseDTO.builder()
                                .success(true)
                                .message("Phone number is available")
                                .build();
        }

        /**
         * Complete Mobile Signup after successful MSG91 verification
         */
        public ApiResponseDTO registerMobileVerify(String accessToken, SignupRequestDTO dto) {
                try {
                        String normalizedPhone = getMobileFromMsg91(accessToken);
                        if (normalizedPhone == null || normalizedPhone.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("MSG91 token verification failed")
                                                .build();
                        }

                        // Override phone number with verified phone
                        dto.setPhoneNo(normalizedPhone);

                        // If email is empty, generate default one
                        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
                                dto.setEmail(normalizedPhone + "@bodhganga.in");
                        }

                        // Save the user using completeSignup
                        return completeSignup(dto, false, true);
                } catch (Exception e) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Internal server error during mobile registration: " + e.getMessage())
                                        .build();
                }
        }

        /**
         * User Login - Authenticate user via email or mobile number
         */
        public ApiResponseDTO login(LoginRequestDTO dto) {
                String rawInput = dto.getEmailOrPhone();
                if (rawInput == null || rawInput.trim().isBlank()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Email or mobile number is required")
                                        .build();
                }

                String sanitized = rawInput.trim();
                User user = null;

                try {
                        if (sanitized.contains("@")) {
                                String normalizedEmail = sanitized.toLowerCase();
                                user = userRepo.findByEmailIgnoreCase(normalizedEmail).orElse(null);
                        } else {
                                String normalizedPhone = normalizePhone(sanitized);
                                if (!normalizedPhone.isBlank()) {
                                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                                }
                                if (user == null) {
                                        user = userRepo.findByEmailIgnoreCase(sanitized.toLowerCase()).orElse(null);
                                }
                        }
                } catch (Exception e) {
                        log.error("Database connection failure during login: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Database service temporarily unavailable. Please retry shortly.")
                                        .build();
                }

                if (user == null) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid email/mobile number or password")
                                        .build();
                }

                // Check if account is active
                if (user.isActive() != null && !user.isActive()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Account is deactivated. Please contact support.")
                                        .build();
                }

                // Verify password using standard BCrypt
                if (!passwordEncoder.matches(dto.getPassword(), user.getHashedPassword())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid email/mobile number or password")
                                        .build();
                }

                // Update last login timestamp
                user.setLastLogin(new Date());
                userRepo.save(user);

                // Generate JWT token
                String jwtSubject = user.getEmail() != null && !user.getEmail().isBlank()
                                ? user.getEmail().trim().toLowerCase()
                                : user.getPhoneNo();
                String token = jwtUtil.generateToken(jwtSubject, user.getId(), user.getRole());

                // Convert to response DTO
                UserResponseDTO userResponse = mapToUserResponse(user);

                // Create response with token and user data
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("token", token);
                responseData.put("user", userResponse);

                return ApiResponseDTO.builder()
                                .success(true)
                                .message("Login successful")
                                .data(responseData)
                                .build();
        }

        /**
         * Admin Login - Authenticate and validate ADMIN role via password (DISABLED:
         * Admin uses OTP login)
         */
        public ApiResponseDTO adminLogin(LoginRequestDTO dto) {
                return ApiResponseDTO.builder()
                                .success(false)
                                .message("Password authentication is disabled for administrators. Please use OTP login.")
                                .build();
        }

        /**
         * Admin OTP Request - Validates admin phone and active status before OTP
         * dispatch
         */
        public ApiResponseDTO adminOtpRequest(String phoneNo) {
                if (phoneNo == null || phoneNo.isBlank()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid or unauthorized mobile number")
                                        .build();
                }

                String normalizedPhone = normalizePhone(phoneNo);
                String normalizedAdminPhone = normalizePhone(configuredAdminPhone);
                if (normalizedAdminPhone.isBlank()) {
                        log.warn("Admin OTP request rejected: ADMIN_PHONE is not configured");
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid or unauthorized mobile number")
                                        .build();
                }

                if (!normalizedPhone.equals(normalizedAdminPhone)) {
                        log.warn("Admin OTP request rejected: phone {} does not match configured admin phone",
                                        normalizedPhone);
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid or unauthorized mobile number")
                                        .build();
                }

                User user;
                try {
                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                } catch (Exception e) {
                        log.error("Database connection failure during admin OTP request: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Database service temporarily unavailable. Please retry shortly.")
                                        .build();
                }
                if (user == null || !"ADMIN".equals(user.getRole()) || !Boolean.TRUE.equals(user.isActive())
                                || !user.isVerified()) {
                        log.warn("Admin OTP request rejected: user account null, not ADMIN, inactive, or unverified");
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid or unauthorized mobile number")
                                        .build();
                }

                log.info("Admin OTP request authorized for phone {}", normalizedPhone);
                return ApiResponseDTO.builder()
                                .success(true)
                                .message("Admin mobile verified. Proceed with OTP verification.")
                                .build();
        }

        /**
         * Admin OTP Verification - Verifies MSG91 token, checks ADMIN role & active
         * status, issues JWT
         */
        public ApiResponseDTO adminOtpVerify(String phoneNo, String accessToken) {
                if (phoneNo == null || phoneNo.isBlank() || accessToken == null || accessToken.isBlank()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number and OTP access token are required")
                                        .build();
                }

                String normalizedPhone = normalizePhone(phoneNo);
                String normalizedAdminPhone = normalizePhone(configuredAdminPhone);
                if (normalizedAdminPhone.isBlank()) {
                        log.warn("Admin OTP verification rejected: ADMIN_PHONE is not configured");
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid or unauthorized mobile number")
                                        .build();
                }

                if (!normalizedPhone.equals(normalizedAdminPhone)) {
                        log.warn("Admin OTP verification rejected: phone {} does not match configured admin phone",
                                        normalizedPhone);
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Access denied: Invalid admin phone number")
                                        .build();
                }

                try {
                        String verifiedPhone = getMobileFromMsg91(accessToken);
                        if (verifiedPhone == null || verifiedPhone.isBlank()) {
                                log.warn("Admin OTP verification rejected: MSG91 token verification returned null");
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("MSG91 token verification failed")
                                                .build();
                        }

                        String normalizedVerifiedPhone = normalizePhone(verifiedPhone);

                        if (!normalizedPhone.equals(normalizedVerifiedPhone)) {
                                log.warn("Admin OTP verification rejected: MSG91 verified phone does not match requested phone");
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Verified phone number does not match requested admin phone")
                                                .build();
                        }
                } catch (Exception e) {
                        log.error("Error during MSG91 token verification in adminOtpVerify: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("MSG91 verification failed: " + e.getMessage())
                                        .build();
                }

                User user;
                try {
                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                } catch (Exception e) {
                        log.error("Database connection failure during admin OTP verify: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Database service temporarily unavailable. Please retry shortly.")
                                        .build();
                }
                if (user == null || !"ADMIN".equals(user.getRole()) || !Boolean.TRUE.equals(user.isActive())
                                || !user.isVerified()) {
                        log.warn("Admin OTP verification rejected: user not found, not ADMIN, inactive, or unverified");
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Access denied: Admin user inactive, unverified, or invalid role")
                                        .build();
                }

                try {
                        user.setLastLogin(new Date());
                        userRepo.save(user);
                } catch (Exception e) {
                        log.warn("Could not record lastLogin timestamp for admin {}: {}", normalizedPhone, e.getMessage());
                }

                String jwtSubject = user.getEmail() != null ? user.getEmail() : user.getPhoneNo();
                String token = jwtUtil.generateToken(jwtSubject, user.getId(), user.getRole());

                UserResponseDTO userResponse = mapToUserResponse(user);

                Map<String, Object> responseData = new HashMap<>();
                responseData.put("token", token);
                responseData.put("user", userResponse);

                log.info("Admin OTP verification successful for admin user: {}", user.getEmail());

                return ApiResponseDTO.builder()
                                .success(true)
                                .message("Admin authentication successful")
                                .data(responseData)
                                .build();
        }

        String getMobileFromMsg91(String accessToken) throws Exception {
                if (accessToken == null || accessToken.isBlank()) {
                        return null;
                }
                String authKey = resolveMsg91AuthKey();

                String url = "https://api.msg91.com/api/v5/widget/verifyAccessToken";

                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("authkey", authKey);
                payload.put("access-token", accessToken.trim());

                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                                .connectTimeout(Duration.ofSeconds(10))
                                .build();
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                                .uri(java.net.URI.create(url))
                                .timeout(Duration.ofSeconds(15))
                                .header("Content-Type", "application/json")
                                .header("Accept", "application/json")
                                .header("authkey", authKey)
                                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload.toString()))
                                .build();

                java.net.http.HttpResponse<String> response = client.send(request,
                                java.net.http.HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                        log.error("MSG91 Token Verification failed. Status: {}, Response: {}",
                                        response.statusCode(), response.body());
                        return null;
                }

                org.json.JSONObject jsonResponse = new org.json.JSONObject(response.body());
                return extractMobileFromJson(jsonResponse);
        }

        String extractMobileFromJson(org.json.JSONObject jsonResponse) {
                if (jsonResponse == null) {
                        return null;
                }

                if (jsonResponse.has("type") && "error".equalsIgnoreCase(jsonResponse.optString("type"))) {
                        log.warn("MSG91 verification error response: type={}, message={}",
                                        jsonResponse.optString("type"), jsonResponse.optString("message"));
                        return null;
                }
                if (jsonResponse.has("status")
                                && ("error".equalsIgnoreCase(jsonResponse.optString("status"))
                                                || "failed".equalsIgnoreCase(jsonResponse.optString("status")))) {
                        log.warn("MSG91 verification error status: status={}, message={}",
                                        jsonResponse.optString("status"), jsonResponse.optString("message"));
                        return null;
                }

                String mobile = null;
                if (jsonResponse.has("data")) {
                        Object dataObj = jsonResponse.get("data");
                        if (dataObj instanceof org.json.JSONObject) {
                                org.json.JSONObject dataJson = (org.json.JSONObject) dataObj;
                                mobile = firstNonBlank(
                                                dataJson.optString("mobile", null),
                                                dataJson.optString("phone", null),
                                                dataJson.optString("mobile_no", null),
                                                dataJson.optString("number", null));
                        } else if (dataObj instanceof String) {
                                mobile = (String) dataObj;
                        }
                }

                if (mobile == null || mobile.isBlank()) {
                        mobile = firstNonBlank(
                                        jsonResponse.optString("mobile", null),
                                        jsonResponse.optString("phone", null),
                                        jsonResponse.optString("mobile_no", null),
                                        jsonResponse.optString("number", null));
                }

                if (mobile == null || mobile.isBlank()) {
                        String msg = jsonResponse.optString("message", null);
                        if (msg != null && msg.replaceAll("[^0-9]", "").length() >= 10) {
                                mobile = msg;
                        }
                }

                if (mobile == null || mobile.isBlank()) {
                        return null;
                }

                return normalizePhone(mobile);
        }

        private String firstNonBlank(String... candidates) {
                for (String c : candidates) {
                        if (c != null && !c.isBlank()) {
                                return c;
                        }
                }
                return null;
        }

        /**
         * Verify MSG91 Access Token and log in / register user (backward compatible
         * overload)
         */
        public ApiResponseDTO verifyMsg91Token(String accessToken) {
                return verifyMsg91Token(accessToken, null, null);
        }

        /**
         * Verify MSG91 Access Token and log in / register user with optional
         * phoneNumber and signupData
         */
        public ApiResponseDTO verifyMsg91Token(String accessToken, String phoneNumber, SignupRequestDTO signupData) {
                try {
                        String verifiedPhone = getMobileFromMsg91(accessToken);
                        if (verifiedPhone == null || verifiedPhone.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("MSG91 verification failed")
                                                .build();
                        }

                        // Normalize phone retrieved from MSG91
                        String normalizedPhone = normalizePhone(verifiedPhone);

                        // Validate that the MSG91 verified number matches the supplied phone number
                        String effectivePhone = (phoneNumber != null && !phoneNumber.isBlank())
                                        ? phoneNumber
                                        : (signupData != null ? signupData.getPhoneNo() : null);
                        if (effectivePhone == null || effectivePhone.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Phone number is required for verification")
                                                .build();
                        }
                        String normalizedProvidedPhone = normalizePhone(effectivePhone);

                        if (!normalizedPhone.equals(normalizedProvidedPhone)) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Verified phone number does not match the registration phone number")
                                                .build();
                        }

                        // Check if it's signup flow or login flow
                        if (signupData != null) {
                                // Mobile Signup Flow
                                signupData.setPhoneNo(normalizedPhone);
                                if (signupData.getEmail() == null || signupData.getEmail().isBlank()) {
                                        signupData.setEmail(normalizedPhone + "@bodhganga.in");
                                }
                                return completeSignup(signupData, true, true);
                        } else {
                                // Mobile Login Flow
                                User user;
                                try {
                                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                                } catch (Exception e) {
                                        log.error("Database connection failure during MSG91 login: {}", e.getMessage());
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("Database service temporarily unavailable. Please retry shortly.")
                                                        .build();
                                }
                                boolean isNewUser = false;

                                if (user == null) {
                                        isNewUser = true;
                                        user = User.builder()
                                                        .name("Scholar_" + normalizedPhone.substring(
                                                                        Math.max(0, normalizedPhone.length() - 4)))
                                                        .email(normalizedPhone + "@bodhganga.in")
                                                        .phoneNo(normalizedPhone)
                                                        .hashedPassword(passwordEncoder
                                                                        .encode(UUID.randomUUID().toString()))
                                                        .role("USER")
                                                        .isVerified(true)
                                                        .emailVerified(true)
                                                        .phoneVerified(true)
                                                        .isActive(true)
                                                        .createdAt(new Date())
                                                        .build();

                                        log.info("Creating new user via MSG91 OTP: {}", user.getPhoneNo());
                                        user = userRepo.save(user);

                                        if (user.getEmail() != null && !user.getEmail().endsWith("@bodhganga.in")) {
                                                try {
                                                        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
                                                } catch (Exception e) {
                                                        log.error("Failed to trigger welcome email: {}",
                                                                        e.getMessage());
                                                }
                                        }
                                } else {
                                        if (user.isActive() != null && !user.isActive()) {
                                                return ApiResponseDTO.builder()
                                                                .success(false)
                                                                .message("Account is deactivated. Please contact support.")
                                                                .build();
                                        }
                                        user.setVerified(true);
                                        user.setPhoneVerified(true);
                                        user.setEmailVerified(true);
                                        user.setLastLogin(new Date());
                                        user = userRepo.save(user);
                                }

                                String jwtSubject = (user.getEmail() != null && !user.getEmail().isBlank())
                                                ? user.getEmail().trim().toLowerCase()
                                                : user.getPhoneNo();
                                String token = jwtUtil.generateToken(jwtSubject, user.getId(), user.getRole());
                                UserResponseDTO userResponse = mapToUserResponse(user);

                                Map<String, Object> responseData = new HashMap<>();
                                responseData.put("token", token);
                                responseData.put("user", userResponse);
                                responseData.put("isNewUser", isNewUser);

                                return ApiResponseDTO.builder()
                                                .success(true)
                                                .message(isNewUser ? "User registered and logged in successfully"
                                                                : "Login successful")
                                                .data(responseData)
                                                .build();
                        }
                } catch (Exception e) {
                        log.error("Error during MSG91 token verification: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Internal server error during MSG91 verification")
                                        .build();
                }
        }

        /**
         * Reset password using either a single-use internal resetToken minted by
         * verifyMsg91TokenOnly(...) or (for single-step callers) a fresh MSG91 accessToken.
         */
        public ApiResponseDTO resetPasswordWithMsg91(String tokenOrAccessToken, String newPassword) {
                if (tokenOrAccessToken == null || tokenOrAccessToken.isBlank()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Verification token is required")
                                        .build();
                }
                if (newPassword == null || newPassword.length() < 6) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Password must be at least 6 characters")
                                        .build();
                }
                try {
                        PasswordResetToken storedToken = passwordResetTokenRepo.findByToken(tokenOrAccessToken.trim())
                                        .orElse(null);

                        User user;
                        if (storedToken != null) {
                                if (storedToken.isUsed()) {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("Reset session already used. Please verify OTP again.")
                                                        .build();
                                }
                                if (storedToken.getExpiryDate() == null || storedToken.isExpired()) {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("Reset session expired. Please verify OTP again.")
                                                        .build();
                                }
                                user = userRepo.findById(storedToken.getUserId()).orElse(null);
                                if (user == null) {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("No account found with this mobile number")
                                                        .build();
                                }
                        } else {
                                String normalizedPhone = normalizePhone(getMobileFromMsg91(tokenOrAccessToken));
                                if (normalizedPhone.isBlank()) {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("MSG91 OTP token verification failed")
                                                        .build();
                                }
                                user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                                if (user == null) {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("No account found with this mobile number")
                                                        .build();
                                }
                        }

                        if (user.isActive() != null && !user.isActive()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Account is deactivated. Please contact support.")
                                                .build();
                        }

                        // Update password in database with standard BCrypt password encoder
                        user.setHashedPassword(passwordEncoder.encode(newPassword));
                        user.setVerified(true);
                        user.setPhoneVerified(true);
                        user.setForcePasswordReset(false);
                        userRepo.save(user);

                        if (storedToken != null) {
                                storedToken.setUsed(true);
                                passwordResetTokenRepo.save(storedToken);
                        }

                        return ApiResponseDTO.builder()
                                        .success(true)
                                        .message("Password reset successful")
                                        .build();

                } catch (Exception e) {
                        log.error("Error during MSG91 password reset: {}", e.getMessage());
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Internal server error during password reset")
                                        .build();
                }
        }

        /**
         * Verify MSG91 Access Token once and mint a short-lived single-use internal
         * resetToken so the frontend never sends a one-time MSG91 token twice.
         */
        public ApiResponseDTO verifyMsg91TokenOnly(String accessToken) {
                try {
                        String normalizedPhone = normalizePhone(getMobileFromMsg91(accessToken));
                        if (normalizedPhone.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("MSG91 OTP token verification failed")
                                                .build();
                        }

                        User user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                        if (user == null) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("No account found with this mobile number")
                                                .build();
                        }
                        if (user.isActive() != null && !user.isActive()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Account is deactivated. Please contact support.")
                                                .build();
                        }

                        passwordResetTokenRepo.deleteByUserId(user.getId());
                        String resetToken = UUID.randomUUID().toString();
                        String identifier = (user.getEmail() != null && !user.getEmail().isBlank())
                                        ? user.getEmail()
                                        : normalizedPhone;
                        Date expiry = new Date(System.currentTimeMillis() + MOBILE_RESET_TOKEN_EXPIRY_MS);
                        passwordResetTokenRepo.save(new PasswordResetToken(resetToken, user.getId(), identifier, expiry));

                        Map<String, Object> data = new HashMap<>();
                        data.put("resetToken", resetToken);
                        data.put("phoneNo", normalizedPhone);

                        return ApiResponseDTO.builder()
                                        .success(true)
                                        .message("OTP verified successfully")
                                        .data(data)
                                        .build();
                } catch (Exception e) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Internal server error during verification: " + e.getMessage())
                                        .build();
                }
        }

        /**
         * Helper method to convert User entity to UserResponseDTO
         * Excludes sensitive information like hashedPassword
         */
        private UserResponseDTO mapToUserResponse(User user) {
                return UserResponseDTO.builder()
                                .id(user.getId())
                                .name(user.getName())
                                .email(user.getEmail())
                                .phoneNo(user.getPhoneNo())
                                .city(user.getCity())
                                .state(user.getState())
                                .country(user.getCountry())
                                .role(user.getRole())
                                .profilePicture(user.getProfilePicture())
                                .qualification(user.getQualification())
                                .forcePasswordReset(user.getForcePasswordReset())
                                .build();
        }
}
