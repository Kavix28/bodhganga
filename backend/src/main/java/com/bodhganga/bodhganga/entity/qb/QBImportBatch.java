package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "qb_import_batches")
@CompoundIndexes({
        @CompoundIndex(name = "qb_batch_file_pair_idx", def = "{'questionDriveFileId': 1, 'solutionDriveFileId': 1}"),
        @CompoundIndex(name = "qb_batch_location_idx", def = "{'stateSlug': 1, 'districtSlug': 1, 'status': 1}")
})
public class QBImportBatch {

    @Id
    private String id;

    @Indexed(unique = true)
    private String importBatchId;

    @Indexed
    private String state;
    @Indexed
    private String stateSlug;
    @Indexed
    private String district;
    @Indexed
    private String districtSlug;
    @Indexed
    private String exam;
    @Indexed
    private String examSlug;
    @Indexed
    private String subject;
    @Indexed
    private String subjectSlug;

    @Indexed
    private String questionDriveFileId;
    private String questionFileName;

    @Indexed
    private String solutionDriveFileId;
    private String solutionFileName;

    @Indexed
    private String status; // DISCOVERED, DOWNLOADING, PARSING, MATCHING, VALIDATING, PERSISTING,
                           // GENERATING_TESTS, COMPLETED, PARTIAL_SUCCESS, FAILED, NO_ELIGIBLE_FILES,
                           // AMBIGUOUS

    private Integer totalQuestions = 0;
    private Integer successfullyParsed = 0;
    private Integer successfullyMatched = 0;
    private Integer unmatchedQuestions = 0;
    private Integer ambiguousQuestions = 0;
    private Integer invalidQuestions = 0;
    private Integer duplicateQuestions = 0;

    private String errorMessage;

    private Date createdAt = new Date();
    private Date updatedAt = new Date();
    private Date startedAt;
    private Date completedAt;

    public QBImportBatch() {
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

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getStateSlug() {
        return stateSlug;
    }

    public void setStateSlug(String stateSlug) {
        this.stateSlug = stateSlug;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getDistrictSlug() {
        return districtSlug;
    }

    public void setDistrictSlug(String districtSlug) {
        this.districtSlug = districtSlug;
    }

    public String getExam() {
        return exam;
    }

    public void setExam(String exam) {
        this.exam = exam;
    }

    public String getExamSlug() {
        return examSlug;
    }

    public void setExamSlug(String examSlug) {
        this.examSlug = examSlug;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getSubjectSlug() {
        return subjectSlug;
    }

    public void setSubjectSlug(String subjectSlug) {
        this.subjectSlug = subjectSlug;
    }

    public String getQuestionDriveFileId() {
        return questionDriveFileId;
    }

    public void setQuestionDriveFileId(String questionDriveFileId) {
        this.questionDriveFileId = questionDriveFileId;
    }

    public String getQuestionFileName() {
        return questionFileName;
    }

    public void setQuestionFileName(String questionFileName) {
        this.questionFileName = questionFileName;
    }

    public String getSolutionDriveFileId() {
        return solutionDriveFileId;
    }

    public void setSolutionDriveFileId(String solutionDriveFileId) {
        this.solutionDriveFileId = solutionDriveFileId;
    }

    public String getSolutionFileName() {
        return solutionFileName;
    }

    public void setSolutionFileName(String solutionFileName) {
        this.solutionFileName = solutionFileName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getSuccessfullyParsed() {
        return successfullyParsed;
    }

    public void setSuccessfullyParsed(Integer successfullyParsed) {
        this.successfullyParsed = successfullyParsed;
    }

    public Integer getSuccessfullyMatched() {
        return successfullyMatched;
    }

    public void setSuccessfullyMatched(Integer successfullyMatched) {
        this.successfullyMatched = successfullyMatched;
    }

    public Integer getUnmatchedQuestions() {
        return unmatchedQuestions;
    }

    public void setUnmatchedQuestions(Integer unmatchedQuestions) {
        this.unmatchedQuestions = unmatchedQuestions;
    }

    public Integer getAmbiguousQuestions() {
        return ambiguousQuestions;
    }

    public void setAmbiguousQuestions(Integer ambiguousQuestions) {
        this.ambiguousQuestions = ambiguousQuestions;
    }

    public Integer getInvalidQuestions() {
        return invalidQuestions;
    }

    public void setInvalidQuestions(Integer invalidQuestions) {
        this.invalidQuestions = invalidQuestions;
    }

    public Integer getDuplicateQuestions() {
        return duplicateQuestions;
    }

    public void setDuplicateQuestions(Integer duplicateQuestions) {
        this.duplicateQuestions = duplicateQuestions;
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

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Date getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Date startedAt) {
        this.startedAt = startedAt;
    }

    public Date getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Date completedAt) {
        this.completedAt = completedAt;
    }
}
