package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.Purchase;
import com.bodhganga.bodhganga.entity.User;
import com.bodhganga.bodhganga.entity.qb.QBAttempt;
import com.bodhganga.bodhganga.entity.qb.QBQuestion;
import com.bodhganga.bodhganga.entity.qb.QBQuestion.QBOption;
import com.bodhganga.bodhganga.entity.qb.QBTest;
import com.bodhganga.bodhganga.repo.PurchaseRepo;
import com.bodhganga.bodhganga.repo.UserRepo;
import com.bodhganga.bodhganga.repo.qb.QBQuestionRepo;
import com.bodhganga.bodhganga.repo.qb.QBTestRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class StateTestServiceSecurityTest {

    private QBTestRepo testRepo;
    private QBQuestionRepo questionRepo;
    private PurchaseRepo purchaseRepo;
    private UserRepo userRepo;
    private MongoTemplate mongoTemplate;
    private StateTestService stateTestService;

    private User testUser;
    private String userId = "user-123";

    @BeforeEach
    void setUp() {
        testRepo = mock(QBTestRepo.class);
        questionRepo = mock(QBQuestionRepo.class);
        purchaseRepo = mock(PurchaseRepo.class);
        userRepo = mock(UserRepo.class);
        mongoTemplate = mock(MongoTemplate.class);

        stateTestService = new StateTestService(testRepo, questionRepo, purchaseRepo, userRepo, mongoTemplate);

        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@bodhganga.com");
        when(userRepo.findByIdentifier(userId)).thenReturn(Optional.of(testUser));

        when(mongoTemplate.save(any(QBAttempt.class))).thenAnswer((Answer<QBAttempt>) inv -> {
            QBAttempt att = inv.getArgument(0);
            if (att.getId() == null) {
                att.setId("att-" + UUID.randomUUID());
            }
            return att;
        });
    }

    private QBQuestion createQuestion(String id, String stateSlug, String diff, String correctAns) {
        QBQuestion q = new QBQuestion();
        q.setId(id);
        q.setStateSlug(stateSlug);
        q.setDifficulty(diff);
        q.setPublished(true);
        q.setQuestionText("Question text for " + id);
        q.setCorrectAnswer(correctAns);
        q.setExplanation("Explanation for " + id);

        QBOption o1 = new QBOption();
        o1.setId("A");
        o1.setText("Option A");
        o1.setIsCorrect("A".equalsIgnoreCase(correctAns));

        QBOption o2 = new QBOption();
        o2.setId("B");
        o2.setText("Option B");
        o2.setIsCorrect("B".equalsIgnoreCase(correctAns));

        q.setOptions(List.of(o1, o2));
        return q;
    }

    @Test
    @DisplayName("1 & 3 & 4. Standard test starts IN_PROGRESS attempt with server-generated 30-min timer")
    void testStandardTestStartsInProgressAttempt() {
        QBTest test = new QBTest();
        test.setId("st-chhattisgarh-easy");
        test.setStateSlug("chhattisgarh");
        test.setDifficulty("EASY");
        test.setPublished(true);
        test.setPrice(0.0);
        test.setTitle("Chhattisgarh GK Easy");

        List<QBQuestion> qList = new ArrayList<>();
        List<String> qIds = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            QBQuestion q = createQuestion("cg-e-" + i, "chhattisgarh", "EASY", "A");
            qList.add(q);
            qIds.add(q.getId());
        }
        test.setQuestionIds(qIds);

        when(mongoTemplate.findById(eq("st-chhattisgarh-easy"), eq(QBTest.class))).thenReturn(test);
        when(questionRepo.findAllById(any())).thenReturn(qList);

        Map<String, Object> result = stateTestService.loadTestForLiveAttempt("st-chhattisgarh-easy", userId);

        assertNotNull(result.get("attemptId"));
        assertEquals(1800L, result.get("remainingTimeSeconds"));

        verify(mongoTemplate, times(1)).save(any(QBAttempt.class));
    }

    @Test
    @DisplayName("2 & 15. Practice test starts IN_PROGRESS attempt without purchase for EASY")
    void testPracticeTestStartsInProgressAttemptEasy() {
        QBTest test = new QBTest();
        test.setId("st-chhattisgarh-easy");
        test.setPublished(true);

        List<QBQuestion> pool = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            pool.add(createQuestion("cg-e-" + i, "chhattisgarh", "EASY", "A"));
        }

        when(mongoTemplate.findById(eq("st-chhattisgarh-easy"), eq(QBTest.class))).thenReturn(test);
        when(mongoTemplate.find(any(Query.class), eq(QBQuestion.class))).thenReturn(pool);
        when(mongoTemplate.find(any(Query.class), eq(QBAttempt.class))).thenReturn(Collections.emptyList());
        when(questionRepo.findAllById(any())).thenAnswer(inv -> pool.subList(0, 15));

        Map<String, Object> result = stateTestService.loadPracticeMoreSession("chhattisgarh", "EASY", userId);

        assertNotNull(result.get("attemptId"));
        assertTrue((Boolean) result.get("isPracticeMode"));
        verify(mongoTemplate, times(1)).save(any(QBAttempt.class));
    }

    @Test
    @DisplayName("5 & 6. Refresh / Reconnect restores same active attempt and remaining time")
    void testRefreshRestoresActiveAttempt() {
        QBTest test = new QBTest();
        test.setId("st-chhattisgarh-easy");
        test.setPublished(true);

        Date startedAt = new Date(System.currentTimeMillis() - 5 * 60 * 1000); // 5 mins ago
        Date expiresAt = new Date(startedAt.getTime() + 30 * 60 * 1000); // 25 mins left

        QBAttempt activeAttempt = new QBAttempt();
        activeAttempt.setId("att-active-123");
        activeAttempt.setUserId(userId);
        activeAttempt.setTestId("st-chhattisgarh-easy");
        activeAttempt.setStatus("IN_PROGRESS");
        activeAttempt.setStartedAt(startedAt);
        activeAttempt.setExpiresAt(expiresAt);
        activeAttempt.setQuestionIds(List.of("q1", "q2"));

        when(mongoTemplate.findById(eq("st-chhattisgarh-easy"), eq(QBTest.class))).thenReturn(test);
        when(mongoTemplate.findOne(any(Query.class), eq(QBAttempt.class))).thenReturn(activeAttempt);
        when(questionRepo.findAllById(any())).thenReturn(List.of(createQuestion("q1", "chhattisgarh", "EASY", "A")));

        Map<String, Object> result = stateTestService.loadTestForLiveAttempt("st-chhattisgarh-easy", userId);

        assertEquals("att-active-123", result.get("attemptId"));
        long rem = (Long) result.get("remainingTimeSeconds");
        assertTrue(rem <= 1500 && rem >= 1490);
    }

    @Test
    @DisplayName("16 & 17. MEDIUM and HARD Practice More return 403 without purchase")
    void testMediumAndHardRequirePurchase() {
        assertThrows(AccessDeniedException.class, () -> {
            stateTestService.loadPracticeMoreSession("chhattisgarh", "MEDIUM", userId);
        });

        assertThrows(AccessDeniedException.class, () -> {
            stateTestService.loadPracticeMoreSession("chhattisgarh", "HARD", userId);
        });
    }

    @Test
    @DisplayName("18 & 19. MEDIUM and HARD work after state bundle purchase")
    void testMediumAndHardWorkWithPurchase() {
        Purchase purchase = new Purchase();
        purchase.setUserId(userId);
        purchase.setStateSlug("chhattisgarh");
        when(purchaseRepo.findByUserId(userId)).thenReturn(List.of(purchase));

        QBTest test = new QBTest();
        test.setId("st-chhattisgarh-medium");
        when(mongoTemplate.findById(eq("st-chhattisgarh-medium"), eq(QBTest.class))).thenReturn(test);

        List<QBQuestion> pool = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            pool.add(createQuestion("cg-m-" + i, "chhattisgarh", "MEDIUM", "B"));
        }
        when(mongoTemplate.find(any(Query.class), eq(QBQuestion.class))).thenReturn(pool);
        when(questionRepo.findAllById(any())).thenReturn(pool);

        Map<String, Object> result = stateTestService.loadPracticeMoreSession("chhattisgarh", "MEDIUM", userId);
        assertNotNull(result.get("attemptId"));
    }

    @Test
    @DisplayName("22. Pre-submission questions do NOT expose correct answers")
    void testNoCorrectAnswersExposedPreSubmission() {
        QBTest test = new QBTest();
        test.setId("st-chhattisgarh-easy");
        test.setPublished(true);

        List<QBQuestion> pool = List.of(createQuestion("cg-1", "chhattisgarh", "EASY", "A"));
        when(mongoTemplate.findById(eq("st-chhattisgarh-easy"), eq(QBTest.class))).thenReturn(test);
        when(mongoTemplate.find(any(Query.class), eq(QBQuestion.class))).thenReturn(pool);
        when(questionRepo.findAllById(any())).thenReturn(pool);

        Map<String, Object> result = stateTestService.loadPracticeMoreSession("chhattisgarh", "EASY", userId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
        Map<String, Object> q0 = questions.get(0);

        assertNull(q0.get("correctAnswer"));
        assertNull(q0.get("explanation"));

        @SuppressWarnings("unchecked")
        List<QBOption> opts = (List<QBOption>) q0.get("options");
        for (QBOption opt : opts) {
            assertNull(opt.getIsCorrect());
        }
    }
}
