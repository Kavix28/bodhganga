package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface QBAttemptRepo extends MongoRepository<QBAttempt, String> {
    List<QBAttempt> findByUserId(String userId);
    List<QBAttempt> findByTestId(String testId);
    List<QBAttempt> findByUserIdAndTestId(String userId, String testId);
}
