package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.testseries.AntiCheatingEventDTO;
import com.bodhganga.bodhganga.dto.testseries.ResponseSubmitDTO;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import com.bodhganga.bodhganga.entity.testseries.TestSession;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.testseries.AntiCheatingService;
import com.bodhganga.bodhganga.services.testseries.TestExecutionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-execution")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000",
                "https://bodhganga.in", "https://www.bodhganga.in" })
public class TestExecutionController {

        private final TestExecutionService testExecutionService;
        private final AntiCheatingService antiCheatingService;
        private final UserRepo userRepo;

        public TestExecutionController(TestExecutionService testExecutionService,
                        AntiCheatingService antiCheatingService,
                        UserRepo userRepo) {
                this.testExecutionService = testExecutionService;
                this.antiCheatingService = antiCheatingService;
                this.userRepo = userRepo;
        }

        private User getAuthenticatedUser(Authentication authentication) {
                String email = authentication.getName();
                return userRepo.findByIdentifier(email)
                                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        }

        @PostMapping("/start/{testSeriesId}")
        public ResponseEntity<ApiResponseDTO> startOrResumeSession(
                        @PathVariable String testSeriesId,
                        Authentication authentication,
                        HttpServletRequest request) {
                User user = getAuthenticatedUser(authentication);
                String clientIp = request.getRemoteAddr();
                String userAgent = request.getHeader("User-Agent");

                TestSession session = testExecutionService.startOrResumeSession(
                                testSeriesId, user.getId(), user.getEmail(), clientIp, userAgent);

                return ResponseEntity.ok(ApiResponseDTO.builder()
                                .success(true)
                                .message("Test session initialized")
                                .data(session)
                                .build());
        }

        @PostMapping("/save-response")
        public ResponseEntity<ApiResponseDTO> saveResponse(
                        @RequestBody ResponseSubmitDTO dto,
                        Authentication authentication) {
                User user = getAuthenticatedUser(authentication);
                TestSession session = testExecutionService.saveResponse(dto, user.getId());

                return ResponseEntity.ok(ApiResponseDTO.builder()
                                .success(true)
                                .message("Response saved")
                                .data(session)
                                .build());
        }

        @PostMapping("/anti-cheating-event")
        public ResponseEntity<ApiResponseDTO> logAntiCheatingEvent(
                        @RequestBody AntiCheatingEventDTO dto,
                        Authentication authentication) {
                User user = getAuthenticatedUser(authentication);
                boolean logged = antiCheatingService.logSecurityEvent(dto, user.getId(), user.getEmail());

                return ResponseEntity.ok(ApiResponseDTO.builder()
                                .success(logged)
                                .message(logged ? "Security event logged" : "Failed to log event")
                                .build());
        }

        @PostMapping("/submit/{sessionId}")
        public ResponseEntity<ApiResponseDTO> submitTest(
                        @PathVariable String sessionId,
                        @RequestParam(defaultValue = "MANUAL") String submitType,
                        Authentication authentication) {
                User user = getAuthenticatedUser(authentication);
                TestAttempt attempt = testExecutionService.submitSession(sessionId, user.getId(), submitType);

                return ResponseEntity.ok(ApiResponseDTO.builder()
                                .success(true)
                                .message("Test submitted and evaluated successfully")
                                .data(attempt)
                                .build());
        }
}
