package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.services.S3Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/qb")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminAwsStatusController {

    private final S3Service s3Service;

    @Value("${aws.region:eu-north-1}")
    private String awsRegion;

    public AdminAwsStatusController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    /**
     * GET /api/admin/qb/aws-status
     */
    @GetMapping("/aws-status")
    public ResponseEntity<Map<String, Object>> getAwsStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        String bucket = s3Service.getBucketName();

        boolean authenticated = false;
        boolean bucketExists = false;
        boolean putPermission = false;
        boolean listPermission = false;

        try {
            s3Service.listObjects();
            listPermission = true;
            authenticated = true;
            bucketExists = true;
        } catch (Exception e) {
            // Unauthenticated or permission denied
        }

        try {
            s3Service.objectExists("health-check-probe.txt");
            putPermission = true;
        } catch (Exception e) {
            // Permission denied
        }

        status.put("authenticated", authenticated);
        status.put("bucketExists", bucketExists);
        status.put("region", awsRegion);
        status.put("putPermission", putPermission);
        status.put("listPermission", listPermission);
        status.put("bucket", bucket);

        return ResponseEntity.ok(status);
    }
}
