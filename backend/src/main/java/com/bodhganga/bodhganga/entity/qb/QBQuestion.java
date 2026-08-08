package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "qb_questions")
@CompoundIndexes({
    @CompoundIndex(name = "qb_hash_drive_idx", def = "{'googleDriveFileId': 1, 'questionHash': 1}", unique = true, sparse = true),
    @CompoundIndex(name = "qb_filter_idx", def = "{'stateSlug': 1, 'examSlug': 1, 'subjectSlug': 1, 'published': 1}")
})
public class QBQuestion {

    @Id
    private String id;

    @Indexed
    private String questionHash; // SHA-256 hash of (questionText + options)
    @Indexed
    private String googleDriveFileId;
    private String s3Key;

    @Indexed
    private String state;
    @Indexed
    private String stateSlug;
    @Indexed
    private String exam;
    @Indexed
    private String examSlug;
    @Indexed
    private String subject;
    @Indexed
    private String subjectSlug;
    private String chapter;
    private String chapterSlug;
    private String topic;
    private String topicSlug;

    private String questionText;
    private List<QBOption> options;
    private String correctAnswer; // Option ID e.g. "A", "B", "C", "D"
    private String explanation;
    
    @Indexed
    private String difficulty; // "EASY", "MEDIUM", "HARD"
    private Double confidenceScore = 1.0;
    private Boolean needsReview = false;

    private String language = "en";
    private Double marks = 1.0;
    private Double negativeMarks = 0.25;

    private List<String> imageUrls;
    private List<String> tableData;
    private List<String> tags;
    private List<String> keywords;

    private Integer version = 1;
    private Boolean isLatestVersion = true;
    
    @Indexed
    private Boolean published = true;
    private Boolean isFreePool = false;
    private String ocrText;

    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    public static class QBOption {
        private String id; // "A", "B", "C", "D"
        private String text;
        private Boolean isCorrect;

        public QBOption() {}
        public QBOption(String id, String text, Boolean isCorrect) {
            this.id = id;
            this.text = text;
            this.isCorrect = isCorrect;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    }

    public QBQuestion() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestionHash() { return questionHash; }
    public void setQuestionHash(String questionHash) { this.questionHash = questionHash; }

    public String getGoogleDriveFileId() { return googleDriveFileId; }
    public void setGoogleDriveFileId(String googleDriveFileId) { this.googleDriveFileId = googleDriveFileId; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getExam() { return exam; }
    public void setExam(String exam) { this.exam = exam; }

    public String getExamSlug() { return examSlug; }
    public void setExamSlug(String examSlug) { this.examSlug = examSlug; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSubjectSlug() { return subjectSlug; }
    public void setSubjectSlug(String subjectSlug) { this.subjectSlug = subjectSlug; }

    public String getChapter() { return chapter; }
    public void setChapter(String chapter) { this.chapter = chapter; }

    public String getChapterSlug() { return chapterSlug; }
    public void setChapterSlug(String chapterSlug) { this.chapterSlug = chapterSlug; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getTopicSlug() { return topicSlug; }
    public void setTopicSlug(String topicSlug) { this.topicSlug = topicSlug; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<QBOption> getOptions() { return options; }
    public void setOptions(List<QBOption> options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public Boolean getNeedsReview() { return needsReview; }
    public void setNeedsReview(Boolean needsReview) { this.needsReview = needsReview; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Double getMarks() { return marks; }
    public void setMarks(Double marks) { this.marks = marks; }

    public Double getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(Double negativeMarks) { this.negativeMarks = negativeMarks; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public List<String> getTableData() { return tableData; }
    public void setTableData(List<String> tableData) { this.tableData = tableData; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Boolean getIsLatestVersion() { return isLatestVersion; }
    public void setIsLatestVersion(Boolean isLatestVersion) { this.isLatestVersion = isLatestVersion; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }

    public Boolean getIsFreePool() { return isFreePool; }
    public void setIsFreePool(Boolean isFreePool) { this.isFreePool = isFreePool; }

    public String getOcrText() { return ocrText; }
    public void setOcrText(String ocrText) { this.ocrText = ocrText; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
