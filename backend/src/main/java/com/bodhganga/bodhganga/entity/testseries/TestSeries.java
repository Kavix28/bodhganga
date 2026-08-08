package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "test_series")
@CompoundIndexes({
    @CompoundIndex(name = "state_district_idx", def = "{'stateSlug': 1, 'districtSlug': 1, 'isPublished': 1}"),
    @CompoundIndex(name = "type_category_idx", def = "{'testType': 1, 'category': 1, 'isPublished': 1}")
})
public class TestSeries {

    @Id
    private String id;

    @Version
    private Long version;

    private String title;
    private String slug;
    private String description;

    // Categorization & Scope
    private String stateSlug;      // e.g. "bihar", "uttar-pradesh"
    private String districtSlug;   // e.g. "patna", "varanasi"
    private String subjectId;      // e.g. "history", "polity"
    private String topicId;        // e.g. "ancient-history"
    private String testType;       // SUBJECT_WISE, STATE_WISE, DISTRICT_WISE, MOCK, PYQ, DAILY_QUIZ, CUSTOM
    private String category;       // UPSC, BPSC, UPPSC, MPPSC, JPSC

    // Access & Pricing
    private Boolean isFree = false;
    private Double price = 0.0;
    private String productId;      // Linked to Product collection for billing

    // Test Configurations
    private Integer durationMinutes = 60;
    private Double totalMarks = 100.0;
    private Double passingPercentage = 40.0;
    private Double positiveMarksPerQuestion = 2.0;
    private Double negativeMarksPerQuestion = 0.66;
    private Boolean allowNegativeMarking = true;
    private Boolean randomizeQuestions = true;
    private Boolean randomizeOptions = true;
    private Boolean showSolutionsImmediately = true;
    private Boolean isScheduled = false;
    private Date startDate;
    private Date endDate;

    // Structuring
    private List<TestSection> sections = new ArrayList<>();

    // Direct Question List (if not sectioned)
    private List<String> questionIds = new ArrayList<>();

    // Metrics Cache
    private Integer totalAttemptsCount = 0;
    private Double averageScoreCache = 0.0;

    // System & Audit
    private Boolean isPublished = false;
    private Boolean isDeleted = false;
    private String createdBy;
    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    public TestSeries() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean isFree) { this.isFree = isFree; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Double getPassingPercentage() { return passingPercentage; }
    public void setPassingPercentage(Double passingPercentage) { this.passingPercentage = passingPercentage; }

    public Double getPositiveMarksPerQuestion() { return positiveMarksPerQuestion; }
    public void setPositiveMarksPerQuestion(Double positiveMarksPerQuestion) { this.positiveMarksPerQuestion = positiveMarksPerQuestion; }

    public Double getNegativeMarksPerQuestion() { return negativeMarksPerQuestion; }
    public void setNegativeMarksPerQuestion(Double negativeMarksPerQuestion) { this.negativeMarksPerQuestion = negativeMarksPerQuestion; }

    public Boolean getAllowNegativeMarking() { return allowNegativeMarking; }
    public void setAllowNegativeMarking(Boolean allowNegativeMarking) { this.allowNegativeMarking = allowNegativeMarking; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

    public Boolean getRandomizeOptions() { return randomizeOptions; }
    public void setRandomizeOptions(Boolean randomizeOptions) { this.randomizeOptions = randomizeOptions; }

    public Boolean getShowSolutionsImmediately() { return showSolutionsImmediately; }
    public void setShowSolutionsImmediately(Boolean showSolutionsImmediately) { this.showSolutionsImmediately = showSolutionsImmediately; }

    public Boolean getIsScheduled() { return isScheduled; }
    public void setIsScheduled(Boolean isScheduled) { this.isScheduled = isScheduled; }

    public Date getStartDate() { return startDate; }
    public void setStartDate(Date startDate) { this.startDate = startDate; }

    public Date getEndDate() { return endDate; }
    public void setEndDate(Date endDate) { this.endDate = endDate; }

    public List<TestSection> getSections() { return sections; }
    public void setSections(List<TestSection> sections) { this.sections = sections; }

    public List<String> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<String> questionIds) { this.questionIds = questionIds; }

    public Integer getTotalAttemptsCount() { return totalAttemptsCount; }
    public void setTotalAttemptsCount(Integer totalAttemptsCount) { this.totalAttemptsCount = totalAttemptsCount; }

    public Double getAverageScoreCache() { return averageScoreCache; }
    public void setAverageScoreCache(Double averageScoreCache) { this.averageScoreCache = averageScoreCache; }

    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
