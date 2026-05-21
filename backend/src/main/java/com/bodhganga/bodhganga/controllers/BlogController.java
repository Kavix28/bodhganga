package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.BlogPost;
import com.bodhganga.bodhganga.repo.BlogPostRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BlogController {

    private final BlogPostRepo blogPostRepo;

    public BlogController(BlogPostRepo blogPostRepo) {
        this.blogPostRepo = blogPostRepo;
    }

    /**
     * GET /api/blog/posts?page=0&size=9
     * Get published blog posts with pagination
     */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponseDTO> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BlogPost> postPage = blogPostRepo.findByStatus("PUBLISHED", pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("totalPages", postPage.getTotalPages());
        pagination.put("totalElements", postPage.getTotalElements());
        pagination.put("currentPage", page);
        pagination.put("size", size);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("data", postPage.getContent());
        responseData.put("pagination", pagination);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Blog posts retrieved successfully")
                .data(responseData)
                .build());
    }

    /**
     * GET /api/blog/posts/search?query=...&page=0&size=9
     * Search blog posts
     */
    @GetMapping("/posts/search")
    public ResponseEntity<ApiResponseDTO> searchPosts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BlogPost> postPage = blogPostRepo.searchByQuery(query, pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("totalPages", postPage.getTotalPages());
        pagination.put("totalElements", postPage.getTotalElements());
        pagination.put("currentPage", page);
        pagination.put("size", size);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("data", postPage.getContent());
        responseData.put("pagination", pagination);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Search results")
                .data(responseData)
                .build());
    }

    /**
     * GET /api/blog/{slug}
     * Get single blog post by slug
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponseDTO> getPostBySlug(@PathVariable String slug) {
        Optional<BlogPost> post = blogPostRepo.findBySlug(slug);

        if (post.isEmpty()) {
            // Try by ID as fallback
            Optional<BlogPost> byId = blogPostRepo.findById(slug);
            if (byId.isEmpty()) {
                return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                        .success(false)
                        .message("Blog post not found")
                        .build());
            }
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Blog post retrieved")
                    .data(byId.get())
                    .build());
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Blog post retrieved")
                .data(post.get())
                .build());
    }

    /**
     * POST /api/blog/posts
     * Create a new blog post (admin only via security config)
     */
    @PostMapping("/posts")
    public ResponseEntity<ApiResponseDTO> createPost(
            @RequestBody BlogPost blogPost,
            Authentication authentication) {

        if (blogPost.getSlug() == null || blogPost.getSlug().isEmpty()) {
            blogPost.setSlug(blogPost.getTitle()
                    .toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-+", "-"));
        }
        if (blogPost.getCreatedAt() == null) {
            blogPost.setCreatedAt(new Date());
        }
        if ("PUBLISHED".equals(blogPost.getStatus()) && blogPost.getPublishedAt() == null) {
            blogPost.setPublishedAt(new Date());
        }
        if (authentication != null) {
            blogPost.setAuthor(authentication.getName());
        }

        BlogPost saved = blogPostRepo.save(blogPost);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Blog post created successfully")
                .data(saved)
                .build());
    }

    /**
     * PUT /api/blog/posts/{id}
     * Update blog post
     */
    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponseDTO> updatePost(
            @PathVariable String id,
            @RequestBody BlogPost blogPost) {

        if (!blogPostRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Blog post not found")
                    .build());
        }

        blogPost.setId(id);
        blogPost.setUpdatedAt(new Date());
        BlogPost updated = blogPostRepo.save(blogPost);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Blog post updated")
                .data(updated)
                .build());
    }

    /**
     * DELETE /api/blog/posts/{id}
     * Delete blog post
     */
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponseDTO> deletePost(@PathVariable String id) {
        if (!blogPostRepo.existsById(id)) {
            return ResponseEntity.status(404).body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Blog post not found")
                    .build());
        }

        blogPostRepo.deleteById(id);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Blog post deleted")
                .build());
    }
}
