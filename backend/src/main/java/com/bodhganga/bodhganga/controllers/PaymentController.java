package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.*;
import com.bodhganga.bodhganga.repo.*;
import com.bodhganga.bodhganga.services.EmailService;
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
import java.util.List;
import java.util.stream.Collectors;

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
    private final PaymentRepo paymentRepo;
    private final CourseRepo courseRepo;
    private final EnrollmentRepo enrollmentRepo;
    private final OrderRepo orderRepo;
    private final InvoiceRepo invoiceRepo;
    private final CartItemRepo cartItemRepo;

    public PaymentController(UserRepo userRepo, PurchaseRepo purchaseRepo, ProductRepo productRepo, 
                             EmailService emailService, PaymentRepo paymentRepo, CourseRepo courseRepo, 
                             EnrollmentRepo enrollmentRepo, OrderRepo orderRepo, InvoiceRepo invoiceRepo,
                             CartItemRepo cartItemRepo) {
        this.userRepo = userRepo;
        this.purchaseRepo = purchaseRepo;
        this.productRepo = productRepo;
        this.emailService = emailService;
        this.paymentRepo = paymentRepo;
        this.courseRepo = courseRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.orderRepo = orderRepo;
        this.invoiceRepo = invoiceRepo;
        this.cartItemRepo = cartItemRepo;
    }

    private void unlockCourse(String userId, String courseId, String orderId) {
        Optional<Purchase> existingPurchase = purchaseRepo.findByUserIdAndProductId(userId, courseId);
        if (existingPurchase.isEmpty()) {
            Purchase purchase = new Purchase();
            purchase.setUserId(userId);
            purchase.setProductId(courseId);
            purchase.setOrderId(orderId);
            purchase.setPurchaseDate(new java.util.Date());
            purchase.setDownloadCount(0);
            courseRepo.findById(courseId).ifPresent(c -> {
                purchase.setAmountPaid(c.getCoursePrice());
            });
            purchaseRepo.save(purchase);
            log.info("Successfully recorded course purchase in MongoDB: userId={}, courseId={}", userId, courseId);
        }

        Optional<Enrollment> existingEnrollment = enrollmentRepo.findByUserIdAndCourseId(userId, courseId);
        if (existingEnrollment.isEmpty()) {
            Enrollment enrollment = new Enrollment();
            enrollment.setUserId(userId);
            enrollment.setCourseId(courseId);
            enrollment.setEnrolledAt(new java.util.Date());
            enrollment.setStatus("ENROLLED");
            enrollment.setProgress(0);
            enrollmentRepo.save(enrollment);
            log.info("Successfully enrolled user in course: userId={}, courseId={}", userId, courseId);
        } else {
            Enrollment enrollment = existingEnrollment.get();
            if (!"ENROLLED".equals(enrollment.getStatus())) {
                enrollment.setStatus("ENROLLED");
                enrollmentRepo.save(enrollment);
                log.info("Updated course enrollment status to ENROLLED: userId={}, courseId={}", userId, courseId);
            }
        }
    }

    private void unlockProduct(String userId, String productId, String orderId) {
        Optional<Purchase> existing = purchaseRepo.findByUserIdAndProductId(userId, productId);
        if (existing.isEmpty()) {
            Purchase purchase = new Purchase();
            purchase.setUserId(userId);
            purchase.setProductId(productId);
            purchase.setOrderId(orderId);
            purchase.setPurchaseDate(new java.util.Date());
            purchase.setDownloadCount(0);
            productRepo.findById(productId).ifPresent(p -> {
                purchase.setAmountPaid(p.getPrice());
            });
            purchaseRepo.save(purchase);
            log.info("Successfully recorded product purchase in MongoDB: userId={}, productId={}", userId, productId);
        }
    }

    /**
     * POST /api/payment/create-order
     * Creates a Razorpay order server-side.
     * Amount is in paise (₹1 = 100 paise).
     */
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponseDTO> createOrder(
            @RequestBody CreateOrderRequest req,
            Authentication authentication) {

        if (razorpayKeyId == null || razorpayKeyId.isBlank()) {
            return ResponseEntity.status(503).body(ApiResponseDTO.builder()
                    .success(false).message("Payment gateway not configured.").build());
        }

        try {
            String userEmail = authentication.getName();
            User user = userRepo.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

            int amountPaise = 0;
            String productId = req.productId();
            String courseId = req.courseId();

            if (courseId != null && !courseId.trim().isEmpty()) {
                Courses course = courseRepo.findById(courseId)
                        .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));
                amountPaise = (int) Math.round(course.getCoursePrice() * 100);
            } else if (req.amountPaise() != null) {
                amountPaise = req.amountPaise();
            } else {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Invalid request: courseId or amountPaise is required.").build());
            }

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);       // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());
            
            JSONObject notes = new JSONObject();
            if (courseId != null && !courseId.trim().isEmpty()) {
                notes.put("courseId", courseId);
            }
            if (productId != null && !productId.trim().isEmpty()) {
                notes.put("productId", productId);
            }
            notes.put("userEmail", userEmail);
            orderRequest.put("notes", notes);

            Order order = client.orders.create(orderRequest);
            String orderId = order.get("id");

            if (courseId != null && !courseId.trim().isEmpty()) {
                Payment payment = new Payment(
                        user.getId(),
                        courseId,
                        orderId,
                        (double) amountPaise / 100.0,
                        "INR"
                );
                paymentRepo.save(payment);
                log.info("Created PENDING Payment record for course: userId={}, courseId={}, orderId={}", user.getId(), courseId, orderId);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", orderId);
            data.put("amount", order.get("amount"));
            data.put("currency", order.get("currency"));
            data.put("keyId", razorpayKeyId);

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Order created").data(data).build());

        } catch (Exception e) {
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
                
                // If it is a course payment, mark the Payment as FAILED
                Optional<Payment> paymentOpt = paymentRepo.findByOrderId(req.razorpayOrderId());
                if (paymentOpt.isPresent()) {
                    Payment p = paymentOpt.get();
                    if ("PENDING".equals(p.getStatus())) {
                        p.setStatus("FAILED");
                        paymentRepo.save(p);
                    }
                }
                
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Payment verification failed. Invalid signature.").build());
            }

            // Signature valid — record purchase
            log.info("Payment verified: orderId={}, paymentId={}, user={}",
                    req.razorpayOrderId(), req.razorpayPaymentId(), authentication.getName());

            // Fetch user from DB
            User user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));

            String resolvedProductName = "Digital Study Notes";
            
            // Check if there is a course Payment record for this order
            Optional<Payment> paymentOpt = paymentRepo.findByOrderId(req.razorpayOrderId());
            if (paymentOpt.isPresent()) {
                Payment p = paymentOpt.get();
                p.setStatus("SUCCESS");
                p.setPaymentId(req.razorpayPaymentId());
                paymentRepo.save(p);

                unlockCourse(user.getId(), p.getCourseId(), req.razorpayOrderId());

                Optional<Courses> courseOpt = courseRepo.findById(p.getCourseId());
                if (courseOpt.isPresent()) {
                    resolvedProductName = courseOpt.get().getCourseTitle();
                }
            } else {
                // Notes/product payment
                String productId = req.productId();
                if (productId == null || productId.isBlank()) {
                    // Try fetching from Razorpay order notes if not provided in request
                    try {
                        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                        Order order = client.orders.fetch(req.razorpayOrderId());
                        if (order.has("notes")) {
                            Object notesObj = order.get("notes");
                            if (notesObj instanceof JSONObject) {
                                productId = ((JSONObject) notesObj).optString("productId");
                            } else if (notesObj instanceof Map) {
                                productId = String.valueOf(((Map<?, ?>) notesObj).get("productId"));
                            }
                        }
                    } catch (Exception ex) {
                        log.error("Error fetching product details from Razorpay: {}", ex.getMessage());
                    }
                }
                
                if (productId != null && !productId.isBlank()) {
                    Optional<Product> prodOpt = productRepo.findById(productId);
                    if (prodOpt.isPresent()) {
                        resolvedProductName = prodOpt.get().getTitle();
                    }
                    unlockProduct(user.getId(), productId, req.razorpayOrderId());

                // Save districtSlug if this is a district unlock payment
                String districtSlug = req.districtSlug();
                String stateSlug = req.stateSlug();
                if (districtSlug != null && !districtSlug.isBlank()) {
                    Purchase districtPurchase = new Purchase();
                    districtPurchase.setUserId(user.getId());
                    districtPurchase.setDistrictSlug(districtSlug);
                    districtPurchase.setStateSlug(stateSlug);
                    districtPurchase.setOrderId(req.razorpayOrderId());
                    districtPurchase.setAmountPaid(99.0);
                    purchaseRepo.save(districtPurchase);
                    log.info("District unlocked: userId={}, districtSlug={}", user.getId(), districtSlug);
                }
                } else {
                    log.warn("Unable to resolve productId for purchase record. OrderId: {}", req.razorpayOrderId());
                }
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
     * GET /api/payment/district/purchased
     * Returns list of districtSlugs the current user has unlocked.
     */
    @GetMapping("/district/purchased")
    public ResponseEntity<ApiResponseDTO> getPurchasedDistricts(Authentication authentication) {
        try {
            if (authentication == null || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                        .success(false).message("Authentication required.").build());
            }
            User user = userRepo.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Purchase> purchases = purchaseRepo.findByUserId(user.getId());

            List<String> districtSlugs = purchases.stream()
                    .map(Purchase::getDistrictSlug)
                    .filter(d -> d != null && !d.isBlank())
                    .distinct()
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).data(districtSlugs).build());
        } catch (Exception e) {
            log.error("Error fetching purchased districts: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error fetching purchases.").build());
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
                    productDetails.put("state", product.getState());
                    productDetails.put("district", product.getDistrict());
                    map.put("product", productDetails);
                    
                    // Flatten fields directly for convenience/backward compatibility
                    map.put("title", product.getTitle());
                    map.put("type", product.getType());
                    map.put("price", product.getPrice());
                    map.put("storageKey", product.getStorageKey());
                    map.put("thumbnail", product.getPreviewUrl());
                    map.put("state", product.getState());
                    map.put("district", product.getDistrict());
                } else {
                    // Try checking if it's a course
                    Optional<Courses> courseOpt = courseRepo.findById(purchase.getProductId());
                    if (courseOpt.isPresent()) {
                        Courses course = courseOpt.get();
                        
                        Map<String, Object> productDetails = new HashMap<>();
                        productDetails.put("id", course.getId());
                        productDetails.put("title", course.getCourseTitle());
                        productDetails.put("type", "COURSE");
                        productDetails.put("price", course.getCoursePrice());
                        productDetails.put("storageKey", null);
                        productDetails.put("thumbnail", course.getThumbnailUrl());
                        map.put("product", productDetails);
                        
                        map.put("title", course.getCourseTitle());
                        map.put("type", "COURSE");
                        map.put("price", course.getCoursePrice());
                        map.put("storageKey", null);
                        map.put("thumbnail", course.getThumbnailUrl());
                    }
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
     * POST /api/payment/claim-free/{productId}
     * Claims a free resource. Creates a ₹0 order, invoice, and purchase record.
     */
    @PostMapping("/claim-free/{productId}")
    public ResponseEntity<ApiResponseDTO> claimFreeResource(
            @PathVariable String productId,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated() 
                    || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                        .success(false).message("Authentication required.").build());
            }

            String userEmail = authentication.getName();
            User user = userRepo.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

            Product product = productRepo.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

            if (!product.isFree()) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Only free resources can be claimed via this endpoint.").build());
            }

            // Check if already purchased
            Optional<Purchase> existingPurchase = purchaseRepo.findByUserIdAndProductId(user.getId(), productId);
            if (existingPurchase.isPresent()) {
                return ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true).message("You already own this resource.").build());
            }

            // 1. Add resource to cart programmatically if it doesn't exist (requirement: "Add resource to cart")
            Optional<CartItem> existingCart = cartItemRepo.findByUserIdAndProductId(user.getId(), productId);
            if (existingCart.isEmpty()) {
                CartItem cartItem = new CartItem(user.getId(), productId, "PRODUCT");
                cartItemRepo.save(cartItem);
            }

            // 2. Create order (requirement: "Create order")
            String freeOrderId = "free_ord_" + System.currentTimeMillis();
            String freePaymentId = "free_pay_" + System.currentTimeMillis();
            
            com.bodhganga.bodhganga.entity.Order dbOrder = new com.bodhganga.bodhganga.entity.Order();
            dbOrder.setUserId(user.getId());
            dbOrder.setProductId(productId);
            dbOrder.setAmount(0.0);
            dbOrder.setCurrency("INR");
            dbOrder.setStatus("PAID");
            dbOrder.setOrderType("FREE_RESOURCE");
            dbOrder.setPaymentStatus("COMPLETED");
            dbOrder.setRazorpayOrderId(freeOrderId);
            dbOrder.setRazorpayPaymentId(freePaymentId);
            orderRepo.save(dbOrder);

            // 3. Generate invoice (requirement: "Generate invoice")
            Invoice invoice = new Invoice();
            invoice.setOrderId(dbOrder.getId());
            invoice.setUserId(user.getId());
            invoice.setInvoiceNumber("INV-FREE-" + System.currentTimeMillis());
            invoice.setAmount(0.0);
            invoice.setPdfUrl("free");
            invoiceRepo.save(invoice);

            // 4. Grant ownership (unlockProduct) (requirement: "Grant ownership")
            Purchase purchase = new Purchase();
            purchase.setUserId(user.getId());
            purchase.setProductId(productId);
            purchase.setOrderId(freeOrderId);
            purchase.setPurchaseDate(new java.util.Date());
            purchase.setDownloadCount(0);
            purchase.setAmountPaid(0.0);
            purchaseRepo.save(purchase);

            // 5. Add payment entity tracking
            Payment payment = new Payment();
            payment.setUserId(user.getId());
            payment.setCourseId(null);
            payment.setOrderId(freeOrderId);
            payment.setPaymentId(freePaymentId);
            payment.setAmount(0.0);
            payment.setCurrency("INR");
            payment.setStatus("SUCCESS");
            paymentRepo.save(payment);

            // 6. Clear from user's cart (requirement: "Add resource to user library" - library queries purchases, so we just clear cart)
            cartItemRepo.deleteByUserIdAndProductId(user.getId(), productId);

            // Send confirmation email
            try {
                emailService.sendOrderConfirmation(user.getEmail(), freeOrderId, product.getTitle());
            } catch (Exception ex) {
                log.error("Failed to send order confirmation email for free resource: {}", ex.getMessage());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("orderId", freeOrderId);
            data.put("paymentId", freePaymentId);
            data.put("status", "SUCCESS");

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Free resource claimed successfully.").data(data).build());

        } catch (Exception e) {
            log.error("Error claiming free resource: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error claiming free resource: " + e.getMessage()).build());
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
                
                // First check if there is a course Payment record for this order
                Optional<Payment> paymentOpt = paymentRepo.findByOrderId(orderId);
                if (paymentOpt.isPresent()) {
                    Payment p = paymentOpt.get();
                    if (!"SUCCESS".equals(p.getStatus())) {
                        p.setStatus("SUCCESS");
                        p.setPaymentId(paymentId);
                        paymentRepo.save(p);

                        unlockCourse(p.getUserId(), p.getCourseId(), orderId);

                        // Send confirmation email
                        try {
                            userRepo.findById(p.getUserId()).ifPresent(user -> {
                                String courseTitle = "Course";
                                Optional<Courses> courseOpt = courseRepo.findById(p.getCourseId());
                                if (courseOpt.isPresent()) {
                                    courseTitle = courseOpt.get().getCourseTitle();
                                }
                                try {
                                    emailService.sendOrderConfirmation(user.getEmail(), orderId, courseTitle);
                                } catch (Exception ex) {
                                    log.error("Failed to send course order confirmation email: {}", ex.getMessage());
                                }
                            });
                        } catch (Exception ex) {
                            log.error("Failed to process webhook email sending: {}", ex.getMessage());
                        }
                    }
                } else {
                    // Notes/product payment
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
                                unlockProduct(user.getId(), finalProdId, finalOrderId);
                                
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
        Integer amountPaise,
        String productId,
        String courseId
    ) {}

    public record VerifyPaymentRequest(
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpaySignature,
        String courseId,
        String productId,
        String districtSlug,
        String stateSlug
    ) {}
}
