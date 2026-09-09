package com.bodhganga.bodhganga.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AnswerParserService {

    public static class ParsedAnswer {
        private int questionNumber;
        private Integer correctOptionIndex; // 0-based
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

    private static final Pattern ANS_KEY_LINE_PATTERN = Pattern
            .compile("(?i)(?:Q\\.?|Question\\s*)?\\s*(\\d{1,3})[\\.\\)]?\\s*[:\\-\\=]?\\s*(?:\\()?([A-D])[\\)\\.\\:]?");
    private static final Pattern EXP_HEADER_PATTERN = Pattern
            .compile("(?i)(?:^|\\n)\\s*(?:Q\\.?|Question\\s*)?\\s*(\\d{1,3})[\\.\\)]\\s*");

    public Map<Integer, ParsedAnswer> parseAnswersFromPages(List<String> pagesText) {
        Map<Integer, ParsedAnswer> answerMap = new HashMap<>();

        for (int pIdx = 0; pIdx < pagesText.size(); pIdx++) {
            int pageNum = pIdx + 1;
            String text = pagesText.get(pIdx);
            if (text == null || text.isBlank())
                continue;

            String[] lines = text.split("\\r?\\n");
            StringBuilder currentExpBlock = new StringBuilder();
            int currentQNum = -1;
            Integer currentAnsOpt = null;

            for (String line : lines) {
                String trimmed = line.trim();

                Matcher keyMatcher = ANS_KEY_LINE_PATTERN.matcher(trimmed);
                while (keyMatcher.find()) {
                    try {
                        int qNum = Integer.parseInt(keyMatcher.group(1));
                        char optChar = keyMatcher.group(2).toUpperCase().charAt(0);
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
                        currentQNum = Integer.parseInt(expMatcher.group(1));
                        currentAnsOpt = extractOptionCharFromLine(trimmed);
                    } catch (Exception e) {
                        currentQNum = -1;
                        currentAnsOpt = null;
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

    private Integer extractOptionCharFromLine(String line) {
        Matcher m = Pattern.compile("(?i)(?:\\()?([A-D])[\\)\\.\\:]").matcher(line);
        if (m.find()) {
            char c = m.group(1).toUpperCase().charAt(0);
            return c - 'A';
        }
        return null;
    }

    private void saveExplanation(Map<Integer, ParsedAnswer> map, int qNum, Integer ansOpt, String rawBlock,
            int pageNum) {
        String cleanExp = rawBlock.replaceAll("(?i)^\\s*(?:Q\\.?|Question\\s*)?\\s*\\d{1,3}[\\.\\)]\\s*", "").trim();
        Matcher m = Pattern.compile("^(?:\\()?([A-D])[\\)\\.\\:]\\s*(.*)$", Pattern.CASE_INSENSITIVE).matcher(cleanExp);
        if (m.find()) {
            if (ansOpt == null) {
                ansOpt = m.group(1).toUpperCase().charAt(0) - 'A';
            }
            cleanExp = m.group(2).trim();
        }

        ParsedAnswer ans = map.computeIfAbsent(qNum, k -> ParsedAnswer.builder()
                .questionNumber(k)
                .pageNumber(pageNum)
                .build());

        if (ansOpt != null && ans.getCorrectOptionIndex() == null) {
            ans.setCorrectOptionIndex(ansOpt);
        }
        if (ans.getExplanation() == null || ans.getExplanation().isBlank()) {
            ans.setExplanation(cleanExp);
        }
    }
}
