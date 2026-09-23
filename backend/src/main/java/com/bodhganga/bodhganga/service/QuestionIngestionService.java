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
    private final GroqExtractionService groqExtractionService;

    private final DocumentExtractionRouter documentExtractionRouter;
    private final DeterministicQuestionClassifier deterministicQuestionClassifier;
    private final AkolaTextNormalizationFilter akolaTextNormalizationFilter;

    @org.springframework.beans.factory.annotation.Autowired
    public QuestionIngestionService(
            PdfExtractionService pdfExtractionService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            QuestionRepo questionRepo,
            S3Service s3Service,
            GroqExtractionService groqExtractionService,
            DocumentExtractionRouter documentExtractionRouter,
            DeterministicQuestionClassifier deterministicQuestionClassifier,
            AkolaTextNormalizationFilter akolaTextNormalizationFilter) {
        this.pdfExtractionService = pdfExtractionService;
        this.questionParserService = questionParserService;
        this.answerParserService = answerParserService;
        this.questionMatchingService = questionMatchingService;
        this.questionRepo = questionRepo;
        this.s3Service = s3Service;
        this.groqExtractionService = groqExtractionService;
        this.documentExtractionRouter = documentExtractionRouter;
        this.deterministicQuestionClassifier = deterministicQuestionClassifier;
        this.akolaTextNormalizationFilter = akolaTextNormalizationFilter;
    }

    public QuestionIngestionService(
            PdfExtractionService pdfExtractionService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            QuestionRepo questionRepo,
            S3Service s3Service,
            GroqExtractionService groqExtractionService,
            DocumentExtractionRouter documentExtractionRouter,
            DeterministicQuestionClassifier deterministicQuestionClassifier) {
        this(pdfExtractionService, questionParserService, answerParserService, questionMatchingService, questionRepo,
                s3Service, groqExtractionService, documentExtractionRouter, deterministicQuestionClassifier,
                new AkolaTextNormalizationFilter());
    }

    public QuestionIngestionService(
            PdfExtractionService pdfExtractionService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            QuestionRepo questionRepo,
            S3Service s3Service,
            GroqExtractionService groqExtractionService) {
        this(pdfExtractionService, questionParserService, answerParserService, questionMatchingService, questionRepo,
                s3Service, groqExtractionService,
                new DocumentExtractionRouter(pdfExtractionService, new OcrService(), new PdfTextQualityAnalyzer()),
                new DeterministicQuestionClassifier(),
                new AkolaTextNormalizationFilter());
    }

    public QuestionIngestionService(
            PdfExtractionService pdfExtractionService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            QuestionMatchingService questionMatchingService,
            QuestionRepo questionRepo,
            S3Service s3Service) {
        this(pdfExtractionService, questionParserService, answerParserService, questionMatchingService, questionRepo,
                s3Service, null,
                new DocumentExtractionRouter(pdfExtractionService, new OcrService(), new PdfTextQualityAnalyzer()),
                new DeterministicQuestionClassifier(),
                new AkolaTextNormalizationFilter());
    }

    public static class IngestionResult {
        private boolean success;
        private String message;
        private String sourceDocumentId;
        private String fileHash;
        private int totalParsed;
        private int draftCount;
        private int reviewRequiredCount;
        private int exactMatchCount;
        private int fuzzyMatchCount;
        private int unmatchedCount;
        private double averageConfidence;
        private boolean dryRun;
        private List<Question> ingestedQuestions;

        public IngestionResult() {
        }

        public IngestionResult(boolean success, String message, String sourceDocumentId, String fileHash,
                int totalParsed, int draftCount, int reviewRequiredCount, int exactMatchCount,
                int fuzzyMatchCount, int unmatchedCount, double averageConfidence, boolean dryRun,
                List<Question> ingestedQuestions) {
            this.success = success;
            this.message = message;
            this.sourceDocumentId = sourceDocumentId;
            this.fileHash = fileHash;
            this.totalParsed = totalParsed;
            this.draftCount = draftCount;
            this.reviewRequiredCount = reviewRequiredCount;
            this.exactMatchCount = exactMatchCount;
            this.fuzzyMatchCount = fuzzyMatchCount;
            this.unmatchedCount = unmatchedCount;
            this.averageConfidence = averageConfidence;
            this.dryRun = dryRun;
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

        public int getExactMatchCount() {
            return exactMatchCount;
        }

        public int getFuzzyMatchCount() {
            return fuzzyMatchCount;
        }

        public int getUnmatchedCount() {
            return unmatchedCount;
        }

        public double getAverageConfidence() {
            return averageConfidence;
        }

        public boolean isDryRun() {
            return dryRun;
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
            private int exactMatchCount;
            private int fuzzyMatchCount;
            private int unmatchedCount;
            private double averageConfidence;
            private boolean dryRun;
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

            public IngestionResultBuilder exactMatchCount(int exactMatchCount) {
                this.exactMatchCount = exactMatchCount;
                return this;
            }

            public IngestionResultBuilder fuzzyMatchCount(int fuzzyMatchCount) {
                this.fuzzyMatchCount = fuzzyMatchCount;
                return this;
            }

            public IngestionResultBuilder unmatchedCount(int unmatchedCount) {
                this.unmatchedCount = unmatchedCount;
                return this;
            }

            public IngestionResultBuilder averageConfidence(double averageConfidence) {
                this.averageConfidence = averageConfidence;
                return this;
            }

            public IngestionResultBuilder dryRun(boolean dryRun) {
                this.dryRun = dryRun;
                return this;
            }

            public IngestionResultBuilder ingestedQuestions(List<Question> ingestedQuestions) {
                this.ingestedQuestions = ingestedQuestions;
                return this;
            }

            public IngestionResult build() {
                return new IngestionResult(success, message, sourceDocumentId, fileHash, totalParsed, draftCount,
                        reviewRequiredCount, exactMatchCount, fuzzyMatchCount, unmatchedCount, averageConfidence,
                        dryRun, ingestedQuestions);
            }
        }
    }

    public IngestionResult ingestQuestionBankPdfs(
            MultipartFile questionPdfFile,
            MultipartFile answerPdfFile,
            String stateSlug,
            String districtSlug,
            String testType) throws IOException {
        boolean isEnvDryRun = Boolean.parseBoolean(System.getProperty("OCR_INGESTION_DRY_RUN", "false"));
        return ingestQuestionBankPdfs(questionPdfFile, answerPdfFile, stateSlug, districtSlug, testType, isEnvDryRun);
    }

    public IngestionResult ingestQuestionBankPdfs(
            MultipartFile questionPdfFile,
            MultipartFile answerPdfFile,
            String stateSlug,
            String districtSlug,
            String testType,
            boolean dryRun) throws IOException {

        validatePdfFile(questionPdfFile, "Question Bank PDF");
        validatePdfFile(answerPdfFile, "Answer PDF");

        byte[] qBytes = questionPdfFile.getBytes();
        byte[] aBytes = answerPdfFile.getBytes();

        String fileHash = computeSHA256(qBytes, aBytes);

        // Check if exact file pair already ingested (idempotency check)
        List<Question> existing = questionRepo != null ? questionRepo.findByFileHash(fileHash)
                : Collections.emptyList();
        if (!existing.isEmpty() && !dryRun) {
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
                    .dryRun(false)
                    .ingestedQuestions(existing)
                    .build();
        }

        String sourceDocId = UUID.randomUUID().toString();
        String qS3Key = "quiz/sources/" + stateSlug + "/" + districtSlug + "/" + sourceDocId + "-question.pdf";
        String aS3Key = "quiz/sources/" + stateSlug + "/" + districtSlug + "/" + sourceDocId + "-answer.pdf";

        // Store S3 objects if s3Service is available and not in dryRun
        if (!dryRun) {
            try {
                if (s3Service != null) {
                    s3Service.uploadFileWithKey(questionPdfFile.getInputStream(), questionPdfFile.getSize(), qS3Key,
                            "application/pdf");
                    s3Service.uploadFileWithKey(answerPdfFile.getInputStream(), answerPdfFile.getSize(), aS3Key,
                            "application/pdf");
                }
            } catch (Exception e) {
                System.err.println("S3 upload skipped/failed in current environment: " + e.getMessage());
            }
        }

        List<String> qPages;
        List<String> aPages;
        DocumentExtractionRouter.ExtractionResult qExtractResult;
        DocumentExtractionRouter.ExtractionResult aExtractResult;

        try {
            qExtractResult = documentExtractionRouter != null
                    ? documentExtractionRouter.routeAndExtract(qBytes)
                    : new DocumentExtractionRouter.ExtractionResult(
                            DocumentExtractionRouter.ExtractionMethod.TEXT_LAYER,
                            pdfExtractionService.extractTextPerPage(qBytes), null, null, true, "Direct extraction");

            aExtractResult = documentExtractionRouter != null
                    ? documentExtractionRouter.routeAndExtract(aBytes)
                    : new DocumentExtractionRouter.ExtractionResult(
                            DocumentExtractionRouter.ExtractionMethod.TEXT_LAYER,
                            pdfExtractionService.extractTextPerPage(aBytes), null, null, true, "Direct extraction");

            qPages = qExtractResult.getPageTexts();
            aPages = aExtractResult.getPageTexts();
        } catch (Exception e) {
            return IngestionResult.builder()
                    .success(false)
                    .message("PDF Extraction failed: " + e.getMessage())
                    .sourceDocumentId(sourceDocId)
                    .fileHash(fileHash)
                    .totalParsed(0)
                    .draftCount(0)
                    .reviewRequiredCount(0)
                    .dryRun(dryRun)
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
                    .dryRun(dryRun)
                    .build();
        }

        TextNormalizationFilter filter = ("akola".equalsIgnoreCase(districtSlug)
                && akolaTextNormalizationFilter != null)
                        ? akolaTextNormalizationFilter
                        : null;

        List<QuestionParserService.ParsedQuestion> parsedQs = (groqExtractionService != null)
                ? groqExtractionService.extractQuestionsFromPdfBytes(qBytes, qPages)
                : questionParserService.parseQuestionsFromPages(qPages, filter);

        if (deterministicQuestionClassifier != null) {
            for (QuestionParserService.ParsedQuestion pq : parsedQs) {
                DeterministicQuestionClassifier.QuestionClassification cls = deterministicQuestionClassifier
                        .classifyQuestion(pq.getQuestionText(), pq.getOptions(), pq.getLevel());

                if (cls.getClassification() == DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED) {
                    pq.setLevel("upsc-level");
                } else if (cls.getClassification() == DeterministicQuestionClassifier.ClassificationResult.FOUNDATION) {
                    pq.setLevel("foundation");
                } else if (cls
                        .getClassification() == DeterministicQuestionClassifier.ClassificationResult.REVIEW_REQUIRED) {
                    pq.setSuspicious(true);
                    pq.setWarningReason(pq.getWarningReason() != null
                            ? pq.getWarningReason() + "; " + cls.getReason()
                            : cls.getReason());
                }
            }
        }

        Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = (groqExtractionService != null)
                ? groqExtractionService.extractSolutionsFromPdfBytes(aBytes, aPages)
                : answerParserService.parseAnswersFromPages(aPages, filter);

        QuestionMatchingService.MatchReport matchReport = questionMatchingService.matchAndBuildReport(
                parsedQs, parsedAs, stateSlug, districtSlug, testType, sourceDocId, qS3Key, aS3Key, fileHash);

        List<Question> matchedQuestions = matchReport.getQuestions();
        List<Question> savedQuestions;

        if (dryRun) {
            savedQuestions = matchedQuestions;
        } else {
            savedQuestions = questionRepo != null ? questionRepo.saveAll(matchedQuestions) : matchedQuestions;
        }

        int draftCount = 0;
        int reviewCount = 0;
        for (Question q : savedQuestions) {
            if ("DRAFT".equalsIgnoreCase(q.getStatus())) {
                draftCount++;
            } else if ("REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())) {
                reviewCount++;
            }
        }

        String msg = dryRun
                ? "Dry run completed successfully. Parsed " + savedQuestions.size() + " questions (DB persist skipped)"
                : "Successfully ingested " + savedQuestions.size() + " questions from PDFs";

        return IngestionResult.builder()
                .success(true)
                .message(msg)
                .sourceDocumentId(sourceDocId)
                .fileHash(fileHash)
                .totalParsed(savedQuestions.size())
                .draftCount(draftCount)
                .reviewRequiredCount(reviewCount)
                .exactMatchCount(matchReport.getExactMatchCount())
                .fuzzyMatchCount(matchReport.getFuzzyMatchCount())
                .unmatchedCount(matchReport.getUnmatchedCount())
                .averageConfidence(matchReport.getAverageConfidence())
                .dryRun(dryRun)
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
