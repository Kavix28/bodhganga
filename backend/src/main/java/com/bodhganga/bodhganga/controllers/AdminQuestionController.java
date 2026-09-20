package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.bodhganga.bodhganga.service.QuestionIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/quiz")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminQuestionController {

    private final QuestionIngestionService questionIngestionService;
    private final QuestionRepo questionRepo;

    public AdminQuestionController(QuestionIngestionService questionIngestionService, QuestionRepo questionRepo) {
        this.questionIngestionService = questionIngestionService;
        this.questionRepo = questionRepo;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponseDTO> uploadQuestionBank(
            @RequestParam("questionPdf") MultipartFile questionPdf,
            @RequestParam("answerPdf") MultipartFile answerPdf,
            @RequestParam("stateSlug") String stateSlug,
            @RequestParam("districtSlug") String districtSlug,
            @RequestParam(value = "testType", defaultValue = "easy") String testType) {

        try {
            QuestionIngestionService.IngestionResult result = questionIngestionService.ingestQuestionBankPdfs(
                    questionPdf, answerPdf, stateSlug, districtSlug, testType);

            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message(result.getMessage())
                    .data(result)
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to process question bank ingestion: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/questions")
    public ResponseEntity<ApiResponseDTO> listAdminQuestions(
            @RequestParam(required = false) String stateSlug,
            @RequestParam(required = false) String districtSlug,
            @RequestParam(required = false) String status) {

        List<Question> questions;
        if (stateSlug != null && districtSlug != null && status != null) {
            questions = questionRepo.findByStateSlugAndDistrictSlugAndStatus(stateSlug, districtSlug, status);
        } else if (stateSlug != null && districtSlug != null) {
            questions = questionRepo.findByStateSlugAndDistrictSlug(stateSlug, districtSlug);
        } else if (status != null) {
            questions = questionRepo.findByStatus(status);
        } else {
            questions = questionRepo.findAll();
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Questions retrieved for admin review")
                .data(questions)
                .build());
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<ApiResponseDTO> getQuestionById(@PathVariable String id) {
        Optional<Question> question = questionRepo.findById(id);
        if (question.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .data(question.get())
                .build());
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<ApiResponseDTO> updateQuestion(
            @PathVariable String id,
            @RequestBody Question updateReq) {

        Optional<Question> existingOpt = questionRepo.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Question q = existingOpt.get();
        if (updateReq.getQuestion() != null)
            q.setQuestion(updateReq.getQuestion());
        if (updateReq.getOptions() != null)
            q.setOptions(updateReq.getOptions());
        if (updateReq.getCorrectAnswer() != null)
            q.setCorrectAnswer(updateReq.getCorrectAnswer());
        if (updateReq.getExplanation() != null)
            q.setExplanation(updateReq.getExplanation());
        if (updateReq.getTopic() != null)
            q.setTopic(updateReq.getTopic());
        if (updateReq.getLevel() != null)
            q.setLevel(updateReq.getLevel());
        if (updateReq.getStatus() != null)
            q.setStatus(updateReq.getStatus());
        if (updateReq.getIsActive() != null)
            q.setIsActive(updateReq.getIsActive());
        q.setUpdatedAt(Instant.now());

        Question saved = questionRepo.save(q);
        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question updated successfully")
                .data(saved)
                .build());
    }

    @PostMapping("/questions/{id}/publish")
    public ResponseEntity<ApiResponseDTO> publishQuestion(@PathVariable String id) {
        try {
            Optional<Question> existingOpt = questionRepo.findById(id);
            if (existingOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Question q = existingOpt.get();
            q.setStatus("PUBLISHED");
            q.setIsActive(true);
            q.setPublishedAt(Instant.now());
            q.setUpdatedAt(Instant.now());

            Question saved = questionRepo.save(q);
            return ResponseEntity.ok(ApiResponseDTO.builder()
                    .success(true)
                    .message("Question published successfully")
                    .data(saved)
                    .build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(ApiResponseDTO.builder()
                    .success(false)
                    .message("Failed to publish question: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/bulk-publish")
    public ResponseEntity<ApiResponseDTO> bulkPublish(
            @RequestParam String stateSlug,
            @RequestParam String districtSlug) {

        List<Question> draftQuestions = questionRepo.findByStateSlugAndDistrictSlug(stateSlug, districtSlug);
        int publishedCount = 0;
        for (Question q : draftQuestions) {
            if ("DRAFT".equalsIgnoreCase(q.getStatus()) || "REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())) {
                q.setStatus("PUBLISHED");
                q.setIsActive(true);
                q.setPublishedAt(Instant.now());
                q.setUpdatedAt(Instant.now());
                questionRepo.save(q);
                publishedCount++;
            }
        }

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Bulk published " + publishedCount + " questions for " + districtSlug)
                .data(publishedCount)
                .build());
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<ApiResponseDTO> archiveQuestion(@PathVariable String id) {
        Optional<Question> existingOpt = questionRepo.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Question q = existingOpt.get();
        q.setStatus("ARCHIVED");
        q.setIsActive(false);
        q.setUpdatedAt(Instant.now());
        questionRepo.save(q);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question archived successfully")
                .build());
    }
}
