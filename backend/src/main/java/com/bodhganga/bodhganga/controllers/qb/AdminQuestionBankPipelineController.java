package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.qb.QBAudit;
import com.bodhganga.bodhganga.entity.qb.QBImportBatch;
import com.bodhganga.bodhganga.entity.qb.QBImportItem;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAuditRepo;
import com.bodhganga.bodhganga.repo.qb.QBImportBatchRepo;
import com.bodhganga.bodhganga.repo.qb.QBImportItemRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.services.qb.QuestionBankDriveService;
import com.bodhganga.bodhganga.services.qb.QuestionBankPipelineTask;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/qb-pipeline")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000", "https://bodhganga.in",
        "https://www.bodhganga.in" })
public class AdminQuestionBankPipelineController {

    private final QuestionBankPipelineTask pipelineTask;
    private final QuestionBankDriveService driveService;
    private final QBQuestionRepo questionRepo;
    private final QBImportBatchRepo batchRepo;
    private final QBImportItemRepo importItemRepo;
    private final QBAuditRepo auditRepo;

    public AdminQuestionBankPipelineController(QuestionBankPipelineTask pipelineTask,
            QuestionBankDriveService driveService,
            QBQuestionRepo questionRepo,
            QBImportBatchRepo batchRepo,
            QBImportItemRepo importItemRepo,
            QBAuditRepo auditRepo) {
        this.pipelineTask = pipelineTask;
        this.driveService = driveService;
        this.questionRepo = questionRepo;
        this.batchRepo = batchRepo;
        this.importItemRepo = importItemRepo;
        this.auditRepo = auditRepo;
    }

    /**
     * POST /api/admin/qb-pipeline/run
     * Manually triggers the Question Bank ingestion pipeline. Requires ROLE_ADMIN.
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponseDTO> runPipeline() {
        try {
            QuestionBankPipelineTask.PipelineRunResult result = pipelineTask.syncQuestionBank(true);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(!"FAILED".equalsIgnoreCase(result.getStatus()))
                    .message(result.getMessage())
                    .data(result)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Pipeline run failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * POST /api/admin/qb-pipeline/run/{importBatchId}
     * Executes single specified import batch manually. Requires ROLE_ADMIN.
     */
    @PostMapping({ "/run/{importBatchId}", "/run-batch/{importBatchId}" })
    public ResponseEntity<ApiResponseDTO> runSingleBatch(
            @PathVariable String importBatchId,
            @RequestParam(defaultValue = "false") boolean force) {
        try {
            QBImportBatch batch = pipelineTask.processSingleBatch(importBatchId, force);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(!"FAILED".equalsIgnoreCase(batch.getStatus()))
                    .message("Single batch execution completed with status: " + batch.getStatus())
                    .data(batch)
                    .build());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Single batch execution failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * GET /api/admin/qb-pipeline/status
     * Returns current pipeline status, batch counts, and question counts. Requires
     * ROLE_ADMIN.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("running", pipelineTask.isRunning());
        status.put("driveConfigured", driveService.isConfigured());
        status.put("totalQuestions", questionRepo.count());
        status.put("publishedQuestions", questionRepo.countByPublishedTrue());
        status.put("needsReviewQuestions", questionRepo.countByNeedsReviewTrue());

        List<QBImportBatch> allBatches = batchRepo.findAll();
        long completedBatches = allBatches.stream().filter(
                b -> "COMPLETED".equalsIgnoreCase(b.getStatus()) || "PARTIAL_SUCCESS".equalsIgnoreCase(b.getStatus()))
                .count();
        long failedBatches = allBatches.stream().filter(b -> "FAILED".equalsIgnoreCase(b.getStatus())).count();
        long ambiguousBatches = allBatches.stream().filter(b -> "AMBIGUOUS".equalsIgnoreCase(b.getStatus())).count();
        long activeBatches = allBatches.stream().filter(b -> List
                .of("DISCOVERED", "DOWNLOADING", "PARSING", "MATCHING", "VALIDATING", "PERSISTING", "GENERATING_TESTS")
                .contains(b.getStatus())).count();

        status.put("totalBatches", allBatches.size());
        status.put("completedBatches", completedBatches);
        status.put("failedBatches", failedBatches);
        status.put("ambiguousBatches", ambiguousBatches);
        status.put("activeBatches", activeBatches);

        return ResponseEntity.ok(status);
    }

