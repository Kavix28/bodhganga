package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Production-safe JSON-based Question Loader for Akola district, Maharashtra.
 * Activated ONLY when configuration property
 * `bodhganga.demo.akola-json.enabled=true`.
 */
@Service
@ConditionalOnProperty(name = "bodhganga.demo.akola-json.enabled", havingValue = "true", matchIfMissing = false)
public class AkolaJsonQuestionLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AkolaJsonQuestionLoader.class);

    private final QuestionRepo questionRepo;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    public AkolaJsonQuestionLoader(QuestionRepo questionRepo, ResourceLoader resourceLoader,
            ObjectMapper objectMapper) {
        this.questionRepo = questionRepo;
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        loadAkolaDemoQuestions();
    }

    public LoaderResult loadAkolaDemoQuestions() throws Exception {
        String location = "classpath:data/questions/maharashtra/akola.json";
        Resource resource = resourceLoader.getResource(location);

        if (!resource.exists()) {
            log.warn("[AKOLA JSON LOADER] Resource file not found at: {}", location);
            return new LoaderResult(0, 0, 0, 0);
        }

        List<AkolaQuestionJsonRecord> records;
        try (var inputStream = resource.getInputStream()) {
            records = objectMapper.readValue(inputStream, new TypeReference<List<AkolaQuestionJsonRecord>>() {
            });
        }

        int totalRead = records != null ? records.size() : 0;
        log.info("[AKOLA JSON LOADER] Read {} records from JSON resource: {}", totalRead, location);

        if (records == null || records.isEmpty()) {
            return new LoaderResult(0, 0, 0, 0);
        }

        Set<String> seenIds = new HashSet<>();
        int insertedCount = 0;
        int skippedCount = 0;

        for (int i = 0; i < records.size(); i++) {
            AkolaQuestionJsonRecord rec = records.get(i);
            validateRecord(rec, seenIds);

            Question q = Question.builder()
                    .id(rec.getId())
                    .stateSlug(rec.getStateSlug())
                    .districtSlug(rec.getDistrictSlug())
                    .testType(rec.getTestType())
                    .level(rec.getLevel())
                    .topic(rec.getTopic() != null ? rec.getTopic() : "General")
                    .question(rec.getQuestion())
                    .options(rec.getOptions())
                    .correctAnswer(rec.getCorrectAnswer())
                    .explanation(rec.getExplanation())
                    .difficulty(rec.getDifficulty() != null ? rec.getDifficulty() : "Easy")
                    .questionNumber(rec.getQuestionNumber())
                    .status(rec.getStatus() != null ? rec.getStatus() : "PUBLISHED")
                    .isActive(rec.getIsActive() != null ? rec.getIsActive() : true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            if (questionRepo.existsById(rec.getId())) {
                questionRepo.save(q);
                skippedCount++;
            } else {
                questionRepo.save(q);
                insertedCount++;
            }
        }

        LoaderResult result = new LoaderResult(totalRead, insertedCount, skippedCount, 0);
        log.info(
                "[AKOLA JSON LOADER SUMMARY] Total Read: {} | Inserted: {} | Skipped (Existing Updated): {} | Rejected: {}",
                result.getTotalRead(), result.getInsertedCount(), result.getSkippedCount(), result.getRejectedCount());
        return result;
    }

    private void validateRecord(AkolaQuestionJsonRecord rec, Set<String> seenIds) {
        if (rec == null) {
            throw new IllegalArgumentException("Record cannot be null");
        }
        if (rec.getId() == null || rec.getId().isBlank()) {
            throw new IllegalArgumentException("Question ID must not be blank");
        }
        if (seenIds.contains(rec.getId())) {
            throw new IllegalArgumentException("Duplicate Question ID found in JSON: " + rec.getId());
        }
        seenIds.add(rec.getId());

        if (rec.getQuestionNumber() == null || rec.getQuestionNumber() <= 0) {
            throw new IllegalArgumentException("Question number must be positive");
        }
        if (!"maharashtra".equalsIgnoreCase(rec.getStateSlug())) {
            throw new IllegalArgumentException("State slug must be 'maharashtra'");
        }
        if (!"akola".equalsIgnoreCase(rec.getDistrictSlug())) {
            throw new IllegalArgumentException("District slug must be 'akola'");
        }
        if (rec.getTestType() == null || rec.getTestType().isBlank()) {
            throw new IllegalArgumentException("Test type must not be blank");
        }
        if (rec.getQuestion() == null || rec.getQuestion().isBlank()) {
            throw new IllegalArgumentException("Question text must not be blank");
        }
        if (rec.getOptions() == null || rec.getOptions().size() != 4) {
            throw new IllegalArgumentException("Options must contain exactly 4 items");
        }
        for (int i = 0; i < rec.getOptions().size(); i++) {
            if (rec.getOptions().get(i) == null || rec.getOptions().get(i).isBlank()) {
                throw new IllegalArgumentException("Option at index " + i + " must not be blank");
            }
        }
        if (rec.getCorrectAnswer() == null || rec.getCorrectAnswer() < 0 || rec.getCorrectAnswer() > 3) {
            throw new IllegalArgumentException("Correct answer index must be an integer between 0 and 3");
        }
        if (rec.getExplanation() == null || rec.getExplanation().isBlank()) {
            throw new IllegalArgumentException("Explanation must not be blank");
        }
    }

    public static class LoaderResult {
        private final int totalRead;
        private final int insertedCount;
        private final int skippedCount;
        private final int rejectedCount;

        public LoaderResult(int totalRead, int insertedCount, int skippedCount, int rejectedCount) {
            this.totalRead = totalRead;
            this.insertedCount = insertedCount;
            this.skippedCount = skippedCount;
            this.rejectedCount = rejectedCount;
        }

        public int getTotalRead() {
            return totalRead;
        }

        public int getInsertedCount() {
            return insertedCount;
        }

        public int getSkippedCount() {
            return skippedCount;
        }

        public int getRejectedCount() {
            return rejectedCount;
        }
    }

    public static class AkolaQuestionJsonRecord {
        private String id;
        private String stateSlug;
        private String districtSlug;
        private String testType;
        private String level;
        private String topic;
        private String question;
        private List<String> options;
        private Integer correctAnswer;
        private String explanation;
        private String difficulty;
        private Integer questionNumber;
        private String status;
        private Boolean isActive;

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

        public String getTestType() {
            return testType;
        }

        public void setTestType(String testType) {
            this.testType = testType;
        }

        public String getLevel() {
            return level;
        }

        public void setLevel(String level) {
            this.level = level;
        }

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
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

        public Integer getCorrectAnswer() {
            return correctAnswer;
        }

        public void setCorrectAnswer(Integer correctAnswer) {
            this.correctAnswer = correctAnswer;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public Integer getQuestionNumber() {
            return questionNumber;
        }

        public void setQuestionNumber(Integer questionNumber) {
            this.questionNumber = questionNumber;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Boolean getIsActive() {
            return isActive;
        }

        public void setIsActive(Boolean isActive) {
            this.isActive = isActive;
        }
    }
}
