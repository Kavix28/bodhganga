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
