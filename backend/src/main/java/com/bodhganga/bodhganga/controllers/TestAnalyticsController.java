package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.testseries.TestAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test-analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class TestAnalyticsController {

    private final TestAnalyticsService testAnalyticsService;
    private final UserRepo userRepo;

    public TestAnalyticsController(TestAnalyticsService testAnalyticsService, UserRepo userRepo) {
        this.testAnalyticsService = testAnalyticsService;
        this.userRepo = userRepo;
    }

    @GetMapping("/user-summary")
    public ResponseEntity<ApiResponseDTO> getUserAnalytics(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Map<String, Object> analytics = testAnalyticsService.getUserAnalytics(user.getId());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("User test analytics retrieved")
                .data(analytics)
                .build());
    }

    @GetMapping("/admin-summary")
    public ResponseEntity<ApiResponseDTO> getAdminAnalytics() {
        Map<String, Object> analytics = testAnalyticsService.getAdminAnalyticsOverview();

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Admin test series analytics loaded")
                .data(analytics)
                .build());
    }
}
