package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestLeaderboard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestLeaderboardRepo extends MongoRepository<TestLeaderboard, String> {

    List<TestLeaderboard> findByTestSeriesIdOrderByRankAsc(String testSeriesId);

    Page<TestLeaderboard> findByTestSeriesIdOrderByRankAsc(String testSeriesId, Pageable pageable);

    Optional<TestLeaderboard> findByTestSeriesIdAndUserId(String testSeriesId, String userId);

    void deleteByTestSeriesId(String testSeriesId);
}
