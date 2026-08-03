package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.QuizAttemptRequestDTO;
import com.bodhganga.bodhganga.entity.QuizAttempt;
import com.bodhganga.bodhganga.entity.QuizAttempt.TopicStats;
import com.bodhganga.bodhganga.repo.QuizAttemptRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/quiz")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class QuizAttemptController {

    private final QuizAttemptRepo quizAttemptRepo;
    private final UserRepo userRepo;

    public QuizAttemptController(QuizAttemptRepo quizAttemptRepo, UserRepo userRepo) {
        this.quizAttemptRepo = quizAttemptRepo;
        this.userRepo = userRepo;
    }

    private String getUserId(String email) {
        return userRepo.findByEmail(email).map(com.bodhganga.bodhganga.entity.User::getId).orElse(null);
    }

    @PostMapping("/attempt")
    public ResponseEntity<ApiResponseDTO> saveAttempt(@RequestBody QuizAttemptRequestDTO requestDTO,
                                                      Authentication authentication) {
        String userEmail = authentication.getName();
        String userId = getUserId(userEmail);

        if (userId == null) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(false)
                    .message("User not found")
                    .build());
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .userId(userId)
                .stateSlug(requestDTO.getStateSlug())
                .districtSlug(requestDTO.getDistrictSlug())
                .testType(requestDTO.getTestType())
                .totalQuestions(requestDTO.getTotalQuestions())
                .correctCount(requestDTO.getCorrectCount())
                .incorrectCount(requestDTO.getIncorrectCount())
                .unattemptedCount(requestDTO.getUnattemptedCount())
                .score(requestDTO.getScore())
                .percentage(requestDTO.getPercentage())
                .accuracy(requestDTO.getAccuracy())
                .timeTaken(requestDTO.getTimeTaken())
                .topicAnalysis(requestDTO.getTopicAnalysis())
                .bookmarkedQuestionIds(requestDTO.getBookmarkedQuestionIds())
                .attemptedAt(Instant.now())
                .build();

        QuizAttempt savedAttempt = quizAttemptRepo.save(attempt);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Quiz attempt saved successfully")
                .data(savedAttempt)
                .build());
    }

    @GetMapping("/attempts")
    public ResponseEntity<ApiResponseDTO> getAttempts(
            @RequestParam(required = false) String stateSlug,
            @RequestParam(required = false) String districtSlug,
            Authentication authentication) {
        String userEmail = authentication.getName();
        String userId = getUserId(userEmail);

        if (userId == null) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(false)
                    .message("User not found")
                    .build());
        }

        List<QuizAttempt> attempts;
        if (stateSlug != null && districtSlug != null) {
            attempts = quizAttemptRepo.findByUserIdAndStateSlugAndDistrictSlugOrderByAttemptedAtDesc(userId, stateSlug, districtSlug);
        } else if (stateSlug != null) {
            attempts = quizAttemptRepo.findByUserIdAndStateSlugOrderByAttemptedAtDesc(userId, stateSlug);
        } else if (districtSlug != null) {
            attempts = quizAttemptRepo.findByUserIdAndDistrictSlugOrderByAttemptedAtDesc(userId, districtSlug);
        } else {
            attempts = quizAttemptRepo.findByUserIdOrderByAttemptedAtDesc(userId);
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Quiz attempts retrieved successfully")
                .data(attempts)
                .build());
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponseDTO> getStats(Authentication authentication) {
        String userEmail = authentication.getName();
        String userId = getUserId(userEmail);

        if (userId == null) {
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(false)
                    .message("User not found")
                    .build());
        }

        Map<String, Object> stats = new HashMap<>();
        List<QuizAttempt> attempts = quizAttemptRepo.findByUserIdOrderByAttemptedAtDesc(userId);
        if (attempts.isEmpty()) {
            stats.put("totalAttempts", 0);
            stats.put("averageScore", 0.0);
            stats.put("averageAccuracy", 0.0);
            stats.put("averagePercentage", 0.0);
            stats.put("totalQuestionsAttempted", 0);
            stats.put("bestScore", 0.0);
            stats.put("currentStreak", 0);
            stats.put("longestStreak", 0);
            stats.put("weakTopics", new ArrayList<>());
            stats.put("districtsAttempted", 0);
            stats.put("recentActivity", getRecentActivityDefaults());

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("No attempts found. Default stats loaded.")
                    .data(stats)
                    .build());
        }

        int totalAttempts = attempts.size();
        double sumScore = 0;
        double sumAccuracy = 0;
        double sumPercentage = 0;
        int totalQuestionsAttempted = 0;
        double bestScore = 0;
        Set<String> distinctDistricts = new HashSet<>();

        Map<String, int[]> topicSums = new HashMap<>();
        Set<LocalDate> dates = new HashSet<>();
        ZoneId zone = ZoneId.systemDefault();

        for (QuizAttempt attempt : attempts) {
            sumScore += attempt.getScore();
            sumAccuracy += attempt.getAccuracy();
            sumPercentage += attempt.getPercentage();
            totalQuestionsAttempted += (attempt.getCorrectCount() + attempt.getIncorrectCount());

            if (attempt.getScore() > bestScore) {
                bestScore = attempt.getScore();
            }

            if (attempt.getDistrictSlug() != null) {
                distinctDistricts.add(attempt.getDistrictSlug());
            }

            if (attempt.getAttemptedAt() != null) {
                dates.add(LocalDate.ofInstant(attempt.getAttemptedAt(), zone));
            }

            if (attempt.getTopicAnalysis() != null) {
                for (Map.Entry<String, TopicStats> entry : attempt.getTopicAnalysis().entrySet()) {
                    String topic = entry.getKey();
                    TopicStats statsObj = entry.getValue();
                    if (statsObj != null) {
                        int[] sums = topicSums.computeIfAbsent(topic, k -> new int[2]);
                        sums[0] += statsObj.getCorrect();
                        sums[1] += statsObj.getTotal();
                    }
                }
            }
        }

        double averageScore = Math.round((sumScore / totalAttempts) * 100.0) / 100.0;
        double averageAccuracy = Math.round((sumAccuracy / totalAttempts) * 100.0) / 100.0;
        double averagePercentage = Math.round((sumPercentage / totalAttempts) * 100.0) / 100.0;

        stats.put("totalAttempts", totalAttempts);
        stats.put("averageScore", averageScore);
        stats.put("averageAccuracy", averageAccuracy);
        stats.put("averagePercentage", averagePercentage);
        stats.put("totalQuestionsAttempted", totalQuestionsAttempted);
        stats.put("bestScore", bestScore);
        stats.put("districtsAttempted", distinctDistricts.size());

        int currentStreak = calculateCurrentStreak(dates);
        int longestStreak = calculateLongestStreak(dates);
        stats.put("currentStreak", currentStreak);
        stats.put("longestStreak", longestStreak);

        List<Map<String, Object>> weakTopics = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : topicSums.entrySet()) {
            String topic = entry.getKey();
            int[] sums = entry.getValue();
            int correct = sums[0];
            int total = sums[1];
            int accuracy = total > 0 ? (int) Math.round(((double) correct / total) * 100.0) : 0;

            Map<String, Object> topicMap = new HashMap<>();
            topicMap.put("topic", topic);
            topicMap.put("accuracy", accuracy);
            topicMap.put("totalQuestions", total);
            weakTopics.add(topicMap);
        }
        weakTopics.sort((a, b) -> Integer.compare((int) a.get("accuracy"), (int) b.get("accuracy")));
        if (weakTopics.size() > 5) {
            weakTopics = weakTopics.subList(0, 5);
        }
        stats.put("weakTopics", weakTopics);

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        Map<String, Long> activityCounts = new HashMap<>();
        for (QuizAttempt attempt : attempts) {
            if (attempt.getAttemptedAt() != null) {
                LocalDate date = LocalDate.ofInstant(attempt.getAttemptedAt(), zone);
                if (!date.isBefore(today.minusDays(6)) && !date.isAfter(today)) {
                    String dateStr = date.toString();
                    activityCounts.put(dateStr, activityCounts.getOrDefault(dateStr, 0L) + 1);
                }
            }
        }

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.toString();
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", dateStr);
            dayData.put("count", activityCounts.getOrDefault(dateStr, 0L));
            recentActivity.add(dayData);
        }
        stats.put("recentActivity", recentActivity);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Quiz stats aggregated successfully")
                .data(stats)
                .build());
    }

    private int calculateCurrentStreak(Set<LocalDate> dates) {
        if (dates.isEmpty()) return 0;
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        if (!dates.contains(today) && !dates.contains(yesterday)) {
            return 0;
        }

        int streak = 0;
        LocalDate checkDate = dates.contains(today) ? today : yesterday;
        while (dates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }
        return streak;
    }

    private int calculateLongestStreak(Set<LocalDate> dates) {
        if (dates.isEmpty()) return 0;
        List<LocalDate> sortedDates = new ArrayList<>(dates);
        Collections.sort(sortedDates);

        int maxStreak = 0;
        int currentStreak = 0;
        LocalDate previousDate = null;

        for (LocalDate date : sortedDates) {
            if (previousDate == null) {
                currentStreak = 1;
            } else if (date.equals(previousDate.plusDays(1))) {
                currentStreak++;
            } else if (!date.equals(previousDate)) {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
            previousDate = date;
        }
        return Math.max(maxStreak, currentStreak);
    }

    private List<Map<String, Object>> getRecentActivityDefaults() {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("count", 0L);
            recentActivity.add(dayData);
        }
        return recentActivity;
    }
}
