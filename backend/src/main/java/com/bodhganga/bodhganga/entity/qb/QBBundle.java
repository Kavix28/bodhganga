package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "qb_bundles")
public class QBBundle {

    @Id
    private String id;

    private String title;
    
    @Indexed
    private String stateSlug;
    @Indexed
    private String examSlug;
    @Indexed
    private String subjectSlug;

    private List<String> freeQuestionIds;
    private List<String> premiumQuestionIds;
    
    @Indexed
    private String sourcePdfDriveId;
    private String s3Key;

    private Double price = 199.0;
    private Boolean published = true;
    private Date createdAt = new Date();

    public QBBundle() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getExamSlug() { return examSlug; }
    public void setExamSlug(String examSlug) { this.examSlug = examSlug; }

    public String getSubjectSlug() { return subjectSlug; }
    public void setSubjectSlug(String subjectSlug) { this.subjectSlug = subjectSlug; }

    public List<String> getFreeQuestionIds() { return freeQuestionIds; }
    public void setFreeQuestionIds(List<String> freeQuestionIds) { this.freeQuestionIds = freeQuestionIds; }

    public List<String> getPremiumQuestionIds() { return premiumQuestionIds; }
    public void setPremiumQuestionIds(List<String> premiumQuestionIds) { this.premiumQuestionIds = premiumQuestionIds; }

    public String getSourcePdfDriveId() { return sourcePdfDriveId; }
    public void setSourcePdfDriveId(String sourcePdfDriveId) { this.sourcePdfDriveId = sourcePdfDriveId; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
