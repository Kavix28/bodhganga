package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "qb_import_items")
@CompoundIndexes({
        @CompoundIndex(name = "qb_item_batch_qnum_idx", def = "{'importBatchId': 1, 'questionNumber': 1}")
})
public class QBImportItem {

    @Id
    private String id;

    @Indexed
    private String importBatchId;

    private Integer questionNumber;
    private String rawQuestionText;
    private String rawExplanationText;

    @Indexed
    private String status; // MATCHED, UNMATCHED, AMBIGUOUS, INVALID, DUPLICATE

    private String errorMessage;
    private Date createdAt = new Date();

    public QBImportItem() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getImportBatchId() {
        return importBatchId;
    }

    public void setImportBatchId(String importBatchId) {
        this.importBatchId = importBatchId;
    }

    public Integer getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(Integer questionNumber) {
        this.questionNumber = questionNumber;
    }

    public String getRawQuestionText() {
        return rawQuestionText;
    }

    public void setRawQuestionText(String rawQuestionText) {
        this.rawQuestionText = rawQuestionText;
    }

    public String getRawExplanationText() {
        return rawExplanationText;
    }

    public void setRawExplanationText(String rawExplanationText) {
        this.rawExplanationText = rawExplanationText;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
