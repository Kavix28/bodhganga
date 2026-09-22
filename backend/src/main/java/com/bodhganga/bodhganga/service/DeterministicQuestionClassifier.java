package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.services.GroqAiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Deterministic Question Classifier for per-question classification (FOUNDATION vs STATEMENT_BASED).
 * Operates strictly PER QUESTION on structural properties (NOT topic or subject difficulty).
 * Only falls back to Groq TEXT AI reasoning for ambiguous questions where deterministic rules are uncertain.
 */
@Component
public class DeterministicQuestionClassifier {

    private static final Logger log = LoggerFactory.getLogger(DeterministicQuestionClassifier.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public enum ClassificationResult {
        FOUNDATION,
        STATEMENT_BASED,
        REVIEW_REQUIRED
    }

    public enum ClassificationSource {
        DETERMINISTIC,
        GROQ,
        MANUAL_REVIEW
    }

    public enum ConfidenceLevel {
        HIGH,
        MEDIUM,
        LOW
    }

    public static class QuestionClassification {
        private final ClassificationResult classification;
        private final ClassificationSource source;
        private final ConfidenceLevel confidenceLevel;
        private final double confidenceScore;
        private final List<String> matchedSignals;
        private final String reason;

        public QuestionClassification(ClassificationResult classification, ClassificationSource source,
                                      ConfidenceLevel confidenceLevel, double confidenceScore,
                                      List<String> matchedSignals, String reason) {
            this.classification = classification;
            this.source = source;
            this.confidenceLevel = confidenceLevel;
            this.confidenceScore = confidenceScore;
            this.matchedSignals = matchedSignals != null ? matchedSignals : List.of();
            this.reason = reason;
        }

        public QuestionClassification(ClassificationResult classification, ClassificationSource source,
                                      double confidenceScore, String reason) {
            this(classification, source,
                    confidenceScore >= 0.85 ? ConfidenceLevel.HIGH : (confidenceScore >= 0.50 ? ConfidenceLevel.MEDIUM : ConfidenceLevel.LOW),
                    confidenceScore, List.of(), reason);
        }

        public ClassificationResult getClassification() { return classification; }
        public ClassificationSource getSource() { return source; }
        public ConfidenceLevel getConfidenceLevel() { return confidenceLevel; }
        public double getConfidence() { return confidenceScore; }
        public double getConfidenceScore() { return confidenceScore; }
        public List<String> getMatchedSignals() { return matchedSignals; }
        public String getReason() { return reason; }
    }

    private final GroqAiService groqAiService;

    @Autowired
    public DeterministicQuestionClassifier(GroqAiService groqAiService) {
        this.groqAiService = groqAiService;
    }

    public DeterministicQuestionClassifier() {
        this(null);
    }

    private static final Pattern STATEMENT_MARKER_PATTERN = Pattern.compile(
            "(?i)(?:statement\\s*(?:i{1,3}|iv|v|[1-5])|consider the following statements?|which of the statements?|assertion(?:\\s*\\([aA]\\)|\\s+[aA]:?)|reason(?:\\s*\\([rR]\\)|\\s+[rR]:?)|match list[- ]?i|match list|match the following|pairs? given above|chronological order|arrange in correct sequence|correct sequence)"
    );

    private static final Pattern MULTI_OPTION_COMBO_PATTERN = Pattern.compile(
            "(?i)(?:1\\s*(?:and|&|,)\\s*2|2\\s*(?:and|&|,)\\s*3|1,\\s*2\\s*and\\s*3|neither\\s*1\\s*nor\\s*2|both\\s+top?\\w*\\s*and|both\\s+[a-z0-9]+\\s+and\\s+[a-z0-9]+|only\\s*1|only\\s*2|1\\s*only|2\\s*only|3\\s*only|all\\s*of\\s*the\\s*above|none\\s*of\\s*the\\s*above|[a-z0-9]+\\s+is\\s+true|[a-z0-9]+\\s+is\\s+false)"
    );

    private static final Pattern NUMBERED_STATEMENTS_PATTERN = Pattern.compile(
            "(?m)^\\s*(?:\\(?[1-5]\\)?|[iI]{1,3}|[aA])\\.\\s+.+$"
    );

    public QuestionClassification classifyQuestion(String questionText, List<String> options) {
        return classifyQuestion(questionText, options, null);
    }

    public QuestionClassification classifyQuestion(String questionText, List<String> options, String existingHeaderLevel) {
        List<String> matchedSignals = new ArrayList<>();

        // Check 1: Malformed / Empty Question Text -> REVIEW_REQUIRED
        if (questionText == null || questionText.isBlank() || questionText.trim().length() < 10) {
            return new QuestionClassification(
                    ClassificationResult.REVIEW_REQUIRED,
                    ClassificationSource.DETERMINISTIC,
                    ConfidenceLevel.LOW,
                    0.0,
                    List.of("MALFORMED_QUESTION_TEXT"),
                    "Question text is missing, empty, or incomplete (<10 chars)"
            );
        }

        // Check 2: Incomplete or Missing Options for MCQ -> REVIEW_REQUIRED if no options or only 1 option
        if (options == null || options.isEmpty() || options.size() < 2) {
            return new QuestionClassification(
                    ClassificationResult.REVIEW_REQUIRED,
                    ClassificationSource.DETERMINISTIC,
                    ConfidenceLevel.LOW,
                    0.20,
                    List.of("INSUFFICIENT_OPTIONS"),
                    "Insufficient options found (<2 options available for MCQ)"
            );
        }

        String qLower = questionText.toLowerCase(Locale.ROOT);
        String combinedOptionsStr = String.join(" ", options).toLowerCase(Locale.ROOT);

        // Header hint override if explicitly stated in document section
        boolean headerSuggestsStatement = "upsc-level".equalsIgnoreCase(existingHeaderLevel)
                || "statement-based".equalsIgnoreCase(existingHeaderLevel)
                || "statement_based".equalsIgnoreCase(existingHeaderLevel);

        boolean headerSuggestsFoundation = "foundation".equalsIgnoreCase(existingHeaderLevel);

        if (headerSuggestsStatement) matchedSignals.add("HEADER_HINT_STATEMENT_BASED");
        if (headerSuggestsFoundation) matchedSignals.add("HEADER_HINT_FOUNDATION");

        // Structural Rule 1: Explicit Statement-Based indicators in question text or options
        boolean matchesStatementMarker = STATEMENT_MARKER_PATTERN.matcher(qLower).find();
        if (matchesStatementMarker) matchedSignals.add("STATEMENT_MARKER_KEYWORD");

        boolean matchesComboPattern = MULTI_OPTION_COMBO_PATTERN.matcher(combinedOptionsStr).find()
                || MULTI_OPTION_COMBO_PATTERN.matcher(qLower).find();
        if (matchesComboPattern) matchedSignals.add("MULTI_OPTION_COMBINATION");

        int statementCount = countNumberedStatements(questionText);
        boolean matchesNumberedStatements = statementCount >= 2;
        if (matchesNumberedStatements) matchedSignals.add("NUMBERED_STATEMENTS_COUNT_" + statementCount);

        if (matchesStatementMarker || matchesNumberedStatements || matchesComboPattern || headerSuggestsStatement) {
            return new QuestionClassification(
                    ClassificationResult.STATEMENT_BASED,
                    ClassificationSource.DETERMINISTIC,
                    ConfidenceLevel.HIGH,
                    0.95,
                    matchedSignals,
                    "Matched structural statement-based patterns (statements/assertions/multi-combos/numbered items)"
            );
        }

        // Structural Rule 2: Direct Foundation Question indicators (single factual recall, standard options)
        boolean hasNormalOptions = options.size() >= 4;
        if (hasNormalOptions) matchedSignals.add("STANDARD_4_OPTIONS");

        boolean isShortPrompt = qLower.length() < 300;
        boolean isFactualPrompt = qLower.contains("which") || qLower.contains("what") || qLower.contains("where")
                || qLower.contains("who") || qLower.contains("when") || qLower.contains("how many")
                || qLower.contains("capital") || qLower.contains("district") || qLower.contains("located")
                || qLower.contains("defined as") || qLower.contains("known as") || qLower.contains("headquarters")
                || headerSuggestsFoundation;
        if (isFactualPrompt) matchedSignals.add("DIRECT_FACTUAL_QUESTION_PROMPT");

        if (hasNormalOptions && (isShortPrompt || isFactualPrompt)) {
            return new QuestionClassification(
                    ClassificationResult.FOUNDATION,
                    ClassificationSource.DETERMINISTIC,
                    ConfidenceLevel.HIGH,
                    0.95,
                    matchedSignals,
                    "Matched structural foundation patterns (direct factual MCQ with standalone options)"
            );
        }

        // Structural Rule 3: Ambiguous / Edge cases -> Fallback to Groq TEXT reasoning if available
        matchedSignals.add("AMBIGUOUS_STRUCTURE");
        QuestionClassification localResult = new QuestionClassification(
                ClassificationResult.REVIEW_REQUIRED,
                ClassificationSource.DETERMINISTIC,
                ConfidenceLevel.LOW,
                0.50,
                matchedSignals,
                "Ambiguous classification from deterministic analysis (insufficient structural evidence)"
        );

        if (groqAiService != null && groqAiService.hasApiKey()) {
            try {
                return refineWithGroqText(questionText, options, localResult);
            } catch (Exception e) {
                log.warn("Groq TEXT classification fallback failed for question: {}. Using deterministic result.", e.getMessage());
            }
        }

        return localResult;
    }

    private QuestionClassification refineWithGroqText(String questionText, List<String> options, QuestionClassification fallback) {
        String systemPrompt = "You are an expert competitive exam question classifier.\n" +
                "Classify the provided multiple-choice question into either 'FOUNDATION' or 'STATEMENT_BASED'.\n" +
                "- 'STATEMENT_BASED': Question includes multi-clause statements, assertions, matching pairs, or multi-statement combinations.\n" +
                "- 'FOUNDATION': Direct factual recall or single-concept question.\n" +
                "Return ONLY a valid JSON object formatted as:\n" +
                "{\n" +
                "  \"classification\": \"FOUNDATION\" or \"STATEMENT_BASED\",\n" +
                "  \"confidence\": 0.95,\n" +
                "  \"reason\": \"Brief explanation\"\n" +
                "}";

        String userPrompt = "Question Text:\n" + questionText + "\n\nOptions:\n" + (options != null ? options : "[]");

        String resJson = groqAiService.callGroqJson(systemPrompt, userPrompt);
        if (resJson != null && !resJson.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(cleanJsonResponse(resJson));
                String classStr = root.path("classification").asText("");
                double conf = root.path("confidence").asDouble(0.90);
                String reason = root.path("reason").asText("Groq text model classification");

                if ("STATEMENT_BASED".equalsIgnoreCase(classStr)) {
                    return new QuestionClassification(ClassificationResult.STATEMENT_BASED, ClassificationSource.GROQ,
                            conf >= 0.85 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM, conf, List.of("GROQ_TEXT_MODEL"), reason);
                } else if ("FOUNDATION".equalsIgnoreCase(classStr)) {
                    return new QuestionClassification(ClassificationResult.FOUNDATION, ClassificationSource.GROQ,
                            conf >= 0.85 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM, conf, List.of("GROQ_TEXT_MODEL"), reason);
                }
            } catch (Exception e) {
                log.warn("Failed to parse Groq classification JSON: {}", e.getMessage());
            }
        }

        return fallback;
    }

    private int countNumberedStatements(String text) {
        int count = 0;
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            if (NUMBERED_STATEMENTS_PATTERN.matcher(line).matches()) {
                count++;
            }
        }
        return count;
    }

    private String cleanJsonResponse(String raw) {
        if (raw == null) return "{}";
        String clean = raw.trim();
        if (clean.startsWith("```json")) clean = clean.substring(7);
        if (clean.startsWith("```")) clean = clean.substring(3);
        if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
        return clean.trim();
    }
}
