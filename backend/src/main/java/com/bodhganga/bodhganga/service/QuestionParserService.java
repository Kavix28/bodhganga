package com.bodhganga.bodhganga.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionParserService {

    public static class ParsedQuestion {
        private int questionNumber;
        private String questionText;
        private List<String> options;
        private String topic;
        private String level; // 'foundation', 'upsc-level'
        private String difficulty;
        private int pageNumber;
        private boolean suspicious;
        private String warningReason;

        public ParsedQuestion() {
        }

        public ParsedQuestion(int questionNumber, String questionText, List<String> options, String topic, String level,
                String difficulty, int pageNumber, boolean suspicious, String warningReason) {
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
            .compile("(?i)(?:^|\\n)\\s*(?:Q\\.?|Question\\s*|\\()?\\s*(\\d{1,3})[\\.\\)]\\s*");

    public List<ParsedQuestion> parseQuestionsFromPages(List<String> pagesText) {
        List<ParsedQuestion> result = new ArrayList<>();
        String currentTopic = "General";
        String currentLevel = "foundation";

        for (int pIdx = 0; pIdx < pagesText.size(); pIdx++) {
            int pageNum = pIdx + 1;
            String text = pagesText.get(pIdx);
            if (text == null || text.isBlank())
                continue;

            String[] lines = text.split("\\r?\\n");
            StringBuilder currentBlock = new StringBuilder();
            int currentQNum = -1;

            for (String line : lines) {
                String trimmed = line.trim();

                // Detect topic section headers
                if (trimmed.equalsIgnoreCase("History") || trimmed.contains("History of")) {
                    currentTopic = "History";
                } else if (trimmed.equalsIgnoreCase("Geography") || trimmed.contains("Geography of")) {
                    currentTopic = "Geography";
                } else if (trimmed.contains("Economy") || trimmed.contains("Agriculture")) {
                    currentTopic = "Economy, Agriculture & Development";
                } else if (trimmed.contains("Art") || trimmed.contains("Culture")) {
                    currentTopic = "Art & Culture";
                } else if (trimmed.contains("Heritage") || trimmed.contains("Monuments")) {
                    currentTopic = "Heritage & Monuments";
                } else if (trimmed.contains("Polity") || trimmed.contains("Administration")) {
                    currentTopic = "State Polity & Administration";
                }

                // Detect Level headers
                if (trimmed.toLowerCase().contains("upsc-level") || trimmed.toLowerCase().contains("upsc level")
                        || trimmed.toLowerCase().contains("advanced level")) {
                    currentLevel = "upsc-level";
                } else if (trimmed.toLowerCase().contains("foundation level")
                        || trimmed.toLowerCase().contains("foundation mcq")) {
                    currentLevel = "foundation";
                }

                Matcher qMatcher = Q_NUM_PATTERN.matcher(trimmed);
                if (qMatcher.find() && isStartOfQuestion(trimmed, qMatcher)) {
                    if (currentQNum > 0 && currentBlock.length() > 0) {
                        ParsedQuestion parsed = parseSingleBlock(currentQNum, currentBlock.toString(), currentTopic,
                                currentLevel, pageNum);
                        result.add(parsed);
                        currentBlock.setLength(0);
                    }
                    try {
                        currentQNum = Integer.parseInt(qMatcher.group(1));
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
                        currentLevel, pageNum);
                result.add(parsed);
            }
        }

        return result;
    }

    private boolean isStartOfQuestion(String line, Matcher matcher) {
        int start = matcher.start();
        return start <= 2;
    }

    public ParsedQuestion parseSingleBlock(int qNum, String blockText, String topic, String level, int pageNum) {
        String cleanBlock = blockText.trim();

        // Extract options (A), (B), (C), (D) or A., B., C., D.
        List<String> options = new ArrayList<>();
        String questionText = cleanBlock;

        String[] lines = cleanBlock.split("\\r?\\n");
        StringBuilder qBuilder = new StringBuilder();
        String currentOptionLabel = null;
        StringBuilder currentOptionText = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher optMatcher = Pattern.compile("^(?:\\()?([A-D])[\\)\\.\\:]\\s*(.*)$", Pattern.CASE_INSENSITIVE)
                    .matcher(trimmed);
            if (optMatcher.find()) {
                if (currentOptionLabel != null) {
                    options.add(currentOptionText.toString().trim());
                    currentOptionText.setLength(0);
                } else {
                    questionText = qBuilder.toString().trim();
                }
                currentOptionLabel = optMatcher.group(1).toUpperCase();
                currentOptionText.append(optMatcher.group(2));
            } else if (currentOptionLabel != null) {
                currentOptionText.append(" ").append(trimmed);
            } else {
                qBuilder.append(line).append("\n");
            }
        }

        if (currentOptionLabel != null) {
            options.add(currentOptionText.toString().trim());
        } else {
            questionText = cleanBlock;
        }

        questionText = questionText.replaceAll("(?i)^\\s*(?:Q\\.?|Question\\s*|\\()?\\s*\\d{1,3}[\\.\\)]\\s*", "")
                .trim();

        boolean suspicious = false;
        String warning = null;

        if (options.size() < 4) {
            suspicious = true;
            warning = "Fewer than 4 options detected (" + options.size() + " options)";
        } else if (questionText.length() < 10) {
            suspicious = true;
            warning = "Question text suspiciously short";
        }

        String difficulty = "upsc-level".equalsIgnoreCase(level) ? "Advanced" : "Easy";

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
