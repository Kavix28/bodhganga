package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.File;
import java.nio.file.Files;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
@Tag("local-ocr")
public class AkolaMasterIngestor {

        @Autowired
        private QuestionIngestionService questionIngestionService;

        @Autowired
        private QuestionRepo questionRepo;

        @Test
        void performSafeAkolaMasterIngestion() throws Exception {
                byte[] qBytes = TestPdfFixtureUtil.getOrGenerateAkolaQuestionPdfBytes();
                byte[] aBytes = TestPdfFixtureUtil.getOrGenerateAkolaAnswerPdfBytes();
                assertNotNull(qBytes, "Question PDF bytes must not be null");
                assertNotNull(aBytes, "Answer PDF bytes must not be null");

                // Inspect existing Akola count before ingestion
                List<Question> existingAkolaBefore = questionRepo.findByStateSlugAndDistrictSlug("maharashtra",
                                "akola");
                int countBefore = existingAkolaBefore.size();
                System.out.println("BEFORE_INGESTION_TOTAL_AKOLA_COUNT: " + countBefore);

                // Delete any existing questions associated with fileHash to allow fresh
                // re-ingestion if previously skipped
                List<Question> matchingHash = questionRepo.findByFileHash(
                                computeHash(qBytes, aBytes));
                if (!matchingHash.isEmpty()) {
                        System.out.println(
                                        "Clearing " + matchingHash.size()
                                                        + " stale hash-matched questions for clean master ingestion");
                        questionRepo.deleteAll(matchingHash);
                }

                MockMultipartFile qMultipart = new MockMultipartFile(
                                "questionPdf", "2-Final MCQs Question bank Akola District.pdf", "application/pdf",
                                qBytes);
                MockMultipartFile aMultipart = new MockMultipartFile(
                                "answerPdf", "8-MCQs Solution with explanation Akola District.pdf", "application/pdf",
                                aBytes);

                QuestionIngestionService.IngestionResult result = questionIngestionService.ingestQuestionBankPdfs(
                                qMultipart, aMultipart, "maharashtra", "akola", "master");

                assertNotNull(result, "Ingestion result should not be null");
                assertTrue(result.isSuccess(), "Ingestion should succeed: " + result.getMessage());

                System.out.println("INGESTION_RESULT_MESSAGE: " + result.getMessage());
                System.out.println("INGESTION_RESULT_TOTAL_PARSED: " + result.getTotalParsed());

                List<Question> newlyIngested = questionRepo.findByFileHash(result.getFileHash());
                System.out.println("NEWLY_INGESTED_QUESTIONS_COUNT: " + newlyIngested.size());
                if (TestPdfFixtureUtil.isUsingRealAkolaPdf()) {
                        assertTrue(newlyIngested.size() >= 118,
                                        "Expected at least 118 parsed questions from real Akola PDF ingestion");
                } else {
                        assertEquals(136, newlyIngested.size(),
                                        "Expected exactly 136 parsed questions from synthetic PDF");
                }

                // Perform bulk publish only on newly ingested DRAFT/REVIEW_REQUIRED questions
                int publishedCount = 0;
                for (Question q : newlyIngested) {
                        if ("DRAFT".equalsIgnoreCase(q.getStatus())
                                        || "REVIEW_REQUIRED".equalsIgnoreCase(q.getStatus())) {
                                q.setStatus("PUBLISHED");
                                q.setIsActive(true);
                                q.setPublishedAt(Instant.now());
                                q.setUpdatedAt(Instant.now());
                                questionRepo.save(q);
                                publishedCount++;
                        }
                }
                System.out.println("BULK_PUBLISHED_COUNT: " + publishedCount);

                // Post-ingestion read-only verification
                List<Question> allAkolaAfter = questionRepo.findByStateSlugAndDistrictSlug("maharashtra", "akola");
                System.out.println("AFTER_INGESTION_TOTAL_AKOLA_COUNT: " + allAkolaAfter.size());

                long masterPdfCount = allAkolaAfter.stream()
                                .filter(q -> result.getFileHash().equals(q.getFileHash()))
                                .count();
                System.out.println("FINAL_INGESTED_PDF_QUESTIONS_COUNT: " + masterPdfCount);

                long publishedActiveMaster = allAkolaAfter.stream()
                                .filter(q -> result.getFileHash().equals(q.getFileHash())
                                                && "PUBLISHED".equalsIgnoreCase(q.getStatus())
                                                && Boolean.TRUE.equals(q.getIsActive()))
                                .count();
                System.out.println("FINAL_PUBLISHED_ACTIVE_PDF_QUESTIONS_COUNT: " + publishedActiveMaster);

                Set<String> distinctIds = new HashSet<>();
                Set<String> duplicateIds = new HashSet<>();
                for (Question q : newlyIngested) {
                        if (!distinctIds.add(q.getId())) {
                                duplicateIds.add(q.getId());
                        }
                }
                System.out.println("NEWLY_INGESTED_DISTINCT_IDS: " + distinctIds.size());
                System.out.println("NEWLY_INGESTED_DUPLICATE_IDS: " + duplicateIds.size());

                long missingText = newlyIngested.stream()
                                .filter(q -> q.getQuestion() == null || q.getQuestion().isBlank())
                                .count();
                long missingOptions = newlyIngested.stream()
                                .filter(q -> q.getOptions() == null || q.getOptions().size() < 4)
                                .count();
                long missingAnswers = newlyIngested.stream().filter(q -> q.getCorrectAnswer() == null).count();
                long missingExplanations = newlyIngested.stream()
                                .filter(q -> q.getExplanation() == null || q.getExplanation().isBlank()).count();

                System.out.println("NEWLY_INGESTED_MISSING_TEXT: " + missingText);
                System.out.println("NEWLY_INGESTED_MISSING_OPTIONS: " + missingOptions);
                System.out.println("NEWLY_INGESTED_MISSING_ANSWERS: " + missingAnswers);
                System.out.println("NEWLY_INGESTED_MISSING_EXPLANATIONS: " + missingExplanations);

                assertEquals(0, missingText, "No missing question text allowed");
                if (!TestPdfFixtureUtil.isUsingRealAkolaPdf()) {
                        assertEquals(0, missingOptions, "No missing options allowed");
                        assertEquals(0, missingAnswers, "No missing correct answers allowed");
                        assertEquals(0, missingExplanations, "No missing explanations allowed");
                }
        }

        private String computeHash(byte[] q, byte[] a) {
                try {
                        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                        digest.update(q);
                        digest.update(a);
                        byte[] hash = digest.digest();
                        StringBuilder hexString = new StringBuilder();
                        for (byte b : hash) {
                                String hex = Integer.toHexString(0xff & b);
                                if (hex.length() == 1)
                                        hexString.append('0');
                                hexString.append(hex);
                        }
                        return hexString.toString();
                } catch (Exception e) {
                        return "";
                }
        }
}
