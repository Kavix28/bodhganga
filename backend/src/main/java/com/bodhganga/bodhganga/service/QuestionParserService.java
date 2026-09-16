package com.bodhganga.bodhganga.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing questions and options from raw or normalized text pages.
 * Supports cross-page question spanning and optional document-level
 * normalization filters.
 */
@Service
public class QuestionParserService {

    private final OcrTextNormalizationService normalizationService;

    @Autowired
    public QuestionParserService(OcrTextNormalizationService normalizationService) {
        this.normalizationService = normalizationService;
    }

    public static class ParsedQuestion {
        private int questionNumber;
        private String questionText;
        private List<String> options;
        private String topic;
        private String level;
        private String difficulty;
        private int pageNumber;
        private boolean suspicious;
        private String warningReason;

        public ParsedQuestion() {
        }

        public ParsedQuestion(int questionNumber, String questionText, List<String> options, String topic,
                String level, String difficulty, int pageNumber, boolean suspicious,
                String warningReason) {
            this.questionNumber = questionNumber;
            this.questionText = questionText;
            this.options = options;
            this.topic = topic;
            this.level = level;
            this.difficulty = difficulty;
            this.pageNumber = pageNumber;
            this.suspicious = suspicious;
            this.warningReason = warningReason;
        }

        public static ParsedQuestionBuilder builder() {
            return new ParsedQuestionBuilder();
        }

        public int getQuestionNumber() {
            return questionNumber;
        }

        public void setQuestionNumber(int questionNumber) {
            this.questionNumber = questionNumber;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public List<String> getOptions() {
            return options;
        }

        public void setOptions(List<String> options) {
            this.options = options;
        }

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }

        public String getLevel() {
            return level;
        }

        public void setLevel(String level) {
            this.level = level;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
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

        public static class ParsedQuestionBuilder {
            private int questionNumber;
            private String questionText;
            private List<String> options;
            private String topic;
            private String level;
            private String difficulty;
            private int pageNumber;
            private boolean suspicious;
            private String warningReason;

            public ParsedQuestionBuilder questionNumber(int questionNumber) {
                this.questionNumber = questionNumber;
                return this;
            }

            public ParsedQuestionBuilder questionText(String questionText) {
                this.questionText = questionText;
                return this;
            }

            public ParsedQuestionBuilder options(List<String> options) {
                this.options = options;
                return this;
            }

            public ParsedQuestionBuilder topic(String topic) {
                this.topic = topic;
                return this;
            }

            public ParsedQuestionBuilder level(String level) {
                this.level = level;
                return this;
            }

            public ParsedQuestionBuilder difficulty(String difficulty) {
                this.difficulty = difficulty;
                return this;
            }

            public ParsedQuestionBuilder pageNumber(int pageNumber) {
                this.pageNumber = pageNumber;
                return this;
            }

            public ParsedQuestionBuilder isSuspicious(boolean suspicious) {
                this.suspicious = suspicious;
                return this;
            }

            public ParsedQuestionBuilder warningReason(String warningReason) {
                this.warningReason = warningReason;
                return this;
            }

            public ParsedQuestion build() {
                return new ParsedQuestion(questionNumber, questionText, options, topic, level, difficulty, pageNumber,
                        suspicious, warningReason);
            }
        }
    }

    private static final Pattern Q_NUM_PATTERN = Pattern
            .compile("(?i)(?:^|\\n)\\s*(?:Q|Question|Qs|Qi)\\.?\\s*(\\d{1,4})");
    private static final Pattern PAGE_MARKER_PATTERN = Pattern.compile("^===PAGE:(\\d+)===$");

    public List<ParsedQuestion> parseQuestionsFromPages(List<String> pagesText) {
        return parseQuestionsFromPages(pagesText, null);
    }

    public List<ParsedQuestion> parseQuestionsFromPages(List<String> pagesText,
            TextNormalizationFilter documentFilter) {
        List<ParsedQuestion> result = new ArrayList<>();

        StringBuilder combinedText = new StringBuilder();
        for (int i = 0; i < pagesText.size(); i++) {
            String page = pagesText.get(i);
            if (page != null && !page.isBlank()) {
                combinedText.append("\n===PAGE:").append(i + 1).append("===\n");
                combinedText.append(page).append("\n");
            }
        }

        String fullText = normalizationService != null
                ? normalizationService.normalizeText(combinedText.toString())
                : combinedText.toString();

        if (documentFilter != null) {
            fullText = documentFilter.filter(fullText);
        }

        String currentTopic = "History";
        String currentLevel = "foundation";

        String[] lines = fullText.split("\\r?\\n");
        StringBuilder currentBlock = new StringBuilder();
        int currentQNum = -1;
        int currentPageNum = 1;
        int currentQPageNum = 1;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isBlank())
                continue;

            Matcher pageMarkerMatcher = PAGE_MARKER_PATTERN.matcher(trimmed);
            if (pageMarkerMatcher.matches()) {
                try {
                    currentPageNum = Integer.parseInt(pageMarkerMatcher.group(1));
                } catch (NumberFormatException ignored) {
                }
                continue;
            }

            String upper = trimmed.toUpperCase();
            boolean isHeaderLine = !trimmed.matches("(?i)^(?:Q\\.?|Question\\s*\\d|\\(|\\d+[\\.\\)]).*")
                    && trimmed.length() < 60;

