package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestSessionRepo extends MongoRepository<TestSession, String> {

    Optional<TestSession> findByUserIdAndTestSeriesIdAndStatusIn(String userId, String testSeriesId, List<String> statuses);

    List<TestSession> findByUserIdOrderByCreatedAtDesc(String userId);

    List<TestSession> findByStatus(String status);
}
