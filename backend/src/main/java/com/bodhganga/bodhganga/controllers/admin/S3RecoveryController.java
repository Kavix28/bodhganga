package com.bodhganga.bodhganga.controllers.admin;

import com.bodhganga.bodhganga.services.S3RecoveryService;
import com.bodhganga.bodhganga.services.S3RecoveryService.RecoveryResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin S3 Recovery Controller for triggering one-time S3 to MongoDB Product metadata restoration.
 */
@RestController
@RequestMapping("/api/admin/recovery")
public class S3RecoveryController {

    private final S3RecoveryService s3RecoveryService;

    public S3RecoveryController(S3RecoveryService s3RecoveryService) {
        this.s3RecoveryService = s3RecoveryService;
    }

    /**
     * POST /api/admin/recovery/s3-to-products
     * Triggers one-time recovery tool that recreates Product documents from existing S3 bucket objects.
     */
    @PostMapping("/s3-to-products")
    public ResponseEntity<RecoveryResult> recoverS3ToProducts() {
        RecoveryResult result = s3RecoveryService.recoverS3ObjectsToProducts();
        return ResponseEntity.ok(result);
    }
}
