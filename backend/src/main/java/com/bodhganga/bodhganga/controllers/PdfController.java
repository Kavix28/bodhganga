package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

@RestController
public class PdfController {

    private static final Logger log = LoggerFactory.getLogger(PdfController.class);
    private final S3Service s3Service;
    private final ProductRepo productRepo;
    private final com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo;
    private final com.bodhganga.bodhganga.repo.UserRepo userRepo;

    // 20MB limit
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024;

    public PdfController(S3Service s3Service, ProductRepo productRepo,
            com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo,
            com.bodhganga.bodhganga.repo.UserRepo userRepo) {
        this.s3Service = s3Service;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.userRepo = userRepo;
    }

    /**
     * POST /api/admin/upload-pdf
     * Uploads a PDF to S3 and returns the key and a presigned URL.
     * Accessible by admins.
     */
    @PostMapping("/api/admin/upload-pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("File is empty.").build());
        }

        // Validate File Type (PDF only)
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf") ||
                originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            log.warn("Invalid file upload attempt: name={}, contentType={}", originalFilename, contentType);
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Only PDF files are allowed.").build());
        }

        // Validate File Size (Max 20MB)
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File size limit exceeded: size={} bytes", file.getSize());
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("File size exceeds the 20MB limit.").build());
        }

        try {
            String key = s3Service.uploadPdf(file);
            String url = s3Service.generatePresignedUrl(key);

            log.info("Successfully uploaded PDF to S3: key={}", key);

            Map<String, String> response = new HashMap<>();
            response.put("key", key);
            response.put("url", url);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to upload PDF file: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Failed to upload file due to an I/O error.").build());
        } catch (Exception e) {
            log.error("Unexpected error during S3 upload: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("An unexpected error occurred during upload.").build());
        }
    }

    /**
     * GET /api/pdf/{*key}
     * Returns a signed temporary URL for reading/downloading a PDF.
     * Supporting both JSON response and direct browser 302 redirection.
     */
    @GetMapping("/api/pdf/{*key}")
    public ResponseEntity<?> getPdfUrl(
            @PathVariable String key,
            @RequestParam(value = "redirect", defaultValue = "false") boolean redirect,
            org.springframework.security.core.Authentication authentication) {

        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Key is required.").build());
        }

        // Strip leading slash if present
        if (key.startsWith("/")) {
            key = key.substring(1);
        }

        try {
            boolean isAuthenticated = authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName());

            boolean isAdmin = isAuthenticated && authentication.getAuthorities().contains(
                    new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));

            if (!isAdmin) {
                // Try to find the product matching this key in DB
                Optional<Product> prodOpt = productRepo.findByS3Key(key);
                if (prodOpt.isEmpty()) {
                    prodOpt = productRepo.findByStorageKey(key);
                }
                if (prodOpt.isEmpty()) {
                    // Search dynamically matching suffix/substring
                    final String finalKey = key;
                    List<Product> matches = productRepo.findAll().stream()
                            .filter(p -> (p.getS3Key() != null && p.getS3Key().contains(finalKey)) ||
                                    (p.getStorageKey() != null && p.getStorageKey().contains(finalKey)))
                            .collect(java.util.stream.Collectors.toList());
                    if (!matches.isEmpty()) {
                        prodOpt = Optional.of(matches.get(0));
                    }
                }

                if (prodOpt.isPresent()) {
                    Product product = prodOpt.get();
                    boolean isFree = product.isFree()
                            || (product.getPrice() != null && product.getPrice() == 0.0);

                    if (!isFree) {
                        // PAID resource: MUST require authentication
                        if (!isAuthenticated) {
                            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                    .success(false).message("Authentication required.").build());
                        }

                        com.bodhganga.bodhganga.entity.User user = userRepo
                                .findByEmailIgnoreCase(authentication.getName().trim())
                                .or(() -> userRepo.findByPhoneNo(authentication.getName().trim()))
                                .orElse(null);

                        if (user == null) {
                            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                    .success(false).message("User not found.").build());
                        }

                        boolean isAccessible = false;

                        // Check if user purchased the specific product/course
                        Optional<Purchase> purchaseOpt = purchaseRepo.findByUserIdAndProductId(user.getId(),
                                product.getId());
                        if (purchaseOpt.isPresent()) {
                            isAccessible = true;
                        }

                        if (!isAccessible && product.getDistrictSlug() != null
                                && !product.getDistrictSlug().isBlank()) {
                            // Check if user purchased the district in the matching state
                            List<Purchase> userPurchases = purchaseRepo.findByUserId(user.getId());
                            boolean districtPurchased = userPurchases.stream()
                                    .anyMatch(p -> isDistrictPurchasedForProduct(product, p));
                            if (districtPurchased) {
                                isAccessible = true;
                            }
                        }

                        if (!isAccessible) {
                            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                    .success(false)
                                    .message("You do not own this document. Please claim or purchase it.")
                                    .build());
                        }
                    }
                } else {
                    // Document not found in catalog. If unauthenticated, return 401; otherwise 403
                    if (!isAuthenticated) {
                        return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                .success(false).message("Authentication required.").build());
                    }
                    return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                            .success(false).message("Document not found in catalog or unauthorized.").build());
                }
            }

            String signedUrl = s3Service.generatePresignedUrl(key);

            if (redirect) {
                return ResponseEntity.status(302)
                        .header("Location", signedUrl)
                        .build();
            }

            Map<String, String> response = new HashMap<>();
            response.put("url", signedUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate presigned URL for key {}: {}", key, e.getMessage());
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false).message("PDF file not found or failed to generate access link.").build());
        }
    }

    /**
     * Verifies that user's purchase matches BOTH districtSlug and stateSlug of
     * product.
     * Fails closed if product has stateSlug but purchase lacks stateSlug or
     * stateSlug differs.
     */
    private boolean isDistrictPurchasedForProduct(Product product, Purchase purchase) {
        if (product == null || purchase == null)
            return false;
        String pDist = product.getDistrictSlug();
        String purDist = purchase.getDistrictSlug();
        if (pDist == null || pDist.isBlank() || purDist == null || purDist.isBlank())
            return false;
        if (!pDist.equals(purDist))
            return false;

        String pState = product.getStateSlug();
        String purState = purchase.getStateSlug();

        // If product is associated with a state, purchase MUST match that state.
        if (pState != null && !pState.isBlank()) {
            if (purState == null || purState.isBlank())
                return false; // Fail closed if purchase state is missing
            return pState.equals(purState);
        }
        return true;
    }
}
