package com.bodhganga.bodhganga.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DeterministicQuestionClassifierTest {

    private DeterministicQuestionClassifier classifier;

    @BeforeEach
    void setUp() {
        classifier = new DeterministicQuestionClassifier(null);
    }

    // ==========================================
    // FOUNDATION TEST MATRIX (Tests 1 - 6)
    // ==========================================

    @Test
    @DisplayName("1. Direct factual question -> FOUNDATION")
    void test1_DirectFactualQuestion() {
        String qText = "What is the capital of Himachal Pradesh?";
        List<String> options = List.of("(A) Shimla", "(B) Dharamshala", "(C) Mandi", "(D) Solan");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
        assertEquals(DeterministicQuestionClassifier.ConfidenceLevel.HIGH, result.getConfidenceLevel());
        assertTrue(result.getConfidenceScore() >= 0.90);
    }

    @Test
    @DisplayName("2. Definition question -> FOUNDATION")
    void test2_DefinitionQuestion() {
        String qText = "Gross Domestic Product (GDP) is defined as which of the following economic indicators?";
        List<String> options = List.of("(A) Total value of goods", "(B) Net export value", "(C) Total capital flux", "(D) Per capita income");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
        assertEquals(DeterministicQuestionClassifier.ConfidenceLevel.HIGH, result.getConfidenceLevel());
    }

    @Test
    @DisplayName("3. Single-fact geography question -> FOUNDATION")
    void test3_SingleFactGeographyQuestion() {
        String qText = "Which hills region is home to the Nartiang Monoliths in Meghalaya?";
        List<String> options = List.of("(A) Jaintia Hills", "(B) Garo Hills", "(C) Khasi Hills", "(D) Assam Valley");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
        assertEquals(DeterministicQuestionClassifier.ConfidenceLevel.HIGH, result.getConfidenceLevel());
    }

    @Test
    @DisplayName("4. Single-fact history question -> FOUNDATION")
    void test4_SingleFactHistoryQuestion() {
        String qText = "Who founded the Guler state in Himachal Pradesh?";
        List<String> options = List.of("(A) Hari Chand", "(B) Karam Chand", "(C) Rup Chand", "(D) Sansar Chand");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
    }

    @Test
    @DisplayName("5. Single-fact polity question -> FOUNDATION")
    void test5_SingleFactPolityQuestion() {
        String qText = "Under which Article of the Constitution of India is the Governor appointed?";
        List<String> options = List.of("(A) Article 153", "(B) Article 155", "(C) Article 161", "(D) Article 163");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
    }

    @Test
    @DisplayName("6. Single-fact economy question -> FOUNDATION")
    void test6_SingleFactEconomyQuestion() {
        String qText = "Which bank acts as the Lead Bank in Akola district of Maharashtra?";
        List<String> options = List.of("(A) Bank of Maharashtra", "(B) Central Bank of India", "(C) State Bank of India", "(D) Union Bank of India");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.FOUNDATION, result.getClassification());
    }

    // ==========================================
    // STATEMENT_BASED TEST MATRIX (Tests 7 - 17)
    // ==========================================

    @Test
    @DisplayName("7. Statement I / Statement II -> STATEMENT_BASED")
    void test7_StatementI_StatementII() {
        String qText = "Statement I: Rat-hole mining was traditionally practiced in Meghalaya.\n" +
                "Statement II: The National Green Tribunal banned unregulated mining in 2014.";
        List<String> options = List.of("(A) Both Statement I and II are correct", "(B) Both are incorrect", "(C) Statement I correct II incorrect", "(D) Statement I incorrect II correct");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
        assertEquals(DeterministicQuestionClassifier.ConfidenceLevel.HIGH, result.getConfidenceLevel());
    }

    @Test
    @DisplayName("8. Two numbered statements -> STATEMENT_BASED")
    void test8_TwoNumberedStatements() {
        String qText = "Consider the following statements:\n" +
                "1. Himachal Pradesh was formed as a Chief Commissioner's Province in 1948.\n" +
                "2. Mandi was one of the original four districts.";
        List<String> options = List.of("(A) 1 only", "(B) 2 only", "(C) Both 1 and 2", "(D) Neither 1 nor 2");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("9. Three numbered statements -> STATEMENT_BASED")
    void test9_ThreeNumberedStatements() {
        String qText = "Consider the following statements regarding the Solan district:\n" +
                "1. Solan is known as the Mushroom City of India.\n" +
                "2. It was created in 1972.\n" +
                "3. Shoolini Mata temple is located here.";
        List<String> options = List.of("(A) 1 and 2 only", "(B) 2 and 3 only", "(C) 1 and 3 only", "(D) 1, 2 and 3");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("10. 'Which of the statements given above is/are correct?' -> STATEMENT_BASED")
    void test10_WhichOfStatementsCorrect() {
        String qText = "Which of the statements given above is/are correct regarding the Akola fort heritage?";
        List<String> options = List.of("(A) 1 only", "(B) 2 only", "(C) Both 1 and 2", "(D) Neither 1 nor 2");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("11. Assertion/reasoning -> STATEMENT_BASED")
    void test11_AssertionReasoning() {
        String qText = "Assertion (A): Timber supply from Chamba was essential for British railways.\n" +
                "Reason (R): Lord Dalhousie negotiated a lease agreement in 1864.";
        List<String> options = List.of("(A) Both A and R are correct", "(B) A is true R is false", "(C) A is false R is true", "(D) Both are false");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("12. Match List-I with List-II -> STATEMENT_BASED")
    void test12_MatchListI_ListII() {
        String qText = "Match List-I (Rivers) with List-II (Tributaries) and select the correct code:";
        List<String> options = List.of("(A) A-1, B-2, C-3", "(B) A-2, B-1, C-3", "(C) A-3, B-2, C-1", "(D) A-1, B-3, C-2");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("13. Match the following -> STATEMENT_BASED")
    void test13_MatchTheFollowing() {
        String qText = "Match the following historical temples with their founding rulers:";
        List<String> options = List.of("(A) 1-a, 2-b", "(B) 1-b, 2-a", "(C) 1-a, 2-a", "(D) None of these");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("14. Chronological order -> STATEMENT_BASED")
    void test14_ChronologicalOrder() {
        String qText = "Arrange the following historical events in chronological order:";
        List<String> options = List.of("(A) 1-2-3-4", "(B) 2-1-3-4", "(C) 3-1-2-4", "(D) 4-3-2-1");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("15. Arrange in correct sequence -> STATEMENT_BASED")
    void test15_ArrangeInCorrectSequence() {
        String qText = "Arrange the following Himalayan passes in correct sequence from West to East:";
        List<String> options = List.of("(A) Rohtang, Shipki La, Nathu La", "(B) Shipki La, Rohtang, Nathu La", "(C) Nathu La, Rohtang, Shipki La", "(D) Rohtang, Nathu La, Shipki La");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("16. Multiple-condition analytical question -> STATEMENT_BASED")
    void test16_MultipleConditionAnalytical() {
        String qText = "Which of the following conditions must be satisfied for a bill to be certified as a Money Bill under Article 110?";
        List<String> options = List.of("(A) 1 and 2 only", "(B) 2 and 3 only", "(C) 1, 2 and 3", "(D) None of the above");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    @Test
    @DisplayName("17. UPSC-style multi-statement question -> STATEMENT_BASED")
    void test17_UpscStyleMultiStatement() {
        String qText = "Consider the following statements regarding Western Ghats biodiversity:\n" +
                "1. It is one of the eight hottest hotspots of biological diversity in the world.\n" +
                "2. High proportion of endemic species live in high altitude montane forests.\n" +
                "Which of the statements given above is/are correct?";
        List<String> options = List.of("(A) 1 only", "(B) 2 only", "(C) Both 1 and 2", "(D) Neither 1 nor 2");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.STATEMENT_BASED, result.getClassification());
    }

    // ==========================================
    // REVIEW_REQUIRED TEST MATRIX (Tests 18 - 20)
    // ==========================================

    @Test
    @DisplayName("18. Ambiguous malformed question -> REVIEW_REQUIRED")
    void test18_AmbiguousMalformedQuestion() {
        String qText = "Q1. ???";
        List<String> options = List.of("(A) A", "(B) B");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.REVIEW_REQUIRED, result.getClassification());
        assertEquals(DeterministicQuestionClassifier.ConfidenceLevel.LOW, result.getConfidenceLevel());
    }

    @Test
    @DisplayName("19. Question with incomplete text -> REVIEW_REQUIRED")
    void test19_QuestionWithIncompleteText() {
        String qText = "";
        List<String> options = List.of("(A) A", "(B) B");
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.REVIEW_REQUIRED, result.getClassification());
    }

    @Test
    @DisplayName("20. Question with insufficient structural evidence -> REVIEW_REQUIRED")
    void test20_InsufficientStructuralEvidence() {
        String qText = "Random extracted text segment without options or clear structure";
        List<String> options = List.of();
        var result = classifier.classifyQuestion(qText, options);

        assertEquals(DeterministicQuestionClassifier.ClassificationResult.REVIEW_REQUIRED, result.getClassification());
    }
}
