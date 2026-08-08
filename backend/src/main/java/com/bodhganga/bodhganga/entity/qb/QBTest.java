package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "qb_tests")
public class QBTest {

    @Id
    private String id;

    private String title;
    private String description;
    
    @Indexed
    private String testType; // "FREE_POOL", "PREMIUM_BUNDLE"

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

    private List<String> questionIds;
    private Integer totalQuestions = 0;
    private Double totalMarks = 0.0;
    private Integer durationMinutes = 30;

    @Indexed
    private Boolean published = true;
    private Double price = 0.0;
    private String sourcePdfDriveId;

    private Date createdAt = new Date();

    public QBTest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

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

    public List<String> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<String> questionIds) { this.questionIds = questionIds; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getSourcePdfDriveId() { return sourcePdfDriveId; }
    public void setSourcePdfDriveId(String sourcePdfDriveId) { this.sourcePdfDriveId = sourcePdfDriveId; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
