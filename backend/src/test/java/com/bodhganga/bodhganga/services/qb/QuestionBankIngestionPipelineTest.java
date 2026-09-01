package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.util.DistrictParser;
import com.bodhganga.bodhganga.util.ProductMetadataUtil;
import com.google.api.services.drive.model.File;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class QuestionBankIngestionPipelineTest {

    @Test
    @DisplayName("A. State & District Detection from Drive path")
    void testStateAndDistrictDetection() {
        List<String> path = List.of("Karnataka", "Bangalore Urban", "Question Bank", "Question Bank");
        DistrictParser.ParsedLocation location = DistrictParser.extractLocation(path, null);

        assertEquals("Karnataka", location.getState());
        assertEquals("karnataka", location.getStateSlug());
        assertEquals("Bangalore Urban", location.getDistrict());
        assertEquals("bangalore-urban", location.getDistrictSlug());
    }

    @Test
    @DisplayName("B. Kerala Ernakulam Detection")
    void testKeralaErnakulamDetection() {
        List<String> path = List.of("Kerala", "Ernakulam", "Question Bank");
        DistrictParser.ParsedLocation location = DistrictParser.extractLocation(path, null);

        assertEquals("Kerala", location.getState());
        assertEquals("kerala", location.getStateSlug());
        assertEquals("Ernakulam", location.getDistrict());
        assertEquals("ernakulam", location.getDistrictSlug());
    }

    @Test
    @DisplayName("C. Question Bank & Answer Key folder classification in ProductMetadataUtil")
    void testFolderClassification() {
        assertTrue(ProductMetadataUtil.isQuestionBankFolder("Question Bank"));
        assertTrue(ProductMetadataUtil.isQuestionBankFolder("question-bank"));
        assertTrue(ProductMetadataUtil.isQuestionBankFolder("Answer Key"));
        assertTrue(ProductMetadataUtil.isQuestionBankFolder("answer-key"));
        assertFalse(ProductMetadataUtil.isQuestionBankFolder("Free Courses"));
        assertFalse(ProductMetadataUtil.isQuestionBankFolder("Paid Courses"));

        List<String> path = List.of("Karnataka", "Bangalore Urban", "Question Bank");
        ProductMetadataUtil.HierarchicalMetadata meta = ProductMetadataUtil.extractMetadata(path, "Set 1.pdf");
        assertEquals(ProductMetadataUtil.ItemType.QUESTION_BANK, meta.itemType);
    }

    @Test
    @DisplayName("D. Question PDF and Answer Key PDF matching by normalized filename")
    void testQuestionAndAnswerKeyMatching() {
        File q1 = new File().setId("q1").setName("Set 1.pdf");
        File q2 = new File().setId("q2").setName("Set 2.pdf");
        File q3 = new File().setId("q3").setName("Set 3.pdf");
        List<File> questionFiles = List.of(q1, q2, q3);

        File a1 = new File().setId("a1").setName("Set 1.pdf");
        File a2 = new File().setId("a2").setName("Set 2 Answer Key.pdf");
        List<File> answerKeyFiles = List.of(a1, a2);

        Map<File, File> pairs = QuestionBankPipelineTask.pairQuestionAndAnswerKeyFiles(questionFiles, answerKeyFiles);

        assertEquals(3, pairs.size());
        assertEquals("a1", pairs.get(q1).getId());
        assertEquals("a2", pairs.get(q2).getId());
        assertNull(pairs.get(q3)); // Unmatched question PDF
    }

    @Test
    @DisplayName("E. Ambiguous Answer Key matching isolation")
    void testAmbiguousAnswerKeyMatching() {
        File q1 = new File().setId("q1").setName("Set 1.pdf");
        List<File> questionFiles = List.of(q1);

        File a1 = new File().setId("a1").setName("Set 1 Key A.pdf");
        File a2 = new File().setId("a2").setName("Set 1 Key B.pdf");
        List<File> answerKeyFiles = List.of(a1, a2);

        Map<File, File> pairs = QuestionBankPipelineTask.pairQuestionAndAnswerKeyFiles(questionFiles, answerKeyFiles);
        assertNull(pairs.get(q1)); // Should be null due to ambiguity warning
    }

    @Test
    @DisplayName("F. QBQuestion Validation - Valid question passes")
    void testQBQuestionValidationPass() {
        QBQuestion q = new QBQuestion();
        q.setQuestionText("What is the capital of Karnataka?");
        q.setOptions(List.of(
                new QBQuestion.QBOption("A", "Bengaluru", true),
                new QBQuestion.QBOption("B", "Mysuru", false)));
        q.setCorrectAnswer("A");
        q.setDifficulty("EASY");
        q.setStateSlug("karnataka");
        q.setDistrictSlug("bangalore-urban");
        q.setGoogleDriveFileId("drive-123");

        String result = GeminiQuestionParserService.validateQuestion(q);
        assertNull(result, "Valid question should pass validation");
    }

    @Test
    @DisplayName("G. QBQuestion Validation - Invalid cases rejected")
    void testQBQuestionValidationRejections() {
        // Blank text
        QBQuestion q1 = new QBQuestion();
        q1.setQuestionText("");
        assertNotNull(GeminiQuestionParserService.validateQuestion(q1));

        // Missing correctAnswer
        QBQuestion q2 = new QBQuestion();
        q2.setQuestionText("Sample?");
        q2.setOptions(
                List.of(new QBQuestion.QBOption("A", "Opt A", false), new QBQuestion.QBOption("B", "Opt B", false)));
        q2.setCorrectAnswer(null);
        assertNotNull(GeminiQuestionParserService.validateQuestion(q2));

        // Invalid correctAnswer ID not matching options
        QBQuestion q3 = new QBQuestion();
        q3.setQuestionText("Sample?");
        q3.setOptions(
                List.of(new QBQuestion.QBOption("A", "Opt A", false), new QBQuestion.QBOption("B", "Opt B", false)));
        q3.setCorrectAnswer("Z");
        q3.setDifficulty("EASY");
        q3.setStateSlug("karnataka");
        q3.setDistrictSlug("bangalore-urban");
        q3.setGoogleDriveFileId("drive-123");
        assertNotNull(GeminiQuestionParserService.validateQuestion(q3));

        // Invalid difficulty
        QBQuestion q4 = new QBQuestion();
        q4.setQuestionText("Sample?");
        q4.setOptions(
                List.of(new QBQuestion.QBOption("A", "Opt A", true), new QBQuestion.QBOption("B", "Opt B", false)));
        q4.setCorrectAnswer("A");
        q4.setDifficulty("EXTREME");
        q4.setStateSlug("karnataka");
        q4.setDistrictSlug("bangalore-urban");
        q4.setGoogleDriveFileId("drive-123");
        assertNotNull(GeminiQuestionParserService.validateQuestion(q4));
    }

    @Test
    @DisplayName("H. Cross-State and Cross-District Metadata Integrity")
    void testCrossStateDistrictProtection() {
        QBQuestion q1 = new QBQuestion();
        q1.setState("Karnataka");
        q1.setStateSlug("karnataka");
        q1.setDistrict("Bangalore Urban");
        q1.setDistrictSlug("bangalore-urban");

        QBQuestion q2 = new QBQuestion();
        q2.setState("Kerala");
        q2.setStateSlug("kerala");
        q2.setDistrict("Ernakulam");
        q2.setDistrictSlug("ernakulam");

        assertNotEquals(q1.getStateSlug(), q2.getStateSlug());
        assertNotEquals(q1.getDistrictSlug(), q2.getDistrictSlug());
        assertEquals("karnataka", q1.getStateSlug());
        assertEquals("kerala", q2.getStateSlug());
    }
}
