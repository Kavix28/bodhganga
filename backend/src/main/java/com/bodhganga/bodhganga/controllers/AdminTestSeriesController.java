package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.testseries.TestSeriesRequestDTO;
import com.bodhganga.bodhganga.entity.testseries.TestSeries;
import com.bodhganga.bodhganga.services.testseries.TestSeriesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/test-series")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminTestSeriesController {

    private final TestSeriesService testSeriesService;

    public AdminTestSeriesController(TestSeriesService testSeriesService) {
        this.testSeriesService = testSeriesService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO> createTestSeries(
            @RequestBody TestSeriesRequestDTO dto,
            Authentication authentication) {
        String createdBy = authentication.getName();
        TestSeries created = testSeriesService.createTestSeries(dto, createdBy);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test series created successfully")
                .data(created)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateTestSeries(
            @PathVariable String id,
            @RequestBody TestSeriesRequestDTO dto) {
        TestSeries updated = testSeriesService.updateTestSeries(id, dto);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test series updated successfully")
                .data(updated)
                .build());
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponseDTO> publishTestSeries(
            @PathVariable String id,
            @RequestParam boolean publish) {
        TestSeries updated = testSeriesService.publishTestSeries(id, publish);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message(publish ? "Test series published" : "Test series unpublished")
                .data(updated)
                .build());
    }
}
