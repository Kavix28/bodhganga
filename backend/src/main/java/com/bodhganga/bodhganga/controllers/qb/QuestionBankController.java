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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class QuestionBankController {

    private final QBTestRepo testRepo;
    private final QBQuestionRepo questionRepo;
    private final QBAttemptRepo attemptRepo;
    private final QBBundleRepo bundleRepo;
    private final MongoTemplate mongoTemplate;

    public QuestionBankController(QBTestRepo testRepo,
                                  QBQuestionRepo questionRepo,
                                  QBAttemptRepo attemptRepo,
                                  QBBundleRepo bundleRepo,
                                  MongoTemplate mongoTemplate) {
        this.testRepo = testRepo;
        this.questionRepo = questionRepo;
        this.attemptRepo = attemptRepo;
        this.bundleRepo = bundleRepo;
        this.mongoTemplate = mongoTemplate;
    }

    // ── Helper: get authenticated user id from JWT principal ──────────────────

    /**
     * Extracts the authenticated user's identifier from the Spring Security context.
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
     * GET /api/question-bank/tests
     * Returns published tests filtered by state, exam, or subject. Public — no auth required.
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
     * Returns test with randomized question order & option positions for live exam session.
     * No Gemini calls — purely MongoDB reads.
     */
    @GetMapping("/tests/{id}")
    public ResponseEntity<ApiResponseDTO> getTestById(@PathVariable String id) {
        QBTest test = mongoTemplate.findById(id, QBTest.class);
        if (test == null || !Boolean.TRUE.equals(test.getPublished())) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Test not found")
                    .build());
        }

        List<QBQuestion> rawQuestions = (List<QBQuestion>) questionRepo.findAllById(
                test.getQuestionIds() != null ? test.getQuestionIds() : Collections.emptyList()
        );

        // Randomize question order and shuffle options for each question
        List<QBQuestion> randomizedQuestions = new ArrayList<>(rawQuestions);
        Collections.shuffle(randomizedQuestions);

        for (QBQuestion q : randomizedQuestions) {
            if (q.getOptions() != null) {
                List<QBQuestion.QBOption> shuffledOpts = new ArrayList<>(q.getOptions());
                Collections.shuffle(shuffledOpts);
                q.setOptions(shuffledOpts);
            }
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("test", test);
        responseData.put("questions", randomizedQuestions);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test loaded for live attempt")
                .data(responseData)
                .build());
    }

    /**
     * POST /api/question-bank/tests/{id}/submit
     * Evaluates exam attempt, calculates score, accuracy, and weak/strong topics.
     * Requires authentication — userId is extracted from the JWT principal, never from the request body.
     */
    @PostMapping("/tests/{id}/submit")
    public ResponseEntity<ApiResponseDTO> submitTest(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload) {

        // Always derive userId from the authenticated principal — never trust the payload
        String userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authentication required to submit a test.")
                    .build());
        }

        QBTest test = mongoTemplate.findById(id, QBTest.class);
        if (test == null) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Test not found")
                    .build());
        }

        @SuppressWarnings("unchecked")
        Map<String, String> userAnswers = (Map<String, String>) payload.getOrDefault("userAnswers", Collections.emptyMap());
        @SuppressWarnings("unchecked")
        List<String> bookmarks = (List<String>) payload.getOrDefault("bookmarks", Collections.emptyList());
        Integer timeSpentSeconds = payload.get("timeSpentSeconds") instanceof Integer t ? t : 0;

        List<QBQuestion> questions = (List<QBQuestion>) questionRepo.findAllById(
                test.getQuestionIds() != null ? test.getQuestionIds() : Collections.emptyList()
        );

        double score = 0.0;
        double totalPossibleMarks = 0.0;
        int correctCount = 0;
        int attemptedCount = userAnswers.size();

        Map<String, int[]> topicStats = new HashMap<>(); // topic → [correctCount, totalCount]

        for (QBQuestion q : questions) {
            double marks    = q.getMarks() != null ? q.getMarks() : 1.0;
            double negMarks = q.getNegativeMarks() != null ? q.getNegativeMarks() : 0.25;
            totalPossibleMarks += marks;

            String topic = q.getTopic() != null ? q.getTopic() : "General";
            topicStats.putIfAbsent(topic, new int[]{0, 0});
            topicStats.get(topic)[1]++;

            String selectedAnswer = userAnswers.get(q.getId());
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

        QBAttempt attempt = new QBAttempt();
        attempt.setUserId(userId);
        attempt.setTestId(id);
        attempt.setTestTitle(test.getTitle());
        attempt.setScore(Math.max(0.0, Math.round(score * 100.0) / 100.0));
        attempt.setTotalMarks(totalPossibleMarks);
        attempt.setAccuracy(Math.round(accuracy * 100.0) / 100.0);
        attempt.setTimeSpentSeconds(timeSpentSeconds);
        attempt.setUserAnswers(userAnswers);
        attempt.setBookmarkedQuestionIds(bookmarks);
        attempt.setTopicPerformance(topicPerformance);
        attempt.setStatus("SUBMITTED");
        attempt.setSubmittedAt(new Date());

        attemptRepo.save(attempt);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("attempt", attempt);
        responseData.put("questionsWithExplanations", questions);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Test submitted and evaluated successfully")
                .data(responseData)
                .build());
    }

    /**
     * GET /api/question-bank/search
     * Full-text search across question text, topic, chapter, keywords, and OCR content.
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
                    Criteria.where("ocrText").regex(regex)
            ));
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

        long attemptedCount  = attempts.size();
        long completedCount  = attempts.stream().filter(a -> "SUBMITTED".equalsIgnoreCase(a.getStatus())).count();

        double bestScore  = attempts.stream().mapToDouble(QBAttempt::getScore).max().orElse(0.0);
        double avgScore   = attempts.stream().mapToDouble(QBAttempt::getScore).average().orElse(0.0);
        double avgAccuracy = attempts.stream().mapToDouble(QBAttempt::getAccuracy).average().orElse(0.0);
        int totalTimeSpent = attempts.stream().mapToInt(QBAttempt::getTimeSpentSeconds).sum();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("availableTests",       availableTests);
        dashboard.put("attemptedCount",       attemptedCount);
        dashboard.put("completedCount",       completedCount);
        dashboard.put("bestScore",            Math.round(bestScore   * 100.0) / 100.0);
        dashboard.put("avgScore",             Math.round(avgScore    * 100.0) / 100.0);
        dashboard.put("avgAccuracy",          Math.round(avgAccuracy * 100.0) / 100.0);
        dashboard.put("totalTimeSpentSeconds", totalTimeSpent);
        dashboard.put("recentAttempts",       attempts);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Dashboard analytics retrieved")
                .data(dashboard)
                .build());
    }
}
