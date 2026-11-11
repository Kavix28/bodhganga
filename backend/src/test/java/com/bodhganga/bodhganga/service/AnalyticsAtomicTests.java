package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.models.SiteMetric;
import com.bodhganga.bodhganga.repositories.SiteMetricRepository;
import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AnalyticsAtomicTests {

    private static final String TEST_RESOURCE_ID = "analytics-test-resource-001";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SiteMetricRepository siteMetricRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    @AfterEach
    void cleanup() {
        siteMetricRepository.deleteById(SiteMetric.GLOBAL_METRICS_ID);
        mongoTemplate.remove(Query.query(Criteria.where("_id").is(TEST_RESOURCE_ID)), "resources");
    }

    @Test
    @DisplayName("Public analytics endpoints accept anonymous POST requests and reject unauthenticated admin reads")
    void testEndpointAuthorization() throws Exception {
        mockMvc.perform(post("/api/analytics/visit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/analytics/resource-view").param("resourceId", TEST_RESOURCE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/analytics/admin/stats"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "student@bodhganga.in", authorities = "ROLE_USER")
    @DisplayName("ROLE_USER cannot read /api/analytics/admin/stats")
    void testUserForbiddenOnAdminStats() throws Exception {
        mockMvc.perform(get("/api/analytics/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@bodhganga.in", authorities = "ROLE_ADMIN")
    @DisplayName("ROLE_ADMIN receives structured live analytics stats")
    void testAdminCanReadStats() throws Exception {
        mockMvc.perform(get("/api/analytics/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalVisits").exists())
                .andExpect(jsonPath("$.data.totalUsersRegistered").exists())
                .andExpect(jsonPath("$.data.activeSignedInUsers").exists())
                .andExpect(jsonPath("$.data.totalResourceViews").exists());
    }

    @Test
    @DisplayName("Concurrent atomic increments produce exact totalVisits, totalResourceViews, and resource viewCount")
    void testConcurrentAtomicIncrements() throws Exception {
        Document testResource = new Document("_id", TEST_RESOURCE_ID)
                .append("title", "Sample Analytics Resource")
                .append("viewCount", 0L);
        mongoTemplate.save(testResource, "resources");

        final int threads = 20;
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch startGate = new CountDownLatch(1);
        List<Callable<Integer>> tasks = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            tasks.add(() -> {
                startGate.await(5, TimeUnit.SECONDS);
                mockMvc.perform(post("/api/analytics/visit"))
                        .andExpect(status().isOk());
                mockMvc.perform(post("/api/analytics/resource-view").param("resourceId", TEST_RESOURCE_ID))
                        .andExpect(status().isOk());
                return 1;
            });
        }

        List<Future<Integer>> futures = new ArrayList<>();
        for (Callable<Integer> task : tasks) {
            futures.add(pool.submit(task));
        }
        startGate.countDown();
        for (Future<Integer> future : futures) {
            assertEquals(1, future.get(15, TimeUnit.SECONDS));
        }
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);

        // Wait briefly for @Async executor threads to flush Mongo $inc updates
        long deadline = System.currentTimeMillis() + 5000L;
        SiteMetric metric = null;
        while (System.currentTimeMillis() < deadline) {
            metric = siteMetricRepository.findById(SiteMetric.GLOBAL_METRICS_ID).orElse(null);
            if (metric != null && metric.getTotalVisits() == threads && metric.getTotalResourceViews() == threads) {
                break;
            }
            Thread.sleep(50L);
        }

        assertNotNull(metric, "global_metrics singleton should be created atomically");
        assertEquals(threads, metric.getTotalVisits(), "All concurrent visit increments must be persisted without lost updates");
        assertEquals(threads, metric.getTotalResourceViews(), "All concurrent resource view increments must be persisted");

        Document updatedResource = mongoTemplate.findOne(
                Query.query(Criteria.where("_id").is(TEST_RESOURCE_ID)),
                Document.class,
                "resources"
        );
        assertNotNull(updatedResource);
        assertEquals((long) threads, ((Number) updatedResource.get("viewCount")).longValue(),
                "Resource viewCount should match exact concurrent hits");

        Map<String, Object> adminStats = analyticsService.getAdminStats();
        assertEquals((long) threads, ((Number) adminStats.get("totalVisits")).longValue());
        assertEquals((long) threads, ((Number) adminStats.get("totalResourceViews")).longValue());
    }
}

