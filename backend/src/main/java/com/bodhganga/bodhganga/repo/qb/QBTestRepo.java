package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBTest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface QBTestRepo extends MongoRepository<QBTest, String> {
    List<QBTest> findByStateSlugAndExamSlugAndSubjectSlugAndPublishedTrue(String stateSlug, String examSlug, String subjectSlug);
    List<QBTest> findByStateSlugAndPublishedTrue(String stateSlug);
    List<QBTest> findByPublishedTrue();
}
