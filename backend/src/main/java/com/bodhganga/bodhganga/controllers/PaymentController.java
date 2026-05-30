package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.EmailService;
import com.bodhganga.bodhganga.entity.Product;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private final UserRepo userRepo;
    private final PurchaseRepo purchaseRepo;
    private final ProductRepo productRepo;
    private final EmailService emailService;

    public PaymentController(UserRepo userRepo, PurchaseRepo purchaseRepo, ProductRepo productRepo, EmailService emailService) {
        this.userRepo = userRepo;
        this.purchaseRepo = purchaseRepo;
        this.productRepo = productRepo;
        this.emailService = emailService;
    }

    /**
     * POST /api/payment/create-order
     * Creates a Razorpay order server-side.
     * Amount is in paise (₹1 = 100 paise).
     */
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponseDTO> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            Authentication authentication) {

        if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
            return ResponseEntity.status(503).body(ApiResponseDTO.builder()
                    .success(false).message("Payment gateway not configured.").build());
        }

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", req.amountPaise());       // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());
            orderRequest.put("notes", new JSONObject()
                    .put("productId", req.productId())
                    .put("userEmail", authentication.getName()));

            Order order = client.orders.create(orderRequest);

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", order.get("id"));
            data.put("amount", order.get("amount"));
            data.put("currency", order.get("currency"));
            data.put("keyId", razorpayKeyId);

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Order created").data(data).build());

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Failed to create payment order.").build());
        }
    }

    /**
     * POST /api/payment/verify
     * Verifies Razorpay payment signature server-side.
     * NEVER trust client-side payment confirmation alone.
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponseDTO> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest req,
            Authentication authentication) {

        try {
            // Verify HMAC-SHA256 signature
            String payload = req.razorpayOrderId() + "|" + req.razorpayPaymentId();
            String expectedSignature = hmacSha256(payload, razorpayKeySecret);

            if (!expectedSignature.equals(req.razorpaySignature())) {
                log.warn("Payment signature mismatch for order: {}", req.razorpayOrderId());
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Payment verification failed. Invalid signature.").build());
            }

            // Signature valid — record purchase
            log.info("Payment verified: orderId={}, paymentId={}, user={}",
                    req.razorpayOrderId(), req.razorpayPaymentId(), authentication.getName());

            // Fetch user from DB
            User user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));

            // Retrieve productId from Razorpay order notes dynamically
            String productId = null;
            if (razorpayKeyId != null && !razorpayKeyId.isBlank() && razorpayKeySecret != null && !razorpayKeySecret.isBlank()) {
                try {
                    RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                    Order order = client.orders.fetch(req.razorpayOrderId());
                    if (order.has("notes")) {
                        Object notesObj = order.get("notes");
                        if (notesObj instanceof JSONObject) {
                            productId = ((JSONObject) notesObj).optString("productId");
                        } else if (notesObj instanceof Map) {
                            productId = String.valueOf(((Map<?, ?>) notesObj).get("productId"));
                        } else {
                            JSONObject notesJson = new JSONObject(notesObj.toString());
                            productId = notesJson.optString("productId");
                        }
                    }
                } catch (Exception ex) {
                    log.error("Error fetching order details from Razorpay: {}", ex.getMessage());
                }
            }

            // Save purchase record to DB
            String resolvedProductName = "Digital Study Notes";
            if (productId != null && !productId.isBlank()) {
                Optional<Product> prodOpt = productRepo.findById(productId);
                if (prodOpt.isPresent()) {
                    resolvedProductName = prodOpt.get().getTitle();
                }
                Optional<Purchase> existing = purchaseRepo.findByUserIdAndProductId(user.getId(), productId);
                if (existing.isEmpty()) {
                    Purchase purchase = new Purchase();
                    purchase.setUserId(user.getId());
                    purchase.setProductId(productId);
                    purchase.setOrderId(req.razorpayOrderId());
                    purchase.setPurchaseDate(new java.util.Date());
                    purchase.setDownloadCount(0);
                    purchaseRepo.save(purchase);
                    log.info("Successfully recorded purchase in MongoDB: userId={}, productId={}", user.getId(), productId);
                } else {
                    log.info("Purchase record already exists in MongoDB: userId={}, productId={}", user.getId(), productId);
                }
            } else {
                log.warn("Unable to resolve productId for purchase record. OrderId: {}", req.razorpayOrderId());
            }

            // Send confirmation email
            try {
                emailService.sendOrderConfirmation(user.getEmail(), req.razorpayOrderId(), resolvedProductName);
            } catch (Exception ex) {
                log.error("Failed to send order confirmation email: {}", ex.getMessage());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("paymentId", req.razorpayPaymentId());
            data.put("orderId", req.razorpayOrderId());
            data.put("status", "PAID");

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Payment verified successfully.").data(data).build());

        } catch (Exception e) {
            log.error("Payment verification error: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Payment verification error.").build());
        }
    }

    /**
     * GET /api/payment/my-purchases
     * Retrieves all purchases made by the currently authenticated user.
     */
    @GetMapping("/my-purchases")
    public ResponseEntity<ApiResponseDTO> getMyPurchases(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("Authentication required.")
                        .build());
            }

            User user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));

            java.util.List<Purchase> purchases = purchaseRepo.findByUserId(user.getId());

            java.util.List<Map<String, Object>> dataList = purchases.stream().map(purchase -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", purchase.getId());
                map.put("purchaseDate", purchase.getPurchaseDate());
                map.put("downloadCount", purchase.getDownloadCount());
                map.put("orderId", purchase.getOrderId());
                map.put("productId", purchase.getProductId());

                // Find associated product details
                Optional<Product> prodOpt = productRepo.findById(purchase.getProductId());
                if (prodOpt.isPresent()) {
                    Product product = prodOpt.get();
                    
                    // Create nested product details object
                    Map<String, Object> productDetails = new HashMap<>();
                    productDetails.put("id", product.getId());
                    productDetails.put("title", product.getTitle());
                    productDetails.put("type", product.getType());
                    productDetails.put("price", product.getPrice());
                    productDetails.put("storageKey", product.getStorageKey());
                    productDetails.put("thumbnail", product.getPreviewUrl()); // mapping previewUrl to thumbnail
                    map.put("product", productDetails);
                    
                    // Flatten fields directly for convenience/backward compatibility
                    map.put("title", product.getTitle());
                    map.put("type", product.getType());
                    map.put("price", product.getPrice());
                    map.put("storageKey", product.getStorageKey());
                    map.put("thumbnail", product.getPreviewUrl());
                }

                return map;
            }).collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("User purchases retrieved successfully.")
                    .data(dataList)
                    .build());

        } catch (Exception e) {
            log.error("Error retrieving purchases: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Error retrieving purchases.")
                    .build());
        }
    }

    /**
     * GET /api/payment/check-purchase/{productId}
     * Checks if the currently authenticated user has purchased the product.
     */
    @GetMapping("/check-purchase/{productId}")
    public ResponseEntity<ApiResponseDTO> checkPurchase(
            @PathVariable String productId,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(false).build());
            }
            User user = userRepo.findByEmail(authentication.getName()).orElse(null);
            if (user == null) {
                return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(false).build());
            }
            boolean hasPurchased = purchaseRepo.findByUserIdAndProductId(user.getId(), productId).isPresent();
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Purchase status retrieved successfully")
                    .data(hasPurchased)
                    .build());
        } catch (Exception e) {
            log.error("Error checking purchase status: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error checking purchase status").build());
        }
    }

    /**
     * POST /api/payment/webhook
     * Razorpay webhook — validates X-Razorpay-Signature header.
     * Configure in Razorpay Dashboard → Webhooks.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        try {
            String expectedSig = hmacSha256(payload, razorpayKeySecret);
            if (!expectedSig.equals(signature)) {
                log.warn("Webhook signature mismatch");
                return ResponseEntity.status(400).body("Invalid signature");
            }

            JSONObject event = new JSONObject(payload);
            String eventType = event.optString("event");
            log.info("Razorpay webhook received: {}", eventType);

            // Handle payment.captured event
            if ("payment.captured".equals(eventType)) {
                JSONObject payment = event
                        .getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                String paymentId = payment.getString("id");
                String orderId = payment.getString("order_id");
                log.info("Payment captured: paymentId={}, orderId={}", paymentId, orderId);
                
                // Retrieve or save purchase record if not already recorded
                try {
                    RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                    Order order = client.orders.fetch(orderId);
                    Object notesObj = order.has("notes") ? order.get("notes") : null;
                    String productId = null;
                    String userEmail = null;
                    if (notesObj != null) {
                        if (notesObj instanceof JSONObject) {
                            productId = ((JSONObject) notesObj).optString("productId");
                            userEmail = ((JSONObject) notesObj).optString("userEmail");
                        } else if (notesObj instanceof Map) {
                            productId = String.valueOf(((Map<?, ?>) notesObj).get("productId"));
                            userEmail = String.valueOf(((Map<?, ?>) notesObj).get("userEmail"));
                        }
                    }
                    if (productId != null && userEmail != null) {
                        final String finalProdId = productId;
                        final String finalOrderId = orderId;
                        userRepo.findByEmail(userEmail).ifPresent(user -> {
                            String resolvedProductName = "Digital Study Notes";
                            Optional<Product> prodOpt = productRepo.findById(finalProdId);
                            if (prodOpt.isPresent()) {
                                resolvedProductName = prodOpt.get().getTitle();
                            }
                            if (purchaseRepo.findByUserIdAndProductId(user.getId(), finalProdId).isEmpty()) {
                                Purchase purchase = new Purchase();
                                purchase.setUserId(user.getId());
                                purchase.setProductId(finalProdId);
                                purchase.setOrderId(finalOrderId);
                                purchase.setPurchaseDate(new java.util.Date());
                                purchase.setDownloadCount(0);
                                purchaseRepo.save(purchase);
                                log.info("Webhook saved purchase successfully for user: {}, product: {}", user.getEmail(), finalProdId);
                            }
                            // Send order confirmation email from webhook
                            try {
                                emailService.sendOrderConfirmation(user.getEmail(), finalOrderId, resolvedProductName);
                            } catch (Exception ex) {
                                log.error("Failed to send webhook order confirmation email: {}", ex.getMessage());
                            }
                        });
                    }
                } catch (Exception ex) {
                    log.error("Webhook purchase recording failed: {}", ex.getMessage());
                }
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Webhook processing error: {}", e.getMessage());
            return ResponseEntity.status(500).body("Error");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }

    // ── Request Records ───────────────────────────────────────────

    public record CreateOrderRequest(
        @Min(100) int amountPaise,   // minimum ₹1
        @NotBlank String productId
    ) {}

    public record VerifyPaymentRequest(
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpaySignature
    ) {}
}