            if (isHeaderLine) {
                if (upper.contains("HISTORY")) {
                    currentTopic = "History";
                    currentLevel = "foundation";
                } else if (upper.contains("GEOGRAPHY")) {
                    currentTopic = "Geography";
                    currentLevel = "foundation";
                } else if (upper.contains("ECONOMY") || upper.contains("AGRICULTURE")
                        || upper.contains("DEVELOPMENT")) {
                    currentTopic = "Economy, Agriculture & Development";
                    currentLevel = "foundation";
                } else if (upper.contains("ART & CULTURE") || upper.contains("ART AND CULTURE")) {
                    currentTopic = "Art & Culture";
                    currentLevel = "foundation";
                } else if (upper.contains("HERITAGE") || upper.contains("MONUMENTS")) {
                    currentTopic = "Heritage & Monuments";
                    currentLevel = "foundation";
                } else if (upper.contains("POLITY") || upper.contains("ADMINISTRATION")) {
                    currentTopic = "State Polity & Administration";
                    currentLevel = "foundation";
                }

                if (upper.contains("UPSC-LEVEL") || upper.contains("UPSC LEVEL") || upper.contains("ADVANCED LEVEL")) {
                    currentLevel = "upsc-level";
                } else if (upper.contains("FOUNDATION LEVEL") || upper.contains("FOUNDATION MCQ")) {
                    currentLevel = "foundation";
                }
            }

            Matcher qMatcher = Q_NUM_PATTERN.matcher(trimmed);
            if (qMatcher.find() && isStartOfQuestion(trimmed, qMatcher)) {
                if (currentQNum > 0 && currentBlock.length() > 0) {
                    ParsedQuestion parsed = parseSingleBlock(currentQNum, currentBlock.toString(), currentTopic,
                            currentLevel, currentQPageNum);
                    result.add(parsed);
                    currentBlock.setLength(0);
                }
                try {
                    currentQNum = Integer.parseInt(qMatcher.group(1));
                    currentQPageNum = currentPageNum;
                } catch (NumberFormatException e) {
                    currentQNum = -1;
                }
            }

            if (currentQNum > 0) {
                currentBlock.append(line).append("\n");
            }
        }

        if (currentQNum > 0 && currentBlock.length() > 0) {
            ParsedQuestion parsed = parseSingleBlock(currentQNum, currentBlock.toString(), currentTopic,
                    currentLevel, currentQPageNum);
            result.add(parsed);
        }

        return result;
    }

    private boolean isStartOfQuestion(String line, Matcher matcher) {
        int start = matcher.start();
        return start <= 2;
    }

    public ParsedQuestion parseSingleBlock(int qNum, String blockText, String topic, String level, int pageNum) {
        String cleanBlock = blockText.trim();

        List<String> options = new ArrayList<>();
        String questionText = cleanBlock;

        String[] lines = cleanBlock.split("\\r?\\n");
        StringBuilder qBuilder = new StringBuilder();
        String currentOptionLabel = null;
        StringBuilder currentOptionText = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher optMatcher = Pattern.compile("^(?:\\()?([A-Da-d])[\\)\\.\\:]\\s*(.*)$", Pattern.CASE_INSENSITIVE)
                    .matcher(trimmed);
            if (optMatcher.find()) {
                if (currentOptionLabel != null) {
                    String optText = currentOptionText.toString().trim();
                    if (normalizationService != null) {
                        optText = normalizationService.cleanOptionText(optText);
                    }
                    options.add(optText);
                    currentOptionText.setLength(0);
                } else {
                    questionText = qBuilder.toString().trim();
                }
                currentOptionLabel = optMatcher.group(1).toUpperCase();
                currentOptionText.append(optMatcher.group(2));
            } else {
                if (currentOptionLabel != null) {
                    currentOptionText.append(" ").append(trimmed);
                } else {
                    qBuilder.append(line).append("\n");
                }
            }
        }

        if (currentOptionLabel != null && currentOptionText.length() > 0) {
            String optText = currentOptionText.toString().trim();
            if (normalizationService != null) {
                optText = normalizationService.cleanOptionText(optText);
            }
            options.add(optText);
        }

        if (normalizationService != null) {
            questionText = normalizationService.cleanQuestionText(questionText);
        } else {
            questionText = questionText.replaceAll("(?i)^\\s*(?:Q\\.?|Question\\s*)?\\s*\\d{1,3}[\\.\\)\\:]?\\s*", "")
                    .trim();
        }

        boolean suspicious = false;
        String warning = null;
        if (options.size() < 4) {
            suspicious = true;
            warning = "Fewer than 4 options parsed: " + options.size();
        } else if (questionText.length() < 10) {
            suspicious = true;
            warning = "Question text too short: " + questionText;
        }

        String difficulty = "foundation".equalsIgnoreCase(level) ? "Easy" : "Medium";

        return ParsedQuestion.builder()
                .questionNumber(qNum)
                .questionText(questionText)
                .options(options)
                .topic(topic)
                .level(level)
                .difficulty(difficulty)
                .pageNumber(pageNum)
                .isSuspicious(suspicious)
                .warningReason(warning)
                .build();
    }
}
