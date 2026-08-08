package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import com.bodhganga.bodhganga.entity.testseries.TestLeaderboard;
import com.bodhganga.bodhganga.repo.testseries.TestAttemptRepo;
import com.bodhganga.bodhganga.repo.testseries.TestLeaderboardRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-evaluation")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class TestEvaluationController {

    private final TestAttemptRepo testAttemptRepo;
    private final TestLeaderboardRepo testLeaderboardRepo;

    public TestEvaluationController(TestAttemptRepo testAttemptRepo, TestLeaderboardRepo testLeaderboardRepo) {
        this.testAttemptRepo = testAttemptRepo;
        this.testLeaderboardRepo = testLeaderboardRepo;
    }

    @GetMapping("/result/{attemptId}")
    public ResponseEntity<ApiResponseDTO> getAttemptResult(@PathVariable String attemptId) {
        TestAttempt attempt = testAttemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Test attempt result not found"));

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test result loaded")
                .data(attempt)
                .build());
    }

    @GetMapping("/leaderboard/{testSeriesId}")
    public ResponseEntity<ApiResponseDTO> getLeaderboard(
            @PathVariable String testSeriesId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TestLeaderboard> leaderboard = testLeaderboardRepo.findByTestSeriesIdOrderByRankAsc(
                testSeriesId, PageRequest.of(page, size));

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test leaderboard loaded")
                .data(leaderboard)
                .build());
    }
}
