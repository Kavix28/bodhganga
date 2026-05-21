package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.dto.*;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.util.JwtUtil;
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

        public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
                this.userRepo = userRepo;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
        }

        /**
         * User Signup - Register new user
         */
        public ApiResponseDTO signup(SignupRequestDTO dto) {
                // Check if email already exists
                if (userRepo.existsByEmail(dto.getEmail())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Email already registered")
                                        .build();
                }

                // Check if phone already exists
                if (userRepo.existsByPhoneNo(dto.getPhoneNo())) {
                        return ApiResponseDTO.builder()
                                        .success(false)
                                        .message("Phone number already registered")
                                        .build();
                }

                // Create new user with hashed password
                User user = User.builder()
                                .name(dto.getName())
                                .email(dto.getEmail())
                                .phoneNo(dto.getPhoneNo())
                                .hashedPassword(passwordEncoder.encode(dto.getPassword()))
                                .gender(dto.getGender())
                                .dateOfBirth(dto.getDateOfBirth())
                                .city(dto.getCity())
                                .state(dto.getState())
                                .country(dto.getCountry())
                                .role("USER")
                                .isVerified(false) // Requires email OTP verification
                                .isActive(true)
                                .createdAt(new Date())
                                .build();

                System.out.println("Attempting to save user: " + user.getEmail());
                // Save user to database
                User savedUser = userRepo.save(user);
                System.out.println("User saved successfully with ID: " + savedUser.getId());

                // Generate JWT token for auto-login
                String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId(), savedUser.getRole());

                // Convert to response DTO (without sensitive data)
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
