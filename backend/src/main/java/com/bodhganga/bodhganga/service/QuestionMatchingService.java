package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QuestionMatchingService {

    public List<Question> matchAndBuildQuestions(
            List<QuestionParserService.ParsedQuestion> parsedQuestions,
            Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers,
            String stateSlug,
            String districtSlug,
            String testType,
            String sourceDocId,
            String sourceQuestionPdf,
            String sourceAnswerPdf,
            String fileHash) {

        List<Question> questions = new ArrayList<>();

        for (QuestionParserService.ParsedQuestion pq : parsedQuestions) {
            int qNum = pq.getQuestionNumber();
            AnswerParserService.ParsedAnswer pa = parsedAnswers.get(qNum);

            boolean needsReview = pq.isSuspicious();
            String reviewReason = pq.getWarningReason();

            Integer correctAnsIdx = null;
            String explanation = null;

            if (pa != null) {
                correctAnsIdx = pa.getCorrectOptionIndex();
                explanation = pa.getExplanation();
                if (pa.isSuspicious()) {
                    needsReview = true;
                    reviewReason = reviewReason != null ? reviewReason + "; " + pa.getWarningReason()
                            : pa.getWarningReason();
                }
            } else {
                needsReview = true;
                reviewReason = reviewReason != null ? reviewReason + "; Missing solution/explanation"
                        : "Missing solution/explanation";
            }

            if (correctAnsIdx == null || correctAnsIdx < 0 || correctAnsIdx > 3) {
                needsReview = true;
                if (correctAnsIdx == null) {
                    correctAnsIdx = 0; // Default fallback index for draft editing
                }
                reviewReason = reviewReason != null ? reviewReason + "; Answer option key invalid/missing"
                        : "Answer option key invalid/missing";
            }

            if (explanation == null || explanation.isBlank()) {
                explanation = "Explanation pending review for question Q" + qNum;
                needsReview = true;
            }

            String status = needsReview ? "REVIEW_REQUIRED" : "DRAFT";
            String qLevel = pq.getLevel() != null ? pq.getLevel()
                    : ("advanced".equalsIgnoreCase(testType) ? "upsc-level" : "foundation");
            String mappedTestType = "upsc-level".equalsIgnoreCase(qLevel) ? "advanced" : testType;

            String questionId = stateSlug + "-" + districtSlug + "-" + mappedTestType + "-" + qNum + "-"
                    + UUID.randomUUID().toString().substring(0, 8);

            Question q = Question.builder()
                    .id(questionId)
                    .stateSlug(stateSlug)
                    .districtSlug(districtSlug)
                    .testType(mappedTestType)
                    .level(qLevel)
                    .topic(pq.getTopic() != null ? pq.getTopic() : "General")
                    .question(pq.getQuestionText())
                    .options(pq.getOptions())
                    .correctAnswer(correctAnsIdx)
                    .explanation(explanation)
                    .difficulty(pq.getDifficulty() != null ? pq.getDifficulty() : "Easy")
                    .questionNumber(qNum)
                    .status(status)
                    .isActive(false) // Draft / Review questions remain inactive until published by Admin
                    .sourceDocumentId(sourceDocId)
                    .sourceQuestionPdf(sourceQuestionPdf)
                    .sourceAnswerPdf(sourceAnswerPdf)
                    .sourcePageNumber(pq.getPageNumber())
                    .fileHash(fileHash)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            questions.add(q);
        }

        return questions;
    }
}
