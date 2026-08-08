package com.bodhganga.bodhganga.services.qb;

import com.bodhganga.bodhganga.entity.qb.*;
import com.bodhganga.bodhganga.repo.qb.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(TestGeneratorService.class);

    private final QBQuestionRepo questionRepo;
    private final QBTestRepo testRepo;
    private final QBBundleRepo bundleRepo;

    public TestGeneratorService(QBQuestionRepo questionRepo, QBTestRepo testRepo, QBBundleRepo bundleRepo) {
        this.questionRepo = questionRepo;
        this.testRepo = testRepo;
        this.bundleRepo = bundleRepo;
    }

    /**
     * Partitions questions from a source PDF into Free Mock Test & Premium Bundle.
     */
    public void generateTestsAndBundles(List<QBQuestion> questions, String sourcePdfDriveId, String s3Key) {
        if (questions == null || questions.isEmpty()) {
            return;
        }

        QBQuestion sample = questions.get(0);
        String state = sample.getState();
        String stateSlug = sample.getStateSlug();
        String exam = sample.getExam();
        String examSlug = sample.getExamSlug();
        String subject = sample.getSubject();
        String subjectSlug = sample.getSubjectSlug();

        // Separate Easy/Medium vs Hard questions for Free Pool selection (~20%)
        List<QBQuestion> easyMedium = questions.stream()
                .filter(q -> "EASY".equalsIgnoreCase(q.getDifficulty()) || "MEDIUM".equalsIgnoreCase(q.getDifficulty()))
                .collect(Collectors.toList());

        Collections.shuffle(easyMedium);

        int freeCount = Math.min(20, Math.max(5, (int) (questions.size() * 0.20)));
        List<QBQuestion> freeQuestions = easyMedium.stream().limit(freeCount).collect(Collectors.toList());
        Set<String> freeIds = freeQuestions.stream().map(QBQuestion::getId).collect(Collectors.toSet());

        // Mark free questions in Mongo
        for (QBQuestion q : freeQuestions) {
            q.setIsFreePool(true);
            questionRepo.save(q);
        }

        // Remaining questions go into Premium Bundle (NO OVERLAP!)
        List<QBQuestion> premiumQuestions = questions.stream()
                .filter(q -> !freeIds.contains(q.getId()))
                .collect(Collectors.toList());
        List<String> premiumIds = premiumQuestions.stream().map(QBQuestion::getId).collect(Collectors.toList());

        // 1. Create Free Mock Test
        QBTest freeTest = new QBTest();
        freeTest.setTitle(String.format("%s - %s Free Practice Test", state, subject));
        freeTest.setDescription(String.format("Free practice test containing %d questions for %s.", freeQuestions.size(), subject));
        freeTest.setTestType("FREE_POOL");
        freeTest.setState(state);
        freeTest.setStateSlug(stateSlug);
        freeTest.setExam(exam);
        freeTest.setExamSlug(examSlug);
        freeTest.setSubject(subject);
        freeTest.setSubjectSlug(subjectSlug);
        freeTest.setQuestionIds(new ArrayList<>(freeIds));
        freeTest.setTotalQuestions(freeQuestions.size());
        freeTest.setTotalMarks((double) freeQuestions.size());
        freeTest.setDurationMinutes(Math.max(15, freeQuestions.size()));
        freeTest.setPrice(0.0);
        freeTest.setSourcePdfDriveId(sourcePdfDriveId);
        testRepo.save(freeTest);

        // 2. Create Premium Bundle & Test
        if (!premiumIds.isEmpty()) {
            QBTest premiumTest = new QBTest();
            premiumTest.setTitle(String.format("%s - %s Complete Question Bank", state, subject));
            premiumTest.setDescription(String.format("Premium Question Bank bundle containing %d questions for %s.", premiumIds.size(), subject));
            premiumTest.setTestType("PREMIUM_BUNDLE");
            premiumTest.setState(state);
            premiumTest.setStateSlug(stateSlug);
            premiumTest.setExam(exam);
            premiumTest.setExamSlug(examSlug);
            premiumTest.setSubject(subject);
            premiumTest.setSubjectSlug(subjectSlug);
            premiumTest.setQuestionIds(premiumIds);
            premiumTest.setTotalQuestions(premiumIds.size());
            premiumTest.setTotalMarks((double) premiumIds.size());
            premiumTest.setDurationMinutes(Math.max(30, premiumIds.size()));
            premiumTest.setPrice(199.0);
            premiumTest.setSourcePdfDriveId(sourcePdfDriveId);
            testRepo.save(premiumTest);

            QBBundle bundle = new QBBundle();
            bundle.setTitle(String.format("%s - %s Master Package", state, subject));
            bundle.setStateSlug(stateSlug);
            bundle.setExamSlug(examSlug);
            bundle.setSubjectSlug(subjectSlug);
            bundle.setFreeQuestionIds(new ArrayList<>(freeIds));
            bundle.setPremiumQuestionIds(premiumIds);
            bundle.setSourcePdfDriveId(sourcePdfDriveId);
            bundle.setS3Key(s3Key);
            bundle.setPrice(199.0);
            bundleRepo.save(bundle);
        }

        log.info("[TEST GENERATOR] Created Free Test ({} questions) and Premium Bundle ({} questions) for {}",
                freeIds.size(), premiumIds.size(), subject);
    }
}
