package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
@Tag("local-ocr")
public class RealEastJaintiaPdfIngestionTest {

    @Autowired
    private PdfExtractionService pdfExtractionService;

    @Autowired
    private PdfTextQualityAnalyzer pdfTextQualityAnalyzer;

    @Autowired
    private DocumentExtractionRouter documentExtractionRouter;

    @Autowired
    private QuestionParserService questionParserService;

    @Autowired
    private AnswerParserService answerParserService;

    @Autowired
    private DeterministicQuestionClassifier deterministicQuestionClassifier;

    @Autowired
    private QuestionMatchingService questionMatchingService;

    @Autowired
    private QuestionIngestionService questionIngestionService;

    @Autowired
    private QuestionRepo questionRepo;

    private File findEastJaintiaQuestionFile() {
        File f = new File(
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga\\2- Final East Jaintia Hills Advanced MCQ Question Bank.pdf");
        if (f.exists())
            return f;
        f = new File(
                "C:\\Users\\chris\\Desktop\\Bodhganga\\2- Final East Jaintia Hills Advanced MCQ Question Bank.pdf");
        if (f.exists())
            return f;
        return null;
    }

    private File findEastJaintiaAnswerFile() {
        File f = new File(
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga\\16-MCQs Solution with explanation East Jaintia Hills District.pdf");
        if (f.exists())
            return f;
        f = new File(
                "C:\\Users\\chris\\Desktop\\Bodhganga\\16-MCQs Solution with explanation East Jaintia Hills District.pdf");
        if (f.exists())
            return f;
        return null;
    }

    @Test
    void testRealEastJaintiaPdfEndToEndIngestionPipeline() throws Exception {
        byte[] qBytes = TestPdfFixtureUtil.getOrGenerateEastJaintiaQuestionPdfBytes();
        byte[] aBytes = TestPdfFixtureUtil.getOrGenerateEastJaintiaAnswerPdfBytes();

        File qFile = findEastJaintiaQuestionFile();
        File aFile = findEastJaintiaAnswerFile();

        if (TestPdfFixtureUtil.isUsingRealEastJaintiaPdf()) {
            assertNotNull(qFile, "Real East Jaintia Question PDF file must exist on desktop");
            assertNotNull(aFile, "Real East Jaintia Answer PDF file must exist on desktop");
        }

        // PHASE 1: Source File Inspection
        int qPageCount = 0;
        int aPageCount = 0;
        try (PDDocument qDoc = Loader.loadPDF(qBytes);
                PDDocument aDoc = Loader.loadPDF(aBytes)) {
            qPageCount = qDoc.getNumberOfPages();
            aPageCount = aDoc.getNumberOfPages();
        }

        PdfTextQualityAnalyzer.TextQualityResult qQuality = pdfTextQualityAnalyzer.analyze(qBytes);
        PdfTextQualityAnalyzer.TextQualityResult aQuality = pdfTextQualityAnalyzer.analyze(aBytes);

        DocumentExtractionRouter.ExtractionResult qRoute = documentExtractionRouter.routeAndExtract(qBytes);
        DocumentExtractionRouter.ExtractionResult aRoute = documentExtractionRouter.routeAndExtract(aBytes);

        System.out.println("==================================================");
        System.out.println("PHASE 1 & 2 — SOURCE AND ROUTE VERIFICATION");
        System.out.println("==================================================");
        System.out.println(
                "Question PDF File: " + (qFile != null ? qFile.getName() : "Synthetic East Jaintia Question Fixture"));
        System.out.println("Question PDF Path: " + (qFile != null ? qFile.getAbsolutePath() : "In-Memory Bytes"));
        System.out.println("Question PDF Size: " + qBytes.length + " bytes");
        System.out.println("Question PDF Pages: " + qPageCount);
        System.out.println("Question PDF Text Quality Usable: " + qQuality.isUsable());
        System.out.println("Question PDF Total Chars: " + qQuality.getTotalCharacterCount());
        System.out.println("Question Extraction Route: " + qRoute.getExtractionMethod());
        System.out.println("--------------------------------------------------");
        System.out.println(
                "Answer PDF File: " + (aFile != null ? aFile.getName() : "Synthetic East Jaintia Answer Fixture"));
        System.out.println("Answer PDF Path: " + (aFile != null ? aFile.getAbsolutePath() : "In-Memory Bytes"));
        System.out.println("Answer PDF Size: " + aBytes.length + " bytes");
        System.out.println("Answer PDF Pages: " + aPageCount);
        System.out.println("Answer PDF Text Quality Usable: " + aQuality.isUsable());
        System.out.println("Answer PDF Total Chars: " + aQuality.getTotalCharacterCount());
        System.out.println("Answer Extraction Route: " + aRoute.getExtractionMethod());
        System.out.println("==================================================");

        // PHASE 3 & 4: Parsing and Classification
        List<String> qPages = qRoute.getPageTexts();
        List<String> aPages = aRoute.getPageTexts();

        List<QuestionParserService.ParsedQuestion> parsedQs = questionParserService.parseQuestionsFromPages(qPages);
        Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = answerParserService.parseAnswersFromPages(aPages);

        Set<Integer> qNumbers = new TreeSet<>();
        List<Integer> duplicateQNumbers = new ArrayList<>();
        int malformedCount = 0;

        for (QuestionParserService.ParsedQuestion pq : parsedQs) {
            if (pq.getQuestionNumber() <= 0 || pq.getQuestionText() == null || pq.getQuestionText().isBlank()
                    || pq.getOptions() == null || pq.getOptions().size() < 4) {
                malformedCount++;
            }
            if (qNumbers.contains(pq.getQuestionNumber())) {
                duplicateQNumbers.add(pq.getQuestionNumber());
            } else {
                qNumbers.add(pq.getQuestionNumber());
            }
        }

        List<Integer> missingQNumbers = new ArrayList<>();
        for (int i = 1; i <= 80; i++) {
            if (!qNumbers.contains(i)) {
                missingQNumbers.add(i);
            }
        }

        List<Integer> extraQNumbers = qNumbers.stream().filter(num -> num > 80 || num < 1).collect(Collectors.toList());

        // Run Classifier and Ingestion in Dry-Run Mode (Phase 8: DB Safety)
        long dbCountBefore = questionRepo.count();

        MockMultipartFile qMultipart = new MockMultipartFile("questionPdf",
                qFile != null ? qFile.getName() : "EastJaintiaQuestion.pdf", "application/pdf", qBytes);
        MockMultipartFile aMultipart = new MockMultipartFile("answerPdf",
                aFile != null ? aFile.getName() : "EastJaintiaAnswer.pdf", "application/pdf", aBytes);

        QuestionIngestionService.IngestionResult ingestionResult = questionIngestionService.ingestQuestionBankPdfs(
                qMultipart, aMultipart, "meghalaya", "east-jaintia-hills", "master", true);

        long dbCountAfter = questionRepo.count();

        assertEquals(dbCountBefore, dbCountAfter, "Dry run MUST NOT persist questions to DB");
        assertTrue(ingestionResult.isSuccess(), "Ingestion pipeline dry-run must succeed");

        List<Question> ingestedQs = ingestionResult.getIngestedQuestions();

        // PHASE 5: Classification Counts & Quality Audit (Mutually Exclusive Breakdown)
        long foundationCount = 0;
        long statementCount = 0;
        long reviewRequiredCount = 0;

        Map<Integer, Question> qMap = ingestedQs.stream()
                .collect(Collectors.toMap(Question::getQuestionNumber, q -> q, (e1, e2) -> e1));
        Map<Integer, DeterministicQuestionClassifier.QuestionClassification> classificationMap = new HashMap<>();

        for (int i = 1; i <= 80; i++) {
            Question q = qMap.get(i);
            if (q != null) {
                DeterministicQuestionClassifier.QuestionClassification cls = deterministicQuestionClassifier
                        .classifyQuestion(q.getQuestion(), q.getOptions(), q.getLevel());
                classificationMap.put(i, cls);
                if (cls.getClassification() == DeterministicQuestionClassifier.ClassificationResult.FOUNDATION) {
                    foundationCount++;
                } else if (cls
                        .getClassification() == DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED) {
                    statementCount++;
                } else {
                    reviewRequiredCount++;
                }
            } else {
                reviewRequiredCount++;
            }
        }

        System.out.println("==================================================");
        System.out.println("PHASE 3, 4 & 5 — PARSING AND MATCHING SUMMARY");
        System.out.println("==================================================");
        System.out.println("Expected Questions: 80");
        System.out.println("Parsed Questions: " + parsedQs.size());
        System.out.println("Malformed Questions: " + malformedCount);
        System.out.println("Duplicate Question Numbers: " + duplicateQNumbers);
        System.out.println("Missing Question Numbers: " + missingQNumbers);
        System.out.println("Extra Question Numbers: " + extraQNumbers);
        System.out.println("Q1 Exists: " + qNumbers.contains(1));
        System.out.println("Q80 Exists: " + qNumbers.contains(80));
        System.out.println("--------------------------------------------------");
        System.out.println("Expected Solutions: 80");
        System.out.println("Parsed Solutions: " + parsedAs.size());
        System.out.println("Exact Matched PAIRS: " + ingestionResult.getExactMatchCount());
        System.out.println("Fuzzy Matched PAIRS: " + ingestionResult.getFuzzyMatchCount());
        System.out.println("Unmatched Questions: " + ingestionResult.getUnmatchedCount());
        System.out.println("Average Confidence: " + String.format("%.4f", ingestionResult.getAverageConfidence()));
        System.out.println("--------------------------------------------------");
        System.out.println("MUTUALLY EXCLUSIVE CLASSIFICATION BREAKDOWN:");
        System.out.println("FOUNDATION = " + foundationCount);
        System.out.println("STATEMENT_BASED = " + statementCount);
        System.out.println("REVIEW_REQUIRED = " + reviewRequiredCount);
        System.out.println("TOTAL CLASSIFIED = " + (foundationCount + statementCount + reviewRequiredCount) + " / 80");
        System.out.println("==================================================");

        // PHASE 6: Classification Audit Table for ALL 80 Questions
        System.out.println("\nPHASE 6 — CLASSIFICATION QUALITY AUDIT TABLE (ALL 80 QUESTIONS)");
        System.out.println(
                "--------------------------------------------------------------------------------------------------");
        System.out.printf("%-4s | %-20s | %-13s | %-10s | %-20s | %s%n", "Q#", "FINAL CLASSIFICATION", "SOURCE",
                "CONFIDENCE", "MATCHED SIGNALS", "REASON");
        System.out.println(
                "--------------------------------------------------------------------------------------------------");

        for (int i = 1; i <= 80; i++) {
            Question q = qMap.get(i);
            if (q == null) {
                System.out.printf("%-4d | %-20s | %-13s | %-10s | %-20s | %s%n", i, "REVIEW_REQUIRED", "N/A", "LOW",
                        "none", "Question missing from PDF parser");
                continue;
            }

            DeterministicQuestionClassifier.QuestionClassification cls = classificationMap.get(i);
            String signals = String.join(",", cls.getMatchedSignals());
            if (signals.isBlank())
                signals = "direct-factual";

            System.out.printf("%-4d | %-20s | %-13s | %-10s | %-20s | %s%n",
                    q.getQuestionNumber(),
                    cls.getClassification().name(),
                    cls.getSource().name(),
                    cls.getConfidenceLevel().name(),
                    signals,
                    cls.getReason());
        }
        System.out.println(
                "--------------------------------------------------------------------------------------------------");

        // PHASE 7: Detailed REVIEW_REQUIRED Questions
        System.out.println("\nPHASE 7 — REVIEW_REQUIRED DETAILED AUDIT");
        System.out.println("==================================================");
        int rrCount = 0;
        for (int i = 1; i <= 80; i++) {
            Question q = qMap.get(i);
            if (q != null && ("REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus()) || q.getIsActive() == null
                    || q.getIsActive())) {
                rrCount++;
                DeterministicQuestionClassifier.QuestionClassification cls = deterministicQuestionClassifier
                        .classifyQuestion(q.getQuestion(), q.getOptions(), q.getLevel());
                System.out.println("Q" + q.getQuestionNumber() + ": " + q.getQuestion());
                System.out.println("Options: " + q.getOptions());
                System.out.println("Status: " + q.getStatus() + " | IsActive: " + q.getIsActive());
                System.out.println("Reason: " + cls.getReason());
                System.out.println("Confidence Score: " + cls.getConfidence());
                System.out.println("Why Ambiguous: "
                        + (q.getExplanation() == null ? "Missing solution explanation or ambiguous statement pattern"
                                : "Requires manual audit"));
                System.out.println("--------------------------------------------------");
            }
        }
        if (rrCount == 0) {
            System.out.println("Zero questions flagged as REVIEW_REQUIRED. All 80 questions parsed deterministically!");
        }
        System.out.println("==================================================");

        // PHASE 8: Database Safety Assertions
        for (Question q : ingestedQs) {
            assertFalse(q.getIsActive(), "Question Q" + q.getQuestionNumber() + " must have isActive = false");
            assertNull(q.getPublishedAt(), "Question Q" + q.getQuestionNumber() + " must have publishedAt = null");
            assertTrue("DRAFT".equalsIgnoreCase(q.getStatus()) || "REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus()),
                    "Question Q" + q.getQuestionNumber() + " status must be DRAFT or REVIEW_REQUIRED but was: "
                            + q.getStatus());
        }
    }
}
