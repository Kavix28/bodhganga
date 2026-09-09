package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.dto.PublicQuestionDTO;
import com.bodhganga.bodhganga.dto.QuizSubmissionDTO;
import com.bodhganga.bodhganga.entity.Question;
import com.bodhganga.bodhganga.entity.QuizAttempt;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.repo.QuestionRepo;
import com.bodhganga.bodhganga.repo.QuizAttemptRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BodhgangaApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class QuizControllerSecurityAndGradingTests {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private QuestionRepo questionRepo;

        @Autowired
        private QuizAttemptRepo quizAttemptRepo;

        @Autowired
        private UserRepo userRepo;

        @Autowired
        private QuestionSeedService questionSeedService;

        private static final String TEST_USER_EMAIL = "student@bodhganga.com";

        @BeforeEach
        void setUp() {
                questionRepo.deleteAll();
                quizAttemptRepo.deleteAll();
                userRepo.deleteAll();

                User user = new User();
                user.setId(UUID.randomUUID().toString());
                user.setEmail(TEST_USER_EMAIL);
                user.setName("Student Test User");
                userRepo.save(user);

                questionSeedService.seedQuestions();
        }

        @Test
        void test1_questionRepositoryFiltering() {
                List<Question> blrEasy = questionRepo
                                .findByStateSlugAndDistrictSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                                                "karnataka", "bengaluru", "easy");
                assertFalse(blrEasy.isEmpty());
                assertEquals("karnataka", blrEasy.get(0).getStateSlug());
                assertEquals("bengaluru", blrEasy.get(0).getDistrictSlug());
                assertEquals("easy", blrEasy.get(0).getTestType());
        }

        @Test
        void test2_publicQuestionDTONeverExposesCorrectAnswerOrExplanation() {
                assertThrows(NoSuchFieldException.class,
                                () -> PublicQuestionDTO.class.getDeclaredField("correctAnswer"));
                assertThrows(NoSuchFieldException.class, () -> PublicQuestionDTO.class.getDeclaredField("explanation"));
        }

        @Test
        @WithMockUser(username = TEST_USER_EMAIL)
        void test3_questionApiReturnsSanitizedQuestionsWithoutAnswerKeys() throws Exception {
                mockMvc.perform(get("/api/quiz/questions")
                                .param("stateSlug", "karnataka")
                                .param("districtSlug", "bengaluru")
                                .param("testType", "easy"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                                .andExpect(jsonPath("$.data[0].id").exists())
                                .andExpect(jsonPath("$.data[0].question").exists())
                                .andExpect(jsonPath("$.data[0].options").exists())
                                .andExpect(jsonPath("$.data[0].correctAnswer").doesNotExist())
                                .andExpect(jsonPath("$.data[0].explanation").doesNotExist());
        }

        @Test
        @WithMockUser(username = TEST_USER_EMAIL)
        void test4_questionFilteringByStateDistrictTestTypeAndTopic() throws Exception {
                mockMvc.perform(get("/api/quiz/questions")
                                .param("stateSlug", "chhattisgarh")
                                .param("districtSlug", "balod")
                                .param("testType", "easy")
                                .param("topic", "Geography"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data[0].topic").value("Geography"));
        }

        @Test
        @WithMockUser(username = TEST_USER_EMAIL)
        void test5_serverSideGradingCalculatesScoreCorrectlyAndIgnoresForgedPayload() throws Exception {
                List<Question> qList = questionRepo
                                .findByStateSlugAndDistrictSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                                                "karnataka", "bengaluru", "easy");
                assertTrue(qList.size() >= 2);

                Question q1 = qList.get(0); // correct ans 1
                Question q2 = qList.get(1); // correct ans 1

                List<String> qIds = Arrays.asList(q1.getId(), q2.getId());
                Map<String, Integer> answers = new HashMap<>();
                answers.put(q1.getId(), q1.getCorrectAnswer()); // Correct
                answers.put(q2.getId(), (q2.getCorrectAnswer() + 1) % 4); // Incorrect

                Map<String, Object> forgedBody = new HashMap<>();
                forgedBody.put("stateSlug", "karnataka");
                forgedBody.put("districtSlug", "bengaluru");
                forgedBody.put("testType", "easy");
                forgedBody.put("timeTaken", 45);
                forgedBody.put("questionIds", qIds);
                forgedBody.put("answers", answers);
                forgedBody.put("score", 999999);
                forgedBody.put("percentage", 100);
                forgedBody.put("accuracy", 100);

                mockMvc.perform(post("/api/quiz/submit")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(forgedBody)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.totalQuestions").value(2))
                                .andExpect(jsonPath("$.data.correctCount").value(1))
                                .andExpect(jsonPath("$.data.incorrectCount").value(1))
                                .andExpect(jsonPath("$.data.unattemptedCount").value(0))
                                .andExpect(jsonPath("$.data.score").value(1.5))
                                .andExpect(jsonPath("$.data.percentage").value(50))
                                .andExpect(jsonPath("$.data.accuracy").value(50))
                                .andExpect(jsonPath("$.data.score", not(999999)));
        }

        @Test
        @WithMockUser(username = TEST_USER_EMAIL)
        void test6_unansweredQuestionsHandledCorrectly() throws Exception {
                List<Question> qList = questionRepo
                                .findByStateSlugAndDistrictSlugAndTestTypeAndIsActiveTrueOrderByQuestionNumberAsc(
                                                "karnataka", "bengaluru", "easy");
                assertTrue(qList.size() >= 2);

                Question q1 = qList.get(0);
                Question q2 = qList.get(1);

                List<String> qIds = Arrays.asList(q1.getId(), q2.getId());
                Map<String, Integer> answers = new HashMap<>();
                answers.put(q1.getId(), q1.getCorrectAnswer()); // 1 correct, q2 unanswered

                QuizSubmissionDTO submission = QuizSubmissionDTO.builder()
                                .stateSlug("karnataka")
                                .districtSlug("bengaluru")
                                .testType("easy")
                                .timeTaken(30)
                                .questionIds(qIds)
                                .answers(answers)
                                .build();

                mockMvc.perform(post("/api/quiz/submit")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(submission)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.correctCount").value(1))
                                .andExpect(jsonPath("$.data.incorrectCount").value(0))
                                .andExpect(jsonPath("$.data.unattemptedCount").value(1))
                                .andExpect(jsonPath("$.data.score").value(2.0));
        }

        @Test
        void test7_historicalQuizAttemptCompatibility() {
                QuizAttempt oldAttempt = QuizAttempt.builder()
                                .id("hist-123")
                                .userId("user-1")
                                .stateSlug("karnataka")
                                .districtSlug("bengaluru")
                                .testType("easy")
                                .totalQuestions(20)
                                .correctCount(15)
                                .incorrectCount(5)
                                .unattemptedCount(0)
                                .score(27.5)
                                .percentage(75)
                                .accuracy(75)
                                .timeTaken(300)
                                .build();

                quizAttemptRepo.save(oldAttempt);

                QuizAttempt fetched = quizAttemptRepo.findById("hist-123").orElse(null);
                assertNotNull(fetched);
                assertEquals(27.5, fetched.getScore());
        }
}
