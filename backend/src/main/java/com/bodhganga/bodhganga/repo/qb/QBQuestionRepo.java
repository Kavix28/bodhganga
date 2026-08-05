package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface QBQuestionRepo extends MongoRepository<QBQuestion, String> {
    Optional<QBQuestion> findByGoogleDriveFileIdAndQuestionHash(String googleDriveFileId, String questionHash);
    List<QBQuestion> findByStateSlugAndExamSlugAndSubjectSlugAndPublishedTrue(String stateSlug, String examSlug, String subjectSlug);
    List<QBQuestion> findByGoogleDriveFileId(String googleDriveFileId);
    List<QBQuestion> findByNeedsReviewTrue();
    long countByPublishedTrue();
    long countByNeedsReviewTrue();
}
