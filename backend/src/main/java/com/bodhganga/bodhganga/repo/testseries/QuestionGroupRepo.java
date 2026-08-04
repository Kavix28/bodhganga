package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.QuestionGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionGroupRepo extends MongoRepository<QuestionGroup, String> {
    List<QuestionGroup> findBySubjectId(String subjectId);
}
