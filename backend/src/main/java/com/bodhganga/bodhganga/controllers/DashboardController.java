package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Enrollment;
import com.bodhganga.bodhganga.entity.Payment;
import com.bodhganga.bodhganga.entity.State;
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

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
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
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name:${aws.s3.bucket.name:bodhganga-prod}}")
    private String s3BucketName;

    public DashboardController(EnrollmentRepo enrollmentRepo, UserRepo userRepo,
                               CourseRepo courseRepo, BlogPostRepo blogPostRepo,
                               ProductRepo productRepo, PurchaseRepo purchaseRepo,
                               StateRepo stateRepo, ContentRepo contentRepo,
                               PaymentRepo paymentRepo, S3Client s3Client) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.blogPostRepo = blogPostRepo;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.stateRepo = stateRepo;
        this.contentRepo = contentRepo;
        this.paymentRepo = paymentRepo;
        this.s3Client = s3Client;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard
    // User dashboard after login
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getDashboard(Authentication authentication) {
        String userEmail = authentication.getName();
        Map<String, Object> dashboardData = new HashMap<>();
        dashboardData.put("welcomeMessage", "Welcome to BodhGanga Dashboard!");
        dashboardData.put("userEmail", userEmail);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Dashboard loaded successfully").data(dashboardData).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/stats  — User-specific stats
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponseDTO> getStats(Authentication authentication) {
        String userEmail = authentication.getName();
        String userId = userRepo.findByEmail(userEmail).map(u -> u.getId()).orElse(null);
        Map<String, Object> stats = new HashMap<>();
        if (userId != null) {
            List<Enrollment> enrollments = enrollmentRepo.findByUserId(userId);
            long completed = enrollments.stream().filter(e -> "COMPLETED".equals(e.getStatus())).count();
            long inProgress = enrollments.stream()
                    .filter(e -> "ENROLLED".equals(e.getStatus()) && e.getProgress() > 0).count();
            stats.put("enrolledCourses", enrollments.size());
            stats.put("completedCourses", completed);
            stats.put("inProgressCourses", inProgress);
            stats.put("totalEnrollments", enrollments.size());
        } else {
            stats.put("enrolledCourses", 0);
            stats.put("completedCourses", 0);
            stats.put("inProgressCourses", 0);
            stats.put("totalEnrollments", 0);
        }
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true).message("Stats retrieved").data(stats).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/admin-stats  — Live production metrics (no fallbacks)
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
        stats.put("totalUsers", totalUsers);
        stats.put("usersThisWeek", usersThisWeek);
        stats.put("usersThisMonth", usersThisMonth);

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
        long totalStates = stateRepo.count();

        // Sum up districts from all published states
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
        stats.put("totalStateCount", 29L);       // India has 28+1=29 states
        stats.put("totalUTCount", 8L);            // India has 8 UTs
        stats.put("totalDistricts", totalDistricts);
        stats.put("utDistricts", utDistricts);
        stats.put("allIndia_totalDistricts", 786L); // Total districts in India

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

        // ── Enrollment metrics ─────────────────────────────────────
        long totalEnrollments = enrollmentRepo.count();
        stats.put("totalEnrollments", totalEnrollments);

        // ── Purchase metrics ───────────────────────────────────────
        long totalPurchases = purchaseRepo.count();
        stats.put("totalPurchases", totalPurchases);

        stats.put("systemHealth", "OPERATIONAL");

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Administrative statistics loaded from live database")
                .data(stats).build());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/dashboard/revenue?period=today|7d|30d|90d|lifetime
    // Time-series revenue data for Recharts analytics tab
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponseDTO> getRevenueChart(
            @RequestParam(defaultValue = "30d") String period) {

        Date fromDate;
        int bucketDays; // how many days per data point
        Date now = new Date();

        switch (period) {
            case "today"    -> { fromDate = startOfToday(); bucketDays = 0; }
            case "7d"       -> { fromDate = dateMinusDays(now, 7);  bucketDays = 1; }
            case "90d"      -> { fromDate = dateMinusDays(now, 90); bucketDays = 7; }
            case "lifetime" -> { fromDate = new Date(0); bucketDays = 30; }
            default         -> { fromDate = dateMinusDays(now, 30); bucketDays = 1; } // 30d
        }

        List<Payment> payments = fromDate.getTime() == 0
                ? paymentRepo.findByStatus("SUCCESS")
                : paymentRepo.findByStatusAndCreatedAtAfter("SUCCESS", fromDate);

        // Build summary totals
        Map<String, Object> summary = new HashMap<>();
        double totalRevenue = payments.stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalOrders", payments.size());
        summary.put("avgOrderValue", payments.isEmpty() ? 0 : totalRevenue / payments.size());

        // User growth over same period
        long newUsers = fromDate.getTime() == 0
                ? userRepo.count()
                : userRepo.countByCreatedAtAfter(fromDate);
        summary.put("newUsers", newUsers);

        // Build time-series chart data
        List<Map<String, Object>> chartData;
        if ("today".equals(period)) {
            // Hourly buckets for today
            chartData = buildHourlyBuckets(payments);
        } else if (bucketDays == 1) {
            // Daily buckets
            chartData = buildDailyBuckets(payments, fromDate, now);
        } else {
            // Weekly/monthly buckets
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
    // GET /api/dashboard/content  — Content breakdown for diagnostics panel
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
    // GET /api/dashboard/storage  — S3 storage analytics (graceful fallback)
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
                if (continuationToken != null) reqBuilder.continuationToken(continuationToken);
                listResp = s3Client.listObjectsV2(reqBuilder.build());

                for (S3Object obj : listResp.contents()) {
                    totalFiles++;
                    long size = obj.size();
                    totalSizeBytes += size;
                    String key = obj.key().toLowerCase();
                    if (key.startsWith("pdfs/") || key.endsWith(".pdf")) {
                        pdfCount++; pdfSize += size;
                    } else if (key.startsWith("videos/") || key.endsWith(".mp4") || key.endsWith(".mov")) {
                        videoCount++; videoSize += size;
                    } else if (key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png") || key.endsWith(".webp")) {
                        imageCount++; imageSize += size;
                    } else {
                        otherCount++; otherSize += size;
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

    // ── Private helpers ────────────────────────────────────────────────────────

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

            double rev = payments.stream().filter(p ->
                    p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(ds) && p.getCreatedAt().before(de))
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            long orders = payments.stream().filter(p ->
                    p.getCreatedAt() != null &&
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

            double rev = payments.stream().filter(p ->
                    p.getCreatedAt() != null &&
                    !p.getCreatedAt().before(bs) && p.getCreatedAt().before(be))
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            long orders = payments.stream().filter(p ->
                    p.getCreatedAt() != null &&
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
