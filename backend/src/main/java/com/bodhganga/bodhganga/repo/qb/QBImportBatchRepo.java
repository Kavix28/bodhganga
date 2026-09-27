package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBImportBatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QBImportBatchRepo extends MongoRepository<QBImportBatch, String> {

    Optional<QBImportBatch> findByImportBatchId(String importBatchId);

    List<QBImportBatch> findByStatus(String status);

    List<QBImportBatch> findByStatusIn(List<String> statuses);

    Optional<QBImportBatch> findByQuestionDriveFileIdAndSolutionDriveFileId(String questionDriveFileId,
            String solutionDriveFileId);

    List<QBImportBatch> findTop50ByOrderByCreatedAtDesc();
}
