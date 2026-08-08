package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.services.GeminiAiService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class GeminiQuestionParserService {

    private static final Logger log = LoggerFactory.getLogger(GeminiQuestionParserService.class);

    private final GeminiAiService geminiAiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiQuestionParserService(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    /**
     * Parses PDF text/content using Gemini AI into structured QBQuestion entities.
     * Gemini is invoked ONLY during ingestion.
     */
    public List<QBQuestion> parseQuestionsFromText(String pdfText, String state, String stateSlug,
                                                  String exam, String examSlug,
                                                  String subject, String subjectSlug,
                                                  String googleDriveFileId, String s3Key) {
        log.info("[GEMINI QB PARSER] Parsing questions for State={}, Exam={}, Subject={}", state, exam, subject);
        
        List<QBQuestion> questions = new ArrayList<>();
        if (pdfText == null || pdfText.isBlank()) {
            return questions;
        }

        String prompt = buildGeminiPrompt(pdfText);

        try {
            String rawJsonResponse = geminiAiService.generalChat(Collections.emptyList(), prompt);
            String jsonArray = cleanJsonResponse(rawJsonResponse);

            List<Map<String, Object>> parsedList = objectMapper.readValue(
                    jsonArray, new TypeReference<List<Map<String, Object>>>() {}
            );

            for (Map<String, Object> map : parsedList) {
                QBQuestion q = new QBQuestion();
                q.setState(state);
                q.setStateSlug(stateSlug);
                q.setExam(exam);
                q.setExamSlug(examSlug);
                q.setSubject(subject);
                q.setSubjectSlug(subjectSlug);
                q.setGoogleDriveFileId(googleDriveFileId);
                q.setS3Key(s3Key);

                String qText = (String) map.getOrDefault("questionText", "");
                q.setQuestionText(qText);

                List<Map<String, Object>> rawOpts = (List<Map<String, Object>>) map.get("options");
                List<QBQuestion.QBOption> opts = new ArrayList<>();
                StringBuilder optionsSb = new StringBuilder();

                if (rawOpts != null) {
                    for (Map<String, Object> optMap : rawOpts) {
                        String optId = (String) optMap.get("id");
                        String optText = (String) optMap.get("text");
                        Boolean isCorr = Boolean.TRUE.equals(optMap.get("isCorrect"));
                        opts.add(new QBQuestion.QBOption(optId, optText, isCorr));
                        optionsSb.append(optId).append(":").append(optText).append(";");
                    }
                }
                q.setOptions(opts);

                q.setCorrectAnswer((String) map.getOrDefault("correctAnswer", "A"));
                q.setExplanation((String) map.getOrDefault("explanation", ""));
                
                String diff = (String) map.getOrDefault("difficulty", "MEDIUM");
                q.setDifficulty(diff.toUpperCase());

                Double conf = map.containsKey("confidenceScore") ? ((Number) map.get("confidenceScore")).doubleValue() : 0.9;
                q.setConfidenceScore(conf);
                q.setNeedsReview(conf < 0.85);

                q.setChapter((String) map.getOrDefault("chapter", subject));
                q.setChapterSlug(generateSlug(q.getChapter()));
                q.setTopic((String) map.getOrDefault("topic", "General"));
                q.setTopicSlug(generateSlug(q.getTopic()));
                q.setLanguage((String) map.getOrDefault("language", "en"));

                // Calculate SHA-256 hash for deduplication
                String hash = calculateSHA256(qText + "|" + optionsSb.toString());
                q.setQuestionHash(hash);

                questions.add(q);
            }

            log.info("[GEMINI QB PARSER] Successfully extracted {} questions.", questions.size());

        } catch (Exception e) {
            log.error("[GEMINI QB PARSER] Failed to parse questions: {}", e.getMessage(), e);
        }

        return questions;
    }

    private String buildGeminiPrompt(String text) {
        return "You are an expert exam question extractor. Extract all MCQs from the following text into a valid JSON array.\n" +
               "If solutions are present at the end of the text, accurately correlate each solution to its corresponding question.\n\n" +
               "Each JSON object must have:\n" +
               "- \"questionText\": String\n" +
               "- \"options\": Array of {\"id\": \"A\", \"text\": \"...\", \"isCorrect\": true/false}\n" +
               "- \"correctAnswer\": String (e.g. \"A\")\n" +
               "- \"explanation\": String\n" +
               "- \"difficulty\": String (\"EASY\", \"MEDIUM\", \"HARD\")\n" +
               "- \"confidenceScore\": Number between 0.0 and 1.0 (based on solution mapping confidence)\n" +
               "- \"chapter\": String\n" +
               "- \"topic\": String\n" +
               "- \"language\": String (\"en\" or \"hi\")\n\n" +
               "Output ONLY raw valid JSON array. No markdown formatting, no code blocks.\n\n" +
               "TEXT:\n" + text;
    }

    private String cleanJsonResponse(String raw) {
        if (raw == null) return "[]";
        String clean = raw.trim();
        if (clean.startsWith("```json")) clean = clean.substring(7);
        if (clean.startsWith("```")) clean = clean.substring(3);
        if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
        return clean.trim();
    }

    public static String calculateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    public static String generateSlug(String input) {
        if (input == null) return "";
        return input.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
