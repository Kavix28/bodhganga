package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.ProductionVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(PipelineController.class);

    private final DriveToS3PipelineTask driveToS3PipelineTask;
    private final ProductRepo productRepo;
    private final ProductionVerificationService productionVerificationService;

    public PipelineController(DriveToS3PipelineTask driveToS3PipelineTask,
                               ProductRepo productRepo,
                               ProductionVerificationService productionVerificationService) {
        this.driveToS3PipelineTask = driveToS3PipelineTask;
        this.productRepo = productRepo;
        this.productionVerificationService = productionVerificationService;
    }

    // =========================================================================
    // POST /api/admin/pipeline/run
    // Manually triggers the ingestion pipeline (bypasses pipelineEnabled flag).
    // =========================================================================
    @PostMapping("/run")
    public ResponseEntity<ApiResponseDTO> runPipeline() {
        log.info("[PIPELINE] Manual run triggered via admin API.");
        try {
            driveToS3PipelineTask.syncDriveToS3(true);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Ingestion pipeline executed successfully")
                    .build());
        } catch (Exception e) {
            log.error("[PIPELINE] Manual run failed", e);
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Pipeline failed: " + e.getMessage())
                    .build());
        }
    }

    // =========================================================================
    // GET /api/admin/pipeline/status — current run state
    // =========================================================================
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPipelineStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("activePipeline", "DriveToS3PipelineTask");
        response.put("legacyPipelineDisabled", true);
        response.put("running", driveToS3PipelineTask.isRunning());
        response.put("lastRun", driveToS3PipelineTask.getLastRun());
        response.put("filesProcessed", driveToS3PipelineTask.getFilesProcessed());
        response.put("filesUploaded", driveToS3PipelineTask.getFilesUploaded());
        response.put("filesFailed", driveToS3PipelineTask.getFilesFailed());
        response.put("filesSkipped", driveToS3PipelineTask.getFilesSkipped());
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
    // GET /api/admin/pipeline/audit (mapped to summary to fit old frontend if needed)
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
    // POST /api/admin/pipeline/reconcile/{stateSlug}/{districtSlug} — district reconciliation
    // =========================================================================
    @PostMapping("/reconcile/{stateSlug}/{districtSlug}")
    public ResponseEntity<Map<String, Object>> reconcileDistrict(@PathVariable String stateSlug, @PathVariable String districtSlug) {
        return ResponseEntity.ok(productionVerificationService.reconcileDistrict(stateSlug, districtSlug));
    }
}
