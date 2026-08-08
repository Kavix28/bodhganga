package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.dto.testseries.ResponseSubmitDTO;
import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import com.bodhganga.bodhganga.entity.testseries.TestSeries;
import com.bodhganga.bodhganga.entity.testseries.TestSession;
import com.bodhganga.bodhganga.entity.testseries.UserResponse;
import com.bodhganga.bodhganga.repo.testseries.TestAttemptRepo;
import com.bodhganga.bodhganga.repo.testseries.TestSeriesRepo;
import com.bodhganga.bodhganga.repo.testseries.TestSessionRepo;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TestExecutionService {

    private final TestSessionRepo testSessionRepo;
    private final TestSeriesRepo testSeriesRepo;
    private final TestAttemptRepo testAttemptRepo;
    private final EvaluationEngineService evaluationEngineService;
    private final RankAndPercentileService rankAndPercentileService;

    public TestExecutionService(TestSessionRepo testSessionRepo, TestSeriesRepo testSeriesRepo,
                                TestAttemptRepo testAttemptRepo, EvaluationEngineService evaluationEngineService,
                                RankAndPercentileService rankAndPercentileService) {
        this.testSessionRepo = testSessionRepo;
        this.testSeriesRepo = testSeriesRepo;
        this.testAttemptRepo = testAttemptRepo;
        this.evaluationEngineService = evaluationEngineService;
        this.rankAndPercentileService = rankAndPercentileService;
    }

    public TestSession startOrResumeSession(String testSeriesId, String userId, String userEmail, String clientIp, String userAgent) {
        Optional<TestSession> existingOpt = testSessionRepo.findByUserIdAndTestSeriesIdAndStatusIn(
                userId, testSeriesId, List.of("CREATED", "IN_PROGRESS", "PAUSED"));

        if (existingOpt.isPresent()) {
            TestSession session = existingOpt.get();
            session.setLastHeartbeatTime(new Date());
            return testSessionRepo.save(session);
        }

        TestSeries testSeries = testSeriesRepo.findById(testSeriesId)
                .orElseThrow(() -> new RuntimeException("Test series not found"));

        TestSession session = new TestSession();
        session.setUserId(userId);
        session.setUserEmail(userEmail);
        session.setTestSeriesId(testSeriesId);
        session.setStatus("IN_PROGRESS");
        session.setStartTime(new Date());
        session.setLastHeartbeatTime(new Date());
        session.setClientIp(clientIp);
        session.setUserAgent(userAgent);
        session.setRemainingTimeSeconds(testSeries.getDurationMinutes() * 60);

        List<String> questionIds = new ArrayList<>(testSeries.getQuestionIds());
        if (Boolean.TRUE.equals(testSeries.getRandomizeQuestions())) {
            Collections.shuffle(questionIds);
        }
        session.setQuestionOrder(questionIds);

        return testSessionRepo.save(session);
    }

    public TestSession saveResponse(ResponseSubmitDTO dto, String userId) {
        TestSession session = testSessionRepo.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized session access");
        }

        if (Boolean.TRUE.equals(session.getIsLocked())) {
            throw new RuntimeException("Session locked: " + session.getLockReason());
        }

        UserResponse userResp = session.getResponses().computeIfAbsent(dto.getQuestionId(),
                k -> new UserResponse(dto.getQuestionId(), dto.getSelectedOptionIds(), dto.getIsBookmarked(), dto.getTimeSpentSeconds()));

        userResp.setSelectedOptionIds(dto.getSelectedOptionIds());
        userResp.setTextAnswer(dto.getTextAnswer());
        userResp.setIsBookmarked(dto.getIsBookmarked());
        userResp.setTimeSpentSeconds(dto.getTimeSpentSeconds());
        userResp.setLastUpdatedTimestamp(System.currentTimeMillis());

        if (Boolean.TRUE.equals(dto.getIsBookmarked())) {
            session.getBookmarkedQuestionIds().add(dto.getQuestionId());
        } else {
            session.getBookmarkedQuestionIds().remove(dto.getQuestionId());
        }

        session.setLastHeartbeatTime(new Date());
        return testSessionRepo.save(session);
    }

    public TestAttempt submitSession(String sessionId, String userId, String submitType) {
        TestSession session = testSessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized session access");
        }

        session.setStatus("SUBMITTED");
        session.setEndTime(new Date());
        testSessionRepo.save(session);

        TestSeries testSeries = testSeriesRepo.findById(session.getTestSeriesId())
                .orElseThrow(() -> new RuntimeException("Test series not found"));

        TestAttempt attempt = evaluationEngineService.evaluateSession(session, testSeries, submitType);
        TestAttempt savedAttempt = testAttemptRepo.save(attempt);

        // Async leaderboard rank recalculation
        rankAndPercentileService.calculateLeaderboardAndRanks(testSeries.getId());

        return savedAttempt;
    }
}
