package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.entity.testseries.Question;
import com.bodhganga.bodhganga.repo.testseries.QuestionRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class QuestionBankService {

    private final QuestionRepo questionRepo;

    public QuestionBankService(QuestionRepo questionRepo) {
        this.questionRepo = questionRepo;
    }

    public Page<Question> getAllQuestions(int page, int size) {
        return questionRepo.findByIsDeletedFalse(PageRequest.of(page, size));
    }

    public Question getQuestionById(String id) {
        return questionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
    }

    public List<Question> getQuestionsByIds(List<String> ids) {
        return questionRepo.findByIdInAndIsDeletedFalse(ids);
    }

    public Question createQuestion(Question question) {
        question.setCreatedAt(new Date());
        question.setUpdatedAt(new Date());
        return questionRepo.save(question);
    }

    public Question updateQuestion(String id, Question updated) {
        Question existing = getQuestionById(id);
        existing.setQuestionText(updated.getQuestionText());
        existing.setQuestionType(updated.getQuestionType());
        existing.setOptions(updated.getOptions());
        existing.setCorrectOptionIds(updated.getCorrectOptionIds());
        existing.setDetailedExplanation(updated.getDetailedExplanation());
        existing.setSubjectId(updated.getSubjectId());
        existing.setTopicId(updated.getTopicId());
        existing.setDifficulty(updated.getDifficulty());
        existing.setBloomLevel(updated.getBloomLevel());
        existing.setTags(updated.getTags());
        existing.setUpdatedAt(new Date());
        return questionRepo.save(existing);
    }

    public void softDeleteQuestion(String id) {
        Question existing = getQuestionById(id);
        existing.setIsDeleted(true);
        existing.setUpdatedAt(new Date());
        questionRepo.save(existing);
    }
}
