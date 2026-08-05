package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.qb.*;
import com.bodhganga.bodhganga.repo.qb.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TestGeneratorServiceTest {

    private QBQuestionRepo questionRepo;
    private QBTestRepo testRepo;
    private QBBundleRepo bundleRepo;
    private TestGeneratorService testGeneratorService;

    @BeforeEach
    void setUp() {
        questionRepo = mock(QBQuestionRepo.class);
        testRepo = mock(QBTestRepo.class);
        bundleRepo = mock(QBBundleRepo.class);
        testGeneratorService = new TestGeneratorService(questionRepo, testRepo, bundleRepo);
    }

    @Test
    void testPartitionsFreeTestAndPremiumBundleWithoutOverlap() {
        List<QBQuestion> questions = new ArrayList<>();
        for (int i = 1; i <= 30; i++) {
            QBQuestion q = new QBQuestion();
            q.setId("q" + i);
            q.setState("Haryana");
            q.setStateSlug("haryana");
            q.setExam("HPSC HCS");
            q.setExamSlug("hpsc-hcs");
            q.setSubject("History");
            q.setSubjectSlug("history");
            q.setDifficulty(i % 2 == 0 ? "EASY" : "MEDIUM");
            questions.add(q);
        }

        when(questionRepo.save(any(QBQuestion.class))).thenAnswer(inv -> inv.getArgument(0));

        testGeneratorService.generateTestsAndBundles(questions, "drive-pdf-123", "s3-pdf-key");

        verify(testRepo, times(2)).save(any(QBTest.class));
        verify(bundleRepo, times(1)).save(any(QBBundle.class));
    }
}
