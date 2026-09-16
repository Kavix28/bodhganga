package com.bodhganga.bodhganga.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing answer keys and explanations from raw or normalized text
 * pages.
 * Supports optional document-level normalization filters.
 */
@Service
public class AnswerParserService {

    private final OcrTextNormalizationService normalizationService;

    @Autowired
    public AnswerParserService(OcrTextNormalizationService normalizationService) {
        this.normalizationService = normalizationService;
    }

    public static class ParsedAnswer {
        private int questionNumber;
        private Integer correctOptionIndex;
        private String explanation;
        private int pageNumber;
        private boolean suspicious;
        private String warningReason;

        public ParsedAnswer() {
        }

        public ParsedAnswer(int questionNumber, Integer correctOptionIndex, String explanation, int pageNumber,
                boolean suspicious, String warningReason) {
            this.questionNumber = questionNumber;
            this.correctOptionIndex = correctOptionIndex;
            this.explanation = explanation;
            this.pageNumber = pageNumber;
            this.suspicious = suspicious;
            this.warningReason = warningReason;
        }

        public static ParsedAnswerBuilder builder() {
            return new ParsedAnswerBuilder();
        }

        public int getQuestionNumber() {
            return questionNumber;
        }

        public void setQuestionNumber(int questionNumber) {
            this.questionNumber = questionNumber;
        }

        public Integer getCorrectOptionIndex() {
            return correctOptionIndex;
        }

        public void setCorrectOptionIndex(Integer correctOptionIndex) {
            this.correctOptionIndex = correctOptionIndex;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public int getPageNumber() {
            return pageNumber;
        }

        public void setPageNumber(int pageNumber) {
            this.pageNumber = pageNumber;
        }

        public boolean isSuspicious() {
            return suspicious;
        }

        public void setSuspicious(boolean suspicious) {
            this.suspicious = suspicious;
        }

        public String getWarningReason() {
            return warningReason;
        }

        public void setWarningReason(String warningReason) {
            this.warningReason = warningReason;
        }

        public static class ParsedAnswerBuilder {
            private int questionNumber;
            private Integer correctOptionIndex;
            private String explanation;
            private int pageNumber;
            private boolean suspicious;
            private String warningReason;

            public ParsedAnswerBuilder questionNumber(int questionNumber) {
                this.questionNumber = questionNumber;
                return this;
            }

            public ParsedAnswerBuilder correctOptionIndex(Integer correctOptionIndex) {
                this.correctOptionIndex = correctOptionIndex;
                return this;
            }

            public ParsedAnswerBuilder explanation(String explanation) {
                this.explanation = explanation;
                return this;
            }

            public ParsedAnswerBuilder pageNumber(int pageNumber) {
                this.pageNumber = pageNumber;
                return this;
            }

            public ParsedAnswerBuilder isSuspicious(boolean suspicious) {
                this.suspicious = suspicious;
                return this;
            }

            public ParsedAnswerBuilder warningReason(String warningReason) {
                this.warningReason = warningReason;
                return this;
            }

            public ParsedAnswer build() {
                return new ParsedAnswer(questionNumber, correctOptionIndex, explanation, pageNumber, suspicious,
                        warningReason);
            }
        }
    }

    private static final Pattern ANS_KEY_LINE_PATTERN = Pattern.compile(
            "(?i)(?:(?:Q\\.?|Question\\s*|Qs\\.?|Qi)\\s*(\\d{1,4})[\\.\\)]?\\s*[:\\-\\=]?\\s*(?:\\()?([A-D])(?![a-zA-Z0-9])[\\)\\.\\:]?)|"
                    +
                    "(?:(?<=\\s|^)(\\d{1,4})[\\.\\)\\:]\\s*[:\\-\\=]?\\s*(?:\\()?([A-D])(?![a-zA-Z0-9])(?:[\\)\\.\\:]|(?=\\s+(?:\\d|[A-Z][A-Z0-9]|\\(|$))))|"
                    +
                    "(?:(?<=\\s|^)(\\d{1,4})\\s*[:\\-\\=]?\\s*\\(([A-D])\\))");
    private static final Pattern EXP_HEADER_PATTERN = Pattern
            .compile("(?i)(?:^|\\n)\\s*(?:Q\\.?|Question\\s*|Qs\\.?|Qi)\\s*(\\d{1,4})[\\.\\:\\s\\-\\)]");

    public Map<Integer, ParsedAnswer> parseAnswersFromPages(List<String> pagesText) {
        return parseAnswersFromPages(pagesText, null);
    }

