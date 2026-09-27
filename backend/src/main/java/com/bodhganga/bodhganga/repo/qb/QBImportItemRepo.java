package com.bodhganga.bodhganga.repo.qb;

import com.bodhganga.bodhganga.entity.qb.QBImportItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QBImportItemRepo extends MongoRepository<QBImportItem, String> {

    List<QBImportItem> findByImportBatchId(String importBatchId);

    void deleteByImportBatchId(String importBatchId);
}
