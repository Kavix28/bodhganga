package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "qb_audits")
public class QBAudit {

    @Id
    private String id;

    private String fileName;
    @Indexed
    private String googleDriveFileId;
    private String s3Key;

    private Integer totalQuestionsExtracted = 0;
    private Integer questionsPassed = 0;
    private Integer questionsFlaggedReview = 0;
    private Integer geminiCallsCount = 0;

    @Indexed
    private String status; // "SUCCESS", "PARTIAL_SUCCESS", "FAILED"
    private String errorMessage;

    private Date timestamp = new Date();

    public QBAudit() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getGoogleDriveFileId() { return googleDriveFileId; }
    public void setGoogleDriveFileId(String googleDriveFileId) { this.googleDriveFileId = googleDriveFileId; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public Integer getTotalQuestionsExtracted() { return totalQuestionsExtracted; }
    public void setTotalQuestionsExtracted(Integer totalQuestionsExtracted) { this.totalQuestionsExtracted = totalQuestionsExtracted; }

    public Integer getQuestionsPassed() { return questionsPassed; }
    public void setQuestionsPassed(Integer questionsPassed) { this.questionsPassed = questionsPassed; }

    public Integer getQuestionsFlaggedReview() { return questionsFlaggedReview; }
    public void setQuestionsFlaggedReview(Integer questionsFlaggedReview) { this.questionsFlaggedReview = questionsFlaggedReview; }

    public Integer getGeminiCallsCount() { return geminiCallsCount; }
    public void setGeminiCallsCount(Integer geminiCallsCount) { this.geminiCallsCount = geminiCallsCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
}
