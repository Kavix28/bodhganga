package com.bodhganga.bodhganga.controllers.qb;

import com.bodhganga.bodhganga.dto.ApiResponseDTO;
import com.bodhganga.bodhganga.entity.qb.QBAttempt;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.repo.qb.QBAttemptRepo;
import com.bodhganga.bodhganga.repo.qb.QBBundleRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.repo.qb.QBTestRepo;
import com.bodhganga.bodhganga.services.qb.StateTestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class QuestionBankControllerSecurityTest {

    private QBTestRepo testRepo;
    private QBQuestionRepo questionRepo;
    private QBAttemptRepo attemptRepo;
    private QBBundleRepo bundleRepo;
    private StateTestService stateTestService;
    private MongoTemplate mongoTemplate;
    private QuestionBankController controller;

    private String userId = "user-789";

    @BeforeEach
    void setUp() {
        testRepo = mock(QBTestRepo.class);
        questionRepo = mock(QBQuestionRepo.class);
        attemptRepo = mock(QBAttemptRepo.class);
        bundleRepo = mock(QBBundleRepo.class);
        stateTestService = mock(StateTestService.class);
        mongoTemplate = mock(MongoTemplate.class);

        controller = new QuestionBankController(testRepo, questionRepo, attemptRepo, bundleRepo, mongoTemplate,
                stateTestService);

        // Setup security context with userId
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(userId);
        when(auth.getPrincipal()).thenReturn(userId);
        when(auth.isAuthenticated()).thenReturn(true);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    private QBQuestion createQuestion(String id, String correctAns) {
        QBQuestion q = new QBQuestion();
        q.setId(id);
        q.setCorrectAnswer(correctAns);
        q.setMarks(1.0);
        q.setNegativeMarks(0.25);
        return q;
    }

    @Test
    @DisplayName("7 & 8. Second submission on already submitted attempt is rejected")
    void testSecondSubmissionIsRejected() {
        QBAttempt submittedAttempt = new QBAttempt();
        submittedAttempt.setId("att-submitted");
        submittedAttempt.setUserId(userId);
        submittedAttempt.setTestId("st-chhattisgarh-easy");
        submittedAttempt.setStatus("SUBMITTED"); // Already submitted

        when(mongoTemplate.findById("att-submitted", QBAttempt.class)).thenReturn(submittedAttempt);

        Map<String, Object> payload = Map.of(
                "attemptId", "att-submitted",
                "userAnswers", Map.of("cg-1", "A"));

        ResponseEntity<ApiResponseDTO> response = controller.submitTest("st-chhattisgarh-easy", payload);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("already been submitted"));
    }

    @Test
    @DisplayName("9. User cannot submit another user's attempt")
    void testCannotSubmitAnotherUsersAttempt() {
        QBAttempt otherUserAttempt = new QBAttempt();
        otherUserAttempt.setId("att-other");
        otherUserAttempt.setUserId("victim-user-999");
        otherUserAttempt.setTestId("st-chhattisgarh-easy");
        otherUserAttempt.setStatus("IN_PROGRESS");

        when(mongoTemplate.findById("att-other", QBAttempt.class)).thenReturn(otherUserAttempt);

        Map<String, Object> payload = Map.of(
                "attemptId", "att-other",
                "userAnswers", Map.of("cg-1", "A"));

        ResponseEntity<ApiResponseDTO> response = controller.submitTest("st-chhattisgarh-easy", payload);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("10, 11, 12, 13 & 14. Arbitrary, cross-state, and unentitled injected question IDs are IGNORED during grading")
    void testArbitraryQuestionInjectionIsIgnored() {
        QBAttempt inProgressAttempt = new QBAttempt();
        inProgressAttempt.setId("att-in-progress");
        inProgressAttempt.setUserId(userId);
        inProgressAttempt.setTestId("st-chhattisgarh-easy");
        inProgressAttempt.setStatus("IN_PROGRESS");
        inProgressAttempt.setQuestionIds(List.of("cg-easy-1", "cg-easy-2"));

        when(mongoTemplate.findById("att-in-progress", QBAttempt.class)).thenReturn(inProgressAttempt);
        when(questionRepo.findAllById(List.of("cg-easy-1", "cg-easy-2")))
                .thenReturn(List.of(
                        createQuestion("cg-easy-1", "A"),
                        createQuestion("cg-easy-2", "B")));

        // Malicious client payload injecting hard questions, questions from other
        // state, etc.
        Map<String, String> injectedUserAnswers = new HashMap<>();
        injectedUserAnswers.put("cg-easy-1", "A"); // Valid
        injectedUserAnswers.put("cg-easy-2", "B"); // Valid
        injectedUserAnswers.put("cg-hard-99", "A"); // INJECTED HARD QUESTION
        injectedUserAnswers.put("mh-easy-10", "C"); // INJECTED CROSS-STATE QUESTION
        injectedUserAnswers.put("arbitrary-fake-id", "D"); // INJECTED ARBITRARY QUESTION

        Map<String, Object> payload = Map.of(
                "attemptId", "att-in-progress",
                "userAnswers", injectedUserAnswers);

        ResponseEntity<ApiResponseDTO> response = controller.submitTest("st-chhattisgarh-easy", payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());

        verify(questionRepo, times(1)).findAllById(List.of("cg-easy-1", "cg-easy-2"));
        verify(questionRepo, never()).findAllById(argThat(iterable -> {
            List<String> list = new ArrayList<>();
            iterable.forEach(list::add);
            return list.contains("cg-hard-99") || list.contains("mh-easy-10");
        }));

        QBAttempt saved = inProgressAttempt;
        assertEquals(2, saved.getUserAnswers().size());
        assertFalse(saved.getUserAnswers().containsKey("cg-hard-99"));
        assertFalse(saved.getUserAnswers().containsKey("mh-easy-10"));
        assertFalse(saved.getUserAnswers().containsKey("arbitrary-fake-id"));
    }

    @Test
    @DisplayName("7. Expired test submission is auto-graded and marked as EXPIRED")
    void testExpiredSubmissionIsMarkedExpired() {
        QBAttempt expiredAttempt = new QBAttempt();
        expiredAttempt.setId("att-expired");
        expiredAttempt.setUserId(userId);
        expiredAttempt.setTestId("st-chhattisgarh-easy");
        expiredAttempt.setStatus("IN_PROGRESS");
        expiredAttempt.setStartedAt(new Date(System.currentTimeMillis() - 40 * 60 * 1000));
        expiredAttempt.setExpiresAt(new Date(System.currentTimeMillis() - 10 * 60 * 1000)); // Expired 10 mins ago
        expiredAttempt.setQuestionIds(List.of("cg-1"));

        when(mongoTemplate.findById("att-expired", QBAttempt.class)).thenReturn(expiredAttempt);
        when(questionRepo.findAllById(List.of("cg-1"))).thenReturn(List.of(createQuestion("cg-1", "A")));

        Map<String, Object> payload = Map.of(
                "attemptId", "att-expired",
                "userAnswers", Map.of("cg-1", "A"));

        ResponseEntity<ApiResponseDTO> response = controller.submitTest("st-chhattisgarh-easy", payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("EXPIRED", expiredAttempt.getStatus());
        assertTrue(response.getBody().getMessage().contains("expired"));
    }
}
