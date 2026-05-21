package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.services.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/downloads")
public class DownloadController {

    private final S3Service s3Service;
    private final PurchaseRepo purchaseRepo;
    private final ProductRepo productRepo;
    private final UserRepo userRepo;

    public DownloadController(S3Service s3Service, PurchaseRepo purchaseRepo, ProductRepo productRepo, UserRepo userRepo) {
        this.s3Service = s3Service;
        this.purchaseRepo = purchaseRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    /**
     * Securely request a temporary download link for a product
     * Requires JWT authentication (User must be logged in)
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponseDTO> getSecureDownloadUrl(
            @PathVariable String productId,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authentication required.")
                    .build());
        }

        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepo.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Authenticated user profile not found.")
                    .build());
        }

        String userId = userOpt.get().getId();

        // 1. Verify Purchase
        Optional<Purchase> purchaseOpt = purchaseRepo.findByUserIdAndProductId(userId, productId);
        if (purchaseOpt.isEmpty()) {
            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Access Denied. You have not purchased this content.")
                    .build());
        }

        // 2. Fetch Product
        Optional<Product> prodOpt = productRepo.findById(productId);
        if (prodOpt.isEmpty() || prodOpt.get().getStorageKey() == null) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Digital content file not found.")
                    .build());
        }

        // 3. Increment download count
        Purchase purchase = purchaseOpt.get();
        purchase.setDownloadCount(purchase.getDownloadCount() + 1);
        purchaseRepo.save(purchase);

        // 4. Generate short-lived signed URL (valid for 15 minutes)
        String signedUrl = s3Service.generatePresignedUrl(prodOpt.get().getStorageKey(), 15);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Download URL generated successfully")
                .data(signedUrl)
                .build());
    }
}
