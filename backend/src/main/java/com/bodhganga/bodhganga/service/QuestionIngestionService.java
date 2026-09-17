package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.bodhganga.bodhganga.services.S3Service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class QuestionIngestionService {

    private final PdfExtractionService pdfExtractionService;
    private final QuestionParserService questionParserService;
    private final AnswerParserService answerParserService;
    private final QuestionMatchingService questionMatchingService;
    private final QuestionRepo questionRepo;
    private final S3Service s3Service;

    public QuestionIngestionService(
            PdfExtractionService pdfExtractionService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            QuestionRepo questionRepo,
            S3Service s3Service) {
        this.pdfExtractionService = pdfExtractionService;
        this.questionParserService = questionParserService;
        this.answerParserService = answerParserService;
        this.questionMatchingService = questionMatchingService;
        this.questionRepo = questionRepo;
        this.s3Service = s3Service;
    }

    public static class IngestionResult {
        private boolean success;
        private String message;
        private String sourceDocumentId;
        private String fileHash;
        private int totalParsed;
        private int draftCount;
        private int reviewRequiredCount;
        private List<Question> ingestedQuestions;

        public IngestionResult() {
        }

        public IngestionResult(boolean success, String message, String sourceDocumentId, String fileHash,
                int totalParsed, int draftCount, int reviewRequiredCount, List<Question> ingestedQuestions) {
            this.success = success;
            this.message = message;
            this.sourceDocumentId = sourceDocumentId;
            this.fileHash = fileHash;
            this.totalParsed = totalParsed;
            this.draftCount = draftCount;
            this.reviewRequiredCount = reviewRequiredCount;
            this.ingestedQuestions = ingestedQuestions;
        }

        public static IngestionResultBuilder builder() {
            return new IngestionResultBuilder();
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getSourceDocumentId() {
            return sourceDocumentId;
        }

        public String getFileHash() {
            return fileHash;
        }

        public int getTotalParsed() {
            return totalParsed;
        }

        public int getDraftCount() {
            return draftCount;
        }

        public int getReviewRequiredCount() {
            return reviewRequiredCount;
        }

        public List<Question> getIngestedQuestions() {
            return ingestedQuestions;
        }

        public static class IngestionResultBuilder {
            private boolean success;
            private String message;
            private String sourceDocumentId;
            private String fileHash;
            private int totalParsed;
            private int draftCount;
            private int reviewRequiredCount;
            private List<Question> ingestedQuestions;

            public IngestionResultBuilder success(boolean success) {
                this.success = success;
                return this;
            }

            public IngestionResultBuilder message(String message) {
                this.message = message;
                return this;
            }

            public IngestionResultBuilder sourceDocumentId(String sourceDocumentId) {
                this.sourceDocumentId = sourceDocumentId;
                return this;
            }

            public IngestionResultBuilder fileHash(String fileHash) {
                this.fileHash = fileHash;
                return this;
            }

            public IngestionResultBuilder totalParsed(int totalParsed) {
                this.totalParsed = totalParsed;
                return this;
            }

            public IngestionResultBuilder draftCount(int draftCount) {
                this.draftCount = draftCount;
                return this;
            }

            public IngestionResultBuilder reviewRequiredCount(int reviewRequiredCount) {
                this.reviewRequiredCount = reviewRequiredCount;
                return this;
            }

            public IngestionResultBuilder ingestedQuestions(List<Question> ingestedQuestions) {
                this.ingestedQuestions = ingestedQuestions;
                return this;
            }

            public IngestionResult build() {
                return new IngestionResult(success, message, sourceDocumentId, fileHash, totalParsed, draftCount,
                        reviewRequiredCount, ingestedQuestions);
            }
        }
    }

    public IngestionResult ingestQuestionBankPdfs(
            MultipartFile questionPdfFile,
            MultipartFile answerPdfFile,
            String stateSlug,
            String districtSlug,
            String testType) throws IOException {

        validatePdfFile(questionPdfFile, "Question Bank PDF");
        validatePdfFile(answerPdfFile, "Answer PDF");

        byte[] qBytes = questionPdfFile.getBytes();
        byte[] aBytes = answerPdfFile.getBytes();

        String fileHash = computeSHA256(qBytes, aBytes);

        // Check if exact file pair already ingested (idempotency check)
        List<Question> existing = questionRepo.findByFileHash(fileHash);
        if (!existing.isEmpty()) {
            long draftC = existing.stream().filter(q -> "DRAFT".equalsIgnoreCase(q.getStatus())).count();
            long reviewC = existing.stream().filter(q -> "REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())).count();
            return IngestionResult.builder()
                    .success(true)
                    .message("Question bank already ingested previously (idempotent skip)")
                    .sourceDocumentId(existing.get(0).getSourceDocumentId())
                    .fileHash(fileHash)
                    .totalParsed(existing.size())
                    .draftCount((int) draftC)
                    .reviewRequiredCount((int) reviewC)
                    .ingestedQuestions(existing)
                    .build();
        }

        String sourceDocId = UUID.randomUUID().toString();
        String qS3Key = "quiz/sources/" + stateSlug + "/" + districtSlug + "/" + sourceDocId + "-question.pdf";
        String aS3Key = "quiz/sources/" + stateSlug + "/" + districtSlug + "/" + sourceDocId + "-answer.pdf";

        // Store S3 objects if s3Service is available
        try {
            if (s3Service != null) {
                s3Service.uploadFileWithKey(questionPdfFile.getInputStream(), questionPdfFile.getSize(), qS3Key,
                        "application/pdf");
                s3Service.uploadFileWithKey(answerPdfFile.getInputStream(), answerPdfFile.getSize(), aS3Key,
                        "application/pdf");
            }
        } catch (Exception e) {
            // Logging warning, non-blocking for local/offline dev mode
            System.err.println("S3 upload skipped/failed in current environment: " + e.getMessage());
        }

        List<String> qPages;
        List<String> aPages;
        try {
            qPages = pdfExtractionService.extractTextPerPage(qBytes);
            aPages = pdfExtractionService.extractTextPerPage(aBytes);
        } catch (Exception e) {
            return IngestionResult.builder()
                    .success(false)
                    .message("OCR processing failed: " + e.getMessage())
                    .sourceDocumentId(sourceDocId)
                    .fileHash(fileHash)
                    .totalParsed(0)
                    .draftCount(0)
                    .reviewRequiredCount(0)
                    .build();
        }

        if (qPages.isEmpty() || qPages.stream().allMatch(String::isBlank)) {
            return IngestionResult.builder()
                    .success(false)
                    .message("OCR processing failed: No text extracted from question PDF")
                    .sourceDocumentId(sourceDocId)
                    .fileHash(fileHash)
                    .totalParsed(0)
                    .draftCount(0)
                    .reviewRequiredCount(0)
                    .build();
        }

        List<QuestionParserService.ParsedQuestion> parsedQs = questionParserService.parseQuestionsFromPages(qPages);
        Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = answerParserService.parseAnswersFromPages(aPages);

        List<Question> matchedQuestions = questionMatchingService.matchAndBuildQuestions(
                parsedQs, parsedAs, stateSlug, districtSlug, testType, sourceDocId, qS3Key, aS3Key, fileHash);

        List<Question> savedQuestions = questionRepo.saveAll(matchedQuestions);

        int draftCount = 0;
        int reviewCount = 0;
        for (Question q : savedQuestions) {
            if ("DRAFT".equalsIgnoreCase(q.getStatus())) {
                draftCount++;
            } else if ("REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())) {
                reviewCount++;
            }
        }

        return IngestionResult.builder()
                .success(true)
                .message("Successfully ingested " + savedQuestions.size() + " questions from PDFs")
                .sourceDocumentId(sourceDocId)
                .fileHash(fileHash)
                .totalParsed(savedQuestions.size())
                .draftCount(draftCount)
                .reviewRequiredCount(reviewCount)
                .ingestedQuestions(savedQuestions)
                .build();
    }

    private void validatePdfFile(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required and cannot be empty");
        }
        if (file.getSize() > 50 * 1024 * 1024) { // 50MB max limit
            throw new IllegalArgumentException(fieldName + " exceeds maximum allowed file size of 50MB");
        }

        try {
            byte[] header = new byte[5];
            file.getInputStream().read(header, 0, 5);
            String magicStr = new String(header);
            if (!magicStr.startsWith("%PDF-")) {
                throw new IllegalArgumentException(fieldName + " must be a valid PDF document (invalid magic bytes)");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read header of " + fieldName, e);
        }
    }

    private String computeSHA256(byte[]... byteArrays) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (byte[] bytes : byteArrays) {
                digest.update(bytes);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString();
        }
    }
}
