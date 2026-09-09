package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.ProductionVerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin API for the Bodhganga ingestion pipeline.
 * Single pipeline: DriveToS3PipelineTask (legacy PipelineTask is disabled).
 */
@RestController
@RequestMapping("/api/admin/pipeline")
public class PipelineController {

    private final ProductRepo productRepo;
    private final ProductionVerificationService productionVerificationService;

    public PipelineController(ProductRepo productRepo,
            ProductionVerificationService productionVerificationService) {
        this.productRepo = productRepo;
        this.productionVerificationService = productionVerificationService;
    }

    // =========================================================================
    // GET /api/admin/pipeline/status — current pipeline retirement status
    // =========================================================================
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPipelineStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("activePipeline", "NONE");
        response.put("drivePipelineRetired", true);
        response.put("message",
                "Google Drive ingestion pipeline has been permanently retired. Use Admin State Resources for resource publishing.");
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // GET /api/admin/pipeline/stats — cumulative catalog metrics
    // =========================================================================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPipelineStats() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalImported", productRepo.countByImportedFromDriveTrue());
        response.put("totalPublished", productRepo.countByIsPublishedTrue());
        response.put("totalFailed", productRepo.countByIngestionStatus(IngestionStatus.FAILED));
        response.put("totalArchived", productRepo.countByArchivedTrue());
        response.put("totalUnpublishedImported",
                productRepo.findByIsPublishedFalseAndImportedFromDriveTrue().size());
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // GET /api/admin/pipeline/audit (mapped to summary to fit old frontend if
    // needed)
    // =========================================================================
    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> getPipelineAudit() {
        return ResponseEntity.ok(productionVerificationService.getSummary());
    }

    // =========================================================================
    // GET /api/admin/pipeline/districts — per-district live audit records
    // =========================================================================
    @GetMapping("/districts")
    public ResponseEntity<List<Map<String, Object>>> getDistrictAudits() {
        return ResponseEntity.ok(productionVerificationService.getDistricts());
    }

    // =========================================================================
    // GET /api/admin/pipeline/missing — missing files leaks
    // =========================================================================
    @GetMapping("/missing")
    public ResponseEntity<Map<String, Object>> getMissingDistricts() {
        return ResponseEntity.ok(productionVerificationService.getLeaks());
    }

    // =========================================================================
    // GET /api/admin/pipeline/leaks — explicit leaks report
    // =========================================================================
    @GetMapping("/leaks")
    public ResponseEntity<Map<String, Object>> getLeaks() {
        return ResponseEntity.ok(productionVerificationService.getLeaks());
    }

    // =========================================================================
    // GET /api/admin/pipeline/coverage — global coverage % and production readiness
    // =========================================================================
    @GetMapping("/coverage")
    public ResponseEntity<Map<String, Object>> getCoverage() {
        return ResponseEntity.ok(productionVerificationService.getCoverage());
    }

    // =========================================================================
    // GET /api/admin/pipeline/summary — final production verification summary
    // =========================================================================
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(productionVerificationService.getSummary());
    }

    // =========================================================================
    // POST /api/admin/pipeline/reconcile — global active reconciliation
    // =========================================================================
    @PostMapping("/reconcile")
    public ResponseEntity<Map<String, Object>> reconcileAll() {
        return ResponseEntity.ok(productionVerificationService.reconcileAll());
    }

    // =========================================================================
    // POST /api/admin/pipeline/reconcile/{stateSlug}/{districtSlug} — district
    // reconciliation
    // =========================================================================
    @PostMapping("/reconcile/{stateSlug}/{districtSlug}")
    public ResponseEntity<Map<String, Object>> reconcileDistrict(@PathVariable String stateSlug,
            @PathVariable String districtSlug) {
        return ResponseEntity.ok(productionVerificationService.reconcileDistrict(stateSlug, districtSlug));
    }
}