    public Map<Integer, ParsedAnswer> parseAnswersFromPages(List<String> pagesText,
            TextNormalizationFilter documentFilter) {
        Map<Integer, ParsedAnswer> answerMap = new HashMap<>();

        for (int pIdx = 0; pIdx < pagesText.size(); pIdx++) {
            int pageNum = pIdx + 1;
            String rawText = pagesText.get(pIdx);
            if (rawText == null || rawText.isBlank())
                continue;

            String text = normalizationService != null ? normalizationService.normalizeText(rawText) : rawText;

            if (documentFilter != null) {
                text = documentFilter.filter(text);
            }

            String[] lines = text.split("\\r?\\n");
            StringBuilder currentExpBlock = new StringBuilder();
            int currentQNum = -1;
            Integer currentAnsOpt = null;

            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isBlank())
                    continue;

                Matcher keyMatcher = ANS_KEY_LINE_PATTERN.matcher(trimmed);
                while (keyMatcher.find()) {
                    try {
                        String qNumStr = keyMatcher.group(1) != null ? keyMatcher.group(1)
                                : (keyMatcher.group(3) != null ? keyMatcher.group(3) : keyMatcher.group(5));
                        String optStr = keyMatcher.group(2) != null ? keyMatcher.group(2)
                                : (keyMatcher.group(4) != null ? keyMatcher.group(4) : keyMatcher.group(6));

                        if (qNumStr == null || optStr == null)
                            continue;

                        int qNum = Integer.parseInt(qNumStr);
                        if (qNum < 1) {
                            continue;
                        }
                        char optChar = optStr.toUpperCase().charAt(0);
                        int optIdx = optChar - 'A';
                        if (!answerMap.containsKey(qNum)) {
                            answerMap.put(qNum, ParsedAnswer.builder()
                                    .questionNumber(qNum)
                                    .correctOptionIndex(optIdx)
                                    .explanation("")
                                    .pageNumber(pageNum)
                                    .build());
                        } else {
                            ParsedAnswer existing = answerMap.get(qNum);
                            if (existing.getCorrectOptionIndex() == null) {
                                existing.setCorrectOptionIndex(optIdx);
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }

                Matcher expMatcher = EXP_HEADER_PATTERN.matcher(trimmed);
                if (expMatcher.find() && expMatcher.start() <= 2) {
                    if (currentQNum > 0 && currentExpBlock.length() > 0) {
                        saveExplanation(answerMap, currentQNum, currentAnsOpt, currentExpBlock.toString(), pageNum);
                        currentExpBlock.setLength(0);
                    }
                    try {
                        int candidateNum = Integer.parseInt(expMatcher.group(1));
                        if (candidateNum >= 1) {
                            currentQNum = candidateNum;
                            Matcher lineOpt = Pattern.compile("(?i)(?:\\()?([A-D])[\\)\\.\\:]").matcher(trimmed);
                            if (lineOpt.find()) {
                                currentAnsOpt = lineOpt.group(1).toUpperCase().charAt(0) - 'A';
                            } else {
                                currentAnsOpt = null;
                            }
                        } else {
                            currentQNum = -1;
                        }
                    } catch (NumberFormatException e) {
                        currentQNum = -1;
                    }
                }

                if (currentQNum > 0) {
                    currentExpBlock.append(line).append("\n");
                }
            }

            if (currentQNum > 0 && currentExpBlock.length() > 0) {
                saveExplanation(answerMap, currentQNum, currentAnsOpt, currentExpBlock.toString(), pageNum);
            }
        }

        return answerMap;
    }

    private void saveExplanation(Map<Integer, ParsedAnswer> map, int qNum, Integer lineOptIndex, String expText,
            int pageNum) {
        if (qNum < 1)
            return;

        String cleanExp = expText.trim();

        if (normalizationService != null) {
            cleanExp = normalizationService.normalizeText(cleanExp);
        }

        cleanExp = cleanExp.replaceAll("(?i)^\\s*(?:Q\\.?|Question\\s*)?\\s*\\d{1,3}[\\.\\)\\:]?\\s*", "").trim();
        cleanExp = cleanExp.replaceAll("(?i)^\\s*\\([a-d]\\)\\s*", "").trim();

        ParsedAnswer existing = map.get(qNum);
        if (existing == null) {
            map.put(qNum, ParsedAnswer.builder()
                    .questionNumber(qNum)
                    .correctOptionIndex(lineOptIndex)
                    .explanation(cleanExp)
                    .pageNumber(pageNum)
                    .build());
        } else {
            if (existing.getCorrectOptionIndex() == null && lineOptIndex != null) {
                existing.setCorrectOptionIndex(lineOptIndex);
            }
            if (existing.getExplanation() == null || existing.getExplanation().isBlank()) {
                existing.setExplanation(cleanExp);
            } else if (!cleanExp.isBlank() && !existing.getExplanation().contains(cleanExp)) {
                existing.setExplanation(existing.getExplanation() + "\n" + cleanExp);
            }
        }
    }
}
