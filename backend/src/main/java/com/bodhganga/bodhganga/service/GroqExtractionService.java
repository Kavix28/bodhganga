package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.services.GroqAiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GroqExtractionService {

    private static final Logger log = LoggerFactory.getLogger(GroqExtractionService.class);

    private final GroqAiService groqAiService;
    private final QuestionParserService questionParserService;
    private final AnswerParserService answerParserService;
    private final OcrTextNormalizationService normalizationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public GroqExtractionService(GroqAiService groqAiService,
            QuestionParserService questionParserService,
            AnswerParserService answerParserService,
            OcrTextNormalizationService normalizationService) {
        this.groqAiService = groqAiService;
        this.questionParserService = questionParserService;
        this.answerParserService = answerParserService;
        this.normalizationService = normalizationService;
    }

    private static final String QUESTION_EXTRACTION_SYSTEM_PROMPT = "You are an expert Question Bank document parser and classifier for Indian state competitive exams.\n"
            + "Analyze the provided Question Bank text and extract all multiple-choice questions.\n\n"
            + "For each question:\n"
            + "1. questionNumber: integer question index (e.g. 1, 2, 3...)\n"
            + "2. questionText: string full question prompt including introductory text or statements if present.\n"
            + "3. options: array of 4 strings representing option text for (A), (B), (C), (D) or (a), (b), (c), (d).\n"
            + "4. sourceSection: section topic header if present (e.g., 'History', 'Geography', 'Economy, Agriculture & Development', 'Art & Culture', 'Heritage & Monuments', 'State Polity & Administration').\n"
            + "5. classification: 'FOUNDATION' or 'STATEMENT_BASED'.\n"
            + "   - 'STATEMENT_BASED': Question contains multiple numbered statements (Statement I/II, 1 and 2), multi-clause reasoning, matching pairs, chronology, assertion/reason, or UPSC/MPSC style statements.\n"
            + "   - 'FOUNDATION': Direct factual single-choice question.\n"
            + "   - If ambiguous or uncertain, set classification to 'REVIEW_REQUIRED'.\n"
            + "6. classificationConfidence: float between 0.0 and 1.0.\n\n"
            + "Return ONLY a valid JSON object formatted as:\n"
            + "{\n"
            + "  \"questions\": [\n"
            + "    {\n"
            + "      \"questionNumber\": 1,\n"
            + "      \"questionText\": \"...\",\n"
            + "      \"options\": [\"...\", \"...\", \"...\", \"...\"],\n"
            + "      \"sourceSection\": \"History\",\n"
            + "      \"classification\": \"FOUNDATION\",\n"
            + "      \"classificationConfidence\": 0.98\n"
            + "    }\n"
            + "  ]\n"
            + "}";

    private static final String SOLUTION_EXTRACTION_SYSTEM_PROMPT = "You are an expert Solution PDF document parser for Indian state competitive exams.\n"
            + "Analyze the provided Answer / Solution text and extract all answer keys and explanations.\n\n"
            + "For each solution:\n"
            + "1. questionNumber: integer question index (e.g. 1, 2, 3...)\n"
            + "2. correctOption: integer (0 for A/1/a, 1 for B/2/b, 2 for C/3/c, 3 for D/4/d).\n"
            + "3. answerText: string option title or answer label if given.\n"
            + "4. explanation: string full detailed explanation text.\n\n"
            + "Return ONLY a valid JSON object formatted as:\n"
            + "{\n"
            + "  \"solutions\": [\n"
            + "    {\n"
            + "      \"questionNumber\": 1,\n"
            + "      \"correctOption\": 0,\n"
            + "      \"answerText\": \"...\",\n"
            + "      \"explanation\": \"...\"\n"
            + "    }\n"
            + "  ]\n"
            + "}";

    public List<QuestionParserService.ParsedQuestion> extractQuestionsFromPdfBytes(byte[] pdfBytes,
            List<String> fallbackPageTexts) {
        return extractQuestions(fallbackPageTexts);
    }

    public Map<Integer, AnswerParserService.ParsedAnswer> extractSolutionsFromPdfBytes(byte[] pdfBytes,
            List<String> fallbackPageTexts) {
        return extractSolutions(fallbackPageTexts);
    }

    public List<QuestionParserService.ParsedQuestion> extractQuestions(List<String> pageTexts) {
        if (groqAiService != null && groqAiService.hasApiKey() && pageTexts != null && !pageTexts.isEmpty()) {
            try {
                List<QuestionParserService.ParsedQuestion> groqResult = extractQuestionsViaGroqText(pageTexts);
                if (groqResult != null && !groqResult.isEmpty()) {
                    log.info("Successfully extracted {} questions via Groq Text AI", groqResult.size());
                    return groqResult;
                }
            } catch (Exception e) {
                log.warn("Groq Text AI question extraction failed, falling back to deterministic parser: {}",
                        e.getMessage());
            }
        }
        log.info("Using deterministic QuestionParserService fallback");
        return questionParserService.parseQuestionsFromPages(pageTexts);
    }

    public Map<Integer, AnswerParserService.ParsedAnswer> extractSolutions(List<String> pageTexts) {
        if (groqAiService != null && groqAiService.hasApiKey() && pageTexts != null && !pageTexts.isEmpty()) {
            try {
                Map<Integer, AnswerParserService.ParsedAnswer> groqResult = extractSolutionsViaGroqText(pageTexts);
                if (groqResult != null && !groqResult.isEmpty()) {
                    log.info("Successfully extracted {} solutions via Groq Text AI", groqResult.size());
                    return groqResult;
                }
            } catch (Exception e) {
                log.warn("Groq Text AI solution extraction failed, falling back to deterministic parser: {}",
                        e.getMessage());
            }
        }
        log.info("Using deterministic AnswerParserService fallback");
        return answerParserService.parseAnswersFromPages(pageTexts);
    }



    public void refineQuestionClassificationWithGroqText(List<QuestionParserService.ParsedQuestion> questions) {
        if (groqAiService == null || !groqAiService.hasApiKey() || questions == null || questions.isEmpty()) {
            return;
        }

        for (QuestionParserService.ParsedQuestion q : questions) {
            if (q.getLevel() == null || q.isSuspicious()) {
                try {
                    String prompt = "Classify this MCQ into 'FOUNDATION' or 'STATEMENT_BASED':\n"
                            + "Question: " + q.getQuestionText() + "\n"
                            + "Options: " + q.getOptions() + "\n"
                            + "Respond in JSON: {\"classification\": \"FOUNDATION\" or \"STATEMENT_BASED\"}";
                    String resJson = groqAiService.callGroqJson(
                            "You are a test classifier. Output ONLY JSON with classification field.", prompt);
                    if (resJson != null && resJson.contains("STATEMENT_BASED")) {
                        q.setLevel("upsc-level");
                        q.setSuspicious(false);
                    } else if (resJson != null && resJson.contains("FOUNDATION")) {
                        q.setLevel("foundation");
                        q.setSuspicious(false);
                    }
                } catch (Exception e) {
                    log.debug("Groq text classification refinement skipped: {}", e.getMessage());
                }
            }
        }
    }

    private List<QuestionParserService.ParsedQuestion> extractQuestionsViaGroqText(List<String> pageTexts) {
        List<QuestionParserService.ParsedQuestion> allQuestions = new ArrayList<>();
        int pagesPerChunk = 3;

        for (int i = 0; i < pageTexts.size(); i += pagesPerChunk) {
            int end = Math.min(i + pagesPerChunk, pageTexts.size());
            StringBuilder chunkBuilder = new StringBuilder();
            for (int p = i; p < end; p++) {
                chunkBuilder.append("=== PAGE ").append(p + 1).append(" ===\n");
                String normalized = normalizationService != null
                        ? normalizationService.normalizeForMatching(pageTexts.get(p))
                        : pageTexts.get(p);
                chunkBuilder.append(normalized).append("\n\n");
            }

            String chunkText = chunkBuilder.toString();
            if (chunkText.trim().length() < 20) {
                continue;
            }

            try {
                String responseJson = groqAiService.callGroqJson(QUESTION_EXTRACTION_SYSTEM_PROMPT, chunkText);
                List<QuestionParserService.ParsedQuestion> chunkQs = parseQuestionJsonResponse(responseJson, i + 1);
                allQuestions.addAll(chunkQs);
            } catch (Exception e) {
                log.error("Failed to parse Groq question extraction response for chunk starting page {}: {}", i + 1,
                        e.getMessage());
            }
        }

        return allQuestions;
    }

    private Map<Integer, AnswerParserService.ParsedAnswer> extractSolutionsViaGroqText(List<String> pageTexts) {
        Map<Integer, AnswerParserService.ParsedAnswer> solutionsMap = new LinkedHashMap<>();
        int pagesPerChunk = 5;

        for (int i = 0; i < pageTexts.size(); i += pagesPerChunk) {
            int end = Math.min(i + pagesPerChunk, pageTexts.size());
            StringBuilder chunkBuilder = new StringBuilder();
            for (int p = i; p < end; p++) {
                chunkBuilder.append("=== PAGE ").append(p + 1).append(" ===\n");
                chunkBuilder.append(pageTexts.get(p)).append("\n\n");
            }

            String chunkText = chunkBuilder.toString();
            if (chunkText.trim().length() < 20) {
                continue;
            }

            try {
                String responseJson = groqAiService.callGroqJson(SOLUTION_EXTRACTION_SYSTEM_PROMPT, chunkText);
                Map<Integer, AnswerParserService.ParsedAnswer> chunkSols = parseSolutionJsonResponse(responseJson,
                        i + 1);
                solutionsMap.putAll(chunkSols);
            } catch (Exception e) {
                log.error("Failed to parse Groq solution extraction response for chunk starting page {}: {}", i + 1,
                        e.getMessage());
            }
        }

        return solutionsMap;
    }

    private List<QuestionParserService.ParsedQuestion> parseQuestionJsonResponse(String rawJson, int defaultPageNum) {
        List<QuestionParserService.ParsedQuestion> questions = new ArrayList<>();
        if (rawJson == null || rawJson.isBlank()) {
            return questions;
        }

        String sanitizedJson = cleanJsonResponse(rawJson);

        try {
            JsonNode root = objectMapper.readTree(sanitizedJson);
            JsonNode questionsNode = root.get("questions");

            if (questionsNode != null && questionsNode.isArray()) {
                for (JsonNode qNode : questionsNode) {
                    int qNum = qNode.path("questionNumber").asInt(0);
                    String qText = qNode.path("questionText").asText("");
                    String topic = qNode.path("sourceSection").asText("General");
                    String classification = qNode.path("classification").asText("FOUNDATION");
                    double confidence = qNode.path("classificationConfidence").asDouble(0.9);

                    List<String> options = new ArrayList<>();
                    JsonNode optsNode = qNode.get("options");
                    if (optsNode != null && optsNode.isArray()) {
                        for (JsonNode opt : optsNode) {
                            options.add(opt.asText(""));
                        }
                    }

                    boolean isSuspicious = false;
                    String warningReason = null;

                    if (qNum <= 0 || qText.isBlank() || options.size() < 4) {
                        isSuspicious = true;
                        warningReason = "Incomplete question structure from Groq model extraction";
                    }

                    String level;
                    if ("STATEMENT_BASED".equalsIgnoreCase(classification)) {
                        level = "upsc-level";
                    } else if ("FOUNDATION".equalsIgnoreCase(classification)) {
                        level = "foundation";
                    } else {
                        level = null;
                        isSuspicious = true;
                        warningReason = warningReason != null
                                ? warningReason + "; Ambiguous classification requiring review"
                                : "Ambiguous classification requiring review";
                    }

                    QuestionParserService.ParsedQuestion pq = QuestionParserService.ParsedQuestion.builder()
                            .questionNumber(qNum)
                            .questionText(qText)
                            .options(options)
                            .topic(topic != null && !topic.isBlank() ? topic : "General")
                            .level(level)
                            .difficulty("Easy")
                            .pageNumber(defaultPageNum)
                            .isSuspicious(isSuspicious)
                            .warningReason(warningReason)
                            .build();

                    questions.add(pq);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse question JSON response: {}", e.getMessage());
        }

        return questions;
    }

    private Map<Integer, AnswerParserService.ParsedAnswer> parseSolutionJsonResponse(String rawJson,
            int defaultPageNum) {
        Map<Integer, AnswerParserService.ParsedAnswer> solutionsMap = new LinkedHashMap<>();
        if (rawJson == null || rawJson.isBlank()) {
            return solutionsMap;
        }

        String sanitizedJson = cleanJsonResponse(rawJson);

        try {
            JsonNode root = objectMapper.readTree(sanitizedJson);
            JsonNode solutionsNode = root.get("solutions");

            if (solutionsNode != null && solutionsNode.isArray()) {
                for (JsonNode sNode : solutionsNode) {
                    int qNum = sNode.path("questionNumber").asInt(0);
                    int correctOpt = sNode.path("correctOption").asInt(-1);
                    String explanation = sNode.path("explanation").asText("");

                    boolean isSuspicious = false;
                    String warningReason = null;

                    if (qNum <= 0 || correctOpt < 0 || correctOpt > 3 || explanation.isBlank()) {
                        isSuspicious = true;
                        warningReason = "Invalid or incomplete solution fields from Groq model extraction";
                    }

                    AnswerParserService.ParsedAnswer pa = AnswerParserService.ParsedAnswer.builder()
                            .questionNumber(qNum)
                            .correctOptionIndex(correctOpt >= 0 ? correctOpt : 0)
                            .explanation(explanation)
                            .pageNumber(defaultPageNum)
                            .isSuspicious(isSuspicious)
                            .warningReason(warningReason)
                            .build();

                    solutionsMap.put(qNum, pa);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse solution JSON response: {}", e.getMessage());
        }

        return solutionsMap;
    }

    private String cleanJsonResponse(String rawJson) {
        if (rawJson == null)
            return "";
        String trimmed = rawJson.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }
}
