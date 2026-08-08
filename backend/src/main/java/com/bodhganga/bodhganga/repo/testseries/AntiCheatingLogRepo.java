package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.AntiCheatingLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AntiCheatingLogRepo extends MongoRepository<AntiCheatingLog, String> {
    List<AntiCheatingLog> findBySessionId(String sessionId);
    List<AntiCheatingLog> findByUserId(String userId);
}
