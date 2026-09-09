package com.bodhganga.bodhganga.dto;

import java.util.List;
import java.util.Map;

public class QuizSubmissionDTO {
    private String stateSlug;
    private String districtSlug;
    private String testType;
    private int timeTaken;
    private List<String> questionIds;
    private Map<String, Integer> answers; // questionId -> selectedOptionIndex (0-based)
    private List<String> bookmarkedQuestionIds;

    public QuizSubmissionDTO() {
    }

    public QuizSubmissionDTO(String stateSlug, String districtSlug, String testType, int timeTaken,
            List<String> questionIds, Map<String, Integer> answers,
            List<String> bookmarkedQuestionIds) {
        this.stateSlug = stateSlug;
        this.districtSlug = districtSlug;
        this.testType = testType;
        this.timeTaken = timeTaken;
        this.questionIds = questionIds;
        this.answers = answers;
        this.bookmarkedQuestionIds = bookmarkedQuestionIds;
    }

    public String getStateSlug() {
        return stateSlug;
    }

    public void setStateSlug(String stateSlug) {
        this.stateSlug = stateSlug;
    }

    public String getDistrictSlug() {
        return districtSlug;
    }

    public void setDistrictSlug(String districtSlug) {
        this.districtSlug = districtSlug;
    }

    public String getTestType() {
        return testType;
    }

    public void setTestType(String testType) {
        this.testType = testType;
    }

    public int getTimeTaken() {
        return timeTaken;
    }

    public void setTimeTaken(int timeTaken) {
        this.timeTaken = timeTaken;
    }

    public List<String> getQuestionIds() {
        return questionIds;
    }

    public void setQuestionIds(List<String> questionIds) {
        this.questionIds = questionIds;
    }

    public Map<String, Integer> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, Integer> answers) {
        this.answers = answers;
    }

    public List<String> getBookmarkedQuestionIds() {
        return bookmarkedQuestionIds;
    }

    public void setBookmarkedQuestionIds(List<String> bookmarkedQuestionIds) {
        this.bookmarkedQuestionIds = bookmarkedQuestionIds;
    }

    public static class QuizSubmissionDTOBuilder {
        private QuizSubmissionDTO dto = new QuizSubmissionDTO();

        public QuizSubmissionDTOBuilder stateSlug(String stateSlug) {
            dto.setStateSlug(stateSlug);
            return this;
        }

        public QuizSubmissionDTOBuilder districtSlug(String districtSlug) {
            dto.setDistrictSlug(districtSlug);
            return this;
        }

        public QuizSubmissionDTOBuilder testType(String testType) {
            dto.setTestType(testType);
            return this;
        }

        public QuizSubmissionDTOBuilder timeTaken(int timeTaken) {
            dto.setTimeTaken(timeTaken);
            return this;
        }

        public QuizSubmissionDTOBuilder questionIds(List<String> questionIds) {
            dto.setQuestionIds(questionIds);
            return this;
        }

        public QuizSubmissionDTOBuilder answers(Map<String, Integer> answers) {
            dto.setAnswers(answers);
            return this;
        }

        public QuizSubmissionDTOBuilder bookmarkedQuestionIds(List<String> bookmarkedQuestionIds) {
            dto.setBookmarkedQuestionIds(bookmarkedQuestionIds);
            return this;
        }

        public QuizSubmissionDTO build() {
            return dto;
        }
    }

    public static QuizSubmissionDTOBuilder builder() {
        return new QuizSubmissionDTOBuilder();
    }
}
