package com.bodhganga.bodhganga.entity.qb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Document(collection = "qb_attempts")
public class QBAttempt {

    @Id
    private String id;

    @Indexed
    private String userId;
    @Indexed
    private String testId;
    private String testTitle;

    private Double score = 0.0;
    private Double totalMarks = 0.0;
    private Double accuracy = 0.0;
    private Integer timeSpentSeconds = 0;

    private Map<String, String> userAnswers; // questionId -> selectedOptionId e.g. "A"
    private List<String> bookmarkedQuestionIds;
    private Map<String, Double> topicPerformance; // topic -> accuracy %

    private Integer rank;
    private Double percentile;

    @Indexed
    private String status = "SUBMITTED"; // "IN_PROGRESS", "SUBMITTED"

    private Date startedAt = new Date();
    private Date submittedAt = new Date();

    public QBAttempt() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTestId() { return testId; }
    public void setTestId(String testId) { this.testId = testId; }

    public String getTestTitle() { return testTitle; }
    public void setTestTitle(String testTitle) { this.testTitle = testTitle; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }

    public Map<String, String> getUserAnswers() { return userAnswers; }
    public void setUserAnswers(Map<String, String> userAnswers) { this.userAnswers = userAnswers; }

    public List<String> getBookmarkedQuestionIds() { return bookmarkedQuestionIds; }
    public void setBookmarkedQuestionIds(List<String> bookmarkedQuestionIds) { this.bookmarkedQuestionIds = bookmarkedQuestionIds; }

    public Map<String, Double> getTopicPerformance() { return topicPerformance; }
    public void setTopicPerformance(Map<String, Double> topicPerformance) { this.topicPerformance = topicPerformance; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Double getPercentile() { return percentile; }
    public void setPercentile(Double percentile) { this.percentile = percentile; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getStartedAt() { return startedAt; }
    public void setStartedAt(Date startedAt) { this.startedAt = startedAt; }

    public Date getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Date submittedAt) { this.submittedAt = submittedAt; }
}
