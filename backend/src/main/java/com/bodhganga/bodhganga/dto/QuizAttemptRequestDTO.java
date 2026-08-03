package com.bodhganga.bodhganga.dto;

import com.bodhganga.bodhganga.entity.QuizAttempt.TopicStats;

import java.util.List;
import java.util.Map;

public class QuizAttemptRequestDTO {

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

    public QuizAttemptRequestDTO() {}

    public QuizAttemptRequestDTO(String stateSlug, String districtSlug, String testType, int totalQuestions,
                                 int correctCount, int incorrectCount, int unattemptedCount, double score,
                                 int percentage, int accuracy, int timeTaken, Map<String, TopicStats> topicAnalysis,
                                 List<String> bookmarkedQuestionIds) {
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
    }

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

    public static class QuizAttemptRequestDTOBuilder {
        private QuizAttemptRequestDTO dto = new QuizAttemptRequestDTO();

        public QuizAttemptRequestDTOBuilder stateSlug(String stateSlug) { dto.setStateSlug(stateSlug); return this; }
        public QuizAttemptRequestDTOBuilder districtSlug(String districtSlug) { dto.setDistrictSlug(districtSlug); return this; }
        public QuizAttemptRequestDTOBuilder testType(String testType) { dto.setTestType(testType); return this; }
        public QuizAttemptRequestDTOBuilder totalQuestions(int totalQuestions) { dto.setTotalQuestions(totalQuestions); return this; }
        public QuizAttemptRequestDTOBuilder correctCount(int correctCount) { dto.setCorrectCount(correctCount); return this; }
        public QuizAttemptRequestDTOBuilder incorrectCount(int incorrectCount) { dto.setIncorrectCount(incorrectCount); return this; }
        public QuizAttemptRequestDTOBuilder unattemptedCount(int unattemptedCount) { dto.setUnattemptedCount(unattemptedCount); return this; }
        public QuizAttemptRequestDTOBuilder score(double score) { dto.setScore(score); return this; }
        public QuizAttemptRequestDTOBuilder percentage(int percentage) { dto.setPercentage(percentage); return this; }
        public QuizAttemptRequestDTOBuilder accuracy(int accuracy) { dto.setAccuracy(accuracy); return this; }
        public QuizAttemptRequestDTOBuilder timeTaken(int timeTaken) { dto.setTimeTaken(timeTaken); return this; }
        public QuizAttemptRequestDTOBuilder topicAnalysis(Map<String, TopicStats> topicAnalysis) { dto.setTopicAnalysis(topicAnalysis); return this; }
        public QuizAttemptRequestDTOBuilder bookmarkedQuestionIds(List<String> bookmarkedQuestionIds) { dto.setBookmarkedQuestionIds(bookmarkedQuestionIds); return this; }

        public QuizAttemptRequestDTO build() { return dto; }
    }

    public static QuizAttemptRequestDTOBuilder builder() {
        return new QuizAttemptRequestDTOBuilder();
    }
}
