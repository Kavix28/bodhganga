package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class DashboardController {

    /**
     * GET /api/dashboard
     * User dashboard homepage after login
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getDashboard(Authentication authentication) {
        String userEmail = authentication.getName();

        Map<String, Object> dashboardData = new HashMap<>();
        dashboardData.put("welcomeMessage", "Welcome to BodhGanga Dashboard!");
        dashboardData.put("userEmail", userEmail);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Dashboard loaded successfully")
                .data(dashboardData)
                .build());
    }

    /**
     * GET /api/dashboard/stats
     * Get user statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponseDTO> getStats(Authentication authentication) {
        // TODO: Implement actual stats from database
        Map<String, Object> stats = new HashMap<>();
        stats.put("enrolledCourses", 0);
        stats.put("completedCourses", 0);
        stats.put("inProgressCourses", 0);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Stats retrieved")
                .data(stats)
                .build());
    }
}
