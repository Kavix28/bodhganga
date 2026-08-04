package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.testseries.TestSeries;
import com.bodhganga.bodhganga.services.testseries.TestSeriesService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-series")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class TestSeriesController {

    private final TestSeriesService testSeriesService;

    public TestSeriesController(TestSeriesService testSeriesService) {
        this.testSeriesService = testSeriesService;
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponseDTO> getCatalog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TestSeries> catalog = testSeriesService.getPublishedCatalog(page, size);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test series catalog retrieved")
                .data(catalog)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> getById(@PathVariable String id) {
        TestSeries ts = testSeriesService.getById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test series details loaded")
                .data(ts)
                .build());
    }

    @GetMapping("/state/{stateSlug}")
    public ResponseEntity<ApiResponseDTO> getByState(@PathVariable String stateSlug) {
        List<TestSeries> list = testSeriesService.getByState(stateSlug);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State test series loaded")
                .data(list)
                .build());
    }

    @GetMapping("/district/{districtSlug}")
    public ResponseEntity<ApiResponseDTO> getByDistrict(@PathVariable String districtSlug) {
        List<TestSeries> list = testSeriesService.getByDistrict(districtSlug);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("District test series loaded")
                .data(list)
                .build());
    }

    @GetMapping("/type/{testType}")
    public ResponseEntity<ApiResponseDTO> getByType(@PathVariable String testType) {
        List<TestSeries> list = testSeriesService.getByType(testType);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Typed test series loaded")
                .data(list)
                .build());
    }
}
