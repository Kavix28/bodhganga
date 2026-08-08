package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;

@Document(collection = "test_sessions")
@CompoundIndexes({
    @CompoundIndex(name = "user_test_status_idx", def = "{'userId': 1, 'testSeriesId': 1, 'status': 1}")
})
public class TestSession {

    @Id
    private String id;

    @Version
    private Long version;

    private String userId;
    private String userEmail;
    private String testSeriesId;

    private String status; // CREATED, IN_PROGRESS, PAUSED, SUBMITTED, AUTO_SUBMITTED, TERMINATED

    private Date startTime;
    private Date endTime;
    private Date lastHeartbeatTime;
    private Integer remainingTimeSeconds;

    // Security & Anti-Cheating State
    private String clientIp;
    private String userAgent;
    private String deviceFingerprint;
    private Integer tabSwitchCount = 0;
    private Boolean isLocked = false;
    private String lockReason;

    // Aspirant Live Responses
    private Map<String, UserResponse> responses = new HashMap<>(); // questionId -> UserResponse
    private Set<String> bookmarkedQuestionIds = new HashSet<>();

    // Question Ordering for Aspirant (Randomized or Fixed)
    private List<String> questionOrder = new ArrayList<>();

    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    public TestSession() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getTestSeriesId() { return testSeriesId; }
    public void setTestSeriesId(String testSeriesId) { this.testSeriesId = testSeriesId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }

    public Date getEndTime() { return endTime; }
    public void setEndTime(Date endTime) { this.endTime = endTime; }

    public Date getLastHeartbeatTime() { return lastHeartbeatTime; }
    public void setLastHeartbeatTime(Date lastHeartbeatTime) { this.lastHeartbeatTime = lastHeartbeatTime; }

    public Integer getRemainingTimeSeconds() { return remainingTimeSeconds; }
    public void setRemainingTimeSeconds(Integer remainingTimeSeconds) { this.remainingTimeSeconds = remainingTimeSeconds; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getDeviceFingerprint() { return deviceFingerprint; }
    public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }

    public Integer getTabSwitchCount() { return tabSwitchCount; }
    public void setTabSwitchCount(Integer tabSwitchCount) { this.tabSwitchCount = tabSwitchCount; }

    public Boolean getIsLocked() { return isLocked; }
    public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }

    public String getLockReason() { return lockReason; }
    public void setLockReason(String lockReason) { this.lockReason = lockReason; }

    public Map<String, UserResponse> getResponses() { return responses; }
    public void setResponses(Map<String, UserResponse> responses) { this.responses = responses; }

    public Set<String> getBookmarkedQuestionIds() { return bookmarkedQuestionIds; }
    public void setBookmarkedQuestionIds(Set<String> bookmarkedQuestionIds) { this.bookmarkedQuestionIds = bookmarkedQuestionIds; }

    public List<String> getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(List<String> questionOrder) { this.questionOrder = questionOrder; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
