package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import com.bodhganga.bodhganga.entity.testseries.TestLeaderboard;
import com.bodhganga.bodhganga.repo.testseries.TestAttemptRepo;
import com.bodhganga.bodhganga.repo.testseries.TestLeaderboardRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class RankAndPercentileService {

    private static final Logger log = LoggerFactory.getLogger(RankAndPercentileService.class);

    private final TestAttemptRepo testAttemptRepo;
    private final TestLeaderboardRepo testLeaderboardRepo;

    public RankAndPercentileService(TestAttemptRepo testAttemptRepo, TestLeaderboardRepo testLeaderboardRepo) {
        this.testAttemptRepo = testAttemptRepo;
        this.testLeaderboardRepo = testLeaderboardRepo;
    }

    @Async
    public void calculateLeaderboardAndRanks(String testSeriesId) {
        try {
            List<TestAttempt> attempts = testAttemptRepo.findByTestSeriesIdOrderByScoreDescTimeTakenSecondsAsc(testSeriesId);
            if (attempts.isEmpty()) return;

            testLeaderboardRepo.deleteByTestSeriesId(testSeriesId);

            long totalCandidates = attempts.size();
            for (int i = 0; i < attempts.size(); i++) {
                TestAttempt attempt = attempts.get(i);
                int rank = i + 1;

                double percentile = totalCandidates > 1
                        ? Math.round(((double) (totalCandidates - rank) / totalCandidates) * 100.0 * 100.0) / 100.0
                        : 100.0;

                attempt.setRank(rank);
                attempt.setPercentile(percentile);
                testAttemptRepo.save(attempt);

                TestLeaderboard entry = new TestLeaderboard();
                entry.setTestSeriesId(testSeriesId);
                entry.setAttemptId(attempt.getId());
                entry.setUserId(attempt.getUserId());
                entry.setUserEmail(attempt.getUserEmail());
                entry.setStateSlug(attempt.getStateSlug());
                entry.setDistrictSlug(attempt.getDistrictSlug());
                entry.setScore(attempt.getScore());
                entry.setTotalMarks(attempt.getTotalMarks());
                entry.setAccuracy(attempt.getAccuracy());
                entry.setTimeTakenSeconds(attempt.getTimeTakenSeconds());
                entry.setRank(rank);
                entry.setPercentile(percentile);
                entry.setCalculatedAt(new Date());

                testLeaderboardRepo.save(entry);
            }
        } catch (Exception e) {
            log.error("Error calculating ranks for test {}: {}", testSeriesId, e.getMessage(), e);
        }
    }
}
