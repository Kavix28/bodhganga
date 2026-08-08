package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Content;
import com.bodhganga.bodhganga.entity.Product;
import com.bodhganga.bodhganga.repo.ContentRepo;
import com.bodhganga.bodhganga.repo.ProductRepo;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class ContentController {

    private final ContentRepo contentRepo;
    private final ProductRepo productRepo;
    private final MongoTemplate mongoTemplate;

    public ContentController(ContentRepo contentRepo, ProductRepo productRepo, MongoTemplate mongoTemplate) {
        this.contentRepo = contentRepo;
        this.productRepo = productRepo;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * GET /api/content/search
     * Multi-faceted full-text search API supporting q, state, category, language, page, size.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponseDTO> searchContent(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Query query = new Query();
        query.addCriteria(Criteria.where("isPublished").is(true)
                .and("isDeleted").ne(true));

        if (state != null && !state.isBlank()) {
            query.addCriteria(Criteria.where("stateSlug").is(Product.generateSlug(state)));
        }
        if (category != null && !category.isBlank()) {
            query.addCriteria(Criteria.where("categorySlug").is(Product.generateSlug(category)));
        }
        if (language != null && !language.isBlank()) {
            query.addCriteria(Criteria.where("language").is(language));
        }

        if (q != null && !q.isBlank()) {
            String regexPattern = "(?i)" + java.util.regex.Pattern.quote(q.trim());
            query.addCriteria(new Criteria().orOperator(
                Criteria.where("title").regex(regexPattern),
                Criteria.where("description").regex(regexPattern),
                Criteria.where("fileName").regex(regexPattern),
                Criteria.where("tags").regex(regexPattern),
                Criteria.where("ocrText").regex(regexPattern)
            ));
        }

        query.with(org.springframework.data.domain.PageRequest.of(page, size));
        List<Product> results = mongoTemplate.find(query, Product.class);

        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("content", results);
        responseData.put("page", page);
        responseData.put("size", size);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Search completed successfully")
                .data(responseData)
                .build());
    }

    /**
     * GET /api/content/versions/{id}
     * Returns multiversion revision history for a given document.
     */
    @GetMapping("/versions/{id}")
    public ResponseEntity<ApiResponseDTO> getVersionHistory(@PathVariable String id) {
        Product target = mongoTemplate.findById(id, Product.class);
        if (target == null || target.getGoogleDriveFileId() == null) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Document or version history not found")
                    .build());
        }

        List<Product> versions = productRepo.findByGoogleDriveFileIdOrderByVersionDesc(target.getGoogleDriveFileId());
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Version revision history loaded")
                .data(versions)
                .build());
    }

    /**
     * GET /api/content/{stateSlug}/{categorySlug}
     * Returns dynamic files for a specific state and category.
     * Examples: /api/content/rajasthan/history, /api/content/madhya-pradesh/geography
     */
    @GetMapping("/{stateSlug}/{categorySlug}")
    public ResponseEntity<ApiResponseDTO> getContentByStateAndCategory(
            @PathVariable String stateSlug,
            @PathVariable String categorySlug) {
        
        Query query = new Query();
        query.addCriteria(Criteria.where("isPublished").is(true)
                .and("stateSlug").is(stateSlug)
                .orOperator(
                    Criteria.where("categorySlug").is(categorySlug),
                    Criteria.where("navbarSlug").is(categorySlug),
                    Criteria.where("category").is(categorySlug)
                ));

        List<Product> products = mongoTemplate.find(query, Product.class);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message(String.format("Content for %s - %s retrieved successfully", stateSlug, categorySlug))
                .data(products)
                .build());
    }

    /**
     * GET /api/content/{stateSlug}/{categorySlug}/{id}
     * Returns specific content item by ID for state & category.
     */
    @GetMapping("/{stateSlug}/{categorySlug}/{id}")
    public ResponseEntity<ApiResponseDTO> getContentById(
            @PathVariable String stateSlug,
            @PathVariable String categorySlug,
            @PathVariable String id) {

        Product product = mongoTemplate.findById(id, Product.class);
        if (product == null || !product.isPublished()) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Content document not found")
                    .build());
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content retrieved")
                .data(product)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllContent() {
        List<Content> contents = contentRepo.findAll();
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content retrieved successfully")
                .data(contents)
                .build());
    }

    @GetMapping("/state/{stateId}")
    public ResponseEntity<ApiResponseDTO> getContentByState(@PathVariable String stateId) {
        List<Content> contents = contentRepo.findByStateId(stateId);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content for state retrieved successfully")
                .data(contents)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO> createContent(@RequestBody Content content) {
        if (content.getCreatedAt() == null) {
            content.setCreatedAt(new Date());
        }
        Content saved = contentRepo.save(content);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content created successfully")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateContent(@PathVariable String id, @RequestBody Content content) {
        if (!contentRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Content not found")
                    .build());
        }
        content.setId(id);
        content.setUpdatedAt(new Date());
        Content updated = contentRepo.save(content);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteContent(@PathVariable String id) {
        if (!contentRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Content not found")
                    .build());
        }
        contentRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Content deleted successfully")
                .build());
    }
}
