package com.bodhganga.bodhganga.entity.testseries;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.*;

@Document(collection = "test_questions")
@CompoundIndexes({
    @CompoundIndex(name = "subject_topic_diff_idx", def = "{'subjectId': 1, 'topicId': 1, 'difficulty': 1}"),
    @CompoundIndex(name = "type_bloom_idx", def = "{'questionType': 1, 'bloomLevel': 1}")
})
public class Question {

    @Id
    private String id;

    private String questionType; // MCQ, MULTI_SELECT, TRUE_FALSE, ASSERTION_REASON, MATCH_FOLLOWING, PARAGRAPH
    private String paragraphGroupId; // Linked to QuestionGroup if passage-based

    private String questionText;
    private String imageUrl;
    private String audioVideoUrl;

    private List<Option> options = new ArrayList<>();
    private List<String> correctOptionIds = new ArrayList<>();

    // For Assertion-Reason or Match Following
    private String assertionText;
    private String reasonText;
    private Map<String, String> matchPairs = new HashMap<>(); // e.g. "Item A" -> "Match 1"

    private String detailedExplanation;
    private String explanationVideoUrl;

    // Metadata Taxonomy
    private String subjectId;
    private String topicId;
    private String stateSlug;
    private String districtSlug;
    private String difficulty; // EASY, MEDIUM, HARD, EXTREME
    private String bloomLevel; // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
    private List<String> tags = new ArrayList<>();

    private Boolean isDeleted = false;
    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    public Question() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }

    public String getParagraphGroupId() { return paragraphGroupId; }
    public void setParagraphGroupId(String paragraphGroupId) { this.paragraphGroupId = paragraphGroupId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getAudioVideoUrl() { return audioVideoUrl; }
    public void setAudioVideoUrl(String audioVideoUrl) { this.audioVideoUrl = audioVideoUrl; }

    public List<Option> getOptions() { return options; }
    public void setOptions(List<Option> options) { this.options = options; }

    public List<String> getCorrectOptionIds() { return correctOptionIds; }
    public void setCorrectOptionIds(List<String> correctOptionIds) { this.correctOptionIds = correctOptionIds; }

    public String getAssertionText() { return assertionText; }
    public void setAssertionText(String assertionText) { this.assertionText = assertionText; }

    public String getReasonText() { return reasonText; }
    public void setReasonText(String reasonText) { this.reasonText = reasonText; }

    public Map<String, String> getMatchPairs() { return matchPairs; }
    public void setMatchPairs(Map<String, String> matchPairs) { this.matchPairs = matchPairs; }

    public String getDetailedExplanation() { return detailedExplanation; }
    public void setDetailedExplanation(String detailedExplanation) { this.detailedExplanation = detailedExplanation; }

    public String getExplanationVideoUrl() { return explanationVideoUrl; }
    public void setExplanationVideoUrl(String explanationVideoUrl) { this.explanationVideoUrl = explanationVideoUrl; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }

    public String getStateSlug() { return stateSlug; }
    public void setStateSlug(String stateSlug) { this.stateSlug = stateSlug; }

    public String getDistrictSlug() { return districtSlug; }
    public void setDistrictSlug(String districtSlug) { this.districtSlug = districtSlug; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getBloomLevel() { return bloomLevel; }
    public void setBloomLevel(String bloomLevel) { this.bloomLevel = bloomLevel; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
