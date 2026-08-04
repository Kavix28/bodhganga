package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestAttemptRepo extends MongoRepository<TestAttempt, String> {

    List<TestAttempt> findByUserIdOrderByAttemptedAtDesc(String userId);

    Page<TestAttempt> findByUserIdOrderByAttemptedAtDesc(String userId, Pageable pageable);

    List<TestAttempt> findByTestSeriesIdOrderByScoreDescTimeTakenSecondsAsc(String testSeriesId);

    long countByTestSeriesId(String testSeriesId);

    long countByUserId(String userId);

    long countByTestSeriesIdAndScoreGreaterThan(String testSeriesId, Double score);
}
