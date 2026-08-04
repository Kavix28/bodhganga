package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import com.bodhganga.bodhganga.repo.testseries.TestAttemptRepo;
import com.bodhganga.bodhganga.repo.testseries.TestSeriesRepo;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TestAnalyticsService {

    private final TestAttemptRepo testAttemptRepo;
    private final TestSeriesRepo testSeriesRepo;

    public TestAnalyticsService(TestAttemptRepo testAttemptRepo, TestSeriesRepo testSeriesRepo) {
        this.testAttemptRepo = testAttemptRepo;
        this.testSeriesRepo = testSeriesRepo;
    }

    public Map<String, Object> getUserAnalytics(String userId) {
        List<TestAttempt> attempts = testAttemptRepo.findByUserIdOrderByAttemptedAtDesc(userId);

        Map<String, Object> res = new HashMap<>();
        res.put("totalAttempts", attempts.size());

        if (attempts.isEmpty()) {
            res.put("averageScore", 0.0);
            res.put("averageAccuracy", 0.0);
            res.put("bestScore", 0.0);
            res.put("totalQuestionsAttempted", 0);
            res.put("correctCount", 0);
            res.put("incorrectCount", 0);
            res.put("unattemptedCount", 0);
            res.put("recentAttempts", new ArrayList<>());
            return res;
        }

        double sumScore = attempts.stream().mapToDouble(TestAttempt::getScore).sum();
        double sumAccuracy = attempts.stream().mapToDouble(TestAttempt::getAccuracy).sum();
        double bestScore = attempts.stream().mapToDouble(TestAttempt::getScore).max().orElse(0.0);

        int totalQs = attempts.stream().mapToInt(TestAttempt::getTotalQuestions).sum();
        int totalCorrect = attempts.stream().mapToInt(TestAttempt::getCorrectCount).sum();
        int totalIncorrect = attempts.stream().mapToInt(TestAttempt::getIncorrectCount).sum();
        int totalUnattempted = attempts.stream().mapToInt(TestAttempt::getUnattemptedCount).sum();

        res.put("averageScore", Math.round((sumScore / attempts.size()) * 100.0) / 100.0);
        res.put("averageAccuracy", Math.round((sumAccuracy / attempts.size()) * 100.0) / 100.0);
        res.put("bestScore", bestScore);
        res.put("totalQuestionsAttempted", totalCorrect + totalIncorrect);
        res.put("correctCount", totalCorrect);
        res.put("incorrectCount", totalIncorrect);
        res.put("unattemptedCount", totalUnattempted);
        res.put("recentAttempts", attempts.stream().limit(10).toList());

        return res;
    }

    public Map<String, Object> getAdminAnalyticsOverview() {
        Map<String, Object> res = new HashMap<>();
        res.put("totalTestSeriesCount", testSeriesRepo.count());
        res.put("publishedTestSeriesCount", testSeriesRepo.countByIsPublishedTrueAndIsDeletedFalse());
        res.put("freeTestSeriesCount", testSeriesRepo.countByIsFreeTrueAndIsPublishedTrueAndIsDeletedFalse());
        res.put("totalAttemptsCount", testAttemptRepo.count());

        return res;
    }
}
