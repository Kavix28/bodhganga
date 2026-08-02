package com.bodhganga.bodhganga.repo;

import com.bodhganga.bodhganga.entity.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepo extends MongoRepository<QuizAttempt, String> {
    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(String userId);

    List<QuizAttempt> findByUserIdAndDistrictSlugOrderByAttemptedAtDesc(String userId, String districtSlug);

    List<QuizAttempt> findByUserIdAndStateSlugOrderByAttemptedAtDesc(String userId, String stateSlug);

    List<QuizAttempt> findByUserIdAndStateSlugAndDistrictSlugOrderByAttemptedAtDesc(String userId, String stateSlug, String districtSlug);
}
