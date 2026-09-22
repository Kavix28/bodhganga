package com.bodhganga.bodhganga.service;

import com.bodhganga.bodhganga.BodhgangaApplication;
import com.bodhganga.bodhganga.controllers.QuizAttemptController;
import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.dto.QuizSubmissionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = BodhgangaApplication.class)
@ActiveProfiles("test")
public class QuizAvailabilityServiceTest {

        @Autowired
        private QuizAvailabilityService quizAvailabilityService;

        @Autowired
        private QuizAttemptController quizAttemptController;

        @Autowired
        private QuestionSeedService questionSeedService;

        @org.junit.jupiter.api.BeforeEach
        void setUp() {
                questionSeedService.seedQuestions();
        }

        @Test
        public void testStateAvailabilityPolicy() {
                assertTrue(quizAvailabilityService.isStateAvailable("maharashtra"), "maharashtra -> true");
                assertTrue(quizAvailabilityService.isStateAvailable("MAHARASHTRA"), "MAHARASHTRA -> true");
                assertTrue(quizAvailabilityService.isStateAvailable(" maharashtra "), " padded maharashtra -> true");
                assertFalse(quizAvailabilityService.isStateAvailable("gujarat"), "gujarat -> false");
                assertFalse(quizAvailabilityService.isStateAvailable("punjab"), "punjab -> false");
                assertFalse(quizAvailabilityService.isStateAvailable(null), "null state -> false");
                assertFalse(quizAvailabilityService.isStateAvailable("   "), "blank state -> false");
        }

        @Test
        public void testDistrictAvailabilityPolicy() {
                // maharashtra/akola -> true
                assertTrue(quizAvailabilityService.isDistrictAvailable("maharashtra", "akola"),
                                "maharashtra/akola -> true");
                // MAHARASHTRA/AKOLA -> true
                assertTrue(quizAvailabilityService.isDistrictAvailable("MAHARASHTRA", "AKOLA"),
                                "MAHARASHTRA/AKOLA -> true");
                // " maharashtra "/" akola " -> true
                assertTrue(quizAvailabilityService.isDistrictAvailable(" maharashtra ", " akola "),
                                "\" maharashtra \"/\" akola \" -> true");
                // maharashtra/pune -> false
                assertFalse(quizAvailabilityService.isDistrictAvailable("maharashtra", "pune"),
                                "maharashtra/pune -> false");
                // gujarat/akola -> false
                assertFalse(quizAvailabilityService.isDistrictAvailable("gujarat", "akola"),
                                "gujarat/akola -> false");
                // gujarat/surat -> false
                assertFalse(quizAvailabilityService.isDistrictAvailable("gujarat", "surat"),
                                "gujarat/surat -> false");
                // null values -> false
                assertFalse(quizAvailabilityService.isDistrictAvailable(null, "akola"), "null state -> false");
                assertFalse(quizAvailabilityService.isDistrictAvailable("maharashtra", null), "null district -> false");
                assertFalse(quizAvailabilityService.isDistrictAvailable(null, null), "both null -> false");
                // blank values -> false
                assertFalse(quizAvailabilityService.isDistrictAvailable("", "akola"), "blank state -> false");
                assertFalse(quizAvailabilityService.isDistrictAvailable("maharashtra", "   "),
                                "blank district -> false");
        }

        @Test
        public void testBackendQuizControllerEnforcement() {
                // 1. Bengaluru questions return HTTP 200
                ResponseEntity<ApiResponseDTO> bengaluruRes = quizAttemptController.getQuestions("karnataka", "bengaluru",
                                "easy",
                                null, 0);
                assertEquals(HttpStatus.OK, bengaluruRes.getStatusCode());
                assertTrue(bengaluruRes.getBody().isSuccess());

                // 2. Pune questions return HTTP 403
                ResponseEntity<ApiResponseDTO> puneRes = quizAttemptController.getQuestions("maharashtra", "pune",
                                "easy", null,
                                0);
                assertEquals(HttpStatus.FORBIDDEN, puneRes.getStatusCode());
                assertFalse(puneRes.getBody().isSuccess());
                assertEquals("The question bank for this location is coming soon.", puneRes.getBody().getMessage());
                assertTrue(puneRes.getBody().getData() instanceof Map);
                Map<?, ?> dataMap = (Map<?, ?>) puneRes.getBody().getData();
                assertEquals("QUESTION_BANK_COMING_SOON", dataMap.get("code"));

                // 3. Gujarat/Surat questions return HTTP 403
                ResponseEntity<ApiResponseDTO> suratRes = quizAttemptController.getQuestions("gujarat", "surat", "easy",
                                null,
                                0);
                assertEquals(HttpStatus.FORBIDDEN, suratRes.getStatusCode());
                assertFalse(suratRes.getBody().isSuccess());
                assertEquals("The question bank for this location is coming soon.", suratRes.getBody().getMessage());

                // 4. Pune published-count returns HTTP 403
                ResponseEntity<ApiResponseDTO> puneCountRes = quizAttemptController.getPublishedCount("maharashtra",
                                "pune");
                assertEquals(HttpStatus.FORBIDDEN, puneCountRes.getStatusCode());
                assertFalse(puneCountRes.getBody().isSuccess());
                Map<?, ?> countDataMap = (Map<?, ?>) puneCountRes.getBody().getData();
                assertEquals("QUESTION_BANK_COMING_SOON", countDataMap.get("code"));

                // 5. Pune submission returns HTTP 403
                QuizSubmissionDTO subDTO = new QuizSubmissionDTO();
                subDTO.setStateSlug("maharashtra");
                subDTO.setDistrictSlug("pune");
                subDTO.setQuestionIds(Collections.singletonList("test-q1"));
                ResponseEntity<ApiResponseDTO> submitRes = quizAttemptController.submitQuiz(subDTO, null);
                assertEquals(HttpStatus.FORBIDDEN, submitRes.getStatusCode());
                assertFalse(submitRes.getBody().isSuccess());
                Map<?, ?> submitDataMap = (Map<?, ?>) submitRes.getBody().getData();
                assertEquals("QUESTION_BANK_COMING_SOON", submitDataMap.get("code"));
        }
}
