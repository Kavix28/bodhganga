package com.bodhganga.bodhganga.repo.testseries;

import com.bodhganga.bodhganga.entity.testseries.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepo extends MongoRepository<Question, String> {

    List<Question> findByIdInAndIsDeletedFalse(List<String> ids);

    Page<Question> findBySubjectIdAndIsDeletedFalse(String subjectId, Pageable pageable);

    Page<Question> findByTopicIdAndIsDeletedFalse(String topicId, Pageable pageable);

    Page<Question> findByDifficultyAndIsDeletedFalse(String difficulty, Pageable pageable);

    Page<Question> findByQuestionTypeAndIsDeletedFalse(String questionType, Pageable pageable);

    Page<Question> findByIsDeletedFalse(Pageable pageable);

    long countByIsDeletedFalse();
}
