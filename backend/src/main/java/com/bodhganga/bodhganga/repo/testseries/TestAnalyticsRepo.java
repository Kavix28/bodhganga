package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestAnalytics;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestAnalyticsRepo extends MongoRepository<TestAnalytics, String> {
    Optional<TestAnalytics> findByTargetTypeAndTargetId(String targetType, String targetId);
}
