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
     * Backward-compatible parsing method.
     */
    public List<QBQuestion> parseQuestionsFromText(String pdfText, String state, String stateSlug,
            String exam, String examSlug,
            String subject, String subjectSlug,
            String googleDriveFileId, String s3Key) {
        return parseQuestionsFromText(pdfText, null, state, stateSlug, "General", "general",
                exam, examSlug, subject, subjectSlug, googleDriveFileId, s3Key);
    }

    /**
     * Full Production Question Bank parsing method supporting Answer Key matching,
     * State & District hierarchy.
     */
    public List<QBQuestion> parseQuestionsFromText(String pdfText, String answerKeyText,
            String state, String stateSlug,
            String district, String districtSlug,
            String exam, String examSlug,
            String subject, String subjectSlug,
            String googleDriveFileId, String s3Key) {
        log.info("[GEMINI QB PARSER] Parsing questions for State={} ({}), District={} ({}), Exam={}, Subject={}",
                state, stateSlug, district, districtSlug, exam, subject);

        List<QBQuestion> questions = new ArrayList<>();
        if (pdfText == null || pdfText.isBlank()) {
            log.warn("[GEMINI QB PARSER] Empty pdfText passed for stateSlug={}, districtSlug={}", stateSlug,
                    districtSlug);
            return questions;
        }

        String prompt = buildGeminiPrompt(pdfText, answerKeyText);

        try {
            String rawJsonResponse = geminiAiService.generalChat(Collections.emptyList(), prompt);
            String jsonArray = cleanJsonResponse(rawJsonResponse);

            List<Map<String, Object>> parsedList = objectMapper.readValue(
                    jsonArray, new TypeReference<List<Map<String, Object>>>() {
                    });

            for (Map<String, Object> map : parsedList) {
                QBQuestion q = new QBQuestion();
                q.setState(state != null ? state : "General");
                q.setStateSlug(stateSlug != null ? stateSlug : "general");
                q.setDistrict(district != null ? district : "General");
                q.setDistrictSlug(districtSlug != null ? districtSlug : "general");
                q.setExam(exam != null ? exam : "State Exams");
                q.setExamSlug(examSlug != null ? examSlug : "state-exams");
                q.setSubject(subject != null ? subject : "General Knowledge");
                q.setSubjectSlug(subjectSlug != null ? subjectSlug : "general-knowledge");
                q.setGoogleDriveFileId(googleDriveFileId);
                q.setS3Key(s3Key);

                String qText = (String) map.getOrDefault("questionText", "");
                q.setQuestionText(qText != null ? qText.trim() : "");

                List<Map<String, Object>> rawOpts = (List<Map<String, Object>>) map.get("options");
                List<QBQuestion.QBOption> opts = new ArrayList<>();
                StringBuilder optionsSb = new StringBuilder();

                if (rawOpts != null) {
                    for (Map<String, Object> optMap : rawOpts) {
                        String optId = (String) optMap.get("id");
                        String optText = (String) optMap.get("text");
                        Boolean isCorr = Boolean.TRUE.equals(optMap.get("isCorrect"));
                        if (optId != null && optText != null) {
                            opts.add(new QBQuestion.QBOption(optId.trim().toUpperCase(), optText.trim(), isCorr));
                            optionsSb.append(optId.trim().toUpperCase()).append(":").append(optText.trim()).append(";");
                        }
                    }
                }
                q.setOptions(opts);

                String corrAns = (String) map.get("correctAnswer");
                if (corrAns != null) {
                    corrAns = corrAns.trim().toUpperCase();
                } else {
                    // Look for option marked isCorrect = true
                    for (QBQuestion.QBOption opt : opts) {
                        if (Boolean.TRUE.equals(opt.getIsCorrect())) {
                            corrAns = opt.getId();
                            break;
                        }
                    }
                }
                q.setCorrectAnswer(corrAns);
                q.setExplanation((String) map.getOrDefault("explanation", ""));

                String diff = (String) map.getOrDefault("difficulty", "MEDIUM");
                if (diff != null) {
                    diff = diff.trim().toUpperCase();
                    if (!Set.of("EASY", "MEDIUM", "HARD").contains(diff)) {
                        diff = "MEDIUM";
                    }
                } else {
                    diff = "MEDIUM";
                }
                q.setDifficulty(diff);

                Double conf = map.containsKey("confidenceScore") ? ((Number) map.get("confidenceScore")).doubleValue()
                        : 0.9;
                q.setConfidenceScore(conf);
                q.setNeedsReview(conf < 0.85);

                q.setChapter((String) map.getOrDefault("chapter", q.getSubject()));
                q.setChapterSlug(generateSlug(q.getChapter()));
                q.setTopic((String) map.getOrDefault("topic", "General"));
                q.setTopicSlug(generateSlug(q.getTopic()));
                q.setLanguage((String) map.getOrDefault("language", "en"));
                q.setPublished(true);

                // SHA-256 Hash for deduplication
                String hash = calculateSHA256(q.getQuestionText() + "|" + optionsSb.toString());
                q.setQuestionHash(hash);

                // Strict Validation (Requirement 9)
                String validationError = validateQuestion(q);
                if (validationError != null) {
                    log.warn(
                            "[GEMINI QB PARSER][REJECTED] Question failed validation: {} (State={}, District={}, FileID={})",
                            validationError, stateSlug, districtSlug, googleDriveFileId);
                    continue;
                }

                questions.add(q);
            }

            log.info("[GEMINI QB PARSER] Successfully extracted & validated {} questions.", questions.size());

        } catch (Exception e) {
            log.error("[GEMINI QB PARSER] Failed to parse questions: {}", e.getMessage(), e);
        }

        return questions;
    }

    /**
     * Requirement 9: Strict QBQuestion Validation
     */
    public static String validateQuestion(QBQuestion q) {
        if (q == null)
            return "Question entity is null";
        if (q.getQuestionText() == null || q.getQuestionText().isBlank()) {
            return "questionText is blank";
        }
        if (q.getOptions() == null || q.getOptions().size() < 2) {
            return "Fewer than 2 options provided (" + (q.getOptions() == null ? 0 : q.getOptions().size()) + ")";
        }
        if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
            return "correctAnswer is missing or blank";
        }
        boolean validOptionMatch = q.getOptions().stream()
                .anyMatch(opt -> opt.getId() != null && opt.getId().equalsIgnoreCase(q.getCorrectAnswer()));
        if (!validOptionMatch) {
            return "correctAnswer '" + q.getCorrectAnswer() + "' does not match any option ID";
        }
        if (q.getDifficulty() == null || !Set.of("EASY", "MEDIUM", "HARD").contains(q.getDifficulty())) {
            return "Invalid difficulty: " + q.getDifficulty();
        }
        if (q.getStateSlug() == null || q.getStateSlug().isBlank()) {
            return "stateSlug is missing";
        }
        if (q.getDistrictSlug() == null || q.getDistrictSlug().isBlank()) {
            return "districtSlug is missing";
        }
        if (q.getGoogleDriveFileId() == null || q.getGoogleDriveFileId().isBlank()) {
            return "googleDriveFileId is missing";
        }
        return null; // Passed validation
    }

    private String buildGeminiPrompt(String text, String answerKeyText) {
        StringBuilder sb = new StringBuilder();
        sb.append(
                "You are an expert exam question extractor. Extract all MCQs from the following text into a valid JSON array.\n");
        sb.append("CRITICAL INSTRUCTIONS:\n");
        sb.append(
                "1. If an Answer Key text is provided below, it is AUTHORITATIVE. Correct answers MUST come directly from the Answer Key.\n");
        sb.append(
                "2. NEVER invent, guess, or fabricate a correct answer. If no answer key is present and no inline answer/solution exists, do NOT manufacture an answer.\n");
        sb.append("3. \"difficulty\" MUST be strictly one of: \"EASY\", \"MEDIUM\", \"HARD\".\n");
        sb.append("4. Each JSON object in the array MUST have:\n");
        sb.append("   - \"questionText\": String\n");
        sb.append("   - \"options\": Array of {\"id\": \"A\", \"text\": \"...\", \"isCorrect\": true/false}\n");
        sb.append("   - \"correctAnswer\": String (e.g. \"A\", \"B\", \"C\", \"D\")\n");
        sb.append("   - \"explanation\": String\n");
        sb.append("   - \"difficulty\": String (\"EASY\", \"MEDIUM\", \"HARD\")\n");
        sb.append("   - \"confidenceScore\": Number between 0.0 and 1.0\n");
        sb.append("   - \"chapter\": String\n");
        sb.append("   - \"topic\": String\n");
        sb.append("   - \"language\": String (\"en\" or \"hi\")\n\n");
        sb.append("Output ONLY raw valid JSON array. No markdown formatting, no code blocks.\n\n");
        sb.append("QUESTION TEXT:\n").append(text).append("\n\n");

        if (answerKeyText != null && !answerKeyText.isBlank()) {
            sb.append("AUTHORITATIVE ANSWER KEY TEXT:\n").append(answerKeyText).append("\n\n");
        }

        return sb.toString();
    }

    private String cleanJsonResponse(String raw) {
        if (raw == null)
            return "[]";
        String clean = raw.trim();
        if (clean.startsWith("```json"))
            clean = clean.substring(7);
        if (clean.startsWith("```"))
            clean = clean.substring(3);
        if (clean.endsWith("```"))
            clean = clean.substring(0, clean.length() - 3);
        return clean.trim();
    }

    public static String calculateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    public static String generateSlug(String input) {
        if (input == null)
            return "";
        return input.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
