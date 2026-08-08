package com.bodhganga.bodhganga.controllers.admin;

import com.bodhganga.bodhganga.config.QuestionBankProperties;
import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.services.DriveToS3PipelineTask;
import com.bodhganga.bodhganga.services.GoogleDriveSyncService;
import com.bodhganga.bodhganga.services.S3Service;
import com.bodhganga.bodhganga.services.qb.QuestionBankDriveService;
import com.bodhganga.bodhganga.services.qb.QuestionBankPipelineTask;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Unified Admin Health & Diagnostics Controller.
 * Provides system-wide sub-system health endpoints as required by platform specifications.
 */
@RestController
@RequestMapping("/api/admin/system")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminSystemHealthController {

    private final MongoTemplate mongoTemplate;
    private final S3Service s3Service;
    private final GoogleDriveSyncService genericDriveService;
    private final QuestionBankDriveService qbDriveService;
    private final QuestionBankProperties qbProps;
    private final DriveToS3PipelineTask stateTask;
    private final QuestionBankPipelineTask qbTask;

    @Value("${aws.region:eu-north-1}")
    private String awsRegion;

    @Value("${google.drive.source-folder-id:}")
    private String stateSourceFolderId;

    public AdminSystemHealthController(MongoTemplate mongoTemplate,
                                       S3Service s3Service,
                                       GoogleDriveSyncService genericDriveService,
                                       QuestionBankDriveService qbDriveService,
                                       QuestionBankProperties qbProps,
                                       DriveToS3PipelineTask stateTask,
                                       QuestionBankPipelineTask qbTask) {
        this.mongoTemplate = mongoTemplate;
        this.s3Service = s3Service;
        this.genericDriveService = genericDriveService;
        this.qbDriveService = qbDriveService;
        this.qbProps = qbProps;
        this.stateTask = stateTask;
        this.qbTask = qbTask;
    }

    /** GET /api/admin/system/health */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> h = new LinkedHashMap<>();
        h.put("status", "UP");
        h.put("mongoConnected", isMongoConnected());
        h.put("genericDriveConfigured", genericDriveService.isConfigured());
        h.put("qbDriveConfigured", qbDriveService.isConfigured());
        h.put("qbPipelineEnabled", qbProps.isPipelineEnabled());
        return ResponseEntity.ok(h);
    }

    /** GET /api/admin/system/config */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getSystemConfig() {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("awsRegion", awsRegion);
        c.put("s3Bucket", s3Service.getBucketName());
        c.put("stateSourceFolder", stateSourceFolderId);
        c.put("qbSourceFolder", qbProps.getSourceFolderId());
        c.put("qbArchiveFolder", qbProps.getArchiveFolderId());
        c.put("qbPipelineEnabled", qbProps.isPipelineEnabled());
        return ResponseEntity.ok(c);
    }

    /** GET /api/admin/system/storage */
    @GetMapping("/storage")
    public ResponseEntity<Map<String, Object>> getStorageInfo() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("bucketName", s3Service.getBucketName());
        s.put("region", awsRegion);
        return ResponseEntity.ok(s);
    }

    /** GET /api/admin/system/pipelines */
    @GetMapping("/pipelines")
    public ResponseEntity<Map<String, Object>> getPipelinesStatus() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("stateNotesPipelineRunning", stateTask.isRunning());
        p.put("qbPipelineRunning", qbTask.isRunning());
        p.put("qbPipelineEnabled", qbProps.isPipelineEnabled());
        return ResponseEntity.ok(p);
    }

    /** GET /api/admin/system/aws */
    @GetMapping("/aws")
    public ResponseEntity<Map<String, Object>> getAwsHealth() {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("bucket", s3Service.getBucketName());
        a.put("region", awsRegion);
        boolean reachable = false;
        try {
            s3Service.objectExists("health-probe.txt");
            reachable = true;
        } catch (Exception e) {}
        a.put("reachable", reachable);
        return ResponseEntity.ok(a);
    }

    /** GET /api/admin/system/google-drive */
    @GetMapping("/google-drive")
    public ResponseEntity<Map<String, Object>> getDriveHealth() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("genericDriveConfigured", genericDriveService.isConfigured());
        d.put("qbDriveConfigured", qbDriveService.isConfigured());
        return ResponseEntity.ok(d);
    }

    /** GET /api/admin/system/mongo */
    @GetMapping("/mongo")
    public ResponseEntity<Map<String, Object>> getMongoHealth() {
        Map<String, Object> m = new LinkedHashMap<>();
        boolean ok = isMongoConnected();
        m.put("connected", ok);
        m.put("database", mongoTemplate.getDb().getName());
        return ResponseEntity.ok(m);
    }

    /** POST /api/admin/system/state-sync */
    @PostMapping("/state-sync")
    public ResponseEntity<ApiResponseDTO> triggerStateSync() {
        try {
            stateTask.syncDriveToS3(true);
            return ResponseEntity.ok(ApiResponseDTO.builder().success(true).message("State Notes pipeline triggered successfully.").build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder().success(false).message("Trigger failed: " + e.getMessage()).build());
        }
    }

    /** POST /api/admin/system/qb-sync */
    @PostMapping("/qb-sync")
    public ResponseEntity<ApiResponseDTO> triggerQbSync() {
        try {
            qbTask.syncQuestionBank(true);
            return ResponseEntity.ok(ApiResponseDTO.builder().success(true).message("Question Bank pipeline triggered successfully.").build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder().success(false).message("Trigger failed: " + e.getMessage()).build());
        }
    }

    private boolean isMongoConnected() {
        try {
            mongoTemplate.executeCommand("{ping: 1}");
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
