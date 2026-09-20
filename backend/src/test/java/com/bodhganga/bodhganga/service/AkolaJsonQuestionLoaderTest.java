package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.PublicQuestionDTO;
import com.bodhganga.bodhganga.dto.QuizSubmissionDTO;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import com.bodhganga.bodhganga.controllers.QuizAttemptController;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class AkolaJsonQuestionLoaderTest {

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private QuizAttemptController quizAttemptController;

    @Autowired
    private ObjectMapper objectMapper;

    private AkolaJsonQuestionLoader loader;

    @BeforeEach
    void setUp() {
        loader = new AkolaJsonQuestionLoader(questionRepo, new DefaultResourceLoader(), objectMapper);
    }

    @Test
    void testJsonParsingAndLoaderExecution() throws Exception {
        AkolaJsonQuestionLoader.LoaderResult result = loader.loadAkolaDemoQuestions();

        assertEquals(136, result.getTotalRead(), "Must read 136 questions from JSON resource");
        assertTrue(result.getInsertedCount() >= 0);
        assertTrue(result.getSkippedCount() >= 0);
        assertEquals(0, result.getRejectedCount(), "Zero validation rejections");
    }

    @Test
    void testIdempotentInsertion() throws Exception {
        loader.loadAkolaDemoQuestions();

        AkolaJsonQuestionLoader.LoaderResult run2 = loader.loadAkolaDemoQuestions();

        assertEquals(0, run2.getInsertedCount(), "Second run must insert 0 new items");
        assertEquals(136, run2.getSkippedCount(), "Second run must skip all 136 existing items as duplicates");
    }

    @Test
    void testValidationRules() {
        AkolaJsonQuestionLoader.AkolaQuestionJsonRecord invalidState = createValidRecord();
        invalidState.setStateSlug("karnataka");
        assertThrows(IllegalStateException.class, () -> invokeValidation(invalidState));

        AkolaJsonQuestionLoader.AkolaQuestionJsonRecord invalidDistrict = createValidRecord();
        invalidDistrict.setDistrictSlug("bengaluru");
        assertThrows(IllegalStateException.class, () -> invokeValidation(invalidDistrict));

        AkolaJsonQuestionLoader.AkolaQuestionJsonRecord invalidOptions = createValidRecord();
        invalidOptions.setOptions(List.of("A", "B", "C")); // 3 options
        assertThrows(IllegalStateException.class, () -> invokeValidation(invalidOptions));

        AkolaJsonQuestionLoader.AkolaQuestionJsonRecord invalidAnswer = createValidRecord();
        invalidAnswer.setCorrectAnswer(4); // index 4 invalid
        assertThrows(IllegalStateException.class, () -> invokeValidation(invalidAnswer));
    }

    @Test
    void testPublicApiQuestionRetrievalAndProtection() throws Exception {
        loader.loadAkolaDemoQuestions();

        ResponseEntity<ApiResponseDTO> response = quizAttemptController.getQuestions(
                "maharashtra", "akola", "easy", null, 20);

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ApiResponseDTO body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());

        @SuppressWarnings("unchecked")
        List<PublicQuestionDTO> questions = (List<PublicQuestionDTO>) body.getData();
        assertFalse(questions.isEmpty(), "Questions list must not be empty");

        for (PublicQuestionDTO q : questions) {
            assertEquals("maharashtra", q.getStateSlug());
            assertEquals("akola", q.getDistrictSlug());
            assertNotNull(q.getQuestion());
            assertEquals(4, q.getOptions().size());
            assertNotNull(q.getTopic());
            assertNotNull(q.getDifficulty());
            assertTrue(q.getQuestionNumber() > 0);
        }
    }

    @Test
    void testMasterQuestionRetrieval() throws Exception {
        loader.loadAkolaDemoQuestions();

        ResponseEntity<ApiResponseDTO> response = quizAttemptController.getQuestions(
                "maharashtra", "akola", "master", null, 200);

        ApiResponseDTO body = response.getBody();
        assertNotNull(body);
        @SuppressWarnings("unchecked")
        List<PublicQuestionDTO> questions = (List<PublicQuestionDTO>) body.getData();

        assertTrue(questions.size() >= 136, "Master test query must return at least 136 questions");
    }

    @Test
    void testPublishedCountEndpoint() throws Exception {
        loader.loadAkolaDemoQuestions();

        ResponseEntity<ApiResponseDTO> response = quizAttemptController.getPublishedCount("maharashtra", "akola");

        ApiResponseDTO body = response.getBody();
        assertNotNull(body);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) body.getData();

        long count = ((Number) data.get("count")).longValue();
        boolean available = (Boolean) data.get("available");

        assertTrue(count >= 136, "Published count must be at least 136");
        assertTrue(available, "Available flag must be true");
    }

    @Test
    void testQuizSubmissionAndGrading() throws Exception {
        loader.loadAkolaDemoQuestions();

        Optional<Question> qOpt = questionRepo.findById("maharashtra-akola-easy-1");
        assertTrue(qOpt.isPresent(), "Question maharashtra-akola-easy-1 must exist");
        Question q = qOpt.get();

        QuizSubmissionDTO submission = new QuizSubmissionDTO();
        submission.setStateSlug("maharashtra");
        submission.setDistrictSlug("akola");
        submission.setTestType("easy");
        submission.setTimeTaken(120);
        submission.setQuestionIds(List.of(q.getId()));

        Map<String, Integer> answers = new HashMap<>();
        answers.put(q.getId(), q.getCorrectAnswer()); // Correct answer selection
        submission.setAnswers(answers);

        ResponseEntity<ApiResponseDTO> response = quizAttemptController.submitQuiz(submission, null);

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ApiResponseDTO body = response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) body.getData();
        assertEquals(1, data.get("totalQuestions"));
        assertEquals(1, data.get("correctCount"));
        assertEquals(0, data.get("incorrectCount"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gradedQuestions = (List<Map<String, Object>>) data.get("gradedQuestions");
        assertEquals(1, gradedQuestions.size());
        Map<String, Object> gradedQ = gradedQuestions.get(0);

        assertEquals(q.getId(), gradedQ.get("id"));
        assertEquals(q.getCorrectAnswer(), gradedQ.get("correctAnswer"));
        assertEquals(q.getExplanation(), gradedQ.get("explanation"));
        assertEquals(true, gradedQ.get("isCorrect"));
    }

    private void invokeValidation(AkolaJsonQuestionLoader.AkolaQuestionJsonRecord record) throws Exception {
        var method = AkolaJsonQuestionLoader.class.getDeclaredMethod("validateRecord",
                AkolaJsonQuestionLoader.AkolaQuestionJsonRecord.class, Set.class);
        method.setAccessible(true);
        try {
            method.invoke(loader, record, new HashSet<String>());
        } catch (java.lang.reflect.InvocationTargetException e) {
            if (e.getCause() instanceof Exception) {
                throw new IllegalStateException(e.getCause().getMessage(), e.getCause());
            }
            throw e;
        }
    }

    private AkolaJsonQuestionLoader.AkolaQuestionJsonRecord createValidRecord() {
        AkolaJsonQuestionLoader.AkolaQuestionJsonRecord rec = new AkolaJsonQuestionLoader.AkolaQuestionJsonRecord();
        rec.setId("maharashtra-akola-easy-999");
        rec.setStateSlug("maharashtra");
        rec.setDistrictSlug("akola");
        rec.setTestType("easy");
        rec.setLevel("foundation");
        rec.setTopic("Geography");
        rec.setQuestion("Valid Question text?");
        rec.setOptions(List.of("Opt A", "Opt B", "Opt C", "Opt D"));
        rec.setCorrectAnswer(0);
        rec.setExplanation("Valid explanation text.");
        rec.setDifficulty("Easy");
        rec.setQuestionNumber(999);
        rec.setStatus("PUBLISHED");
        rec.setIsActive(true);
        return rec;
    }
}
