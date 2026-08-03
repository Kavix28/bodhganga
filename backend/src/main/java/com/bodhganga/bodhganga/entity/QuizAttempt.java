package com.bodhganga.bodhganga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "quiz_attempts")
public class QuizAttempt {

    @Id
    private String id;

    private String userId;
    private String stateSlug;
    private String districtSlug;
    private String testType;
    private int totalQuestions;
    private int correctCount;
    private int incorrectCount;
    private int unattemptedCount;
    private double score;
    private int percentage;
    private int accuracy;
    private int timeTaken;
    private Map<String, TopicStats> topicAnalysis;
    private List<String> bookmarkedQuestionIds;
    private Instant attemptedAt;

    public QuizAttempt() {}

    public QuizAttempt(String id, String userId, String stateSlug, String districtSlug, String testType,
                       int totalQuestions, int correctCount, int incorrectCount, int unattemptedCount,
                       double score, int percentage, int accuracy, int timeTaken,
                       Map<String, TopicStats> topicAnalysis, List<String> bookmarkedQuestionIds,
                       Instant attemptedAt) {
        this.id = id;
        this.userId = userId;
        this.stateSlug = stateSlug;
        this.districtSlug = districtSlug;
        this.testType = testType;
        this.totalQuestions = totalQuestions;
        this.correctCount = correctCount;
        this.incorrectCount = incorrectCount;
        this.unattemptedCount = unattemptedCount;
        this.score = score;
        this.percentage = percentage;
        this.accuracy = accuracy;
        this.timeTaken = timeTaken;
        this.topicAnalysis = topicAnalysis;
        this.bookmarkedQuestionIds = bookmarkedQuestionIds;
        this.attemptedAt = attemptedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public int getIncorrectCount() { return incorrectCount; }
    public void setIncorrectCount(int incorrectCount) { this.incorrectCount = incorrectCount; }

    public int getUnattemptedCount() { return unattemptedCount; }
    public void setUnattemptedCount(int unattemptedCount) { this.unattemptedCount = unattemptedCount; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public int getPercentage() { return percentage; }
    public void setPercentage(int percentage) { this.percentage = percentage; }

    public int getAccuracy() { return accuracy; }
    public void setAccuracy(int accuracy) { this.accuracy = accuracy; }

    public int getTimeTaken() { return timeTaken; }
    public void setTimeTaken(int timeTaken) { this.timeTaken = timeTaken; }

    public Map<String, TopicStats> getTopicAnalysis() { return topicAnalysis; }
    public void setTopicAnalysis(Map<String, TopicStats> topicAnalysis) { this.topicAnalysis = topicAnalysis; }

    public List<String> getBookmarkedQuestionIds() { return bookmarkedQuestionIds; }
    public void setBookmarkedQuestionIds(List<String> bookmarkedQuestionIds) { this.bookmarkedQuestionIds = bookmarkedQuestionIds; }

    public Instant getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(Instant attemptedAt) { this.attemptedAt = attemptedAt; }

    public static class TopicStats {
        private int total;
        private int correct;
        private int incorrect;

        public TopicStats() {}

        public TopicStats(int total, int correct, int incorrect) {
            this.total = total;
            this.correct = correct;
            this.incorrect = incorrect;
        }

        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public int getCorrect() { return correct; }
        public void setCorrect(int correct) { this.correct = correct; }

        public int getIncorrect() { return incorrect; }
        public void setIncorrect(int incorrect) { this.incorrect = incorrect; }
    }

    public static class QuizAttemptBuilder {
        private QuizAttempt attempt = new QuizAttempt();

        public QuizAttemptBuilder id(String id) { attempt.setId(id); return this; }
        public QuizAttemptBuilder userId(String userId) { attempt.setUserId(userId); return this; }
        public QuizAttemptBuilder stateSlug(String stateSlug) { attempt.setStateSlug(stateSlug); return this; }
        public QuizAttemptBuilder districtSlug(String districtSlug) { attempt.setDistrictSlug(districtSlug); return this; }
        public QuizAttemptBuilder testType(String testType) { attempt.setTestType(testType); return this; }
        public QuizAttemptBuilder totalQuestions(int totalQuestions) { attempt.setTotalQuestions(totalQuestions); return this; }
        public QuizAttemptBuilder correctCount(int correctCount) { attempt.setCorrectCount(correctCount); return this; }
        public QuizAttemptBuilder incorrectCount(int incorrectCount) { attempt.setIncorrectCount(incorrectCount); return this; }
        public QuizAttemptBuilder unattemptedCount(int unattemptedCount) { attempt.setUnattemptedCount(unattemptedCount); return this; }
        public QuizAttemptBuilder score(double score) { attempt.setScore(score); return this; }
        public QuizAttemptBuilder percentage(int percentage) { attempt.setPercentage(percentage); return this; }
        public QuizAttemptBuilder accuracy(int accuracy) { attempt.setAccuracy(accuracy); return this; }
        public QuizAttemptBuilder timeTaken(int timeTaken) { attempt.setTimeTaken(timeTaken); return this; }
        public QuizAttemptBuilder topicAnalysis(Map<String, TopicStats> topicAnalysis) { attempt.setTopicAnalysis(topicAnalysis); return this; }
        public QuizAttemptBuilder bookmarkedQuestionIds(List<String> bookmarkedQuestionIds) { attempt.setBookmarkedQuestionIds(bookmarkedQuestionIds); return this; }
        public QuizAttemptBuilder attemptedAt(Instant attemptedAt) { attempt.setAttemptedAt(attemptedAt); return this; }

        public QuizAttempt build() { return attempt; }
    }

    public static QuizAttemptBuilder builder() {
        return new QuizAttemptBuilder();
    }
}
