package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.service.OtpService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/otp")
public class OtpController {

    private final OtpService otpService;
    private final UserRepo userRepo;

    public OtpController(OtpService otpService, UserRepo userRepo) {
        this.otpService = otpService;
        this.userRepo = userRepo;
    }

    /**
     * POST /api/auth/otp/send
     * Send OTP to email for verification
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponseDTO> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        // Check user exists
        if (!userRepo.existsByEmail(req.email())) {
            // Return same message to prevent user enumeration
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("If this email is registered, an OTP has been sent.")
                    .build());
        }

        String error = otpService.sendOtp(req.email());
        if (error != null) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDTO.builder().success(false).message(error).build());
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("OTP sent successfully. Check your email.")
                .build());
    }

    /**
     * POST /api/auth/otp/verify
     * Verify OTP and mark user as verified
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponseDTO> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        String error = otpService.verifyOtp(req.email(), req.otp());
        if (error != null) {
            return ResponseEntity.badRequest().body(
                    ApiResponseDTO.builder().success(false).message(error).build());
        }

        // Mark user as verified
        userRepo.findByEmail(req.email()).ifPresent(user -> {
            user.setVerified(true);
            user.setEmailVerified(true);
            userRepo.save(user);
        });

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Email verified successfully.")
                .build());
    }

    // ── Request Records ───────────────────────────────────────────

    public record SendOtpRequest(
        @NotBlank @Email String email
    ) {}

    public record VerifyOtpRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 6, message = "OTP must be 6 digits") String otp
    ) {}
}
