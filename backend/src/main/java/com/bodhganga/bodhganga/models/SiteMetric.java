package com.bodhganga.bodhganga.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Singleton site-wide atomic analytics counters persisted in MongoDB.
 */
@Document(collection = "site_metrics")
public class SiteMetric {

    public static final String GLOBAL_METRICS_ID = "global_metrics";

    @Id
    private String id = GLOBAL_METRICS_ID;

    private long totalVisits;
    private long totalResourceViews;
    private Instant lastUpdated;

    public SiteMetric() {
        this.id = GLOBAL_METRICS_ID;
    }

    public SiteMetric(String id, long totalVisits, long totalResourceViews, Instant lastUpdated) {
        this.id = (id != null && !id.isBlank()) ? id : GLOBAL_METRICS_ID;
        this.totalVisits = totalVisits;
        this.totalResourceViews = totalResourceViews;
        this.lastUpdated = lastUpdated;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getTotalVisits() {
        return totalVisits;
    }

    public void setTotalVisits(long totalVisits) {
        this.totalVisits = totalVisits;
    }

    public long getTotalResourceViews() {
        return totalResourceViews;
    }

    public void setTotalResourceViews(long totalResourceViews) {
        this.totalResourceViews = totalResourceViews;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}

