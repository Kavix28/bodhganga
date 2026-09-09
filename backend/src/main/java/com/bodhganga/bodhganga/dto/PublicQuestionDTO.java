package com.bodhganga.bodhganga.dto;

import java.util.List;

public class PublicQuestionDTO {
    private String id;
    private String stateSlug;
    private String districtSlug;
    private String topic;
    private String testType;
    private String question;
    private List<String> options;
    private String difficulty;
    private int questionNumber;

    public PublicQuestionDTO() {
    }

    public PublicQuestionDTO(String id, String stateSlug, String districtSlug, String topic, String testType,
            String question, List<String> options, String difficulty, int questionNumber) {
        this.id = id;
        this.stateSlug = stateSlug;
        this.districtSlug = districtSlug;
        this.topic = topic;
        this.testType = testType;
        this.question = question;
        this.options = options;
        this.difficulty = difficulty;
        this.questionNumber = questionNumber;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getTestType() {
        return testType;
    }

    public void setTestType(String testType) {
        this.testType = testType;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(int questionNumber) {
        this.questionNumber = questionNumber;
    }

    public static class PublicQuestionDTOBuilder {
        private PublicQuestionDTO dto = new PublicQuestionDTO();

        public PublicQuestionDTOBuilder id(String id) {
            dto.setId(id);
            return this;
        }

        public PublicQuestionDTOBuilder stateSlug(String stateSlug) {
            dto.setStateSlug(stateSlug);
            return this;
        }

        public PublicQuestionDTOBuilder districtSlug(String districtSlug) {
            dto.setDistrictSlug(districtSlug);
            return this;
        }

        public PublicQuestionDTOBuilder topic(String topic) {
            dto.setTopic(topic);
            return this;
        }

        public PublicQuestionDTOBuilder testType(String testType) {
            dto.setTestType(testType);
            return this;
        }

        public PublicQuestionDTOBuilder question(String question) {
            dto.setQuestion(question);
            return this;
        }

        public PublicQuestionDTOBuilder options(List<String> options) {
            dto.setOptions(options);
            return this;
        }

        public PublicQuestionDTOBuilder difficulty(String difficulty) {
            dto.setDifficulty(difficulty);
            return this;
        }

        public PublicQuestionDTOBuilder questionNumber(int questionNumber) {
            dto.setQuestionNumber(questionNumber);
            return this;
        }

        public PublicQuestionDTO build() {
            return dto;
        }
    }

    public static PublicQuestionDTOBuilder builder() {
        return new PublicQuestionDTOBuilder();
    }
}
