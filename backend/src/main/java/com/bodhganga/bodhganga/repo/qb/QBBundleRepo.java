package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBBundle;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface QBBundleRepo extends MongoRepository<QBBundle, String> {
    List<QBBundle> findByStateSlugAndExamSlugAndSubjectSlugAndPublishedTrue(String stateSlug, String examSlug, String subjectSlug);
    List<QBBundle> findBySourcePdfDriveId(String sourcePdfDriveId);
}
