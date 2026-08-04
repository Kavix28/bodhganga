package com.bodhganga.bodhganga.controllers;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.testseries.Question;
import com.bodhganga.bodhganga.services.testseries.QuestionBankService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/questions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000",
        "https://bodhganga.in", "https://www.bodhganga.in"})
public class AdminQuestionBankController {

    private final QuestionBankService questionBankService;

    public AdminQuestionBankController(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Question> questions = questionBankService.getAllQuestions(page, size);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Questions retrieved")
                .data(questions)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO> createQuestion(@RequestBody Question question) {
        Question created = questionBankService.createQuestion(question);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question created successfully")
                .data(created)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> updateQuestion(
            @PathVariable String id,
            @RequestBody Question question) {
        Question updated = questionBankService.updateQuestion(id, question);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question updated successfully")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteQuestion(@PathVariable String id) {
        questionBankService.softDeleteQuestion(id);

        return ResponseEntity.ok(ApiResponseDTO.builder()
                .success(true)
                .message("Question deleted successfully")
                .build());
    }
}