    /**
     * GET /api/admin/qb-pipeline/batches
     * Returns the 50 most recent QBImportBatch records. Requires ROLE_ADMIN.
     */
    @GetMapping("/batches")
    public ResponseEntity<List<QBImportBatch>> getBatches() {
        return ResponseEntity.ok(batchRepo.findTop50ByOrderByCreatedAtDesc());
    }

    /**
     * GET /api/admin/qb-pipeline/batches/{batchId}/items
     * Returns all QBImportItem records for a specific import batch. Requires
     * ROLE_ADMIN.
     */
    @GetMapping("/batches/{batchId}/items")
    public ResponseEntity<List<QBImportItem>> getBatchItems(@PathVariable String batchId) {
        return ResponseEntity.ok(importItemRepo.findByImportBatchId(batchId));
    }

    /**
     * POST /api/admin/qb-pipeline/batches/recover
     * Triggers stale batch recovery scan manually. Requires ROLE_ADMIN.
     */
    @PostMapping("/batches/recover")
    public ResponseEntity<ApiResponseDTO> recoverStaleBatches() {
        try {
            pipelineTask.recoverStaleBatches();
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Stale batch recovery completed successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Stale batch recovery failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * GET /api/admin/qb-pipeline/validate
     * Validates Drive credentials and folder accessibility. Requires ROLE_ADMIN.
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validatePipeline() {
        Map<String, Object> result = new LinkedHashMap<>();
        boolean credentialsOk = driveService.isConfigured();
        result.put("credentialsLoaded", credentialsOk);
        if (!credentialsOk) {
            result.put("verdict", "FAIL — Drive client not initialized. Check google.drive.qb.credentials.");
            return ResponseEntity.ok(result);
        }
        result.put("verdict", "PASS — Drive client initialized successfully. Run /run to start the pipeline.");
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/qb-pipeline/audits
     * Returns the 50 most recent pipeline audit records. Requires ROLE_ADMIN.
     */
    @GetMapping("/audits")
    public ResponseEntity<List<QBAudit>> getAudits() {
        return ResponseEntity.ok(auditRepo.findTop50ByOrderByTimestampDesc());
    }

    /**
     * GET /api/admin/qb-pipeline/review-queue
     * Returns all questions flagged for admin review. Requires ROLE_ADMIN.
     */
    @GetMapping("/review-queue")
    public ResponseEntity<List<QBQuestion>> getReviewQueue() {
        return ResponseEntity.ok(questionRepo.findByNeedsReviewTrue());
    }

    /**
     * PUT /api/admin/qb-pipeline/questions/{id}
     * Allows admins to edit, approve, or reject an AI-extracted question. Requires
     * ROLE_ADMIN.
     */
    @PutMapping("/questions/{id}")
    public ResponseEntity<ApiResponseDTO> updateQuestion(@PathVariable String id, @RequestBody QBQuestion updated) {
        Optional<QBQuestion> opt = questionRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Question not found")
                    .build());
        }

        QBQuestion q = opt.get();
        if (updated.getQuestionText() != null)
            q.setQuestionText(updated.getQuestionText());
        if (updated.getOptions() != null)
            q.setOptions(updated.getOptions());
        if (updated.getCorrectAnswer() != null)
            q.setCorrectAnswer(updated.getCorrectAnswer());
        if (updated.getExplanation() != null)
            q.setExplanation(updated.getExplanation());
        if (updated.getDifficulty() != null)
            q.setDifficulty(updated.getDifficulty());
        if (updated.getNeedsReview() != null)
            q.setNeedsReview(updated.getNeedsReview());
        if (updated.getPublished() != null)
            q.setPublished(updated.getPublished());

        q.setUpdatedAt(new Date());
        QBQuestion saved = questionRepo.save(q);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question updated successfully")
                .data(saved)
                .build());
    }
}
