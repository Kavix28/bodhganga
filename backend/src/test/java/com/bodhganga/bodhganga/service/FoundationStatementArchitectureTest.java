package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class FoundationStatementArchitectureTest {

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private QuestionBankMigrationService migrationService;

    @Autowired
    private QuestionMatchingService questionMatchingService;

    @BeforeEach
    void setUp() {
        questionRepo.deleteAll();
    }

    @Test
    void testQuestionBankMigrationNormalizesLegacyFields() {
        Question legacyEasy = Question.builder()
                .id("test-easy-1")
                .stateSlug("maharashtra")
                .districtSlug("akola")
                .testType("easy")
                .level("foundation")
                .question("Sample easy question?")
                .status("PUBLISHED")
                .isActive(true)
                .build();

        Question legacyAdvanced = Question.builder()
                .id("test-adv-1")
                .stateSlug("maharashtra")
                .districtSlug("akola")
                .testType("advanced")
                .level("upsc-level")
                .question("Sample advanced question?")
                .status("PUBLISHED")
                .isActive(true)
                .build();

        Question master = Question.builder()
                .id("test-master-1")
                .stateSlug("maharashtra")
                .districtSlug("akola")
                .testType("master")
                .level("foundation")
                .question("Sample master question?")
                .status("PUBLISHED")
                .isActive(true)
                .build();

        questionRepo.saveAll(List.of(legacyEasy, legacyAdvanced, master));

        migrationService.migrateLegacyQuestionClassifications();

        Question migratedEasy = questionRepo.findById("test-easy-1").orElseThrow();
        assertEquals("foundation", migratedEasy.getTestType());
        assertEquals("foundation", migratedEasy.getLevel());

        Question migratedAdv = questionRepo.findById("test-adv-1").orElseThrow();
        assertEquals("statement-based", migratedAdv.getTestType());
        assertEquals("statement-based", migratedAdv.getLevel());

        Question migratedMaster = questionRepo.findById("test-master-1").orElseThrow();
        assertEquals("master", migratedMaster.getTestType());
    }

    @Test
    void testQuestionMatchingMapsLevelsToFoundationAndStatementBased() {
        List<QuestionParserService.ParsedQuestion> pqs = new ArrayList<>();

        QuestionParserService.ParsedQuestion pq1 = new QuestionParserService.ParsedQuestion();
        pq1.setQuestionNumber(1);
        pq1.setQuestionText("What is Akola history?");
        pq1.setOptions(List.of("A", "B", "C", "D"));
        pq1.setLevel("foundation");
        pq1.setTopic("History");
        pqs.add(pq1);

        QuestionParserService.ParsedQuestion pq2 = new QuestionParserService.ParsedQuestion();
        pq2.setQuestionNumber(2);
        pq2.setQuestionText("Consider the following statements regarding Akola river systems...");
        pq2.setOptions(List.of("Only 1", "Only 2", "Both 1 and 2", "Neither 1 nor 2"));
        pq2.setLevel("upsc-level");
        pq2.setTopic("Geography");
        pqs.add(pq2);

        AnswerParserService.ParsedAnswer pa1 = new AnswerParserService.ParsedAnswer();
        pa1.setQuestionNumber(1);
        pa1.setCorrectOptionIndex(0);
        pa1.setExplanation("Explanation 1");

        AnswerParserService.ParsedAnswer pa2 = new AnswerParserService.ParsedAnswer();
        pa2.setQuestionNumber(2);
        pa2.setCorrectOptionIndex(2);
        pa2.setExplanation("Explanation 2");

        var answersMap = java.util.Map.of(1, pa1, 2, pa2);

        List<Question> questions = questionMatchingService.matchAndBuildQuestions(
                pqs, answersMap, "maharashtra", "akola", "auto", "doc-123", "q.pdf", "a.pdf", "hash-123");

        assertNotNull(questions);
        assertEquals(2, questions.size());

        Question q1 = questions.get(0);
        assertEquals("foundation", q1.getTestType());
        assertEquals("foundation", q1.getLevel());

        Question q2 = questions.get(1);
        assertEquals("statement-based", q2.getTestType());
        assertEquals("statement-based", q2.getLevel());
    }
}
