package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBAudit;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface QBAuditRepo extends MongoRepository<QBAudit, String> {
    List<QBAudit> findByGoogleDriveFileId(String googleDriveFileId);
    List<QBAudit> findTop50ByOrderByTimestampDesc();
    long countByStatus(String status);
}
