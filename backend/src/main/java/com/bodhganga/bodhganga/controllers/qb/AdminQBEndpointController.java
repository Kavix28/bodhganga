package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
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
@RequestMapping("/api/admin/qb")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminQBEndpointController {

    private final QuestionBankPipelineTask pipelineTask;
    private final QuestionBankDriveService driveService;
    private final QuestionBankProperties props;
    private final QBQuestionRepo questionRepo;
    private final QBAuditRepo auditRepo;

    public AdminQBEndpointController(QuestionBankPipelineTask pipelineTask,
                                      QuestionBankDriveService driveService,
                                      QuestionBankProperties props,
                                      QBQuestionRepo questionRepo,
                                      QBAuditRepo auditRepo) {
        this.pipelineTask = pipelineTask;
        this.driveService = driveService;
        this.props = props;
        this.questionRepo = questionRepo;
        this.auditRepo = auditRepo;
    }

    /**
     * GET /api/admin/qb/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", props.isPipelineEnabled());
        status.put("configured", driveService.isConfigured() && !props.getSourceFolderId().isBlank());
        status.put("authenticated", driveService.isConfigured());
        status.put("credentialsLoaded", driveService.isConfigured());
        status.put("schedulerRunning", props.isPipelineEnabled());
        
        Optional<QBAudit> latestAudit = auditRepo.findTop50ByOrderByTimestampDesc().stream().findFirst();
        status.put("lastRun", latestAudit.map(a -> a.getTimestamp().toString()).orElse("Never"));
        
        status.put("processedFiles", auditRepo.countByStatus("SUCCESS"));
        status.put("failedFiles", auditRepo.countByStatus("FAILED"));
        status.put("sourceFolder", props.getSourceFolderId());
        status.put("archiveFolder", props.getArchiveFolderId());
        
        return ResponseEntity.ok(status);
    }

    /**
     * POST /api/admin/qb/trigger
     */
    @PostMapping("/trigger")
    public ResponseEntity<ApiResponseDTO> triggerPipeline() {
        try {
            pipelineTask.syncQuestionBank(true);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Question Bank pipeline manually triggered and executed successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Pipeline execution failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * POST /api/admin/qb/test-auth
     */
    @PostMapping("/test-auth")
    public ResponseEntity<Map<String, Object>> testAuth() {
        Map<String, Object> result = new LinkedHashMap<>();
        boolean ok = driveService.isConfigured();
        result.put("authenticated", ok);
        result.put("credentialsPath", props.getCredentials());
        result.put("message", ok ? "Google Drive authentication verified successfully." : "Google Drive authentication failed.");
        return ResponseEntity.ok(result);
    }
}
