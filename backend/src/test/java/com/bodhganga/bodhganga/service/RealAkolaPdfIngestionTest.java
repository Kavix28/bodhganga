package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
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

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
@Tag("local-ocr")
public class RealAkolaPdfIngestionTest {

    @Autowired
    private PdfExtractionService pdfExtractionService;

    @Autowired
    private QuestionParserService questionParserService;

    @Autowired
    private AnswerParserService answerParserService;

    @Autowired
    private QuestionIngestionService questionIngestionService;

    @Autowired
    private QuestionMatchingService questionMatchingService;

    @Autowired
    private QuestionRepo questionRepo;

    private File findFile(String pattern) {
        String[] dirs = {
                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                "C:\\Users\\chris\\Desktop\\Bodhganga"
        };
        for (String dirPath : dirs) {
            File dir = new File(dirPath);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles(
                        (d, name) -> name.toLowerCase().contains("akola") && name.toLowerCase().contains(pattern));
                if (files != null && files.length > 0) {
                    return files[0];
                }
            }
        }
        return null;
    }

    @Test
    void testRealAkolaPdfOcrIngestionPipeline() throws Exception {
        File qFile = findFile("question");
        File aFile = findFile("solution");
        if (aFile == null)
            aFile = findFile("explanation");

        assertNotNull(qFile, "Question PDF file must exist on desktop");
        assertNotNull(aFile, "Answer PDF file must exist on desktop");

        byte[] qBytes = Files.readAllBytes(qFile.toPath());
        byte[] aBytes = Files.readAllBytes(aFile.toPath());

        int qPageCount = 0;
        int aPageCount = 0;
        try (PDDocument qDoc = Loader.loadPDF(qBytes);
                PDDocument aDoc = Loader.loadPDF(aBytes)) {
            qPageCount = qDoc.getNumberOfPages();
            aPageCount = aDoc.getNumberOfPages();
            assertEquals(42, qPageCount, "Question PDF must have 42 pages");
            assertEquals(14, aPageCount, "Answer PDF must have 14 pages");
        }

        System.out.println("[REAL OCR AKOLA] Question PDF: " + qFile.getAbsolutePath() + " (" + qPageCount + " pages)");
        System.out.println("[REAL OCR AKOLA] Answer PDF: " + aFile.getAbsolutePath() + " (" + aPageCount + " pages)");

        // Run through OCR pipeline
        List<String> qPages = pdfExtractionService.extractTextPerPage(qBytes);
        List<String> aPages = pdfExtractionService.extractTextPerPage(aBytes);

        int totalQChars = qPages.stream().mapToInt(String::length).sum();
        int totalAChars = aPages.stream().mapToInt(String::length).sum();

        System.out.println("[REAL OCR AKOLA] Question OCR text total chars: " + totalQChars);
        System.out.println("[REAL OCR AKOLA] Answer OCR text total chars: " + totalAChars);

        assertTrue(totalQChars > 1000, "Question PDF OCR text extraction should produce > 1000 characters");
        assertTrue(totalAChars > 500, "Answer PDF OCR text extraction should produce > 500 characters");

        List<QuestionParserService.ParsedQuestion> parsedQs = questionParserService.parseQuestionsFromPages(qPages);
        Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = answerParserService.parseAnswersFromPages(aPages);

        System.out.println("[REAL OCR AKOLA] Parsed Questions Count: " + parsedQs.size());
        System.out.println("[REAL OCR AKOLA] Parsed Answers Count: " + parsedAs.size());

        assertTrue(parsedQs.size() > 0, "Parser must extract questions from OCR text");
        assertTrue(parsedAs.size() > 0, "Parser must extract answers from OCR text");

        // Execute Ingestion Service
        MockMultipartFile qMultipart = new MockMultipartFile("questionPdf", qFile.getName(), "application/pdf", qBytes);
        MockMultipartFile aMultipart = new MockMultipartFile("answerPdf", aFile.getName(), "application/pdf", aBytes);

        questionRepo.deleteAll();
        QuestionIngestionService.IngestionResult result = questionIngestionService.ingestQuestionBankPdfs(
                qMultipart, aMultipart, "maharashtra", "akola", "easy");

        assertTrue(result.isSuccess(), "Ingestion should succeed");
        assertTrue(result.getTotalParsed() > 0, "Should ingest parsed questions into MongoDB");

        System.out.println("[REAL OCR AKOLA] Ingestion Success: " + result.isSuccess());
        System.out.println("[REAL OCR AKOLA] Total Ingested: " + result.getTotalParsed());
        System.out.println("[REAL OCR AKOLA] Draft Count: " + result.getDraftCount());
        System.out.println("[REAL OCR AKOLA] Review Required Count: " + result.getReviewRequiredCount());

        // Test idempotency
        QuestionIngestionService.IngestionResult idempotentResult = questionIngestionService.ingestQuestionBankPdfs(
                qMultipart, aMultipart, "maharashtra", "akola", "easy");
        assertTrue(idempotentResult.isSuccess());
        assertTrue(idempotentResult.getMessage().contains("already ingested")
                || idempotentResult.getMessage().contains("idempotent skip"));
    }

    @Test
    void testRealAkolaPdfDryRunMode() throws Exception {
        File qFile = findFile("question");
        File aFile = findFile("solution");
        if (aFile == null)
            aFile = findFile("explanation");

        assertNotNull(qFile);
        assertNotNull(aFile);

        byte[] qBytes = Files.readAllBytes(qFile.toPath());
        byte[] aBytes = Files.readAllBytes(aFile.toPath());

        MockMultipartFile qMultipart = new MockMultipartFile("questionPdf", qFile.getName(), "application/pdf", qBytes);
        MockMultipartFile aMultipart = new MockMultipartFile("answerPdf", aFile.getName(), "application/pdf", aBytes);

        questionRepo.deleteAll();
        long dbCountBefore = questionRepo.count();

        // Perform single OCR extraction for diagnostics and dry-run
        List<String> qPages = pdfExtractionService.extractTextPerPage(qBytes);
        List<String> aPages = pdfExtractionService.extractTextPerPage(aBytes);

        List<QuestionParserService.ParsedQuestion> parsedQs = questionParserService.parseQuestionsFromPages(qPages);
        Map<Integer, AnswerParserService.ParsedAnswer> parsedAs = answerParserService.parseAnswersFromPages(aPages);

        QuestionMatchingService.MatchReport matchReport = questionMatchingService.matchAndBuildReport(
                parsedQs, parsedAs, "maharashtra", "akola", "easy", "dry-run-source", "s3-q", "s3-a", "hash");

        long dbCountAfter = questionRepo.count();

        System.out.println("==================================================");
        System.out.println("REAL AKOLA DRY RUN DIAGNOSTIC REPORT");
        System.out.println("==================================================");
        System.out.println("Total Parsed Questions: " + parsedQs.size());
        System.out.println("Total Parsed Answers: " + parsedAs.size());
        long draftCount = matchReport.getQuestions().stream().filter(q -> "DRAFT".equalsIgnoreCase(q.getStatus())).count();
        long reviewRequiredCount = matchReport.getQuestions().stream().filter(q -> "REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())).count();

        System.out.println("Exact Matches: " + matchReport.getExactMatchCount());
        System.out.println("Fuzzy Matches: " + matchReport.getFuzzyMatchCount());
        System.out.println("Unmatched: " + matchReport.getUnmatchedCount());
        System.out.println("DRAFT Count: " + draftCount);
        System.out.println("REVIEW_REQUIRED Count: " + reviewRequiredCount);
        System.out.println("Average Matching Confidence: " + matchReport.getAverageConfidence());
        System.out.println("DB Count Before: " + dbCountBefore);
        System.out.println("DB Count After: " + dbCountAfter);
        System.out.println("==================================================");

        Set<Integer> qNums = new TreeSet<>();
        for (QuestionParserService.ParsedQuestion pq : parsedQs) {
            qNums.add(pq.getQuestionNumber());
        }

        Set<Integer> aNums = new TreeSet<>(parsedAs.keySet());

        System.out.println("PARSED QUESTION NUMBERS (" + qNums.size() + "): " + qNums);
        System.out.println("PARSED ANSWER NUMBERS (" + aNums.size() + "): " + aNums);

        Set<Integer> missingInQ = new TreeSet<>();
        for (int i = 1; i <= 136; i++) {
            if (!qNums.contains(i)) missingInQ.add(i);
        }
        System.out.println("MISSING QUESTION NUMBERS (1 to 136): " + missingInQ);

        Set<Integer> unmatchedAnswerKeys = new TreeSet<>(aNums);
        unmatchedAnswerKeys.removeAll(qNums);
        System.out.println("ANSWER KEYS NOT IN QUESTIONS (" + unmatchedAnswerKeys.size() + "): " + unmatchedAnswerKeys);

        Set<Integer> questionKeysWithoutAnswers = new TreeSet<>(qNums);
        questionKeysWithoutAnswers.removeAll(aNums);
        System.out.println("QUESTION KEYS WITHOUT ANSWERS (" + questionKeysWithoutAnswers.size() + "): " + questionKeysWithoutAnswers);

        assertEquals(dbCountBefore, dbCountAfter, "Dry run must NOT persist any questions to DB");
        assertEquals(0, dbCountAfter, "DB must remain empty after dry run");
    }
}
