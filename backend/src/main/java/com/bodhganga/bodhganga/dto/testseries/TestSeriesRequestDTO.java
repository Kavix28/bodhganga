package com.bodhganga.bodhganga.dto.testseries;

import com.bodhganga.bodhganga.entity.testseries.TestSection;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class TestSeriesRequestDTO {

    private String title;
    private String slug;
    private String description;

    private String stateSlug;
    private String districtSlug;
    private String subjectId;
    private String topicId;
    private String testType;
    private String category;

    private Boolean isFree = false;
    private Double price = 0.0;
    private String productId;

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

    private List<TestSection> sections = new ArrayList<>();
    private List<String> questionIds = new ArrayList<>();

    public TestSeriesRequestDTO() {}

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
}
