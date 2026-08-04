package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "leaderboards")
@CompoundIndexes({
    @CompoundIndex(name = "test_rank_idx", def = "{'testSeriesId': 1, 'rank': 1}"),
    @CompoundIndex(name = "test_score_time_idx", def = "{'testSeriesId': 1, 'score': -1, 'timeTakenSeconds': 1}")
})
public class TestLeaderboard {

    @Id
    private String id;

    private String testSeriesId;
    private String attemptId;
    private String userId;
    private String userName;
    private String userEmail;
    private String stateSlug;
    private String districtSlug;

    private Double score;
    private Double totalMarks;
    private Double accuracy;
    private Integer timeTakenSeconds;
    private Integer rank;
    private Double percentile;

    private Date calculatedAt = new Date();

    public TestLeaderboard() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTestSeriesId() { return testSeriesId; }
    public void setTestSeriesId(String testSeriesId) { this.testSeriesId = testSeriesId; }

    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public Integer getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(Integer timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Double getPercentile() { return percentile; }
    public void setPercentile(Double percentile) { this.percentile = percentile; }

    public Date getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(Date calculatedAt) { this.calculatedAt = calculatedAt; }
}
