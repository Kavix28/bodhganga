package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/pipeline")
public class PipelineController {

    private static final Logger log = LoggerFactory.getLogger(PipelineController.class);
    private final DriveToS3PipelineTask driveToS3PipelineTask;

    public PipelineController(DriveToS3PipelineTask driveToS3PipelineTask) {
        this.driveToS3PipelineTask = driveToS3PipelineTask;
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
}
