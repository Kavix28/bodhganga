package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "questions")
public class Question {

    @Id
    private String id;

    private String stateSlug;
    private String districtSlug;

    private String testType; // 'easy', 'advanced', 'master'
    private String level; // 'foundation', 'upsc-level', 'master'
    private String topic;

    private String question;
    private List<String> options;
    private Integer correctAnswer; // 0-based index (0=A, 1=B, 2=C, 3=D)
    private String explanation;
    private String difficulty; // 'Easy', 'Moderate', 'Advanced'

    private Integer questionNumber;

    private String status = "PUBLISHED"; // 'UPLOADED', 'OCR_PROCESSING', 'PARSED', 'DRAFT', 'REVIEW_REQUIRED',
                                         // 'PUBLISHED', 'REJECTED', 'ARCHIVED'
    private Boolean isActive = true;

    private String sourceDocumentId;
    private String sourceQuestionPdf;
    private String sourceAnswerPdf;
    private Integer sourcePageNumber;
    private String fileHash;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant publishedAt;

    public Question() {
    }

    public Question(String id, String stateSlug, String districtSlug, String testType, String level, String topic,
            String question, List<String> options, Integer correctAnswer, String explanation, String difficulty,
            Integer questionNumber, String status, Boolean isActive, String sourceDocumentId, String sourceQuestionPdf,
            String sourceAnswerPdf, Integer sourcePageNumber, String fileHash, Instant createdAt, Instant updatedAt,
            Instant publishedAt) {
        this.id = id;
        this.stateSlug = stateSlug;
        this.districtSlug = districtSlug;
        this.testType = testType;
        this.level = level;
        this.topic = topic;
        this.question = question;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.difficulty = difficulty;
        this.questionNumber = questionNumber;
        this.status = status != null ? status : "PUBLISHED";
        this.isActive = isActive != null ? isActive : true;
        this.sourceDocumentId = sourceDocumentId;
        this.sourceQuestionPdf = sourceQuestionPdf;
        this.sourceAnswerPdf = sourceAnswerPdf;
        this.sourcePageNumber = sourcePageNumber;
        this.fileHash = fileHash;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.publishedAt = publishedAt;
    }

    public static QuestionBuilder builder() {
        return new QuestionBuilder();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStateSlug() {
        return stateSlug;
    }

    public void setStateSlug(String stateSlug) {
        this.stateSlug = stateSlug;
    }

    public String getDistrictSlug() {
        return districtSlug;
    }

    public void setDistrictSlug(String districtSlug) {
        this.districtSlug = districtSlug;
    }

    public String getTestType() {
        return testType;
    }

    public void setTestType(String testType) {
        this.testType = testType;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public Integer getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(Integer correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(Integer questionNumber) {
        this.questionNumber = questionNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getSourceDocumentId() {
        return sourceDocumentId;
    }

    public void setSourceDocumentId(String sourceDocumentId) {
        this.sourceDocumentId = sourceDocumentId;
    }

    public String getSourceQuestionPdf() {
        return sourceQuestionPdf;
    }

    public void setSourceQuestionPdf(String sourceQuestionPdf) {
        this.sourceQuestionPdf = sourceQuestionPdf;
    }

    public String getSourceAnswerPdf() {
        return sourceAnswerPdf;
    }

    public void setSourceAnswerPdf(String sourceAnswerPdf) {
        this.sourceAnswerPdf = sourceAnswerPdf;
    }

    public Integer getSourcePageNumber() {
        return sourcePageNumber;
    }

    public void setSourcePageNumber(Integer sourcePageNumber) {
        this.sourcePageNumber = sourcePageNumber;
    }

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public static class QuestionBuilder {
        private String id;
        private String stateSlug;
        private String districtSlug;
        private String testType;
        private String level;
        private String topic;
        private String question;
        private List<String> options;
        private Integer correctAnswer;
        private String explanation;
        private String difficulty;
        private Integer questionNumber;
        private String status = "PUBLISHED";
        private Boolean isActive = true;
        private String sourceDocumentId;
        private String sourceQuestionPdf;
        private String sourceAnswerPdf;
        private Integer sourcePageNumber;
        private String fileHash;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant publishedAt;

        public QuestionBuilder id(String id) {
            this.id = id;
            return this;
        }

        public QuestionBuilder stateSlug(String stateSlug) {
            this.stateSlug = stateSlug;
            return this;
        }

        public QuestionBuilder districtSlug(String districtSlug) {
            this.districtSlug = districtSlug;
            return this;
        }

        public QuestionBuilder testType(String testType) {
            this.testType = testType;
            return this;
        }

        public QuestionBuilder level(String level) {
            this.level = level;
            return this;
        }

        public QuestionBuilder topic(String topic) {
            this.topic = topic;
            return this;
        }

        public QuestionBuilder question(String question) {
            this.question = question;
            return this;
        }

        public QuestionBuilder options(List<String> options) {
            this.options = options;
            return this;
        }

        public QuestionBuilder correctAnswer(Integer correctAnswer) {
            this.correctAnswer = correctAnswer;
            return this;
        }

        public QuestionBuilder explanation(String explanation) {
            this.explanation = explanation;
            return this;
        }

        public QuestionBuilder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public QuestionBuilder questionNumber(Integer questionNumber) {
            this.questionNumber = questionNumber;
            return this;
        }

        public QuestionBuilder status(String status) {
            this.status = status;
            return this;
        }

        public QuestionBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public QuestionBuilder sourceDocumentId(String sourceDocumentId) {
            this.sourceDocumentId = sourceDocumentId;
            return this;
        }

        public QuestionBuilder sourceQuestionPdf(String sourceQuestionPdf) {
            this.sourceQuestionPdf = sourceQuestionPdf;
            return this;
        }

        public QuestionBuilder sourceAnswerPdf(String sourceAnswerPdf) {
            this.sourceAnswerPdf = sourceAnswerPdf;
            return this;
        }

        public QuestionBuilder sourcePageNumber(Integer sourcePageNumber) {
            this.sourcePageNumber = sourcePageNumber;
            return this;
        }

        public QuestionBuilder fileHash(String fileHash) {
            this.fileHash = fileHash;
            return this;
        }

        public QuestionBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public QuestionBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public QuestionBuilder publishedAt(Instant publishedAt) {
            this.publishedAt = publishedAt;
            return this;
        }

        public Question build() {
            return new Question(id, stateSlug, districtSlug, testType, level, topic, question, options, correctAnswer,
                    explanation, difficulty, questionNumber, status, isActive, sourceDocumentId, sourceQuestionPdf,
                    sourceAnswerPdf, sourcePageNumber, fileHash, createdAt, updatedAt, publishedAt);
        }
    }
}
