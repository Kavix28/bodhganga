package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.qb.*;
import com.bodhganga.bodhganga.repo.qb.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/question-bank")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000", "https://bodhganga.in",
        "https://www.bodhganga.in" })
public class QuestionBankController {

    private final QBTestRepo testRepo;
    private final QBQuestionRepo questionRepo;
    private final QBAttemptRepo attemptRepo;
    private final QBBundleRepo bundleRepo;
    private final MongoTemplate mongoTemplate;
    private final com.bodhganga.bodhganga.services.qb.StateTestService stateTestService;

    public QuestionBankController(QBTestRepo testRepo,
            QBQuestionRepo questionRepo,
            QBAttemptRepo attemptRepo,
            QBBundleRepo bundleRepo,
            MongoTemplate mongoTemplate,
            com.bodhganga.bodhganga.services.qb.StateTestService stateTestService) {
        this.testRepo = testRepo;
        this.questionRepo = questionRepo;
        this.attemptRepo = attemptRepo;
        this.bundleRepo = bundleRepo;
        this.mongoTemplate = mongoTemplate;
        this.stateTestService = stateTestService;
    }

    // ── Helper: get authenticated user id from JWT principal ──────────────────

    /**
     * Extracts the authenticated user's identifier from the Spring Security
     * context.
     * The JWT filter sets the principal as the user's email (String).
     * Returns null if no authenticated principal is present (anonymous).
     */
    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String principal) {
            if (!"anonymousUser".equals(principal)) {
                return principal;
            }
        }
        return null;
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    /**
     * GET /api/question-bank/state-tests/{stateSlug}
     * Returns 3-tier difficulty state tests (Easy, Medium, Hard) for a state, with
     * user unlock status.
     */
    @GetMapping("/state-tests/{stateSlug}")
    public ResponseEntity<ApiResponseDTO> getStateTests(@PathVariable String stateSlug) {
        String userId = getAuthenticatedUserId();
        List<Map<String, Object>> tests = stateTestService.getOrGenerateStateTests(stateSlug, userId);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("State tests retrieved successfully")
                .data(tests)
                .build());
    }

    /**
     * GET /api/question-bank/tests
     * Returns published tests filtered by state, exam, or subject. Public — no auth
     * required.
     */
    @GetMapping("/tests")
    public ResponseEntity<ApiResponseDTO> getTests(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String exam,
            @RequestParam(required = false) String subject) {

        Query query = new Query();
        query.addCriteria(Criteria.where("published").is(true));

        if (state != null && !state.isBlank()) {
            query.addCriteria(Criteria.where("stateSlug").is(state.toLowerCase()));
        }
        if (exam != null && !exam.isBlank()) {
            query.addCriteria(Criteria.where("examSlug").is(exam.toLowerCase()));
        }
        if (subject != null && !subject.isBlank()) {
            query.addCriteria(Criteria.where("subjectSlug").is(subject.toLowerCase()));
        }

        List<QBTest> tests = mongoTemplate.find(query, QBTest.class);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Tests retrieved successfully")
                .data(tests)
                .build());
    }

    /**
     * GET /api/question-bank/tests/{id}
     * Returns test with randomized question order & option positions for live exam
     * session.
     * Validates access control & enforces server-authoritative timer.
     */
    @GetMapping("/tests/{id}")
    public ResponseEntity<ApiResponseDTO> getTestById(@PathVariable String id) {
        try {
            String userId = getAuthenticatedUserId();
            Map<String, Object> responseData = stateTestService.loadTestForLiveAttempt(id, userId);

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Test loaded for live attempt")
                    .data(responseData)
                    .build());
        } catch (org.springframework.security.access.AccessDeniedException ade) {
            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                    .success(false)
                    .message(ade.getMessage())
                    .build());
        } catch (NoSuchElementException nse) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message(nse.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to load test: " + e.getMessage())
                    .build());
        }
    }

    /**
     * GET /api/question-bank/practice-more/{stateSlug}/{difficulty}
     * Returns unattempted practice questions for a specific state and difficulty.
     * Enforces backend entitlement: EASY is free, MEDIUM and HARD require state
     * entitlement.
     */
    @GetMapping("/practice-more/{stateSlug}/{difficulty}")
    public ResponseEntity<ApiResponseDTO> getPracticeMore(
            @PathVariable String stateSlug,
            @PathVariable String difficulty) {
        String userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authentication required for Practice More.")
                    .build());
        }

        try {
            Map<String, Object> responseData = stateTestService.loadPracticeMoreSession(stateSlug, difficulty, userId);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Practice questions loaded successfully")
                    .data(responseData)
                    .build());
        } catch (org.springframework.security.access.AccessDeniedException ade) {
            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                    .success(false)
                    .message(ade.getMessage())
                    .build());
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(400).body(ApiResponseDTO.builder()
                    .success(false)
                    .message(iae.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to load practice test: " + e.getMessage())
                    .build());
        }
    }

    /**
     * POST /api/question-bank/tests/{id}/submit
     * Evaluates exam attempt, calculates score, accuracy, and weak/strong topics.
     * Requires authentication — userId is extracted from the JWT principal, never
     * from the request body.
     */
    @PostMapping("/tests/{id}/submit")
    public ResponseEntity<ApiResponseDTO> submitTest(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {

        String userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authentication required to submit a test.")
                    .build());
        }

        String attemptId = payload.get("attemptId") instanceof String s ? s : null;
        QBAttempt attempt = null;

        if (attemptId != null && !attemptId.isBlank()) {
            attempt = mongoTemplate.findById(attemptId, QBAttempt.class);
        }
        if (attempt == null) {
            Query q = new Query(Criteria.where("userId").is(userId)
                    .and("testId").is(id)
                    .and("status").is("IN_PROGRESS"));
            attempt = mongoTemplate.findOne(q, QBAttempt.class);
        }

        if (attempt == null) {
            return ResponseEntity.status(400).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("No active test attempt found or attempt has already been submitted.")
                    .build());
        }

        if (!userId.equals(attempt.getUserId())) {
            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Access denied: Attempt does not belong to current user.")
                    .build());
        }

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return ResponseEntity.status(400).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("This attempt has already been submitted or finalized.")
                    .build());
        }

        boolean isExpired = attempt.getExpiresAt() != null && new Date().after(attempt.getExpiresAt());

        @SuppressWarnings("unchecked")
        Map<String, String> rawAnswers = (Map<String, String>) payload.getOrDefault("userAnswers",
                Collections.emptyMap());
        @SuppressWarnings("unchecked")
        List<String> bookmarks = (List<String>) payload.getOrDefault("bookmarks", Collections.emptyList());
        Integer timeSpentSeconds = payload.get("timeSpentSeconds") instanceof Integer t ? t : 0;

        // PART A & G: AUTHORITATIVE QUESTION SET RESOLUTION
        // Never use userAnswers.keySet() directly for database lookup.
        List<String> authQIds = attempt.getQuestionIds();
        if (authQIds == null || authQIds.isEmpty()) {
            QBTest test = mongoTemplate.findById(id, QBTest.class);
            if (test != null && test.getQuestionIds() != null) {
                authQIds = test.getQuestionIds();
            } else {
                authQIds = Collections.emptyList();
            }
        }

        // Restrict userAnswers strictly to the authoritative set
        Map<String, String> sanitizedUserAnswers = new HashMap<>();
        if (rawAnswers != null) {
            for (Map.Entry<String, String> entry : rawAnswers.entrySet()) {
                if (authQIds.contains(entry.getKey())) {
                    sanitizedUserAnswers.put(entry.getKey(), entry.getValue());
                }
            }
        }

        List<QBQuestion> questions = (List<QBQuestion>) questionRepo.findAllById(authQIds);

        double score = 0.0;
        double totalPossibleMarks = 0.0;
        int correctCount = 0;
        int attemptedCount = sanitizedUserAnswers.size();

        Map<String, int[]> topicStats = new HashMap<>();

        for (QBQuestion q : questions) {
            double marks = q.getMarks() != null ? q.getMarks() : 1.0;
            double negMarks = q.getNegativeMarks() != null ? q.getNegativeMarks() : 0.25;
            totalPossibleMarks += marks;

            String topic = q.getTopic() != null ? q.getTopic() : "General";
            topicStats.putIfAbsent(topic, new int[] { 0, 0 });
            topicStats.get(topic)[1]++;

            String selectedAnswer = sanitizedUserAnswers.get(q.getId());
            if (selectedAnswer != null) {
                if (selectedAnswer.equalsIgnoreCase(q.getCorrectAnswer())) {
                    score += marks;
                    correctCount++;
                    topicStats.get(topic)[0]++;
                } else {
                    score -= negMarks;
                }
            }
        }

        double accuracy = attemptedCount > 0 ? (correctCount * 100.0) / attemptedCount : 0.0;

        Map<String, Double> topicPerformance = new HashMap<>();
        for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
            int[] arr = entry.getValue();
            double topicAcc = arr[1] > 0 ? (arr[0] * 100.0) / arr[1] : 0.0;
            topicPerformance.put(entry.getKey(), Math.round(topicAcc * 10.0) / 10.0);
        }

        attempt.setUserAnswers(sanitizedUserAnswers);
        attempt.setBookmarkedQuestionIds(bookmarks);
        attempt.setTimeSpentSeconds(timeSpentSeconds);
        attempt.setScore(Math.max(0.0, Math.round(score * 100.0) / 100.0));
        attempt.setTotalMarks(totalPossibleMarks);
        attempt.setAccuracy(Math.round(accuracy * 100.0) / 100.0);
        attempt.setTopicPerformance(topicPerformance);
        attempt.setStatus(isExpired ? "EXPIRED" : "SUBMITTED");
        attempt.setSubmittedAt(new Date());

        attemptRepo.save(attempt);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("attempt", attempt);
        responseData.put("questionsWithExplanations", questions);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message(isExpired ? "Test attempt expired. Submitted answers auto-graded."
                        : "Test submitted and evaluated successfully")
                .data(responseData)
                .build());
    }

    /**
     * GET /api/question-bank/search
     * Full-text search across question text, topic, chapter, keywords, and OCR
     * content.
     * Public — no auth required.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponseDTO> searchQuestions(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String exam,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String difficulty) {

        Query query = new Query();
        query.addCriteria(Criteria.where("published").is(true));

        if (state != null && !state.isBlank()) {
            query.addCriteria(Criteria.where("stateSlug").is(state.toLowerCase()));
        }
        if (exam != null && !exam.isBlank()) {
            query.addCriteria(Criteria.where("examSlug").is(exam.toLowerCase()));
        }
        if (subject != null && !subject.isBlank()) {
            query.addCriteria(Criteria.where("subjectSlug").is(subject.toLowerCase()));
        }
        if (difficulty != null && !difficulty.isBlank()) {
            query.addCriteria(Criteria.where("difficulty").is(difficulty.toUpperCase()));
        }

        if (q != null && !q.isBlank()) {
            String regex = "(?i)" + java.util.regex.Pattern.quote(q.trim());
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("questionText").regex(regex),
                    Criteria.where("topic").regex(regex),
                    Criteria.where("chapter").regex(regex),
                    Criteria.where("keywords").regex(regex),
                    Criteria.where("ocrText").regex(regex)));
        }

        List<QBQuestion> questions = mongoTemplate.find(query, QBQuestion.class);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Search completed successfully")
                .data(questions)
                .build());
    }

    /**
     * GET /api/question-bank/dashboard
     * Returns the authenticated user's performance analytics.
     * Requires authentication — userId is extracted from the JWT principal.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponseDTO> getUserDashboard() {
        String userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authentication required to view your dashboard.")
                    .build());
        }

        List<QBAttempt> attempts = attemptRepo.findByUserId(userId);
        long availableTests = testRepo.count();

        long attemptedCount = attempts.size();
        long completedCount = attempts.stream().filter(a -> "SUBMITTED".equalsIgnoreCase(a.getStatus())).count();

        double bestScore = attempts.stream().mapToDouble(QBAttempt::getScore).max().orElse(0.0);
        double avgScore = attempts.stream().mapToDouble(QBAttempt::getScore).average().orElse(0.0);
        double avgAccuracy = attempts.stream().mapToDouble(QBAttempt::getAccuracy).average().orElse(0.0);
        int totalTimeSpent = attempts.stream().mapToInt(QBAttempt::getTimeSpentSeconds).sum();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("availableTests", availableTests);
        dashboard.put("attemptedCount", attemptedCount);
        dashboard.put("completedCount", completedCount);
        dashboard.put("bestScore", Math.round(bestScore * 100.0) / 100.0);
        dashboard.put("avgScore", Math.round(avgScore * 100.0) / 100.0);
        dashboard.put("avgAccuracy", Math.round(avgAccuracy * 100.0) / 100.0);
        dashboard.put("totalTimeSpentSeconds", totalTimeSpent);
        dashboard.put("recentAttempts", attempts);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Dashboard analytics retrieved")
                .data(dashboard)
                .build());
    }
}
