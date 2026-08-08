package com.bodhganga.bodhganga.entity.testseries;

public class Option {
    private String optionId; // e.g. "A", "B", "C", "D" or UUID
    private String text;
    private String imageUrl;
    private Boolean isCorrect;

    public Option() {}

    public Option(String optionId, String text, String imageUrl, Boolean isCorrect) {
        this.optionId = optionId;
        this.text = text;
        this.imageUrl = imageUrl;
        this.isCorrect = isCorrect;
    }

    public String getOptionId() { return optionId; }
    public void setOptionId(String optionId) { this.optionId = optionId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
