package com.bodhganga.bodhganga.services;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.PasswordResetToken;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.PasswordResetTokenRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepo userRepo;
    private final PasswordResetTokenRepo tokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend.url:${FRONTEND_URL:https://www.bodhganga.in}}")
    private String frontendUrl;

    @Value("${password.reset.token.expiration.minutes:30}")
    private int expirationMinutes;

    public PasswordResetService(UserRepo userRepo, PasswordResetTokenRepo tokenRepo,
                                PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Initiate password reset by generating an ephemeral token and dispatching email.
     */
    public ApiResponseDTO createPasswordResetToken(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isBlank()) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Email address is required")
                    .build();
        }

        String normalizedEmail = rawEmail.trim().toLowerCase();

        User user = userRepo.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (user == null) {
            log.warn("Password reset requested for nonexistent email: {}", normalizedEmail);
            // Return success message to protect against email enumeration
            return ApiResponseDTO.builder()
                    .success(true)
                    .message("If an account exists with that email, password reset instructions have been sent.")
                    .build();
        }

        try {
            // Invalidate/delete any previous tokens for this user
            tokenRepo.deleteByUserId(user.getId());

            // Generate cryptographically unique token
            String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
            Date expiryDate = new Date(System.currentTimeMillis() + (expirationMinutes * 60 * 1000L));

            PasswordResetToken resetToken = new PasswordResetToken(token, user.getId(), user.getEmail(), expiryDate);
            tokenRepo.save(resetToken);

            // Construct callback URL matching the frontend route: ${FRONTEND_URL}/reset-password?token=${token}
            String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "https://www.bodhganga.in";
            String resetUrl = base + "/reset-password?token=" + token;

            // Dispatch email asynchronously
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetUrl, expirationMinutes);
            log.info("Password reset token generated for user id: {}", user.getId());

            return ApiResponseDTO.builder()
                    .success(true)
                    .message("Password reset instructions have been sent to your email address.")
                    .build();
        } catch (Exception e) {
            log.error("Error creating password reset token for {}: {}", normalizedEmail, e.getMessage(), e);
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Unable to process password reset request at this time. Please retry shortly.")
                    .build();
        }
    }

    /**
     * Validate reset token status before displaying the form to user.
     */
    public ApiResponseDTO validatePasswordResetToken(String token) {
        if (token == null || token.trim().isBlank()) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Reset token is required")
                    .build();
        }

        PasswordResetToken resetToken = tokenRepo.findByTokenAndUsedFalse(token.trim()).orElse(null);
        if (resetToken == null) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Invalid or already redeemed password reset token.")
                    .build();
        }

        if (resetToken.isExpired()) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("This password reset token has expired. Please request a new link.")
                    .build();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("email", resetToken.getEmail());
        data.put("valid", true);

        return ApiResponseDTO.builder()
                .success(true)
                .message("Token is valid.")
                .data(data)
                .build();
    }

    /**
     * Redeem token and update user's password using BCrypt encoding.
     */
    public ApiResponseDTO resetPassword(String token, String newPassword) {
        if (token == null || token.trim().isBlank()) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Reset token is required")
                    .build();
        }

        if (newPassword == null || newPassword.length() < 6) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Password must be at least 6 characters")
                    .build();
        }

        PasswordResetToken resetToken = tokenRepo.findByTokenAndUsedFalse(token.trim()).orElse(null);
        if (resetToken == null) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Invalid or already redeemed password reset token.")
                    .build();
        }

        if (resetToken.isExpired()) {
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("This password reset token has expired. Please request a new link.")
                    .build();
        }

        User user = null;
        if (resetToken.getUserId() != null) {
            user = userRepo.findById(resetToken.getUserId()).orElse(null);
        }
        if (user == null && resetToken.getEmail() != null) {
            user = userRepo.findByEmailIgnoreCase(resetToken.getEmail()).orElse(null);
        }

        if (user == null) {
            log.error("User not found for valid reset token: {}", token);
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Account associated with this token could not be located.")
                    .build();
        }

        try {
            // Strictly encode password using standard BCrypt
            user.setHashedPassword(passwordEncoder.encode(newPassword));
            user.setForcePasswordReset(false);
            user.setActive(true);
            user.setVerified(true);
            userRepo.save(user);

            // Invalidate token
            resetToken.setUsed(true);
            tokenRepo.save(resetToken);

            log.info("Password successfully updated for user: {}", user.getId());

            return ApiResponseDTO.builder()
                    .success(true)
                    .message("Password reset successful. You may now sign in with your new credentials.")
                    .build();
        } catch (Exception e) {
            log.error("Failed to update password for user {}: {}", user.getId(), e.getMessage(), e);
            return ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to update password. Please try again.")
                    .build();
        }
    }
}

