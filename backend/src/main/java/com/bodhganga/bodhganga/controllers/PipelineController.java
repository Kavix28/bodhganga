package com.bodhganga.bodhganga.controllers;
import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.IngestionStatus;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.PipelineTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/api/admin/pipeline")
public class PipelineController {
    private static final Logger log = LoggerFactory.getLogger(PipelineController.class);
    private final DriveToS3PipelineTask driveToS3PipelineTask;
    private final ProductRepo productRepo;
    private final PipelineTask pipelineTask;
    public PipelineController(DriveToS3PipelineTask driveToS3PipelineTask, ProductRepo productRepo, PipelineTask pipelineTask) {
        this.driveToS3PipelineTask = driveToS3PipelineTask;
        this.productRepo = productRepo;
        this.pipelineTask = pipelineTask;
    }
    /**
     * POST /api/admin/pipeline/run
     * Manually triggers the Google Drive to S3 ingestion pipeline.
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponseDTO> runPipeline() {
        log.info("Manual execution of Google Drive to S3 Ingestion Pipeline triggered via API.");
        try {
            // Force the pipeline to run immediately bypass if pipelineEnabled is false in env
            driveToS3PipelineTask.syncDriveToS3(true);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Ingestion pipeline executed successfully")
                    .build());
        } catch (Exception e) {
            log.error("Failed to manually run ingestion pipeline", e);
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to run ingestion pipeline: " + e.getMessage())
                    .build());
        }
    }
    /**
     * GET /api/admin/pipeline/status
     * Returns details of the last/current run.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getPipelineStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("running", driveToS3PipelineTask.isRunning());
        response.put("lastRun", driveToS3PipelineTask.getLastRun());
        response.put("filesProcessed", driveToS3PipelineTask.getFilesProcessed());
        response.put("filesUploaded", driveToS3PipelineTask.getFilesUploaded());
        response.put("filesFailed", driveToS3PipelineTask.getFilesFailed());
        response.put("filesSkipped", driveToS3PipelineTask.getFilesSkipped());
        return ResponseEntity.ok(response);
    }
    /**
     * GET /api/admin/pipeline/stats
     * Returns cumulative catalog metrics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPipelineStats() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalImported", productRepo.countByImportedFromDriveTrue());
        response.put("totalPublished", productRepo.countByIsPublishedTrue());
        response.put("totalFailed", productRepo.countByIngestionStatus(IngestionStatus.FAILED));
        response.put("totalArchived", productRepo.countByArchivedTrue());
        return ResponseEntity.ok(response);
    }
}
