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

        @Autowired
        private AkolaTextNormalizationFilter akolaTextNormalizationFilter;

        private File findFile(String pattern) {
                String[] dirs = {
                                "C:\\Users\\chris\\OneDrive\\Desktop\\Bodhganga",
                                "C:\\Users\\chris\\Desktop\\Bodhganga"
                };
                for (String dirPath : dirs) {
                        File dir = new File(dirPath);
                        if (dir.exists() && dir.isDirectory()) {
                                File[] files = dir.listFiles(
                                                (d, name) -> name.toLowerCase().contains("akola")
                                                                && name.toLowerCase().contains(pattern));
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
                                .parseQuestionsFromPages(qPagesText, akolaTextNormalizationFilter);
                Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers = answerParserService
                                .parseAnswersFromPages(aPagesText, akolaTextNormalizationFilter);

                System.out.println("==================================================");
                System.out.println("AKOLA PARSER REGRESSION TEST BASELINE");
                System.out.println("==================================================");
                System.out.println("Parsed Questions Count: " + parsedQuestions.size());
                System.out.println("Parsed Answers Count: " + parsedAnswers.size());

                Set<Integer> qNums = parsedQuestions.stream()
                                .map(QuestionParserService.ParsedQuestion::getQuestionNumber)
                                .collect(Collectors.toCollection(TreeSet::new));
                System.out.println("Distinct Question Numbers (" + qNums.size() + "): " + qNums);

                Map<String, Long> levelDist = parsedQuestions.stream()
                                .collect(Collectors.groupingBy(QuestionParserService.ParsedQuestion::getLevel,
                                                Collectors.counting()));
                System.out.println("Level Distribution: " + levelDist);

                Map<String, Long> topicDist = parsedQuestions.stream()
                                .collect(Collectors.groupingBy(QuestionParserService.ParsedQuestion::getTopic,
                                                Collectors.counting()));
                System.out.println("Topic Distribution: " + topicDist);

                // Assertions verifying strict non-fabrication & counts:
                assertEquals(136, parsedQuestions.size(),
                                "QuestionParserService must produce exactly 136 canonical questions");

                // Answer count is 135 because Q55 answer key header was omitted in the source
                // solution PDF
                assertEquals(135, parsedAnswers.size(),
                                "AnswerParserService must produce 135 answers without fabricating Q55");

                // Verify Q55 is NOT fabricated in answer parser
                assertNull(parsedAnswers.get(55),
                                "Q55 answer key is omitted in the source solution PDF scan and must NOT be fabricated");

                Set<Integer> expectedNums = new TreeSet<>();
                for (int i = 1; i <= 136; i++) {
                        expectedNums.add(i);
                }
                assertEquals(expectedNums, qNums, "Question numbers must be exactly {1..136} and 100% unique");

                assertEquals(101L, levelDist.getOrDefault("foundation", 0L), "Foundation count must be 101");
                assertEquals(35L, levelDist.getOrDefault("upsc-level", 0L), "UPSC-Level count must be 35");

                // Verification of direct PDF evidence for character repairs:
                // 1. Qd1S -> Q115 verified against Question PDF Line 846 ("Qd1S.,Whatis the
                // shape of the inner fortification...")
                QuestionParserService.ParsedQuestion q115 = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 115)
                                .findFirst().orElse(null);
                assertNotNull(q115, "Q115 must be parsed from PDF Line 846 (Qd1S character misread)");
                assertTrue(q115.getQuestionText().toLowerCase().contains("inner fortification"),
                                "Q115 must contain inner fortification text");

                // 2. Q839 -> Q89 verified against Solution PDF Line 407 ("Q839. (a) A ritual
                // folk performance...")
                AnswerParserService.ParsedAnswer a89 = parsedAnswers.get(89);
                assertNotNull(a89, "A89 must be parsed from Solution PDF Line 407 (Q839 character misread)");
                assertTrue(a89.getExplanation().toLowerCase().contains("gondhal"),
                                "A89 explanation must contain Gondhal text");

                // 3. Q126.(4) -> Q126.(d) verified against Solution PDF Line 531 ("Q126. (4),
                // Washim")
                AnswerParserService.ParsedAnswer a126 = parsedAnswers.get(126);
                assertNotNull(a126, "A126 must be parsed from Solution PDF Line 531 ((4) character misread)");
                assertEquals(3, a126.getCorrectOptionIndex(), "A126 option index must be 3 (option d)");

                // 4. Q84.\{e) -> Q84.(c) verified against Solution PDF Line 381
                // ("Q84.\{e)'Lezim")
                AnswerParserService.ParsedAnswer a84 = parsedAnswers.get(84);
                assertNotNull(a84, "A84 must be parsed from Solution PDF Line 381 (\\{e) character misread)");
                assertEquals(2, a84.getCorrectOptionIndex(), "A84 option index must be 2 (option c)");

                long placeholderQuestionsCount = 0;
                long emptyQuestionTextsCount = 0;
                long placeholderOptionsCount = 0;
                long suspiciousQuestionsCount = 0;

                for (QuestionParserService.ParsedQuestion q : parsedQuestions) {
                        assertNotNull(q.getOptions(), "Options list must not be null for Q" + q.getQuestionNumber());
                        if (q.getOptions().size() < 4) {
                                assertTrue(q.isSuspicious(), "Question Q" + q.getQuestionNumber()
                                                + " with fewer than 4 options must be flagged as suspicious");
                        } else {
                                assertEquals(4, q.getOptions().size(),
                                                "Question Q" + q.getQuestionNumber() + " must have 4 options");
                        }
                        assertNotNull(q.getQuestionText(),
                                        "Question text must not be null for Q" + q.getQuestionNumber());

                        String qText = q.getQuestionText();
                        if (qText.isBlank()) {
                                emptyQuestionTextsCount++;
                        }
                        if (qText.contains("Extracted from source PDF") || qText.contains("Pending OCR review")) {
                                placeholderQuestionsCount++;
                        }
                        boolean hasPlaceholderOpt = q.getOptions().stream().anyMatch(opt -> opt.contains("Option A")
                                        || opt.contains("Option B") || opt.contains("Option C")
                                        || opt.contains("Option D"));
                        if (hasPlaceholderOpt) {
                                placeholderOptionsCount++;
                        }
                        if (q.isSuspicious()) {
                                suspiciousQuestionsCount++;
                        }
                }

                // Strict assertions: FAIL if any placeholders exist in the canonical question
                // dataset
                assertEquals(0, placeholderQuestionsCount,
                                "Test MUST FAIL if any question contains placeholder question text");
                assertEquals(0, emptyQuestionTextsCount, "Test MUST FAIL if any question has empty question text");
                assertEquals(0, placeholderOptionsCount, "Test MUST FAIL if any question contains placeholder options");

                QuestionParserService.ParsedQuestion q71 = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 71)
                                .findFirst().orElse(null);
                assertNotNull(q71, "Q71 must exist");
                assertFalse(q71.getQuestionText().isBlank(), "Q71 text must not be blank");
                assertTrue(q71.getQuestionText().toLowerCase().contains("korku"),
                                "Q71 must contain meaningful Korku content");

                QuestionParserService.ParsedQuestion q101 = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 101)
                                .findFirst().orElse(null);
                assertNotNull(q101, "Q101 must exist");
                assertFalse(q101.getQuestionText().isBlank(), "Q101 text must not be blank");
                assertTrue(
                                q101.getQuestionText().toLowerCase().contains("patur")
                                                || q101.getQuestionText().toLowerCase().contains("caves")
                                                || q101.getQuestionText().toLowerCase().contains("rock-cut"),
                                "Q101 must contain meaningful Patur content");

                // Page provenance assertions: prove page numbers are preserved across document
                QuestionParserService.ParsedQuestion q1 = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 1)
                                .findFirst().orElse(null);
                assertNotNull(q1, "Q1 must exist");
                assertEquals(3, q1.getPageNumber(),
                                "Q1 must originate on PDF source page 3 (pages 1-2 are cover/branding)");

                QuestionParserService.ParsedQuestion q71Page = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 71)
                                .findFirst().orElse(null);
                assertNotNull(q71Page);
                assertEquals(19, q71Page.getPageNumber(),
                                "Q71 page number must match actual PDF source page 19");

                QuestionParserService.ParsedQuestion q136Page = parsedQuestions.stream()
                                .filter(q -> q.getQuestionNumber() == 136)
                                .findFirst().orElse(null);
                assertNotNull(q136Page);
                assertEquals(35, q136Page.getPageNumber(),
                                "Q136 page number must match actual PDF source page 35");

                long pageOneCount = parsedQuestions.stream().filter(q -> q.getPageNumber() == 1).count();
                assertEquals(0, pageOneCount,
                                "Page 1 is a cover page and must contain 0 questions");
        }
}
