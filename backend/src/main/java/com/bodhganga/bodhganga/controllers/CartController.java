package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.*;
import com.bodhganga.bodhganga.repo.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Cart API — all endpoints require authentication.
 * Cart is stored per-user in the cart_items MongoDB collection.
 * Guest carts are handled client-side (localStorage); merged on login via POST /api/cart/merge.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private static final Logger log = LoggerFactory.getLogger(CartController.class);

    private final CartItemRepo cartItemRepo;
    private final UserRepo userRepo;
    private final CourseRepo courseRepo;
    private final ProductRepo productRepo;
    private final PurchaseRepo purchaseRepo;
    private final EnrollmentRepo enrollmentRepo;

    public CartController(CartItemRepo cartItemRepo, UserRepo userRepo,
                          CourseRepo courseRepo, ProductRepo productRepo,
                          PurchaseRepo purchaseRepo, EnrollmentRepo enrollmentRepo) {
        this.cartItemRepo = cartItemRepo;
        this.userRepo = userRepo;
        this.courseRepo = courseRepo;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.enrollmentRepo = enrollmentRepo;
    }

    /**
     * GET /api/cart
     * Returns all cart items for the authenticated user with product details.
     */
    @GetMapping
    public ResponseEntity<ApiResponseDTO> getCart(Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) {
                return unauthorized();
            }
            List<CartItem> items = cartItemRepo.findByUserId(user.getId());
            List<Map<String, Object>> enriched = enrichCartItems(items);
            Map<String, Object> result = new HashMap<>();
            result.put("items", enriched);
            result.put("count", enriched.size());
            result.put("subtotal", computeSubtotal(enriched));
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Cart loaded").data(result).build());
        } catch (Exception e) {
            log.error("Error loading cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error loading cart").build());
        }
    }

    /**
     * GET /api/cart/count
     * Returns just the item count (for navbar badge).
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponseDTO> getCartCount(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(0L).build());
            }
            User user = resolveUser(authentication);
            if (user == null) {
                return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(0L).build());
            }
            long count = cartItemRepo.countByUserId(user.getId());
            return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(count).build());
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponseDTO.builder().success(true).data(0L).build());
        }
    }

    /**
     * POST /api/cart/add
     * Body: { "productId": "...", "productType": "COURSE" | "PRODUCT" }
     * Validates item exists, checks not already owned, adds to cart.
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponseDTO> addToCart(
            @RequestBody AddToCartRequest req,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) return unauthorized();

            // Already in cart?
            if (cartItemRepo.findByUserIdAndProductId(user.getId(), req.productId()).isPresent()) {
                return ResponseEntity.ok(ApiResponseDTO.builder()
                        .success(true).message("Item already in cart").build());
            }

            // Already purchased/enrolled?
            if (purchaseRepo.findByUserIdAndProductId(user.getId(), req.productId()).isPresent()
                    || enrollmentRepo.findByUserIdAndCourseId(user.getId(), req.productId()).isPresent()) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("You already own this item").build());
            }

            // Validate product/course exists
            String productType = req.productType() != null ? req.productType().toUpperCase() : "COURSE";
            boolean exists = false;
            if ("COURSE".equals(productType)) {
                exists = courseRepo.findById(req.productId()).isPresent();
            } else {
                exists = productRepo.findById(req.productId()).isPresent();
                productType = "PRODUCT";
            }
            if (!exists) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Item not found").build());
            }

            CartItem item = new CartItem(user.getId(), req.productId(), productType);
            cartItemRepo.save(item);
            long newCount = cartItemRepo.countByUserId(user.getId());

            Map<String, Object> data = new HashMap<>();
            data.put("cartCount", newCount);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Added to cart").data(data).build());
        } catch (Exception e) {
            log.error("Error adding to cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error adding to cart").build());
        }
    }

    /**
     * DELETE /api/cart/remove/{productId}
     * Remove a single item from cart.
     */
    @DeleteMapping("/remove/{productId}")
    @Transactional
    public ResponseEntity<ApiResponseDTO> removeFromCart(
            @PathVariable String productId,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) return unauthorized();
            cartItemRepo.deleteByUserIdAndProductId(user.getId(), productId);
            long newCount = cartItemRepo.countByUserId(user.getId());
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Removed from cart").data(newCount).build());
        } catch (Exception e) {
            log.error("Error removing from cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error removing from cart").build());
        }
    }

    /**
     * DELETE /api/cart/clear
     * Clear all items from user's cart.
     */
    @DeleteMapping("/clear")
    @Transactional
    public ResponseEntity<ApiResponseDTO> clearCart(Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) return unauthorized();
            cartItemRepo.deleteByUserId(user.getId());
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message("Cart cleared").build());
        } catch (Exception e) {
            log.error("Error clearing cart: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Error clearing cart").build());
        }
    }

    /**
     * POST /api/cart/merge
     * Merge guest localStorage cart into user's DB cart on login.
     * Body: { "items": [ { "productId": "...", "productType": "COURSE" } ] }
     */
    @PostMapping("/merge")
    public ResponseEntity<ApiResponseDTO> mergeCart(
            @RequestBody MergeCartRequest req,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) return unauthorized();
            if (req.items() == null || req.items().isEmpty()) {
                return ResponseEntity.ok(ApiResponseDTO.builder().success(true).message("Nothing to merge").build());
            }
            int merged = 0;
            for (AddToCartRequest item : req.items()) {
                if (cartItemRepo.findByUserIdAndProductId(user.getId(), item.productId()).isPresent()) continue;
                if (purchaseRepo.findByUserIdAndProductId(user.getId(), item.productId()).isPresent()) continue;
                cartItemRepo.save(new CartItem(user.getId(), item.productId(),
                        item.productType() != null ? item.productType().toUpperCase() : "COURSE"));
                merged++;
            }
            long newCount = cartItemRepo.countByUserId(user.getId());
            Map<String, Object> data = new HashMap<>();
            data.put("merged", merged);
            data.put("cartCount", newCount);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true).message(merged + " items merged").data(data).build());
        } catch (Exception e) {
            log.error("Cart merge error: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Cart merge failed").build());
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) return null;
        return userRepo.findByEmail(auth.getName()).orElse(null);
    }

    private ResponseEntity<ApiResponseDTO> unauthorized() {
        return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                .success(false).message("Authentication required").build());
    }

    private List<Map<String, Object>> enrichCartItems(List<CartItem> items) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (CartItem item : items) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", item.getId());
            row.put("productId", item.getProductId());
            row.put("productType", item.getProductType());
            row.put("addedAt", item.getAddedAt());

            if ("COURSE".equals(item.getProductType())) {
                courseRepo.findById(item.getProductId()).ifPresent(c -> {
                    row.put("title", c.getCourseTitle());
                    row.put("price", c.getCoursePrice());
                    row.put("thumbnail", c.getThumbnailUrl());
                    row.put("instructor", c.getInstructorName());
                    row.put("category", c.getCourseCategory());
                });
            } else {
                productRepo.findById(item.getProductId()).ifPresent(p -> {
                    row.put("title", p.getTitle());
                    row.put("price", p.getPrice());
                    row.put("thumbnail", p.getPreviewUrl());
                    row.put("type", p.getType());
                });
            }
            result.add(row);
        }
        return result;
    }

    private double computeSubtotal(List<Map<String, Object>> items) {
        return items.stream().mapToDouble(item -> {
            Object price = item.get("price");
            if (price instanceof Number) return ((Number) price).doubleValue();
            return 0.0;
        }).sum();
    }

    // ── Request Records ────────────────────────────────────────────────────────

    public record AddToCartRequest(String productId, String productType) {}
    public record MergeCartRequest(List<AddToCartRequest> items) {}
}
