package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.*;
import com.bodhganga.bodhganga.repo.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in" })
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    private final EnrollmentRepo enrollmentRepo;
    private final UserRepo userRepo;
    private final CourseRepo courseRepo;
    private final BlogPostRepo blogPostRepo;
    private final ProductRepo productRepo;
    private final PurchaseRepo purchaseRepo;
    private final StateRepo stateRepo;
    private final ContentRepo contentRepo;
    private final PaymentRepo paymentRepo;
    private final QuizAttemptRepo quizAttemptRepo;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-pdf-storage-prod}}")
    private String s3BucketName;

    public DashboardController(EnrollmentRepo enrollmentRepo, UserRepo userRepo,
            CourseRepo courseRepo, BlogPostRepo blogPostRepo,
            ProductRepo productRepo, PurchaseRepo purchaseRepo,
            StateRepo stateRepo, ContentRepo contentRepo,
            PaymentRepo paymentRepo, QuizAttemptRepo quizAttemptRepo,
            S3Client s3Client) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.blogPostRepo = blogPostRepo;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.stateRepo = stateRepo;
        this.contentRepo = contentRepo;
        this.paymentRepo = paymentRepo;
        this.quizAttemptRepo = quizAttemptRepo;
        this.s3Client = s3Client;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard
    // User dashboard greeting & quick summary
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getDashboard(Authentication authentication) {
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepo.findByIdentifier(userEmail);

        Map<String, Object> dashboardData = new HashMap<>();
        dashboardData.put("welcomeMessage", "Welcome to BodhGanga Dashboard!");
        dashboardData.put("userEmail", userEmail);
        dashboardData.put("userName", userOpt.map(User::getName).orElse("Scholar"));
        dashboardData.put("userRole", userOpt.map(User::getRole).orElse("USER"));
        dashboardData.put("totalStates", 29);
        dashboardData.put("totalUTs", 8);
        dashboardData.put("totalDistricts", 786);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Dashboard loaded successfully").data(dashboardData).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/stats — User-specific stats
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponseDTO> getStats(Authentication authentication) {
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepo.findByIdentifier(userEmail);
        String userId = userOpt.map(User::getId).orElse(null);

        Map<String, Object> stats = new HashMap<>();
        if (userId != null) {
            List<Enrollment> enrollments = enrollmentRepo.findByUserId(userId);
            long completed = enrollments.stream().filter(e -> "COMPLETED".equalsIgnoreCase(e.getStatus())).count();
            long inProgress = enrollments.stream()
                    .filter(e -> "ENROLLED".equalsIgnoreCase(e.getStatus()) && e.getProgress() != null
                            && e.getProgress() > 0)
                    .count();

            List<QuizAttempt> attempts = quizAttemptRepo.findByUserIdOrderByAttemptedAtDesc(userId);
            int quizCount = attempts.size();
            double avgScore = quizCount > 0
                    ? Math.round(attempts.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0.0) * 100.0)
                            / 100.0
                    : 0.0;
            double avgAccuracy = quizCount > 0
                    ? Math.round(attempts.stream().mapToDouble(QuizAttempt::getAccuracy).average().orElse(0.0) * 100.0)
                            / 100.0
                    : 0.0;

            List<Purchase> purchases = purchaseRepo.findByUserId(userId);

            stats.put("enrolledCourses", enrollments.size());
            stats.put("completedCourses", completed);
            stats.put("inProgressCourses", inProgress);
            stats.put("totalEnrollments", enrollments.size());
            stats.put("totalQuizAttempts", quizCount);
            stats.put("avgScore", avgScore);
            stats.put("avgAccuracy", avgAccuracy);
            stats.put("totalPurchases", purchases.size());
        } else {
            stats.put("enrolledCourses", 0);
            stats.put("completedCourses", 0);
            stats.put("inProgressCourses", 0);
            stats.put("totalEnrollments", 0);
            stats.put("totalQuizAttempts", 0);
            stats.put("avgScore", 0.0);
            stats.put("avgAccuracy", 0.0);
            stats.put("totalPurchases", 0);
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Stats retrieved").data(stats).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/user-overview — Full student workspace aggregated payload
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/user-overview")
    public ResponseEntity<ApiResponseDTO> getUserOverview(Authentication authentication) {
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepo.findByIdentifier(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponseDTO.builder().success(false).message("User not found").build());
        }

        User user = userOpt.get();
        String userId = user.getId();

        Map<String, Object> overview = new HashMap<>();

        // 1. Profile Summary
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName() != null ? user.getName() : "Scholar");
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("state", user.getState() != null ? user.getState() : "India");
        profile.put("createdAt", user.getCreatedAt());

        String name = user.getName() != null ? user.getName() : "Scholar";
        String initials = Arrays.stream(name.split(" "))
                .filter(s -> !s.isBlank())
                .map(s -> s.substring(0, 1).toUpperCase())
                .collect(Collectors.joining(""));
        if (initials.length() > 2)
            initials = initials.substring(0, 2);
        profile.put("initials", initials.isEmpty() ? "S" : initials);

        overview.put("profile", profile);

        // 2. Enrollments & Courses
        List<Enrollment> enrollments = enrollmentRepo.findByUserId(userId);
        long completed = enrollments.stream().filter(e -> "COMPLETED".equalsIgnoreCase(e.getStatus())).count();
        long inProgress = enrollments.stream().filter(
                e -> "ENROLLED".equalsIgnoreCase(e.getStatus()) && e.getProgress() != null && e.getProgress() > 0)
                .count();

        overview.put("enrolledCoursesCount", enrollments.size());
        overview.put("completedCoursesCount", completed);
        overview.put("inProgressCoursesCount", inProgress);

        // 3. Quiz Attempts & Streak
        List<QuizAttempt> attempts = quizAttemptRepo.findByUserIdOrderByAttemptedAtDesc(userId);
        int totalAttempts = attempts.size();
        double avgScore = totalAttempts > 0
                ? Math.round(attempts.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0.0) * 100.0) / 100.0
                : 0.0;
        double avgAccuracy = totalAttempts > 0
                ? Math.round(attempts.stream().mapToDouble(QuizAttempt::getAccuracy).average().orElse(0.0) * 100.0)
                        / 100.0
                : 0.0;
        double bestScore = totalAttempts > 0 ? attempts.stream().mapToDouble(QuizAttempt::getScore).max().orElse(0.0)
                : 0.0;

        Set<LocalDate> testDates = new HashSet<>();
        ZoneId zone = ZoneId.systemDefault();
        for (QuizAttempt qa : attempts) {
            if (qa.getAttemptedAt() != null) {
                testDates.add(LocalDate.ofInstant(qa.getAttemptedAt(), zone));
            }
        }
        int currentStreak = calculateCurrentStreak(testDates);
        int longestStreak = calculateLongestStreak(testDates);

        Map<String, Object> quizStats = new HashMap<>();
        quizStats.put("totalAttempts", totalAttempts);
        quizStats.put("avgScore", avgScore);
        quizStats.put("avgAccuracy", avgAccuracy);
        quizStats.put("bestScore", bestScore);
        quizStats.put("currentStreak", currentStreak);
        quizStats.put("longestStreak", longestStreak);

        overview.put("quizStats", quizStats);

        // 4. Preparation Completeness Score
        int completeness = Math.min(100, (int) (enrollments.size() * 15 + completed * 20 + totalAttempts * 5));
        if (completeness == 0)
            completeness = 25; // Base starting metric
        overview.put("preparationCompleteness", completeness);

        // 5. 7-Day Matrix Activity
        List<Map<String, Object>> activityMatrix = build7DayActivityMatrix(attempts);
        overview.put("activityMatrix", activityMatrix);

        // 6. Recent Attempts (top 5)
        overview.put("recentAttempts", attempts.stream().limit(5).collect(Collectors.toList()));

        // 7. Recent Purchases
        List<Purchase> purchases = purchaseRepo.findByUserId(userId);
        overview.put("totalPurchases", purchases.size());
        overview.put("recentPurchases", purchases.stream().limit(5).collect(Collectors.toList()));

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("User overview loaded successfully")
                .data(overview)
                .build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/admin-stats — Live production metrics (no fallbacks)
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/admin-stats")
    public ResponseEntity<ApiResponseDTO> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        // Date helpers
        Date now = new Date();
        Date weekAgo = dateMinusDays(now, 7);
        Date monthAgo = dateMinusDays(now, 30);
        Date todayStart = startOfToday();

        // ── User metrics ───────────────────────────────────────────
        long totalUsers = userRepo.count();
        long usersThisWeek = userRepo.countByCreatedAtAfter(weekAgo);
        long usersThisMonth = userRepo.countByCreatedAtAfter(monthAgo);
        long activeUsers24h = userRepo.countByCreatedAtAfter(dateMinusDays(now, 1));

        stats.put("totalUsers", totalUsers);
        stats.put("usersThisWeek", usersThisWeek);
        stats.put("usersThisMonth", usersThisMonth);
        stats.put("activeUsers24h", activeUsers24h);

        // ── Course / Content metrics ────────────────────────────────
        long totalCourses = courseRepo.count();
        long totalPDFs = contentRepo.countByType("pdf");
        long totalVideos = contentRepo.countByType("video");
        long totalContent = contentRepo.count();
        stats.put("totalCourses", totalCourses);
        stats.put("totalPDFs", totalPDFs);
        stats.put("totalVideos", totalVideos);
        stats.put("totalContent", totalContent);
        stats.put("totalCourseMaterials", totalCourses + totalContent);

        // ── Blog / Syllabus metrics ────────────────────────────────
        long totalBlogs = blogPostRepo.count();
        stats.put("totalBlogs", totalBlogs);

        // ── Product / Library metrics ──────────────────────────────
        long totalProducts = productRepo.count();
        stats.put("totalProducts", totalProducts);

        // ── States & Districts coverage ────────────────────────────
        long statesPublished = stateRepo.countByType("STATE");
        long utsPublished = stateRepo.countByType("UT");

        List<State> allStates = stateRepo.findByType("STATE");
        List<State> allUTs = stateRepo.findByType("UT");
        long totalDistricts = allStates.stream()
                .filter(s -> s.getDistricts() != null)
                .mapToLong(s -> s.getDistricts().size()).sum();
        long utDistricts = allUTs.stream()
                .filter(s -> s.getDistricts() != null)
                .mapToLong(s -> s.getDistricts().size()).sum();

        stats.put("statesPublished", statesPublished);
        stats.put("utsPublished", utsPublished);
        stats.put("totalStateCount", 29L);
        stats.put("totalUTCount", 8L);
        stats.put("totalDistricts", totalDistricts);
        stats.put("utDistricts", utDistricts);
        stats.put("allIndia_totalDistricts", 786L);

        // ── Revenue metrics (from Payment collection) ──────────────
        List<Payment> successPayments = paymentRepo.findByStatus("SUCCESS");
        List<Payment> failedPayments = paymentRepo.findByStatus("FAILED");
        List<Payment> pendingPayments = paymentRepo.findByStatus("PENDING");

        double revenueLifetime = successPayments.stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
        double revenueThisMonth = paymentRepo.findByStatusAndCreatedAtAfter("SUCCESS", monthAgo)
                .stream().mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
        double revenueToday = paymentRepo.findByStatusAndCreatedAtAfter("SUCCESS", todayStart)
                .stream().mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

        stats.put("revenueLifetime", revenueLifetime);
        stats.put("revenueThisMonth", revenueThisMonth);
        stats.put("revenueToday", revenueToday);
        stats.put("successfulPayments", successPayments.size());
        stats.put("failedPayments", failedPayments.size());
        stats.put("pendingPayments", pendingPayments.size());

        long totalTransactions = successPayments.size() + failedPayments.size() + pendingPayments.size();
        double conversionRate = totalTransactions > 0
                ? Math.round((double) successPayments.size() / totalTransactions * 100.0 * 10.0) / 10.0
                : 100.0;
        stats.put("conversionRate", conversionRate);

        // ── Quiz & Platform Engagement Metrics ────────────────────
        long totalPlatformQuizAttempts = quizAttemptRepo.count();
        stats.put("totalPlatformQuizAttempts", totalPlatformQuizAttempts);

        // ── Enrollment & Purchase metrics ─────────────────────────
        long totalEnrollments = enrollmentRepo.count();
        long totalPurchases = purchaseRepo.count();
        stats.put("totalEnrollments", totalEnrollments);
        stats.put("totalPurchases", totalPurchases);

        stats.put("systemHealth", "OPERATIONAL");

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Administrative statistics loaded from live database")
                .data(stats).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/live-activity — Real-time Platform Stream (DB backed)
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/live-activity")
    public ResponseEntity<ApiResponseDTO> getLiveActivity() {
        List<Map<String, Object>> events = new ArrayList<>();

        // 1. Recent Users
        try {
            List<User> recentUsers = userRepo.findTop20ByOrderByCreatedAtDesc();
            for (User u : recentUsers) {
                if (u.getCreatedAt() == null)
                    continue;
                Map<String, Object> ev = new HashMap<>();
                ev.put("id", "usr_" + u.getId());
                ev.put("type", "USER_REGISTER");
                ev.put("user", u.getName() != null ? u.getName() : "Scholar");
                ev.put("userEmail", u.getEmail());
                ev.put("action", "Registered on Platform");
                ev.put("region", u.getState() != null ? u.getState() : "India");
                ev.put("timestamp", u.getCreatedAt().getTime());
                ev.put("timeAgo", formatTimeAgo(u.getCreatedAt()));
                events.add(ev);
            }
        } catch (Exception e) {
            log.warn("Error fetching recent users for live feed: {}", e.getMessage());
        }

        // 2. Recent Payments
        try {
            List<Payment> recentPayments = paymentRepo.findTop20ByOrderByCreatedAtDesc();
            for (Payment p : recentPayments) {
                if (p.getCreatedAt() == null)
                    continue;
                Map<String, Object> ev = new HashMap<>();
                ev.put("id", "pay_" + p.getId());
                ev.put("type", "PURCHASE");
                ev.put("user", resolveUserName(p.getUserId()));
                ev.put("userEmail", p.getUserId());
                ev.put("action",
                        "Purchased Material (₹" + (p.getAmount() != null ? Math.round(p.getAmount()) : 0) + ")");
                ev.put("region", "Digital Store");
                ev.put("timestamp", p.getCreatedAt().getTime());
                ev.put("timeAgo", formatTimeAgo(p.getCreatedAt()));
                events.add(ev);
            }
        } catch (Exception e) {
            log.warn("Error fetching recent payments for live feed: {}", e.getMessage());
        }

        // 3. Recent Quiz Attempts
        try {
            List<QuizAttempt> recentQuizzes = quizAttemptRepo.findTop20ByOrderByAttemptedAtDesc();
            for (QuizAttempt q : recentQuizzes) {
                if (q.getAttemptedAt() == null)
                    continue;
                Map<String, Object> ev = new HashMap<>();
                ev.put("id", "quiz_" + q.getId());
                ev.put("type", "QUIZ_ATTEMPT");
                ev.put("user", resolveUserName(q.getUserId()));
                ev.put("userEmail", q.getUserId());
                ev.put("action", "Attempted Test (" + Math.round(q.getAccuracy()) + "% acc)");
                ev.put("region", q.getStateSlug() != null ? q.getStateSlug().toUpperCase() : "Quiz Zone");
                ev.put("timestamp", q.getAttemptedAt().toEpochMilli());
                ev.put("timeAgo", formatTimeAgo(Date.from(q.getAttemptedAt())));
                events.add(ev);
            }
        } catch (Exception e) {
            log.warn("Error fetching recent quiz attempts for live feed: {}", e.getMessage());
        }

        // Sort merged events by timestamp descending
        events.sort((a, b) -> Long.compare((Long) b.get("timestamp"), (Long) a.get("timestamp")));

        // Limit to top 15 events
        List<Map<String, Object>> feed = events.stream().limit(15).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Live platform activity stream loaded")
                .data(feed)
                .build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/revenue?period=today|7d|30d|90d|lifetime
    // Time-series revenue data for Recharts analytics tab
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponseDTO> getRevenueChart(
            @RequestParam(defaultValue = "30d") String period) {

        Date fromDate;
        int bucketDays;
        Date now = new Date();

        switch (period) {
            case "today" -> {
                fromDate = startOfToday();
                bucketDays = 0;
            }
            case "7d" -> {
                fromDate = dateMinusDays(now, 7);
                bucketDays = 1;
            }
            case "90d" -> {
                fromDate = dateMinusDays(now, 90);
                bucketDays = 7;
            }
            case "lifetime" -> {
                fromDate = new Date(0);
                bucketDays = 30;
            }
            default -> {
                fromDate = dateMinusDays(now, 30);
                bucketDays = 1;
            } // 30d
        }

        List<Payment> payments = fromDate.getTime() == 0
                ? paymentRepo.findByStatus("SUCCESS")
                : paymentRepo.findByStatusAndCreatedAtAfter("SUCCESS", fromDate);

        Map<String, Object> summary = new HashMap<>();
        double totalRevenue = payments.stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalOrders", payments.size());
        summary.put("avgOrderValue",
                payments.isEmpty() ? 0 : Math.round(totalRevenue / payments.size() * 100.0) / 100.0);

        long newUsers = fromDate.getTime() == 0
                ? userRepo.count()
                : userRepo.countByCreatedAtAfter(fromDate);
        summary.put("newUsers", newUsers);

        List<Map<String, Object>> chartData;
        if ("today".equals(period)) {
            chartData = buildHourlyBuckets(payments);
        } else if (bucketDays == 1) {
            chartData = buildDailyBuckets(payments, fromDate, now);
        } else {
            chartData = buildWeeklyBuckets(payments, fromDate, now, bucketDays);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("chartData", chartData);
        result.put("period", period);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Revenue analytics loaded")
                .data(result).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/analytics/regional — Regional state breakdown
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/analytics/regional")
    public ResponseEntity<ApiResponseDTO> getRegionalAnalytics() {
        List<User> users = userRepo.findAll();
        Map<String, Long> usersByState = users.stream()
                .map(u -> u.getState() != null ? u.getState() : "Unspecified")
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

        List<Map<String, Object>> regionalList = new ArrayList<>();
        usersByState.forEach((state, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("state", state);
            item.put("userCount", count);
            regionalList.add(item);
        });

        regionalList.sort((a, b) -> Long.compare((Long) b.get("userCount"), (Long) a.get("userCount")));

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Regional analytics retrieved")
                .data(regionalList)
                .build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/content — Content breakdown for diagnostics panel
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/content")
    public ResponseEntity<ApiResponseDTO> getContentStats() {
        Map<String, Object> content = new HashMap<>();
        content.put("totalCourses", courseRepo.count());
        content.put("totalPDFs", contentRepo.countByType("pdf"));
        content.put("totalVideos", contentRepo.countByType("video"));
        content.put("totalNotes", contentRepo.count());
        content.put("totalProducts", productRepo.count());
        content.put("totalBlogs", blogPostRepo.count());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Content statistics loaded").data(content).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/storage — S3 storage analytics (graceful fallback)
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/storage")
    public ResponseEntity<ApiResponseDTO> getStorageStats() {
        Map<String, Object> storage = new HashMap<>();
        try {
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(s3BucketName)
                    .build();

            long totalFiles = 0;
            long totalSizeBytes = 0;
            long pdfCount = 0, videoCount = 0, imageCount = 0, otherCount = 0;
            long pdfSize = 0, videoSize = 0, imageSize = 0, otherSize = 0;

            ListObjectsV2Response listResp;
            String continuationToken = null;
            do {
                ListObjectsV2Request.Builder reqBuilder = ListObjectsV2Request.builder()
                        .bucket(s3BucketName)
                        .maxKeys(1000);
                if (continuationToken != null)
                    reqBuilder.continuationToken(continuationToken);
                listResp = s3Client.listObjectsV2(reqBuilder.build());

                for (S3Object obj : listResp.contents()) {
                    totalFiles++;
                    long size = obj.size();
                    totalSizeBytes += size;
                    String key = obj.key().toLowerCase();
                    if (key.startsWith("pdfs/") || key.endsWith(".pdf")) {
                        pdfCount++;
                        pdfSize += size;
                    } else if (key.startsWith("videos/") || key.endsWith(".mp4") || key.endsWith(".mov")) {
                        videoCount++;
                        videoSize += size;
                    } else if (key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png")
                            || key.endsWith(".webp")) {
                        imageCount++;
                        imageSize += size;
                    } else {
                        otherCount++;
                        otherSize += size;
                    }
                }
                continuationToken = listResp.nextContinuationToken();
            } while (listResp.isTruncated());

            storage.put("available", true);
            storage.put("totalFiles", totalFiles);
            storage.put("totalSizeBytes", totalSizeBytes);
            storage.put("totalSizeMB", Math.round(totalSizeBytes / 1024.0 / 1024.0 * 10) / 10.0);
            storage.put("pdfCount", pdfCount);
            storage.put("pdfSizeMB", Math.round(pdfSize / 1024.0 / 1024.0 * 10) / 10.0);
            storage.put("videoCount", videoCount);
            storage.put("videoSizeMB", Math.round(videoSize / 1024.0 / 1024.0 * 10) / 10.0);
            storage.put("imageCount", imageCount);
            storage.put("imageSizeMB", Math.round(imageSize / 1024.0 / 1024.0 * 10) / 10.0);
            storage.put("otherCount", otherCount);
            storage.put("otherSizeMB", Math.round(otherSize / 1024.0 / 1024.0 * 10) / 10.0);
            storage.put("bucket", s3BucketName);

        } catch (Exception e) {
            log.warn("S3 storage analytics unavailable: {}", e.getMessage());
            storage.put("available", false);
            storage.put("warning", "S3 ListBucket permission not available or bucket unreachable");
            storage.put("totalFiles", 0);
            storage.put("totalSizeMB", 0);
        }
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Storage analytics loaded").data(storage).build());
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private String resolveUserName(String userIdOrEmail) {
        if (userIdOrEmail == null)
            return "Scholar";
        Optional<User> uOpt = userRepo.findByIdentifier(userIdOrEmail);
        if (uOpt.isPresent() && uOpt.get().getName() != null) {
            return uOpt.get().getName();
        }
        return "Scholar";
    }

    private String formatTimeAgo(Date date) {
        if (date == null)
            return "Recently";
        long seconds = (System.currentTimeMillis() - date.getTime()) / 1000;
        if (seconds < 60)
            return "Just now";
        long minutes = seconds / 60;
        if (minutes < 60)
            return minutes + " mins ago";
        long hours = minutes / 60;
        if (hours < 24)
            return hours + " hrs ago";
        long days = hours / 24;
        return days + " days ago";
    }

    private Date dateMinusDays(Date from, int days) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(from);
        cal.add(Calendar.DAY_OF_MONTH, -days);
        return cal.getTime();
    }

    private Date startOfToday() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTime();
    }

    private int calculateCurrentStreak(Set<LocalDate> dates) {
        if (dates.isEmpty())
            return 0;
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        if (!dates.contains(today) && !dates.contains(yesterday)) {
            return 0;
        }

        int streak = 0;
        LocalDate checkDate = dates.contains(today) ? today : yesterday;
        while (dates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }
        return streak;
    }

    private int calculateLongestStreak(Set<LocalDate> dates) {
        if (dates.isEmpty())
            return 0;
        List<LocalDate> sortedDates = new ArrayList<>(dates);
        Collections.sort(sortedDates);

        int maxStreak = 1;
        int currentStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        }
        return maxStreak;
    }

    private List<Map<String, Object>> build7DayActivityMatrix(List<QuizAttempt> attempts) {
        List<Map<String, Object>> matrix = new ArrayList<>();
        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long count = attempts.stream().filter(qa -> {
                if (qa.getAttemptedAt() == null)
                    return false;
                LocalDate attemptDate = LocalDate.ofInstant(qa.getAttemptedAt(), zone);
                return attemptDate.equals(day);
            }).count();

            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", day.toString());
            dayMap.put("count", count);
            matrix.add(dayMap);
        }
        return matrix;
    }

    private List<Map<String, Object>> buildHourlyBuckets(List<Payment> payments) {
        List<Map<String, Object>> result = new ArrayList<>();
        Calendar now = Calendar.getInstance();
        int currentHour = now.get(Calendar.HOUR_OF_DAY);
        for (int h = 0; h <= currentHour; h++) {
            final int hour = h;
            double rev = payments.stream().filter(p -> {
                Calendar pc = Calendar.getInstance();
                pc.setTime(p.getCreatedAt());
                return pc.get(Calendar.HOUR_OF_DAY) == hour;
            }).mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            long orders = payments.stream().filter(p -> {
                Calendar pc = Calendar.getInstance();
                pc.setTime(p.getCreatedAt());
                return pc.get(Calendar.HOUR_OF_DAY) == hour;
            }).count();
            Map<String, Object> bucket = new HashMap<>();
            bucket.put("date", String.format("%02d:00", hour));
            bucket.put("revenue", rev);
            bucket.put("orders", orders);
            result.add(bucket);
        }
        return result;
    }

    private List<Map<String, Object>> buildDailyBuckets(List<Payment> payments, Date from, Date to) {
        List<Map<String, Object>> result = new ArrayList<>();
        Calendar cursor = Calendar.getInstance();
        cursor.setTime(from);
        cursor.set(Calendar.HOUR_OF_DAY, 0);
        cursor.set(Calendar.MINUTE, 0);
        cursor.set(Calendar.SECOND, 0);
        cursor.set(Calendar.MILLISECOND, 0);

        Calendar end = Calendar.getInstance();
        end.setTime(to);

        while (!cursor.after(end)) {
            Calendar dayStart = (Calendar) cursor.clone();
            Calendar dayEnd = (Calendar) cursor.clone();
            dayEnd.add(Calendar.DAY_OF_MONTH, 1);

            Date ds = dayStart.getTime();
            Date de = dayEnd.getTime();

            double rev = payments.stream().filter(p -> p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(ds) && p.getCreatedAt().before(de))
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            long orders = payments.stream().filter(p -> p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(ds) && p.getCreatedAt().before(de)).count();

            Map<String, Object> bucket = new HashMap<>();
            bucket.put("date", String.format("%d/%d", cursor.get(Calendar.DAY_OF_MONTH),
                    cursor.get(Calendar.MONTH) + 1));
            bucket.put("revenue", rev);
            bucket.put("orders", orders);
            result.add(bucket);

            cursor.add(Calendar.DAY_OF_MONTH, 1);
        }
        return result;
    }

    private List<Map<String, Object>> buildWeeklyBuckets(List<Payment> payments, Date from, Date to, int bucketDays) {
        List<Map<String, Object>> result = new ArrayList<>();
        Calendar cursor = Calendar.getInstance();
        cursor.setTime(from);
        cursor.set(Calendar.HOUR_OF_DAY, 0);
        cursor.set(Calendar.MINUTE, 0);
        cursor.set(Calendar.SECOND, 0);
        cursor.set(Calendar.MILLISECOND, 0);

        Calendar end = Calendar.getInstance();
        end.setTime(to);

        while (!cursor.after(end)) {
            Calendar bucketStart = (Calendar) cursor.clone();
            Calendar bucketEnd = (Calendar) cursor.clone();
            bucketEnd.add(Calendar.DAY_OF_MONTH, bucketDays);

            Date bs = bucketStart.getTime();
            Date be = bucketEnd.getTime();

            double rev = payments.stream().filter(p -> p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(bs) && p.getCreatedAt().before(be))
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            long orders = payments.stream().filter(p -> p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(bs) && p.getCreatedAt().before(be)).count();

            Map<String, Object> bucket = new HashMap<>();
            bucket.put("date", String.format("%d/%d", bucketStart.get(Calendar.DAY_OF_MONTH),
                    bucketStart.get(Calendar.MONTH) + 1));
            bucket.put("revenue", rev);
            bucket.put("orders", orders);
            result.add(bucket);

            cursor.add(Calendar.DAY_OF_MONTH, bucketDays);
        }
        return result;
    }
}
