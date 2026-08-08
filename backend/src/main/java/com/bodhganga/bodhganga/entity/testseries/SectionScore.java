package com.bodhganga.bodhganga.entity.testseries;

public class SectionScore {
    private String sectionId;
    private String sectionName;
    private Double score;
    private Double totalMarks;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unattemptedCount;

    public SectionScore() {}

    public SectionScore(String sectionId, String sectionName, Double score, Double totalMarks, Integer correctCount, Integer incorrectCount, Integer unattemptedCount) {
        this.sectionId = sectionId;
        this.sectionName = sectionName;
        this.score = score;
        this.totalMarks = totalMarks;
        this.correctCount = correctCount;
        this.incorrectCount = incorrectCount;
        this.unattemptedCount = unattemptedCount;
    }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Integer getIncorrectCount() { return incorrectCount; }
    public void setIncorrectCount(Integer incorrectCount) { this.incorrectCount = incorrectCount; }

    public Integer getUnattemptedCount() { return unattemptedCount; }
    public void setUnattemptedCount(Integer unattemptedCount) { this.unattemptedCount = unattemptedCount; }
}
