package com.bodhganga.bodhganga.entity.testseries;

import java.util.ArrayList;
import java.util.List;

public class UserResponse {
    private String questionId;
    private List<String> selectedOptionIds = new ArrayList<>();
    private String textAnswer;
    private Boolean isBookmarked = false;
    private Integer timeSpentSeconds = 0;
    private Long lastUpdatedTimestamp;

    public UserResponse() {}

    public UserResponse(String questionId, List<String> selectedOptionIds, Boolean isBookmarked, Integer timeSpentSeconds) {
        this.questionId = questionId;
        this.selectedOptionIds = selectedOptionIds != null ? selectedOptionIds : new ArrayList<>();
        this.isBookmarked = isBookmarked != null ? isBookmarked : false;
        this.timeSpentSeconds = timeSpentSeconds != null ? timeSpentSeconds : 0;
        this.lastUpdatedTimestamp = System.currentTimeMillis();
    }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public List<String> getSelectedOptionIds() { return selectedOptionIds; }
    public void setSelectedOptionIds(List<String> selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }

    public String getTextAnswer() { return textAnswer; }
    public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }

    public Boolean getIsBookmarked() { return isBookmarked; }
    public void setIsBookmarked(Boolean isBookmarked) { this.isBookmarked = isBookmarked; }

    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }

    public Long getLastUpdatedTimestamp() { return lastUpdatedTimestamp; }
    public void setLastUpdatedTimestamp(Long lastUpdatedTimestamp) { this.lastUpdatedTimestamp = lastUpdatedTimestamp; }
}
