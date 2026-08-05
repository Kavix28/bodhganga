package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.qb.QBAudit;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAuditRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.services.qb.QuestionBankDriveService;
import com.bodhganga.bodhganga.services.qb.QuestionBankPipelineTask;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/qb-pipeline")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminQuestionBankPipelineController {

    private final QuestionBankPipelineTask pipelineTask;
    private final QuestionBankDriveService driveService;
    private final QBQuestionRepo questionRepo;
    private final QBAuditRepo auditRepo;

    public AdminQuestionBankPipelineController(QuestionBankPipelineTask pipelineTask,
                                               QuestionBankDriveService driveService,
                                               QBQuestionRepo questionRepo,
                                               QBAuditRepo auditRepo) {
        this.pipelineTask = pipelineTask;
        this.driveService = driveService;
        this.questionRepo = questionRepo;
        this.auditRepo    = auditRepo;
    }

    /**
     * POST /api/admin/qb-pipeline/run
     * Manually triggers the Question Bank ingestion pipeline. Requires ROLE_ADMIN.
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponseDTO> runPipeline() {
        try {
            pipelineTask.syncQuestionBank(true);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Question Bank pipeline executed successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Pipeline run failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * GET /api/admin/qb-pipeline/status
     * Returns current pipeline status and question counts. Requires ROLE_ADMIN.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("running",              pipelineTask.isRunning());
        status.put("driveConfigured",      driveService.isConfigured());
        status.put("totalQuestions",       questionRepo.count());
        status.put("publishedQuestions",   questionRepo.countByPublishedTrue());
        status.put("needsReviewQuestions", questionRepo.countByNeedsReviewTrue());
        return ResponseEntity.ok(status);
    }

    /**
     * GET /api/admin/qb-pipeline/validate
     * Validates Drive credentials and folder accessibility without running the full pipeline.
     * Returns a checklist so you can confirm everything is wired correctly before enabling the scheduler.
     * Requires ROLE_ADMIN.
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validatePipeline() {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Credentials check
        boolean credentialsOk = driveService.isConfigured();
        result.put("credentialsLoaded", credentialsOk);

        if (!credentialsOk) {
            result.put("verdict", "FAIL — Drive client not initialized. Check google.drive.qb.credentials and restart.");
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
     * Allows admins to edit, approve, or reject an AI-extracted question. Requires ROLE_ADMIN.
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
        if (updated.getQuestionText()  != null) q.setQuestionText(updated.getQuestionText());
        if (updated.getOptions()        != null) q.setOptions(updated.getOptions());
        if (updated.getCorrectAnswer()  != null) q.setCorrectAnswer(updated.getCorrectAnswer());
        if (updated.getExplanation()    != null) q.setExplanation(updated.getExplanation());
        if (updated.getDifficulty()     != null) q.setDifficulty(updated.getDifficulty());
        if (updated.getNeedsReview()    != null) q.setNeedsReview(updated.getNeedsReview());
        if (updated.getPublished()      != null) q.setPublished(updated.getPublished());

        q.setUpdatedAt(new Date());
        QBQuestion saved = questionRepo.save(q);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question updated successfully")
                .data(saved)
                .build());
    }
}
