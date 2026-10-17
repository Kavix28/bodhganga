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
     * PUBLIC DOWNLOAD REMOVAL:
     * In accordance with BodhGanga resource security policy, direct file downloads
     * are disabled across public interfaces. Users must access and view content online.
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponseDTO> getSecureDownloadUrl(
            @PathVariable String productId,
            Authentication authentication) {

        return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                .success(false)
                .message("Direct downloads are disabled. Please access and view study materials online.")
                .build());
    }
}
