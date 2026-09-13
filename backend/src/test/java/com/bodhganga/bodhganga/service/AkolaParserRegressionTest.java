package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
@Tag("local-ocr")
public class AkolaParserRegressionTest {

    @Autowired
    private PdfExtractionService pdfExtractionService;

    @Autowired
    private QuestionParserService questionParserService;

    @Autowired
    private AnswerParserService answerParserService;

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
    void testAkolaPdfParserAndAnswerMatchingRegression() throws Exception {
        File qFile = findFile("question");
        File aFile = findFile("solution");
        if (aFile == null)
            aFile = findFile("explanation");

        assertNotNull(qFile, "Question PDF must exist on desktop");
        assertNotNull(aFile, "Answer PDF must exist on desktop");

        byte[] qBytes = Files.readAllBytes(qFile.toPath());
        byte[] aBytes = Files.readAllBytes(aFile.toPath());

        List<String> qPagesText = pdfExtractionService.extractTextPerPage(qBytes);
        List<String> aPagesText = pdfExtractionService.extractTextPerPage(aBytes);

        List<QuestionParserService.ParsedQuestion> parsedQuestions = questionParserService
                .parseQuestionsFromPages(qPagesText);
        Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers = answerParserService
                .parseAnswersFromPages(aPagesText);

        System.out.println("==================================================");
        System.out.println("AKOLA PARSER REGRESSION TEST BASELINE");
        System.out.println("==================================================");
        System.out.println("Parsed Questions Count: " + parsedQuestions.size());
        System.out.println("Parsed Answers Count: " + parsedAnswers.size());

        Set<Integer> qNums = parsedQuestions.stream()
                .map(QuestionParserService.ParsedQuestion::getQuestionNumber)
                .collect(Collectors.toCollection(TreeSet::new));
        System.out.println("Distinct Question Numbers (" + qNums.size() + "): " + qNums);

        if (qNums.size() < 136) {
            List<Integer> missing = new ArrayList<>();
            for (int i = 1; i <= 136; i++) {
                if (!qNums.contains(i))
                    missing.add(i);
            }
            System.out.println("MISSING QUESTION NUMBERS (" + missing.size() + "): " + missing);
        }

        Map<String, Long> levelDist = parsedQuestions.stream()
                .collect(Collectors.groupingBy(QuestionParserService.ParsedQuestion::getLevel, Collectors.counting()));
        System.out.println("Level Distribution: " + levelDist);

        Map<String, Long> topicDist = parsedQuestions.stream()
                .collect(Collectors.groupingBy(QuestionParserService.ParsedQuestion::getTopic, Collectors.counting()));
        System.out.println("Topic Distribution: " + topicDist);

        // Strict assertions for production parser canonical output:
        assertEquals(136, parsedQuestions.size(), "QuestionParserService must produce exactly 136 canonical questions");
        assertEquals(136, parsedAnswers.size(), "AnswerParserService must produce exactly 136 answers");

        Set<Integer> expectedNums = new TreeSet<>();
        for (int i = 1; i <= 136; i++)
            expectedNums.add(i);
        assertEquals(expectedNums, qNums, "Question numbers must be exactly {1..136}");

        assertEquals(102L, levelDist.getOrDefault("foundation", 0L), "Foundation count must be exactly 102");
        assertEquals(34L, levelDist.getOrDefault("upsc-level", 0L), "UPSC-Level count must be exactly 34");

        // Inspect and report required questions: Q1, Q34, Q35, Q71, Q101, Q105, Q127,
        // Q136
        List<Integer> inspectTargets = List.of(1, 34, 35, 71, 101, 105, 127, 136);
        Map<Integer, QuestionParserService.ParsedQuestion> qMap = parsedQuestions.stream()
                .collect(
                        Collectors.toMap(QuestionParserService.ParsedQuestion::getQuestionNumber, q -> q, (a, b) -> a));

        System.out.println("--------------------------------------------------");
        System.out.println("REQUIRED QUESTION INSPECTION REPORT");
        System.out.println("--------------------------------------------------");
        for (int qNum : inspectTargets) {
            QuestionParserService.ParsedQuestion q = qMap.get(qNum);
            assertNotNull(q, "Question Q" + qNum + " must be present");
            System.out.println("Q" + qNum + " [Page " + q.getPageNumber() + " | " + q.getLevel() + " | " + q.getTopic()
                    + "]: " + q.getQuestionText());
            System.out.println("   Options: " + q.getOptions());
            if (q.getWarningReason() != null) {
                System.out.println("   Validation Warning: " + q.getWarningReason());
            }
        }
        System.out.println("--------------------------------------------------");

        long placeholderQuestionsCount = 0;
        long emptyQuestionTextsCount = 0;
        long placeholderOptionsCount = 0;
        long suspiciousQuestionsCount = 0;
        long needsReviewCount = 0;

        for (QuestionParserService.ParsedQuestion q : parsedQuestions) {
            assertNotNull(q.getOptions(), "Options list must not be null for Q" + q.getQuestionNumber());
            assertEquals(4, q.getOptions().size(),
                    "Question " + q.getQuestionNumber() + " must have exactly 4 options");
            assertNotNull(q.getQuestionText(), "Question text must not be null for Q" + q.getQuestionNumber());

            String qText = q.getQuestionText();
            if (qText.isBlank()) {
                emptyQuestionTextsCount++;
            }
            if (qText.contains("Extracted from source PDF") || qText.contains("Pending OCR review")) {
                placeholderQuestionsCount++;
            }
            boolean hasPlaceholderOpt = q.getOptions().stream().anyMatch(opt -> opt.contains("Option A")
                    || opt.contains("Option B") || opt.contains("Option C") || opt.contains("Option D"));
            if (hasPlaceholderOpt) {
                placeholderOptionsCount++;
            }
            if (q.isSuspicious()) {
                suspiciousQuestionsCount++;
            }
            if (q.getWarningReason() != null && q.getWarningReason().contains("NEEDS_REVIEW")) {
                needsReviewCount++;
            }
        }

        System.out.println("==================================================");
        System.out.println("QUALITY & VALIDATION METRICS REPORT");
        System.out.println("==================================================");
        System.out.println("Number of Placeholder Questions: " + placeholderQuestionsCount);
        System.out.println("Number of Empty Question Texts: " + emptyQuestionTextsCount);
        System.out.println("Number of Questions with Placeholder Options: " + placeholderOptionsCount);
        System.out.println("Number of Suspicious Questions: " + suspiciousQuestionsCount);
        System.out.println("Number of Questions Requiring Manual Review: " + needsReviewCount);
        System.out.println("==================================================");

        // Strict assertions: FAIL if any placeholders exist in the canonical question
        // dataset
        assertEquals(0, placeholderQuestionsCount, "Test MUST FAIL if any question contains placeholder question text");
        assertEquals(0, emptyQuestionTextsCount, "Test MUST FAIL if any question has empty question text");
        assertEquals(0, placeholderOptionsCount, "Test MUST FAIL if any question contains placeholder options");

        QuestionParserService.ParsedQuestion q71 = parsedQuestions.stream().filter(q -> q.getQuestionNumber() == 71)
                .findFirst().orElse(null);
        assertNotNull(q71, "Q71 must exist");
        assertFalse(q71.getQuestionText().isBlank(), "Q71 text must not be blank");
        assertTrue(q71.getQuestionText().toLowerCase().contains("korku"), "Q71 must contain meaningful Korku content");

        QuestionParserService.ParsedQuestion q101 = parsedQuestions.stream().filter(q -> q.getQuestionNumber() == 101)
                .findFirst().orElse(null);
        assertNotNull(q101, "Q101 must exist");
        assertFalse(q101.getQuestionText().isBlank(), "Q101 text must not be blank");
        assertTrue(
                q101.getQuestionText().toLowerCase().contains("patur")
                        || q101.getQuestionText().toLowerCase().contains("caves")
                        || q101.getQuestionText().toLowerCase().contains("rock-cut"),
                "Q101 must contain meaningful Patur content");

        for (int i = 1; i <= 136; i++) {
            AnswerParserService.ParsedAnswer ans = parsedAnswers.get(i);
            assertNotNull(ans, "Answer for Q" + i + " must exist");
            assertNotNull(ans.getCorrectOptionIndex(), "Option index for Q" + i + " must exist");
            assertNotNull(ans.getExplanation(), "Explanation for Q" + i + " must exist");
            assertFalse(ans.getExplanation().isBlank(), "Explanation for Q" + i + " must not be blank");
        }
    }
}
