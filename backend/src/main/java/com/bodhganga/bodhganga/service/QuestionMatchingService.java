package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QuestionMatchingService {

    private final OcrTextNormalizationService normalizationService;

    @org.springframework.beans.factory.annotation.Autowired
    public QuestionMatchingService(OcrTextNormalizationService normalizationService) {
        this.normalizationService = normalizationService;
    }

    public QuestionMatchingService() {
        this.normalizationService = new OcrTextNormalizationService();
    }

    private String normalizeForMatching(String text) {
        if (normalizationService != null) {
            return normalizationService.normalizeForMatching(text);
        }
        if (text == null || text.isBlank())
            return "";
        String clean = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFC)
                .toLowerCase(java.util.Locale.ROOT);
        return clean.replaceAll("[^\\p{L}\\p{N}\\p{M}]", " ").replaceAll("\\s+", " ").trim();
    }

    public double calculateSimilarity(String qText, String ansText) {
        if (qText == null || ansText == null || qText.isBlank() || ansText.isBlank()) {
            return 0.0;
        }
        String normQ = normalizeForMatching(qText);
        String normAns = normalizeForMatching(ansText);

        if (normQ.isBlank() || normAns.isBlank()) {
            return 0.0;
        }

        if (normQ.equals(normAns) || normAns.contains(normQ)) {
            return 1.0;
        }

        String[] qWords = normQ.split(" ");
        String[] ansWords = normAns.split(" ");

        java.util.Set<String> qTokens = new java.util.HashSet<>();
        for (String w : qWords) {
            if (w.length() >= 2)
                qTokens.add(w);
        }
        java.util.Set<String> ansTokens = new java.util.HashSet<>();
        for (String w : ansWords) {
            if (w.length() >= 2)
                ansTokens.add(w);
        }

        if (qTokens.isEmpty() || ansTokens.isEmpty()) {
            return 0.0;
        }

        java.util.Set<String> intersection = new java.util.HashSet<>(qTokens);
        intersection.retainAll(ansTokens);

        double tokenOverlap = (double) intersection.size() / qTokens.size();

        java.util.Set<String> union = new java.util.HashSet<>(qTokens);
        union.addAll(ansTokens);
        double jaccard = (double) intersection.size() / union.size();

        double lcsRatio = calculateLcsRatio(normQ, normAns);

        double combinedScore = (0.50 * tokenOverlap) + (0.25 * jaccard) + (0.25 * lcsRatio);

        return Math.min(1.0, Math.max(0.0, Math.round(combinedScore * 1000.0) / 1000.0));
    }

    private double calculateLcsRatio(String s1, String s2) {
        int m = s1.length();
        int n = s2.length();
        if (m == 0 || n == 0)
            return 0.0;
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return (double) dp[m][n] / m;
    }

    public static class MatchResult {
        private final QuestionParserService.ParsedQuestion question;
        private final AnswerParserService.ParsedAnswer answer;
        private final String matchMethod; // QUESTION_NUMBER, NORMALIZED_TEXT, FUZZY_TEXT, QUESTION_NUMBER_CONFLICT, UNMATCHED
        private final double confidence;

        public MatchResult(QuestionParserService.ParsedQuestion question, AnswerParserService.ParsedAnswer answer,
                String matchMethod, double confidence) {
            this.question = question;
            this.answer = answer;
            this.matchMethod = matchMethod;
            this.confidence = confidence;
        }

        public QuestionParserService.ParsedQuestion getQuestion() {
            return question;
        }

        public AnswerParserService.ParsedAnswer getAnswer() {
            return answer;
        }

        public String getMatchMethod() {
            return matchMethod;
        }

        public double getConfidence() {
            return confidence;
        }
    }

    public static class MatchReport {
        private final List<Question> questions;
        private final List<MatchResult> matchResults;
        private final int exactMatchCount;
        private final int fuzzyMatchCount;
        private final int unmatchedCount;
        private final double averageConfidence;

        public MatchReport(List<Question> questions, List<MatchResult> matchResults, int exactMatchCount,
                int fuzzyMatchCount, int unmatchedCount, double averageConfidence) {
            this.questions = questions;
            this.matchResults = matchResults;
            this.exactMatchCount = exactMatchCount;
            this.fuzzyMatchCount = fuzzyMatchCount;
            this.unmatchedCount = unmatchedCount;
            this.averageConfidence = averageConfidence;
        }

        public List<Question> getQuestions() {
            return questions;
        }

        public List<MatchResult> getMatchResults() {
            return matchResults;
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
    }

    public List<Question> matchAndBuildQuestions(
            List<QuestionParserService.ParsedQuestion> parsedQuestions,
            Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers,
            String stateSlug,
            String districtSlug,
            String testType,
            String sourceDocId,
            String sourceQuestionPdf,
            String sourceAnswerPdf,
            String fileHash) {
        return matchAndBuildReport(parsedQuestions, parsedAnswers, stateSlug, districtSlug, testType,
                sourceDocId, sourceQuestionPdf, sourceAnswerPdf, fileHash).getQuestions();
    }

    public MatchReport matchAndBuildReport(
            List<QuestionParserService.ParsedQuestion> parsedQuestions,
            Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers,
            String stateSlug,
            String districtSlug,
            String testType,
            String sourceDocId,
            String sourceQuestionPdf,
            String sourceAnswerPdf,
            String fileHash) {

        List<Question> questions = new ArrayList<>();
        List<MatchResult> matchResults = new ArrayList<>();

        int exactCount = 0;
        int fuzzyCount = 0;
        int unmatchedCount = 0;
        double totalConfidence = 0.0;

        for (QuestionParserService.ParsedQuestion pq : parsedQuestions) {
            int qNum = pq.getQuestionNumber();
            AnswerParserService.ParsedAnswer pa = null;
            String matchMethod = "UNMATCHED";
            double confidence = 0.0;

            // Level 1: Exact Question Number Match + Consistency Validation
            if (parsedAnswers.containsKey(qNum)) {
                AnswerParserService.ParsedAnswer candidatePa = parsedAnswers.get(qNum);
                MatchResult evalResult = evaluateQuestionNumberMatch(pq, candidatePa);
                pa = candidatePa;
                matchMethod = evalResult.getMatchMethod();
                confidence = evalResult.getConfidence();
                if ("QUESTION_NUMBER".equals(matchMethod)) {
                    exactCount++;
                } else {
                    unmatchedCount++;
                }
            } else {
                // Level 2 & 3: Fallback Fuzzy Match on Explanation / Answer Text
                FuzzyMatchResult fuzzyResult = findFuzzyAnswerMatch(pq, parsedAnswers);
                if (fuzzyResult != null) {
                    pa = fuzzyResult.getAnswer();
                    matchMethod = "FUZZY_TEXT";
                    confidence = fuzzyResult.getConfidence();
                    fuzzyCount++;
                } else {
                    matchMethod = "UNMATCHED";
                    confidence = 0.0;
                    unmatchedCount++;
                }
            }

            totalConfidence += confidence;
            matchResults.add(new MatchResult(pq, pa, matchMethod, confidence));

            boolean needsReview = pq.isSuspicious() || confidence < 0.80 || "QUESTION_NUMBER_CONFLICT".equals(matchMethod);
            String reviewReason = pq.getWarningReason();

            Integer correctAnsIdx = null;
            String explanation = null;

            if (pa != null) {
                correctAnsIdx = pa.getCorrectOptionIndex();
                explanation = pa.getExplanation();
                if (pa.isSuspicious()) {
                    needsReview = true;
                    reviewReason = reviewReason != null ? reviewReason + "; " + pa.getWarningReason()
                            : pa.getWarningReason();
                }
            } else {
                needsReview = true;
                reviewReason = reviewReason != null ? reviewReason + "; Missing solution/explanation"
                        : "Missing solution/explanation";
            }

            if (correctAnsIdx == null || correctAnsIdx < 0 || correctAnsIdx > 3) {
                needsReview = true;
                if (correctAnsIdx == null) {
                    correctAnsIdx = 0; // Default fallback index for draft editing
                }
                reviewReason = reviewReason != null ? reviewReason + "; Answer option key invalid/missing"
                        : "Answer option key invalid/missing";
            }

            if (explanation == null || explanation.isBlank()) {
                explanation = "Explanation pending review for question Q" + qNum;
                needsReview = true;
            }

            String status = needsReview ? "REVIEW_REQUIRED" : "DRAFT";
            String qLevel = pq.getLevel() != null ? pq.getLevel()
                    : ("advanced".equalsIgnoreCase(testType) ? "upsc-level" : "foundation");
            String mappedTestType = "master".equalsIgnoreCase(testType) ? "master"
                    : ("upsc-level".equalsIgnoreCase(qLevel) ? "advanced" : testType);

            String questionId = stateSlug + "-" + districtSlug + "-" + mappedTestType + "-" + qNum + "-"
                    + UUID.randomUUID().toString().substring(0, 8);

            Question q = Question.builder()
                    .id(questionId)
                    .stateSlug(stateSlug)
                    .districtSlug(districtSlug)
                    .testType(mappedTestType)
                    .level(qLevel)
                    .topic(pq.getTopic() != null ? pq.getTopic() : "General")
                    .question(pq.getQuestionText())
                    .options(pq.getOptions())
                    .correctAnswer(correctAnsIdx)
                    .explanation(explanation)
                    .difficulty(pq.getDifficulty() != null ? pq.getDifficulty() : "Easy")
                    .questionNumber(qNum)
                    .status(status)
                    .isActive(false) // Draft / Review questions remain inactive until published by Admin
                    .sourceDocumentId(sourceDocId)
                    .sourceQuestionPdf(sourceQuestionPdf)
                    .sourceAnswerPdf(sourceAnswerPdf)
                    .sourcePageNumber(pq.getPageNumber())
                    .fileHash(fileHash)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            questions.add(q);
        }

        double avgConfidence = parsedQuestions.isEmpty() ? 0.0 : totalConfidence / parsedQuestions.size();
        return new MatchReport(questions, matchResults, exactCount, fuzzyCount, unmatchedCount, avgConfidence);
    }

    private MatchResult evaluateQuestionNumberMatch(
            QuestionParserService.ParsedQuestion pq,
            AnswerParserService.ParsedAnswer pa) {

        double confidence = 1.0;
        String matchMethod = "QUESTION_NUMBER";

        Integer optIdx = pa.getCorrectOptionIndex();
        boolean invalidOptionIndex = (optIdx == null || optIdx < 0 || optIdx > 3);
        boolean invalidOptionsList = (pq.getOptions() == null || pq.getOptions().size() < 4);

        if (invalidOptionIndex || invalidOptionsList) {
            return new MatchResult(pq, pa, "QUESTION_NUMBER_CONFLICT", 0.60);
        }

        String selectedOptionText = pq.getOptions().get(optIdx);
        String normExp = normalizeForMatching(pa.getExplanation());
        String normOpt = normalizeForMatching(selectedOptionText);

        if (!normExp.isBlank() && !normOpt.isBlank()) {
            String optLower = normOpt.toLowerCase(java.util.Locale.ROOT);
            String expLower = normExp.toLowerCase(java.util.Locale.ROOT);

            boolean hasNegation = (!optLower.isBlank() && optLower.length() > 3) && (
                    expLower.contains(optLower + " is not")
                    || expLower.contains(optLower + " is incorrect")
                    || expLower.contains(optLower + " is false"));

            if (hasNegation) {
                return new MatchResult(pq, pa, "QUESTION_NUMBER_CONFLICT", 0.60);
            }

        }

        return new MatchResult(pq, pa, matchMethod, confidence);
    }

    private static class FuzzyMatchResult {
        private final AnswerParserService.ParsedAnswer answer;
        private final double confidence;

        public FuzzyMatchResult(AnswerParserService.ParsedAnswer answer, double confidence) {
            this.answer = answer;
            this.confidence = confidence;
        }

        public AnswerParserService.ParsedAnswer getAnswer() {
            return answer;
        }

        public double getConfidence() {
            return confidence;
        }
    }

    private FuzzyMatchResult findFuzzyAnswerMatch(
            QuestionParserService.ParsedQuestion pq,
            Map<Integer, AnswerParserService.ParsedAnswer> parsedAnswers) {
        if (pq.getQuestionText() == null || pq.getQuestionText().isBlank()) {
            return null;
        }

        double bestScore = 0.0;
        AnswerParserService.ParsedAnswer bestAnswer = null;

        for (AnswerParserService.ParsedAnswer pa : parsedAnswers.values()) {
            if (pa.getExplanation() != null && !pa.getExplanation().isBlank()) {
                double score = calculateSimilarity(pq.getQuestionText(), pa.getExplanation());
                if (score > bestScore) {
                    bestScore = score;
                    bestAnswer = pa;
                }
            }
        }

        if (bestScore >= 0.80 && bestAnswer != null) {
            return new FuzzyMatchResult(bestAnswer, bestScore);
        }
        return null;
    }
}
