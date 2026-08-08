package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "test_analytics")
public class TestAnalytics {

    @Id
    private String id;
    private String targetType; // USER, TEST, DISTRICT, STATE, GLOBAL
    private String targetId;   // userId or testId or districtSlug or stateSlug

    private Long totalAttempts = 0L;
    private Double totalScoreSum = 0.0;
    private Double averageScore = 0.0;
    private Double averageAccuracy = 0.0;
    private Double highestScore = 0.0;
    private Double lowestScore = 0.0;

    private Map<String, Long> difficultyBreakdown = new HashMap<>(); // EASY -> count
    private Map<String, Double> topicAccuracyMap = new HashMap<>();  // topicId -> avg accuracy

    private Date lastUpdated = new Date();

    public TestAnalytics() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public Long getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(Long totalAttempts) { this.totalAttempts = totalAttempts; }

    public Double getTotalScoreSum() { return totalScoreSum; }
    public void setTotalScoreSum(Double totalScoreSum) { this.totalScoreSum = totalScoreSum; }

    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }

    public Double getAverageAccuracy() { return averageAccuracy; }
    public void setAverageAccuracy(Double averageAccuracy) { this.averageAccuracy = averageAccuracy; }

    public Double getHighestScore() { return highestScore; }
    public void setHighestScore(Double highestScore) { this.highestScore = highestScore; }

    public Double getLowestScore() { return lowestScore; }
    public void setLowestScore(Double lowestScore) { this.lowestScore = lowestScore; }

    public Map<String, Long> getDifficultyBreakdown() { return difficultyBreakdown; }
    public void setDifficultyBreakdown(Map<String, Long> difficultyBreakdown) { this.difficultyBreakdown = difficultyBreakdown; }

    public Map<String, Double> getTopicAccuracyMap() { return topicAccuracyMap; }
    public void setTopicAccuracyMap(Map<String, Double> topicAccuracyMap) { this.topicAccuracyMap = topicAccuracyMap; }

    public Date getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Date lastUpdated) { this.lastUpdated = lastUpdated; }
}
