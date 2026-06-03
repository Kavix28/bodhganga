package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.*;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.util.JwtUtil;
import com.bodhganga.bodhganga.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

        private static final Logger log = LoggerFactory.getLogger(AuthService.class);

        private final UserRepo userRepo;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final EmailService emailService;

        public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService) {
                this.userRepo = userRepo;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
                this.emailService = emailService;
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
         * Complete Signup - saves user to DB and generates session (only called after OTP success)
         */
        public ApiResponseDTO completeSignup(SignupRequestDTO dto, boolean emailVerified, boolean phoneVerified) {
                String normalizedPhone = dto.getPhoneNo() != null ? dto.getPhoneNo().replaceAll("[^0-9]", "") : "";
                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                        normalizedPhone = normalizedPhone.substring(2);
                }

                // Double check if phone already exists
                if (!normalizedPhone.isBlank() && userRepo.existsByPhoneNo(normalizedPhone)) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number already registered")
                                        .build();
                }

                // Double check if email already exists (only if a custom email is provided)
                if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
                        if (userRepo.existsByEmail(dto.getEmail())) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Email already registered")
                                                .build();
                        }
                }

                // Create new user with hashed password
                User user = User.builder()
                                .name(dto.getName())
                                .email(dto.getEmail())
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
                String normalizedPhone = phoneNo.replaceAll("[^0-9]", "");
                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                        normalizedPhone = normalizedPhone.substring(2);
                }
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
         * User Login - Authenticate user via mobile number only
         */
        public ApiResponseDTO login(LoginRequestDTO dto) {
                String emailOrPhone = dto.getEmailOrPhone();

                if (emailOrPhone.contains("@")) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Email login is disabled. Please log in using your Mobile Number.")
                                        .build();
                }

                // Normalize phone number (remove non-digits)
                String normalizedPhone = emailOrPhone.replaceAll("[^0-9]", "");
                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                        normalizedPhone = normalizedPhone.substring(2);
                }

                User user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);

                if (user == null) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid mobile number or password")
                                        .build();
                }

                // Check if account is active
                if (!user.isActive()) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Account is deactivated. Please contact support.")
                                        .build();
                }

                // Verify password
                if (!passwordEncoder.matches(dto.getPassword(), user.getHashedPassword())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid mobile number or password")
                                        .build();
                }

                // Update last login timestamp
                user.setLastLogin(new Date());
                userRepo.save(user);

                // Generate JWT token
                String jwtSubject = user.getEmail() != null ? user.getEmail() : user.getPhoneNo();
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
         * Admin Login - Authenticate and validate ADMIN role
         */
        public ApiResponseDTO adminLogin(LoginRequestDTO dto) {
                // First perform standard login
                ApiResponseDTO loginResult = login(dto);

                // If login failed, return error as-is
                if (!loginResult.isSuccess()) {
                        return loginResult;
                }

                String emailOrPhone = dto.getEmailOrPhone();
                String normalizedPhone = emailOrPhone.replaceAll("[^0-9]", "");
                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                        normalizedPhone = normalizedPhone.substring(2);
                }

                User user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);

                // Validate ADMIN role
                if (user == null || !"ADMIN".equals(user.getRole())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("ACCESS_DENIED")
                                        .build();
                }

                // Admin role confirmed — return the full login result
                return loginResult;
        }

        String getMobileFromMsg91(String accessToken) throws Exception {
                String authKey = System.getenv("MSG91_AUTH_KEY");
                if (authKey == null || authKey.isBlank()) {
                        throw new IllegalStateException("MSG91_AUTH_KEY environment variable is not configured.");
                }

                String url = "https://control.msg91.com/api/v5/widget/verifyAccessToken";
                
                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("authkey", authKey);
                payload.put("access-token", accessToken);

                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                                 .uri(java.net.URI.create(url))
                                 .header("Content-Type", "application/json")
                                 .header("authkey", authKey)
                                 .POST(java.net.http.HttpRequest.BodyPublishers.ofString(payload.toString()))
                                 .build();

                java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() != 200) {
                        log.error("MSG91 Token Verification failed. Status: {}, Body: {}", response.statusCode(), response.body());
                        return null;
                }

                org.json.JSONObject jsonResponse = new org.json.JSONObject(response.body());
                String mobile = null;
                if (jsonResponse.has("data")) {
                        org.json.JSONObject dataObj = jsonResponse.optJSONObject("data");
                        if (dataObj != null) {
                                mobile = dataObj.optString("mobile");
                        }
                }
                if (mobile == null || mobile.isBlank()) {
                        mobile = jsonResponse.optString("mobile");
                }

                if (mobile == null || mobile.isBlank()) {
                        return null;
                }

                // Normalize phone (remove non-digits, remove leading 91 if it's 12 digits total)
                String normalizedPhone = mobile.replaceAll("[^0-9]", "");
                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                        normalizedPhone = normalizedPhone.substring(2);
                }
                return normalizedPhone;
        }

        /**
         * Verify MSG91 Access Token and log in / register user (backward compatible overload)
         */
        public ApiResponseDTO verifyMsg91Token(String accessToken) {
                return verifyMsg91Token(accessToken, null, null);
        }

        /**
         * Verify MSG91 Access Token and log in / register user with optional phoneNumber and signupData
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
                        String normalizedPhone = verifiedPhone.replaceAll("[^0-9]", "");
                        if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                                normalizedPhone = normalizedPhone.substring(2);
                        }

                        // Validate that the MSG91 verified number matches the supplied phone number
                        if (phoneNumber == null || phoneNumber.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Phone number is required for verification")
                                                .build();
                        }
                        String normalizedProvidedPhone = phoneNumber.replaceAll("[^0-9]", "");
                        if (normalizedProvidedPhone.startsWith("91") && normalizedProvidedPhone.length() == 12) {
                                normalizedProvidedPhone = normalizedProvidedPhone.substring(2);
                        }

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
                                User user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                                boolean isNewUser = false;

                                if (user == null) {
                                        isNewUser = true;
                                        user = User.builder()
                                                        .name("Scholar_" + normalizedPhone.substring(Math.max(0, normalizedPhone.length() - 4)))
                                                        .email(normalizedPhone + "@bodhganga.in")
                                                        .phoneNo(normalizedPhone)
                                                        .hashedPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
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
                                                        log.error("Failed to trigger welcome email: {}", e.getMessage());
                                                }
                                        }
                                } else {
                                        user.setVerified(true);
                                        user.setPhoneVerified(true);
                                        user = userRepo.save(user);
                                }

                                String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());
                                UserResponseDTO userResponse = mapToUserResponse(user);

                                Map<String, Object> responseData = new HashMap<>();
                                responseData.put("token", token);
                                responseData.put("user", userResponse);
                                responseData.put("isNewUser", isNewUser);

                                return ApiResponseDTO.builder()
                                                .success(true)
                                                .message(isNewUser ? "User registered and logged in successfully" : "Login successful")
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
         * Reset password with MSG91 OTP token verification
         */
        public ApiResponseDTO resetPasswordWithMsg91(String accessToken, String newPassword) {
                try {
                        String normalizedPhone = getMobileFromMsg91(accessToken);
                        if (normalizedPhone == null || normalizedPhone.isBlank()) {
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

                        // Update password in database with standard BCrypt password encoder
                        user.setHashedPassword(passwordEncoder.encode(newPassword));
                        user.setVerified(true); // Ensure marked verified
                        userRepo.save(user);

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
         * Verify MSG91 Access Token only (without creating a user)
         */
        public ApiResponseDTO verifyMsg91TokenOnly(String accessToken) {
                try {
                        String normalizedPhone = getMobileFromMsg91(accessToken);
                        if (normalizedPhone == null || normalizedPhone.isBlank()) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("MSG91 OTP token verification failed")
                                                .build();
                        }
                        return ApiResponseDTO.builder()
                                        .success(true)
                                        .message("OTP verified successfully")
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
