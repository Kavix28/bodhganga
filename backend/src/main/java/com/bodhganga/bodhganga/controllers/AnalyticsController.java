package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Real-time atomic analytics endpoints for public traffic telemetry and admin reporting.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Public fire-and-forget endpoint to record a unique browser session visit.
     */
    @PostMapping("/visit")
    public ResponseEntity<ApiResponseDTO> recordVisit() {
        analyticsService.recordVisit();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Visit recorded")
                .build());
    }

    /**
     * Public fire-and-forget endpoint to record a study resource view/access.
     */
    @PostMapping("/resource-view")
    public ResponseEntity<ApiResponseDTO> recordResourceView(
            @RequestParam(value = "resourceId", required = false) String resourceId) {
        analyticsService.recordResourceView(resourceId);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Resource view recorded")
                .build());
    }

    /**
     * Admin-only live analytics summary for Dashboard cards.
     */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponseDTO> getAdminStats() {
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Analytics stats loaded successfully")
                .data(analyticsService.getAdminStats())
                .build());
    }
}

