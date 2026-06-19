package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.repo.ProductRepo;
import com.bodhganga.bodhganga.services.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.List;

@RestController
public class PdfController {

    private static final Logger log = LoggerFactory.getLogger(PdfController.class);
    private final S3Service s3Service;
    private final ProductRepo productRepo;
    private final com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo;
    private final com.bodhganga.bodhganga.repo.UserRepo userRepo;

    // 20MB limit
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024;

    public PdfController(S3Service s3Service, ProductRepo productRepo, 
                         com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo, 
                         com.bodhganga.bodhganga.repo.UserRepo userRepo) {
        this.s3Service = s3Service;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.userRepo = userRepo;
    }

    /**
     * POST /api/admin/upload-pdf
     * Uploads a PDF to S3 and returns the key and a presigned URL.
     * Accessible by admins.
     */
    @PostMapping("/api/admin/upload-pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("File is empty.").build());
        }

        // Validate File Type (PDF only)
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf") ||
                originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            log.warn("Invalid file upload attempt: name={}, contentType={}", originalFilename, contentType);
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Only PDF files are allowed.").build());
        }

        // Validate File Size (Max 20MB)
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File size limit exceeded: size={} bytes", file.getSize());
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("File size exceeds the 20MB limit.").build());
        }

        try {
            String key = s3Service.uploadPdf(file);
            String url = s3Service.generatePresignedUrl(key);

            log.info("Successfully uploaded PDF to S3: key={}", key);

            Map<String, String> response = new HashMap<>();
            response.put("key", key);
            response.put("url", url);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to upload PDF file: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Failed to upload file due to an I/O error.").build());
        } catch (Exception e) {
            log.error("Unexpected error during S3 upload: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("An unexpected error occurred during upload.").build());
        }
    }

    /**
     * GET /api/pdf/{*key}
     * Returns a signed temporary URL for reading/downloading a PDF.
     * Supporting both JSON response and direct browser 302 redirection.
     */
    @GetMapping("/api/pdf/{*key}")
    public ResponseEntity<?> getPdfUrl(
            @PathVariable String key,
            @RequestParam(value = "redirect", defaultValue = "false") boolean redirect,
            org.springframework.security.core.Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated() 
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                    .success(false).message("Authentication required.").build());
        }

        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Key is required.").build());
        }

        // Strip leading slash if present
        if (key.startsWith("/")) {
            key = key.substring(1);
        }

        try {
            boolean isAdmin = authentication.getAuthorities().contains(
                    new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));

            if (!isAdmin) {
                com.bodhganga.bodhganga.entity.User user = userRepo.findByEmailIgnoreCase(authentication.getName().trim())
                        .or(() -> userRepo.findByPhoneNo(authentication.getName().trim()))
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Try to find the product matching this key in DB
                Optional<Product> prodOpt = productRepo.findByS3Key(key);
                if (prodOpt.isEmpty()) {
                    prodOpt = productRepo.findByStorageKey(key);
                }

                if (prodOpt.isPresent()) {
                    Product product = prodOpt.get();
                    boolean isAccessible = product.isFree() || (product.getPrice() != null && product.getPrice() == 0.0);
                    
                    if (!isAccessible) {
                        // Check if user purchased the specific product/course
                        Optional<Purchase> purchaseOpt = purchaseRepo.findByUserIdAndProductId(user.getId(), product.getId());
                        if (purchaseOpt.isPresent()) {
                            isAccessible = true;
                        }
                    }
                    
                    if (!isAccessible && product.getDistrictSlug() != null && !product.getDistrictSlug().isBlank()) {
                        // Check if user purchased the district
                        List<Purchase> userPurchases = purchaseRepo.findByUserId(user.getId());
                        boolean districtPurchased = userPurchases.stream()
                                .anyMatch(p -> product.getDistrictSlug().equals(p.getDistrictSlug()));
                        if (districtPurchased) {
                            isAccessible = true;
                        }
                    }

                    if (!isAccessible) {
                        return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                .success(false).message("You do not own this document. Please claim or purchase it.").build());
                    }
                } else {
                    // Search dynamically matching suffix/substring
                    final String finalKey = key;
                    List<Product> matches = productRepo.findAll().stream()
                            .filter(p -> (p.getS3Key() != null && p.getS3Key().contains(finalKey)) || 
                                         (p.getStorageKey() != null && p.getStorageKey().contains(finalKey)))
                            .collect(java.util.stream.Collectors.toList());
                    if (!matches.isEmpty()) {
                        Product product = matches.get(0);
                        boolean isAccessible = product.isFree() || (product.getPrice() != null && product.getPrice() == 0.0);
                        
                        if (!isAccessible) {
                            Optional<Purchase> purchaseOpt = purchaseRepo.findByUserIdAndProductId(user.getId(), product.getId());
                            if (purchaseOpt.isPresent()) {
                                isAccessible = true;
                            }
                        }
                        
                        if (!isAccessible && product.getDistrictSlug() != null && !product.getDistrictSlug().isBlank()) {
                            List<Purchase> userPurchases = purchaseRepo.findByUserId(user.getId());
                            boolean districtPurchased = userPurchases.stream()
                                    .anyMatch(p -> product.getDistrictSlug().equals(p.getDistrictSlug()));
                            if (districtPurchased) {
                                isAccessible = true;
                            }
                        }

                        if (!isAccessible) {
                            return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                    .success(false).message("You do not own this document. Please claim or purchase it.").build());
                        }
                    } else {
                        return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                .success(false).message("Document not found in catalog or unauthorized.").build());
                    }
                }
            }

            String signedUrl = s3Service.generatePresignedUrl(key);

            if (redirect) {
                return ResponseEntity.status(302)
                        .header("Location", signedUrl)
                        .build();
            }

            Map<String, String> response = new HashMap<>();
            response.put("url", signedUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate presigned URL for key {}: {}", key, e.getMessage());
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false).message("PDF file not found or failed to generate access link.").build());
        }
    }

    /**
     * POST /api/admin/import-pdf-from-drive
     * Automatically downloads a PDF from Google Drive and uploads it to S3.
     * Accessible by admins.
     */
    @PostMapping("/api/admin/import-pdf-from-drive")
    public ResponseEntity<?> importPdfFromDrive(@RequestBody ImportDriveRequest req) {
        if (req == null || req.googleDriveUrl() == null || req.googleDriveUrl().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("googleDriveUrl is required.").build());
        }
        if (req.title() == null || req.title().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("PDF Title is required.").build());
        }
        if (req.category() == null || req.category().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Category is required.").build());
        }

        String driveUrl = req.googleDriveUrl().trim();
        String fileId = extractFileId(driveUrl);
        if (fileId == null) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Invalid Google Drive URL. Supported format: https://drive.google.com/file/d/{id}/view").build());
        }

        String downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            // Set User-Agent to mimic browser download
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(downloadUrl, org.springframework.http.HttpMethod.GET, entity, byte[].class);

            if (response.getStatusCode().value() != 200 || response.getBody() == null) {
                return ResponseEntity.status(400).body(ApiResponseDTO.builder()
                        .success(false).message("Failed to download file from Google Drive. Verify file sharing permissions.").build());
            }

            // Validate content type
            String contentType = response.getHeaders().getFirst("Content-Type");
            if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
                log.warn("Invalid file type from Drive download: {}", contentType);
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Downloaded file is not a valid PDF. Content-Type: " + contentType).build());
            }

            byte[] pdfBytes = response.getBody();
            // Validate size (max 20MB)
            if (pdfBytes.length > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Downloaded PDF file exceeds the 20MB limit.").build());
            }

            // Try to resolve filename from Content-Disposition header
            String contentDisposition = response.getHeaders().getFirst("Content-Disposition");
            String filename = "drive_" + fileId + ".pdf";
            if (contentDisposition != null) {
                int fnIndex = contentDisposition.indexOf("filename=");
                if (fnIndex != -1) {
                    String sub = contentDisposition.substring(fnIndex + 9);
                    if (sub.startsWith("\"")) {
                        filename = sub.substring(1, sub.indexOf("\"", 1));
                    } else {
                        int spaceIndex = sub.indexOf(" ");
                        filename = spaceIndex != -1 ? sub.substring(0, spaceIndex) : sub;
                    }
                }
            }

            String key = s3Service.uploadPdf(pdfBytes, filename);
            String url = s3Service.generatePresignedUrl(key);

            log.info("Successfully uploaded PDF to S3: key={}, size={} bytes", key, pdfBytes.length);

            // Create Product document in MongoDB
            Product product = new Product();
            product.setId(UUID.randomUUID().toString());
            product.setTitle(req.title().trim());
            product.setDescription(req.description() != null ? req.description().trim() : "");
            product.setType("PDF");
            
            boolean isFree = (req.isPaid() == null || !req.isPaid());
            product.setFree(isFree);
            product.setPrice(isFree ? 0.0 : 99.0);
            
            product.setPreviewUrl(url); // Store preview URL or signed URL
            product.setStorageKey(key); // Store S3 Object Key
            product.setPublished(true);
            product.setCreatedAt(new Date());

            // Set new fields
            product.setCategory(req.category().trim());
            product.setCourseId(req.courseId() != null ? req.courseId().trim() : "");
            product.setFileName(filename);
            product.setFileSize((long) pdfBytes.length);
            product.setS3Key(key);
            product.setDriveUrl(driveUrl);
            product.setImportedFromDrive(true);

            // Map category to state and slugs for marketplace filters
            String categoryClean = req.category().trim();
            product.setState(categoryClean);
            product.setStateSlug(Product.generateSlug(categoryClean));
            product.setDistrict("general");
            product.setDistrictSlug("general");

            Product savedProduct = productRepo.save(product);
            log.info("Successfully imported PDF from Google Drive and saved Product: key={}, id={}", key, savedProduct.getId());

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("message", "PDF imported successfully");
            responseData.put("productId", savedProduct.getId());
            responseData.put("s3Key", key);
            responseData.put("fileName", filename);
            responseData.put("fileSize", pdfBytes.length);
            return ResponseEntity.ok(responseData);

        } catch (Exception e) {
            log.error("Google Drive PDF import failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponseDTO.builder()
                    .success(false).message("Google Drive import failed: " + e.getMessage()).build());
        }
    }

    private String extractFileId(String url) {
        try {
            int dIndex = url.indexOf("/d/");
            if (dIndex == -1) return null;
            String remaining = url.substring(dIndex + 3);
            int slashIndex = remaining.indexOf("/");
            if (slashIndex == -1) {
                int questionIndex = remaining.indexOf("?");
                return questionIndex != -1 ? remaining.substring(0, questionIndex) : remaining;
            }
            return remaining.substring(0, slashIndex);
        } catch (Exception e) {
            return null;
        }
    }

    public record ImportDriveRequest(
        String title,
        String description,
        String googleDriveUrl,
        String courseId,
        String category,
        Boolean isPaid,
        Double price
    ) {}
}
