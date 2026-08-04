package com.bodhganga.bodhganga.dto.testseries;

import java.util.ArrayList;
import java.util.List;

public class ResponseSubmitDTO {
    private String sessionId;
    private String questionId;
    private List<String> selectedOptionIds = new ArrayList<>();
    private String textAnswer;
    private Boolean isBookmarked = false;
    private Integer timeSpentSeconds = 0;

    public ResponseSubmitDTO() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

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
}
