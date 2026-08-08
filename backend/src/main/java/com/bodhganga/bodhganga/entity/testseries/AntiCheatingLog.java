package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "anti_cheating_logs")
public class AntiCheatingLog {

    @Id
    private String id;
    private String sessionId;
    private String userId;
    private String userEmail;
    private String testSeriesId;
    private String eventType; // TAB_SWITCH, FULLSCREEN_EXIT, COPY_PASTE_ATTEMPT, MULTIPLE_DEVICE, IP_CHANGE
    private String details;
    private String clientIp;
    private String userAgent;

    private Date timestamp = new Date();

    public AntiCheatingLog() {}

    public AntiCheatingLog(String sessionId, String userId, String userEmail, String testSeriesId, String eventType, String details, String clientIp, String userAgent) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.testSeriesId = testSeriesId;
        this.eventType = eventType;
        this.details = details;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
        this.timestamp = new Date();
    }

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

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
}
