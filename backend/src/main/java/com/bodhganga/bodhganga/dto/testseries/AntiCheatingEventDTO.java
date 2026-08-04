package com.bodhganga.bodhganga.dto.testseries;

public class AntiCheatingEventDTO {
    private String sessionId;
    private String eventType; // TAB_SWITCH, FULLSCREEN_EXIT, COPY_PASTE_ATTEMPT, MULTIPLE_DEVICE, IP_CHANGE
    private String details;
    private String clientIp;
    private String userAgent;

    public AntiCheatingEventDTO() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
