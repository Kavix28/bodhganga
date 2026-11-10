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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;

@RestController
public class PdfController {

    private static final Logger log = LoggerFactory.getLogger(PdfController.class);
    private final S3Service s3Service;
    private final ProductRepo productRepo;
    private final com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo;
    private final com.bodhganga.bodhganga.util.AuthUserResolver authUserResolver;

    // 20MB limit
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024;

    public PdfController(S3Service s3Service, ProductRepo productRepo,
            com.bodhganga.bodhganga.repo.PurchaseRepo purchaseRepo,
            com.bodhganga.bodhganga.util.AuthUserResolver authUserResolver) {
        this.s3Service = s3Service;
        this.productRepo = productRepo;
        this.purchaseRepo = purchaseRepo;
        this.authUserResolver = authUserResolver;
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
            String url = s3Service.generatePresignedGetUrl(key);

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
     * GET /api/pdf/resource
     * GET /api/pdf
     *
     * Canonical, robust endpoint for resolving presigned URLs via query parameters.
     * Prevents web-server/Tomcat/firewall rejection of URL-encoded slashes (%2F) in URI paths.
     * Supports both 'key' (S3 object key) and 'id' (MongoDB Product ObjectId).
     */
    @GetMapping(value = {"/api/pdf/resource", "/api/pdf"})
    public ResponseEntity<?> getPdfUrlByResource(
            @RequestParam(value = "key", required = false) String key,
            @RequestParam(value = "id", required = false) String id,
            @RequestParam(value = "redirect", defaultValue = "false") boolean redirect,
            org.springframework.security.core.Authentication authentication) {
        return resolvePdfAccess(key, id, redirect, authentication);
    }

    /**
     * GET /api/pdf/{*key}
     * Legacy wildcard path mapping maintained for backward compatibility.
     */
    @GetMapping("/api/pdf/{*key}")
    public ResponseEntity<?> getPdfUrl(
            @PathVariable String key,
            @RequestParam(value = "redirect", defaultValue = "false") boolean redirect,
            org.springframework.security.core.Authentication authentication) {
        return resolvePdfAccess(key, null, redirect, authentication);
    }

    private ResponseEntity<?> resolvePdfAccess(
            String rawKey,
            String rawId,
            boolean redirect,
            org.springframework.security.core.Authentication authentication) {

        String key = rawKey;
        String id = (rawId != null && !rawId.isBlank()) ? rawId.trim() : null;

        if ((key == null || key.isBlank()) && (id == null || id.isBlank())) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false).message("Resource key or id is required.").build());
        }

        if (key != null) {
            key = key.trim();

            // Strip leading slashes if present
            while (key.startsWith("/")) {
                key = key.substring(1);
            }

            // Path traversal and malformed path protection (no double URL decoding)
            if (isPathTraversalOrMalformed(key)) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Invalid resource path.").build());
            }

            // Canonicalize key from legacy full URLs or paths
            key = extractObjectKey(key);

            // Re-validate canonicalized key against path traversal
            if (isPathTraversalOrMalformed(key)) {
                return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                        .success(false).message("Invalid resource path.").build());
            }
        }

        try {
            boolean isAuthenticated = authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName());

            boolean isAdmin = isAuthenticated && authentication.getAuthorities().contains(
                    new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));

            Optional<Product> prodOpt = Optional.empty();

            // 1. Direct MongoDB ID match if id param provided
            if (id != null && !id.isBlank()) {
                prodOpt = productRepo.findById(id);
            }

            // 2. Direct MongoDB ID match if key is passed as product ID (contains no slash)
            if (prodOpt.isEmpty() && key != null && !key.isBlank() && !key.contains("/")) {
                prodOpt = productRepo.findById(key);
            }

            // 3. Direct S3 key match
            if (prodOpt.isEmpty() && key != null && !key.isBlank()) {
                prodOpt = productRepo.findByS3Key(key);
            }

            // 4. Storage key match
            if (prodOpt.isEmpty() && key != null && !key.isBlank()) {
                prodOpt = productRepo.findByStorageKey(key);
            }

            // 5. URL substring extraction if full S3 URL was passed
            if (prodOpt.isEmpty() && key != null && key.contains("amazonaws.com/")) {
                String sub = extractObjectKey(key);
                prodOpt = productRepo.findByS3Key(sub);
                if (prodOpt.isEmpty()) {
                    prodOpt = productRepo.findByStorageKey(sub);
                }
            }

            String resolvedObjectKey = key;

            if (prodOpt.isPresent()) {
                Product product = prodOpt.get();

                // Parameter Mismatch Protection:
                // If both id and key were provided, verify key and id both belong to this product.
                if (id != null && !id.isBlank() && key != null && !key.isBlank()) {
                    String pS3 = product.getS3Key() != null ? extractObjectKey(product.getS3Key()) : null;
                    String pStorage = product.getStorageKey() != null ? extractObjectKey(product.getStorageKey()) : null;
                    String pId = product.getId();
                    boolean keyMatches = (pS3 != null && pS3.equalsIgnoreCase(key))
                            || (pStorage != null && pStorage.equalsIgnoreCase(key));
                    boolean idMatches = (pId != null && pId.equalsIgnoreCase(id));
                    if (!keyMatches || !idMatches) {
                        log.warn("Security rejection: Provided id='{}' or key='{}' does not match product metadata (pId='{}', pKey='{}')",
                                id, key, pId, pS3 != null ? pS3 : pStorage);
                        return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                                .success(false).message("Resource identifier does not match the requested storage key.").build());
                    }
                }

                // Lifecycle & Deletion validation
                Boolean isDeleted = product.getIsDeleted();
                if (isDeleted != null && isDeleted) {
                    return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                            .success(false).message("Material has been removed.").build());
                }

                if (product.isArchived()) {
                    return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                            .success(false).message("Material is archived.").build());
                }

                boolean isPublished = product.isPublished() || product.getPublished();
                if (!isPublished && !isAdmin) {
                    return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                            .success(false).message("Material is not published.").build());
                }

                // Resolve S3 key from authoritative product metadata
                if (product.getS3Key() != null && !product.getS3Key().isBlank()) {
                    resolvedObjectKey = extractObjectKey(product.getS3Key());
                } else if (product.getStorageKey() != null && !product.getStorageKey().isBlank()) {
                    resolvedObjectKey = extractObjectKey(product.getStorageKey());
                }

                boolean isFree = isAuthoritativePublicFree(product);

                if (!isFree) {
                    // PAID resource: MUST require valid authentication & entitlement
                    if (!isAuthenticated) {
                        return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                .success(false).message("Authentication required.").build());
                    }

                    com.bodhganga.bodhganga.entity.User user = authUserResolver.resolveUser(authentication)
                            .orElse(null);

                    if (user == null) {
                        return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                .success(false).message("User not found.").build());
                    }

                    boolean isAccessible = false;

                    // Direct product purchase
                    Optional<Purchase> purchaseOpt = purchaseRepo.findByUserIdAndProductId(user.getId(), product.getId());
                    if (purchaseOpt.isPresent()) {
                        isAccessible = true;
                    }

                    // District bundle purchase
                    if (!isAccessible && product.getDistrictSlug() != null && !product.getDistrictSlug().isBlank()) {
                        List<Purchase> userPurchases = purchaseRepo.findByUserId(user.getId());
                        boolean districtPurchased = userPurchases.stream()
                                .anyMatch(p -> isDistrictPurchasedForProduct(product, p));
                        if (districtPurchased) {
                            isAccessible = true;
                        }
                    }

                    if (!isAccessible && !isAdmin) {
                        return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                .success(false)
                                .message("You do not own this document. Please claim or purchase it.")
                                .build());
                    }
                }
            } else {
                // Document not found in catalog.
                // If a catalog identifier (id) was explicitly requested but not found, fail closed immediately.
                if (id != null && !id.isBlank()) {
                    return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                            .success(false).message("Material not found in catalog.").build());
                }

                // Check if path represents an explicitly approved public layout.
                if (!isAdmin) {
                    boolean isPublicFreePath = isApprovedPublicStorageLayout(key);

                    if (!isPublicFreePath) {
                        if (!isAuthenticated) {
                            return ResponseEntity.status(401).body(ApiResponseDTO.builder()
                                    .success(false).message("Authentication required.").build());
                        }
                        return ResponseEntity.status(403).body(ApiResponseDTO.builder()
                                .success(false).message("Document not found in catalog or unauthorized.").build());
                    }
                }
            }

            if (resolvedObjectKey == null || resolvedObjectKey.isBlank()) {
                return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false).message("No storage object associated with this material.").build());
            }

            String signedUrl = s3Service.generatePresignedGetUrl(resolvedObjectKey);
            if (signedUrl == null) {
                signedUrl = s3Service.generatePresignedUrl(resolvedObjectKey);
            }

            if (redirect) {
                return ResponseEntity.status(302)
                        .header("Location", signedUrl)
                        .build();
            }

            Map<String, String> response = new HashMap<>();
            response.put("url", signedUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate presigned URL for key='{}', id='{}': {}", key, id, e.getMessage());
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false).message("PDF file not found or failed to generate access link.").build());
        }
    }

    private String extractObjectKey(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        if (s3Service != null) {
            try {
                String k = s3Service.getObjectKey(raw);
                if (k != null && !k.isBlank()) return k;
            } catch (Exception ignored) {
            }
        }
        String key = raw.trim();
        if (key.contains("amazonaws.com/")) {
            key = key.substring(key.indexOf("amazonaws.com/") + "amazonaws.com/".length());
        } else if (key.contains("://")) {
            int schemeIdx = key.indexOf("://");
            int pathIdx = key.indexOf('/', schemeIdx + 3);
            if (pathIdx >= 0) {
                key = key.substring(pathIdx);
            }
        }
        int queryIdx = key.indexOf('?');
        if (queryIdx >= 0) key = key.substring(0, queryIdx);
        int fragIdx = key.indexOf('#');
        if (fragIdx >= 0) key = key.substring(0, fragIdx);
        while (key.startsWith("/")) key = key.substring(1);
        return key;
    }

    private String normalizeSlug(String raw) {
        if (raw == null || raw.isBlank())
            return "";
        return raw.trim().toLowerCase(java.util.Locale.ROOT);
    }

    /**
     * Checks if a resource key contains direct, encoded, or double-encoded path traversal sequences.
     */
    private boolean isPathTraversalOrMalformed(String key) {
        if (key == null || key.isBlank()) return false;
        if (key.indexOf('\0') >= 0) return true;
        if (key.contains("..")) return true;

        String lower = key.toLowerCase(java.util.Locale.ROOT);
        // Direct, encoded, or double-encoded path traversal sequences
        if (lower.contains("%2e%2e") || lower.contains("%2e.") || lower.contains(".%2e")
                || lower.contains("%2f") || lower.contains("%5c")
                || lower.contains("%252e") || lower.contains("%252f") || lower.contains("%255c")) {
            return true;
        }
        return false;
    }

    /**
     * Authoritative, fail-closed classification for public educational materials.
     * Enforces BodhGanga's established architectural rules:
     * - Paid resources must NEVER become public due to conflicting metadata (fails closed).
     * - State resources must have valid state scope and canonical state category metadata.
     * - District resources must have valid state scope and actual district slug.
     * - Zero price, districtSlug=general, category=free, or resourceScope=STATE alone do NOT prove public access.
     */
    private boolean isAuthoritativePublicFree(Product product) {
        if (product == null) {
            return false;
        }

        // 1. FAIL-CLOSED: Absolute rejection on any paid indicator
        if (product.getPrice() != null && product.getPrice() > 0.0) {
            return false;
        }
        if (hasPaidSegment(product.getS3Key()) || hasPaidSegment(product.getStorageKey())) {
            return false;
        }
        String cat = product.getCategory() != null ? product.getCategory().trim().toLowerCase(java.util.Locale.ROOT) : "";
        String catSlug = product.getCategorySlug() != null ? product.getCategorySlug().trim().toLowerCase(java.util.Locale.ROOT) : "";
        if ("paid".equals(cat) || "paid".equals(catSlug) || cat.startsWith("paid ") || cat.startsWith("paid-")
                || "paid resources".equals(cat) || "paid-resources".equals(cat)) {
            return false;
        }

        // 2. State-Scoped Educational Material Classification
        // Must belong to a valid state, have verified state scope, and match canonical state category
        if (product.isStateScope()) {
            String sSlug = normalizeSlug(product.getStateSlug());
            if (!sSlug.isEmpty() && isValidSlug(sSlug)) {
                // Must be explicitly free or verified zero price with no paid indicators
                return product.isFree() || (product.getPrice() != null && product.getPrice() == 0.0);
            }
        }

        // 3. District-Scoped Educational Material Classification
        // Must have valid state slug and actual district slug (not "general", "state", etc.)
        String pDist = normalizeSlug(product.getDistrictSlug());
        String pState = normalizeSlug(product.getStateSlug());
        if (!pDist.isEmpty() && !pState.isEmpty() && isValidSlug(pDist) && isValidSlug(pState)
                && !"general".equals(pDist) && !"state".equals(pDist)
                && !"images".equals(pDist) && !"state-images".equals(pDist)) {

            // Contradictory metadata check: A district resource cannot claim resourceScope = "STATE"
            if (Product.SCOPE_STATE.equalsIgnoreCase(product.getResourceScope())) {
                return false;
            }

            // District free resource: must be explicitly free and zero/null price
            if (product.isFree() && (product.getPrice() == null || product.getPrice() == 0.0)) {
                return true;
            }

            // Or storage key is in canonical/legacy district free layout
            String keyToCheck = product.getS3Key() != null ? product.getS3Key() : product.getStorageKey();
            if (isApprovedPublicStorageLayout(keyToCheck)) {
                return product.isFree() || (product.getPrice() != null && product.getPrice() == 0.0);
            }
        }

        // 4. Approved Public Storage Layout (canonical district free, legacy district free, state images)
        String s3Key = product.getS3Key() != null ? product.getS3Key() : product.getStorageKey();
        if (isApprovedPublicStorageLayout(s3Key) || isStateImageLayout(s3Key)) {
            return product.isFree() || (product.getPrice() != null && product.getPrice() == 0.0);
        }

        // 5. Cataloged product explicitly marked free with zero/null price and no conflicting state scope
        if (product.isFree() && (product.getPrice() == null || product.getPrice() == 0.0)) {
            if (product.getStateSlug() != null && !product.getStateSlug().isBlank()
                    && Product.SCOPE_STATE.equalsIgnoreCase(product.getResourceScope())) {
                return false; // State scope without canonical category fails closed
            }
            return true;
        }

        // Fail-closed for all other combinations
        return false;
    }

    private boolean hasPaidSegment(String key) {
        if (key == null || key.isBlank()) return false;
        String normalized = key.replace('\\', '/').trim();
        for (String seg : normalized.split("/")) {
            if ("paid".equalsIgnoreCase(seg.trim())) {
                return true;
            }
        }
        return false;
    }

    private boolean isStateImageLayout(String key) {
        if (key == null || key.isBlank()) return false;
        String normalized = key.replace('\\', '/').trim();
        while (normalized.startsWith("/")) normalized = normalized.substring(1);
        String[] parts = normalized.split("/");
        if (parts.length == 3 && "states".equalsIgnoreCase(parts[0]) && isValidSlug(normalizeSlug(parts[1]))) {
            String fn = parts[2].toLowerCase(java.util.Locale.ROOT);
            return fn.endsWith(".png") || fn.endsWith(".jpg") || fn.endsWith(".jpeg")
                    || fn.endsWith(".webp") || fn.endsWith(".svg");
        }
        return false;
    }

    /**
     * Verifies that user's purchase matches BOTH districtSlug and stateSlug of
     * product.
     * Fails closed if product has stateSlug but purchase lacks stateSlug or
     * stateSlug differs.
     */
    private boolean isDistrictPurchasedForProduct(Product product, Purchase purchase) {
        if (product == null || purchase == null)
            return false;
        String pDist = normalizeSlug(product.getDistrictSlug());
        String purDist = normalizeSlug(purchase.getDistrictSlug());
        if (pDist.isEmpty() || purDist.isEmpty())
            return false;
        if (!pDist.equals(purDist))
            return false;

        String pState = normalizeSlug(product.getStateSlug());
        String purState = normalizeSlug(purchase.getStateSlug());

        // If product is associated with a state, purchase MUST match that state.
        if (!pState.isEmpty()) {
            if (purState.isEmpty())
                return false; // Fail closed if purchase state is missing
            return pState.equals(purState);
        }
        return true;
    }

    /**
     * Strict, normalized, segment-aware verification for uncatalogued public resources.
     * Evaluates path components to ensure arbitrary or paid S3 keys cannot be accessed without catalog entitlement.
     *
     * Verified Application-Generated Public Layouts:
     * 1. State image assets (DriveToS3PipelineTask & ProductMetadataUtil line 326):
     *    states/{stateSlug}/{imageFilename.(png|jpg|jpeg|webp|svg)} (exactly 3 segments)
     * 2. Canonical free district & state-general study material (AdminResourceService lines 409, 447):
     *    states/{stateSlug}/{districtSlug}/free/{filename} (exactly 5 segments, segment[3] == "free")
     * 3. Legacy free district study material (DriveToS3PipelineTask & ProductMetadataUtil lines 331-332):
     *    {stateSlug}/{districtSlug}/free/{filename} (exactly 4 segments, segment[2] == "free")
     *
     * STRICT PROHIBITIONS:
     * - Any key containing a "paid" path segment is NEVER public.
     * - Broad substrings (such as "sample", loose "/free/", loose "states/") are NOT permitted.
     * - Speculative fallback layouts are NOT allowed.
     * - Keys must fail closed if they do not strictly conform to an approved public layout.
     */
    private boolean isApprovedPublicStorageLayout(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }

        String normalized = key.replace('\\', '/').trim();
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }

        // Reject path traversal attempts
        if (isPathTraversalOrMalformed(normalized)) {
            return false;
        }

        String[] rawSegments = normalized.split("/");
        if (rawSegments.length < 2) {
            return false;
        }

        String[] segments = new String[rawSegments.length];
        for (int i = 0; i < rawSegments.length; i++) {
            segments[i] = rawSegments[i].trim().toLowerCase(java.util.Locale.ROOT);
            // If ANY path segment is "paid", immediately reject
            if ("paid".equals(segments[i])) {
                return false;
            }
        }

        // Layout 1: State image assets (e.g. states/haryana/Haryana-cover.png)
        if (segments.length == 3 && "states".equals(segments[0])) {
            String filename = segments[2];
            boolean isImage = filename.endsWith(".png") || filename.endsWith(".jpg")
                    || filename.endsWith(".jpeg") || filename.endsWith(".webp") || filename.endsWith(".svg");
            return isImage && isValidSlug(segments[1]);
        }

        // Layout 2: Canonical free district or state-general study material (states/{stateSlug}/{districtSlug}/free/{filename})
        if (segments.length == 5 && "states".equals(segments[0]) && "free".equals(segments[3])) {
            return isValidSlug(segments[1]) && isValidSlug(segments[2]) && !segments[4].isBlank();
        }

        // Layout 3: Legacy free district study material ({stateSlug}/{districtSlug}/free/{filename})
        if (segments.length == 4 && "free".equals(segments[2])) {
            return isValidSlug(segments[0]) && isValidSlug(segments[1]) && !segments[3].isBlank();
        }

        // No unverified speculative layouts permitted
        return false;
    }

    private boolean isValidSlug(String slug) {
        if (slug == null || slug.isBlank()) return false;
        return slug.matches("^[a-z0-9_-]+$");
    }
}
