package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.*;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.util.JwtUtil;
import com.bodhganga.bodhganga.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

        private final UserRepo userRepo;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final EmailService emailService;
        private final OtpService otpService;

        public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService, OtpService otpService) {
                this.userRepo = userRepo;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
                this.emailService = emailService;
                this.otpService = otpService;
        }

        /**
         * User Signup - Register new user
         */
        /**
         * Initiate Email Signup - validates details and sends email OTP
         */
        public ApiResponseDTO registerEmailRequest(SignupRequestDTO dto) {
                // Check if email already exists
                if (userRepo.existsByEmail(dto.getEmail())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Email already registered")
                                        .build();
                }

                // Check if phone already exists
                if (dto.getPhoneNo() != null && !dto.getPhoneNo().isBlank()) {
                        String normalizedPhone = dto.getPhoneNo().replaceAll("[^0-9]", "");
                        if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                                normalizedPhone = normalizedPhone.substring(2);
                        }
                        if (userRepo.existsByPhoneNo(normalizedPhone)) {
                                return ApiResponseDTO.builder()
                                                .success(false)
                                                .message("Phone number already registered")
                                                .build();
                        }
                }

                // Send email OTP
                String error = this.otpService.sendOtp(dto.getEmail());
                if (error != null) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message(error)
                                        .build();
                }

                return ApiResponseDTO.builder()
                                .success(true)
                                .message("OTP sent to your email. Please verify.")
                                .build();
        }

        /**
         * Complete Signup - saves user to DB and generates session (only called after OTP success)
         */
        public ApiResponseDTO completeSignup(SignupRequestDTO dto, boolean emailVerified, boolean phoneVerified) {
                // Double check if email already exists
                if (userRepo.existsByEmail(dto.getEmail())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Email already registered")
                                        .build();
                }

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
                                .isVerified(emailVerified || phoneVerified) // Set to verified since OTP succeeded
                                .emailVerified(emailVerified)
                                .phoneVerified(phoneVerified)
                                .isActive(true)
                                .createdAt(new Date())
                                .build();

                System.out.println("Saving verified user: " + user.getEmail());
                User savedUser = userRepo.save(user);

                // Trigger welcome email asynchronously
                try {
                        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
                } catch (Exception e) {
                        System.err.println("Failed to trigger welcome email: " + e.getMessage());
                }

                // Generate JWT token for auto-login
                String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId(), savedUser.getRole());

                // Convert to response DTO
                UserResponseDTO userResponse = mapToUserResponse(savedUser);

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
                String error = otpService.verifyOtp(email, otp);
                if (error != null) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message(error)
                                        .build();
                }
                return completeSignup(dto, true, false);
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
         * User Login - Authenticate user
         */
        public ApiResponseDTO login(LoginRequestDTO dto) {
                // Determine if input is email or phone
                String emailOrPhone = dto.getEmailOrPhone();
                User user = null;

                if (emailOrPhone.contains("@")) {
                        // It's an email
                        user = userRepo.findByEmail(emailOrPhone).orElse(null);
                } else {
                        // It's a phone number - normalize it (remove non-digits)
                        String normalizedPhone = emailOrPhone.replaceAll("[^0-9]", "");
                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                }

                if (user == null) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Invalid email/phone or password")
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
                                        .message("Invalid email or password")
                                        .build();
                }

                // Update last login timestamp
                user.setLastLogin(new Date());
                userRepo.save(user);

                // Generate JWT token
                String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());

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

                // Determine user from email or phone
                String emailOrPhone = dto.getEmailOrPhone();
                User user = null;
                if (emailOrPhone.contains("@")) {
                        user = userRepo.findByEmail(emailOrPhone).orElse(null);
                } else {
                        String normalizedPhone = emailOrPhone.replaceAll("[^0-9]", "");
                        user = userRepo.findByPhoneNo(normalizedPhone).orElse(null);
                }

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

        private String getMobileFromMsg91(String accessToken) throws Exception {
                String authKey = System.getenv("MSG91_AUTH_KEY");
                if (authKey == null || authKey.isBlank()) {
                        authKey = "520206A2KLoox4x6a15faa9P1"; // Fallback to provided key
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
                        System.err.println("MSG91 Token Verification failed. Status: " + response.statusCode() + ", Body: " + response.body());
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
                        String normalizedPhone = getMobileFromMsg91(accessToken);
                        if (normalizedPhone == null || normalizedPhone.isBlank()) {
                                // Fallback to provided phoneNumber if MSG91 API fails or returns empty in test/mock envs
                                if (phoneNumber != null && !phoneNumber.isBlank()) {
                                        normalizedPhone = phoneNumber.replaceAll("[^0-9]", "");
                                        if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                                                normalizedPhone = normalizedPhone.substring(2);
                                        }
                                } else {
                                        return ApiResponseDTO.builder()
                                                        .success(false)
                                                        .message("MSG91 token verification failed or mobile number not retrieved")
                                                        .build();
                                }
                        } else {
                                // Normalize phone retrieved from MSG91
                                normalizedPhone = normalizedPhone.replaceAll("[^0-9]", "");
                                if (normalizedPhone.startsWith("91") && normalizedPhone.length() == 12) {
                                        normalizedPhone = normalizedPhone.substring(2);
                                }
                        }

                        // Check if it's signup flow or login flow
                        if (signupData != null) {
                                // Mobile Signup Flow
                                signupData.setPhoneNo(normalizedPhone);
                                if (signupData.getEmail() == null || signupData.getEmail().isBlank()) {
                                        signupData.setEmail(normalizedPhone + "@bodhganga.in");
                                }
                                return completeSignup(signupData, false, true);
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
                                                        .emailVerified(false)
                                                        .phoneVerified(true)
                                                        .isActive(true)
                                                        .createdAt(new Date())
                                                        .build();
                                        
                                        System.out.println("Creating new user via MSG91 OTP: " + user.getPhoneNo());
                                        user = userRepo.save(user);

                                        try {
                                                emailService.sendWelcomeEmail(user.getEmail(), user.getName());
                                        } catch (Exception e) {
                                                System.err.println("Failed to trigger welcome email: " + e.getMessage());
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
                        System.err.println("Error during MSG91 token verification: " + e.getMessage());
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
                        System.err.println("Error during MSG91 password reset: " + e.getMessage());
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
