package com.bodhganga.bodhganga.entity.testseries;

import com.bodhganga.bodhganga.entity.QuizAttempt.TopicStats;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.*;

@Document(collection = "test_attempts")
@CompoundIndexes({
    @CompoundIndex(name = "user_attempt_idx", def = "{'userId': 1, 'attemptedAt': -1}"),
    @CompoundIndex(name = "test_score_idx", def = "{'testSeriesId': 1, 'score': -1}")
})
public class TestAttempt {

    @Id
    private String id;

    private String sessionId;
    private String userId;
    private String userEmail;
    private String testSeriesId;
    private String testTitle;
    private String stateSlug;
    private String districtSlug;
    private String testType;

    // Evaluation Results
    private Double totalMarks;
    private Double score;
    private Double positiveMarks;
    private Double negativeMarks;
    private Double percentage;
    private Double accuracy;

    private Integer totalQuestions;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unattemptedCount;
    private Integer timeTakenSeconds;

    // Sectional Breakdown
    private List<SectionScore> sectionScores = new ArrayList<>();

    // Topic Performance (Weak/Strong)
    private Map<String, TopicStats> topicAnalysis = new HashMap<>();

    // Itemized Question Responses
    private Map<String, UserResponse> questionResponses = new HashMap<>();

    // Ranking & Percentile (Calculated Async)
    private Integer rank;
    private Double percentile;

    private String submitType; // MANUAL, AUTO_SUBMIT_TIMER, AUTO_SUBMIT_CHEATING
    private Instant attemptedAt = Instant.now();

    public TestAttempt() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getTestSeriesId() { return testSeriesId; }
    public void setTestSeriesId(String testSeriesId) { this.testSeriesId = testSeriesId; }

    public String getTestTitle() { return testTitle; }
    public void setTestTitle(String testTitle) { this.testTitle = testTitle; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getPositiveMarks() { return positiveMarks; }
    public void setPositiveMarks(Double positiveMarks) { this.positiveMarks = positiveMarks; }

    public Double getNegativeMarks() { return negativeMarks; }
    public void setNegativeMarks(Double negativeMarks) { this.negativeMarks = negativeMarks; }

    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectCount() { return correctCount; }
    public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }

    public Integer getIncorrectCount() { return incorrectCount; }
    public void setIncorrectCount(Integer incorrectCount) { this.incorrectCount = incorrectCount; }

    public Integer getUnattemptedCount() { return unattemptedCount; }
    public void setUnattemptedCount(Integer unattemptedCount) { this.unattemptedCount = unattemptedCount; }

    public Integer getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(Integer timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }

    public List<SectionScore> getSectionScores() { return sectionScores; }
    public void setSectionScores(List<SectionScore> sectionScores) { this.sectionScores = sectionScores; }

    public Map<String, TopicStats> getTopicAnalysis() { return topicAnalysis; }
    public void setTopicAnalysis(Map<String, TopicStats> topicAnalysis) { this.topicAnalysis = topicAnalysis; }

    public Map<String, UserResponse> getQuestionResponses() { return questionResponses; }
    public void setQuestionResponses(Map<String, UserResponse> questionResponses) { this.questionResponses = questionResponses; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Double getPercentile() { return percentile; }
    public void setPercentile(Double percentile) { this.percentile = percentile; }

    public String getSubmitType() { return submitType; }
    public void setSubmitType(String submitType) { this.submitType = submitType; }

    public Instant getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(Instant attemptedAt) { this.attemptedAt = attemptedAt; }
}
