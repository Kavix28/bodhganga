package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.services.AdminResourceService;
import com.bodhganga.bodhganga.services.AdminResourceService.ResourceUploadResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/resources")
public class AdminResourceController {

    private static final Logger log = LoggerFactory.getLogger(AdminResourceController.class);

    private final AdminResourceService adminResourceService;

    public AdminResourceController(AdminResourceService adminResourceService) {
        this.adminResourceService = adminResourceService;
    }

    /**
     * Admin Endpoint to List All Active (Non-Archived) Resources for a District
     * Returns both published and unpublished resources so admins can manage their
     * publication status.
     */
    @GetMapping("/state/{stateSlug}/district/{districtSlug}")
    public ResponseEntity<Map<String, Object>> getDistrictResources(
            @PathVariable("stateSlug") String stateSlug,
            @PathVariable("districtSlug") String districtSlug) {
        Map<String, Object> response = new HashMap<>();
        try {
            var products = adminResourceService.getDistrictResources(stateSlug, districtSlug);
            response.put("success", true);
            response.put("data", products);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Admin Resource Upload Endpoint
     * Uploads PDF file, validates state & district against canonical master data,
     * calculates SHA-256 hash, enforces free/paid semantics, uploads to S3, and
     * creates Mongo product record.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadResource(
            @RequestParam("file") MultipartFile file,
            @RequestParam("stateSlug") String stateSlug,
            @RequestParam("districtSlug") String districtSlug,
            @RequestParam("isFree") boolean isFree,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "publish", defaultValue = "true") boolean publish) {
        Map<String, Object> response = new HashMap<>();
        try {
            ResourceUploadResult result = adminResourceService.uploadResource(
                    file, stateSlug, districtSlug, isFree, category, title, description, publish);

            Product p = result.getProduct();
            Map<String, Object> data = new HashMap<>();
            data.put("id", p.getId());
            data.put("title", p.getTitle());
            data.put("description", p.getDescription());
            data.put("state", p.getState());
            data.put("stateSlug", p.getStateSlug());
            data.put("district", p.getDistrict());
            data.put("districtSlug", p.getDistrictSlug());
            data.put("isFree", p.isFree());
            data.put("price", p.getPrice());
            data.put("category", p.getCategory());
            data.put("s3Key", p.getS3Key());
            data.put("s3Url", p.getS3Url());
            data.put("published", p.isPublished());
            data.put("isPublished", p.isPublished());
            data.put("archived", p.isArchived());
            data.put("contentHash", p.getContentHash());
            data.put("fileSize", p.getFileSize());
            data.put("type", p.getType());
            data.put("contentType", p.getContentType());
            data.put("mimeType", p.getMimeType());
            data.put("fileExtension", p.getFileExtension());

            response.put("success", true);
            response.put("isDuplicate", result.isDuplicate());
            response.put("message", result.getMessage());
            response.put("data", data);
            response.put("resource", data);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Admin resource upload validation failed: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (Exception e) {
            log.error("Admin resource upload encountered error: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error");
            response.put("message", "Failed to upload resource due to backend error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Admin Endpoint to Toggle Publication Status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable("id") String id,
            @RequestBody Map<String, Boolean> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean publish = body != null && Boolean.TRUE.equals(body.get("publish"));
            Product updated = adminResourceService.updatePublicationStatus(id, publish);
            response.put("success", true);
            response.put("message", "Publication status updated successfully.");
            response.put("data", Map.of("id", updated.getId(), "published", updated.isPublished()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Admin Endpoint to Soft-Delete / Archive a Resource
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> archiveResource(@PathVariable("id") String id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Product archived = adminResourceService.archiveResource(id);
            response.put("success", true);
            response.put("message", "Resource archived successfully.");
            response.put("data", Map.of("id", archived.getId(), "archived", archived.isArchived()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
