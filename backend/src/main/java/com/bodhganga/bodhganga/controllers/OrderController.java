package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.*;
import com.bodhganga.bodhganga.repo.*;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Order management API.
 * User orders: GET /api/orders
 * Admin orders: GET /api/admin/orders (requires ROLE_ADMIN)
 */
@RestController
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    private final PurchaseRepo purchaseRepo;
    private final PaymentRepo paymentRepo;
    private final UserRepo userRepo;
    private final CourseRepo courseRepo;
    private final ProductRepo productRepo;

    public OrderController(PurchaseRepo purchaseRepo, PaymentRepo paymentRepo,
                           UserRepo userRepo, CourseRepo courseRepo,
                           ProductRepo productRepo) {
        this.purchaseRepo = purchaseRepo;
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.productRepo = productRepo;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/orders  — User's own purchase history
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/api/orders")
    public ResponseEntity<ApiResponseDTO> getMyOrders(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                        .success(false).message("Authentication required").build());
            }

            User user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Purchase> purchases = purchaseRepo.findByUserId(user.getId());
            List<Map<String, Object>> orders = new ArrayList<>();

            for (Purchase purchase : purchases) {
                Map<String, Object> row = buildOrderRow(purchase, user);
                orders.add(row);
            }

            // Sort by date descending
            orders.sort((a, b) -> {
                Date da = (Date) a.get("purchaseDate");
                Date db = (Date) b.get("purchaseDate");
                if (da == null || db == null) return 0;
                return db.compareTo(da);
            });

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Order history retrieved")
                    .data(orders).build());

        } catch (Exception e) {
            log.error("Error retrieving orders: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error retrieving orders").build());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/admin/orders  — All orders (admin only)
    // Query params: page, size, status, search
    // ──────────────────────────────────────────────────────────────────────────
    @GetMapping("/api/admin/orders")
    public ResponseEntity<ApiResponseDTO> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        try {
            List<Payment> payments;
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                payments = paymentRepo.findByStatus(status.toUpperCase());
            } else {
                payments = paymentRepo.findAll();
            }

            // Apply search filter (by userId or orderId or paymentId)
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                payments = payments.stream().filter(p ->
                        (p.getOrderId() != null && p.getOrderId().toLowerCase().contains(q)) ||
                        (p.getPaymentId() != null && p.getPaymentId().toLowerCase().contains(q)) ||
                        (p.getUserId() != null && p.getUserId().toLowerCase().contains(q))
                ).collect(Collectors.toList());
            }

            // Sort by createdAt desc
            payments.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });

            // Pagination
            int total = payments.size();
            int from = Math.min(page * size, total);
            int to = Math.min(from + size, total);
            List<Payment> pageData = payments.subList(from, to);

            // Enrich
            List<Map<String, Object>> enriched = pageData.stream()
                    .map(this::buildAdminOrderRow).collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("orders", enriched);
            result.put("total", total);
            result.put("page", page);
            result.put("size", size);
            result.put("pages", (int) Math.ceil((double) total / size));

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Admin orders loaded").data(result).build());

        } catch (Exception e) {
            log.error("Admin orders error: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error loading admin orders").build());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/admin/orders/{orderId}/refund  — Initiate Razorpay refund
    // ──────────────────────────────────────────────────────────────────────────
    @PostMapping("/api/admin/orders/{orderId}/refund")
    public ResponseEntity<ApiResponseDTO> refundOrder(@PathVariable String orderId) {
        try {
            Optional<Payment> paymentOpt = paymentRepo.findByOrderId(orderId);
            if (paymentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Order not found: " + orderId).build());
            }

            Payment payment = paymentOpt.get();
            if (!"SUCCESS".equals(payment.getStatus())) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Only successful payments can be refunded").build());
            }

            if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
                return ResponseEntity.status(503).body(ApiResponseDTO.builder()
                        .success(false).message("Razorpay not configured").build());
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject refundReq = new JSONObject();
            if (payment.getAmount() != null) {
                refundReq.put("amount", (int) (payment.getAmount() * 100)); // paise
            }
            refundReq.put("speed", "normal");

            com.razorpay.Refund refund = client.payments.refund(payment.getPaymentId(), refundReq);

            payment.setStatus("REFUNDED");
            paymentRepo.save(payment);

            Map<String, Object> data = new HashMap<>();
            data.put("refundId", refund.get("id"));
            data.put("status", "REFUNDED");

            log.info("Refund issued for orderId={}, paymentId={}", orderId, payment.getPaymentId());

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Refund initiated").data(data).build());

        } catch (Exception e) {
            log.error("Refund error for orderId={}: {}", orderId, e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Refund failed: " + e.getMessage()).build());
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Map<String, Object> buildOrderRow(Purchase purchase, User user) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", purchase.getId());
        row.put("orderId", purchase.getOrderId());
        row.put("purchaseDate", purchase.getPurchaseDate());
        row.put("productId", purchase.getProductId());
        row.put("downloadCount", purchase.getDownloadCount());

        // Look up payment for amount + status
        if (purchase.getOrderId() != null) {
            paymentRepo.findByOrderId(purchase.getOrderId()).ifPresent(p -> {
                row.put("amount", p.getAmount());
                row.put("paymentId", p.getPaymentId());
                row.put("status", p.getStatus());
            });
        }
        if (!row.containsKey("status")) {
            row.put("status", "PAID");
        }

        // Resolve product name & thumbnail
        courseRepo.findById(purchase.getProductId()).ifPresentOrElse(c -> {
            row.put("productName", c.getCourseTitle());
            row.put("productType", "COURSE");
            row.put("thumbnail", c.getThumbnailUrl());
        }, () -> productRepo.findById(purchase.getProductId()).ifPresent(p -> {
            row.put("productName", p.getTitle());
            row.put("productType", p.getType() != null ? p.getType() : "PRODUCT");
            row.put("thumbnail", p.getPreviewUrl());
        }));

        return row;
    }

    private Map<String, Object> buildAdminOrderRow(Payment payment) {
        Map<String, Object> row = new HashMap<>();
        row.put("orderId", payment.getOrderId());
        row.put("paymentId", payment.getPaymentId());
        row.put("userId", payment.getUserId());
        row.put("amount", payment.getAmount());
        row.put("currency", payment.getCurrency());
        row.put("status", payment.getStatus());
        row.put("createdAt", payment.getCreatedAt());

        // Lookup user email
        if (payment.getUserId() != null) {
            userRepo.findById(payment.getUserId()).ifPresent(u -> {
                row.put("userEmail", u.getEmail());
                row.put("userName", u.getName());
            });
        }

        // Resolve course name
        if (payment.getCourseId() != null) {
            courseRepo.findById(payment.getCourseId()).ifPresent(c -> {
                row.put("productName", c.getCourseTitle());
                row.put("productType", "COURSE");
            });
        }

        return row;
    }
}
