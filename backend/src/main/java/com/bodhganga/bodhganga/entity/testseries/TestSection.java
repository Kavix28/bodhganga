package com.bodhganga.bodhganga.entity.testseries;

import java.util.ArrayList;
import java.util.List;

public class TestSection {
    private String sectionId;
    private String sectionName;
    private String description;
    private Double positiveMarks;
    private Double negativeMarks;
    private List<String> questionIds = new ArrayList<>();

    public TestSection() {}

    public TestSection(String sectionId, String sectionName, Double positiveMarks, Double negativeMarks, List<String> questionIds) {
        this.sectionId = sectionId;
        this.sectionName = sectionName;
        this.positiveMarks = positiveMarks;
        this.negativeMarks = negativeMarks;
        this.questionIds = questionIds != null ? questionIds : new ArrayList<>();
    }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getPositiveMarks() { return positiveMarks; }
    public void setPositiveMarks(Double positiveMarks) { this.positiveMarks = positiveMarks; }

    public Double getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(Double negativeMarks) { this.negativeMarks = negativeMarks; }

    public List<String> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<String> questionIds) { this.questionIds = questionIds; }
}
