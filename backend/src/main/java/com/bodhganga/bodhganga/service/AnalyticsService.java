package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.models.SiteMetric;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.repositories.SiteMetricRepository;
import com.mongodb.client.result.UpdateResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Non-blocking atomic analytics collector and aggregator backed by MongoDB $inc.
 */
@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    private static final List<String> RESOURCE_COLLECTIONS = List.of("resources", "products", "content");

    private final MongoTemplate mongoTemplate;
    private final UserRepo userRepo;
    private final SiteMetricRepository siteMetricRepository;

    public AnalyticsService(MongoTemplate mongoTemplate,
                            UserRepo userRepo,
                            SiteMetricRepository siteMetricRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepo = userRepo;
        this.siteMetricRepository = siteMetricRepository;
    }

    /**
     * Atomically increment total unique website visits in the background.
     */
    @Async
    public void recordVisit() {
        incrementGlobalMetric("totalVisits");
    }

    /**
     * Atomically increment global resource view count and optional per-resource counter.
     */
    @Async
    public void recordResourceView(String resourceId) {
        incrementGlobalMetric("totalResourceViews");

        if (resourceId == null || resourceId.isBlank()) {
            return;
        }
        String trimmedId = resourceId.trim();
        try {
            Query byId = Query.query(Criteria.where("_id").is(trimmedId));
            Update incView = new Update().inc("viewCount", 1L);
            for (String collection : RESOURCE_COLLECTIONS) {
                UpdateResult result = mongoTemplate.updateFirst(byId, incView, collection);
                if (result.getMatchedCount() > 0) {
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Non-fatal resource view increment failure for id={}: {}", trimmedId, e.getMessage());
        }
    }

    /**
     * Return live aggregated site traffic, active user, and resource view metrics for admins.
     */
    public Map<String, Object> getAdminStats() {
        SiteMetric metric = siteMetricRepository.findById(SiteMetric.GLOBAL_METRICS_ID).orElse(null);

        long totalVisits = metric != null ? metric.getTotalVisits() : 0L;
        long totalResourceViews = metric != null ? metric.getTotalResourceViews() : 0L;
        long totalUsersRegistered = userRepo.count();

        Date twentyFourHoursAgo = Date.from(Instant.now().minus(24, ChronoUnit.HOURS));
        Query activeUsersQuery = Query.query(
                Criteria.where("lastLogin").gte(twentyFourHoursAgo).and("isActive").ne(false)
        );
        long activeSignedInUsers = mongoTemplate.count(activeUsersQuery, User.class);
        if (activeSignedInUsers == 0L) {
            activeSignedInUsers = userRepo.countByIsVerifiedTrue();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVisits", totalVisits);
        stats.put("totalUsersRegistered", totalUsersRegistered);
        stats.put("activeSignedInUsers", activeSignedInUsers);
        stats.put("totalResourceViews", totalResourceViews);
        stats.put("lastUpdated", metric != null ? metric.getLastUpdated() : null);
        return stats;
    }

    private void incrementGlobalMetric(String counterField) {
        try {
            Query query = Query.query(Criteria.where("_id").is(SiteMetric.GLOBAL_METRICS_ID));
            Update update = new Update()
                    .inc(counterField, 1L)
                    .set("lastUpdated", Instant.now());
            mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().upsert(true).returnNew(true),
                    SiteMetric.class
            );
        } catch (Exception e) {
            log.warn("Non-fatal global analytics failure for field={}: {}", counterField, e.getMessage());
        }
    }
}

