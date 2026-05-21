package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Content;
import com.bodhganga.bodhganga.repo.ContentRepo;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ContentController {

    private final ContentRepo contentRepo;

    public ContentController(ContentRepo contentRepo) {
        this.contentRepo = contentRepo;
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
