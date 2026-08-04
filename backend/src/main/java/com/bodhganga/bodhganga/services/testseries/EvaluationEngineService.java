package com.bodhganga.bodhganga.services.testseries;

import com.bodhganga.bodhganga.entity.QuizAttempt.TopicStats;
import com.bodhganga.bodhganga.entity.testseries.*;
import com.bodhganga.bodhganga.repo.testseries.QuestionRepo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class EvaluationEngineService {

    private final QuestionRepo questionRepo;

    public EvaluationEngineService(QuestionRepo questionRepo) {
        this.questionRepo = questionRepo;
    }

    public TestAttempt evaluateSession(TestSession session, TestSeries testSeries, String submitType) {
        TestAttempt attempt = new TestAttempt();
        attempt.setSessionId(session.getId());
        attempt.setUserId(session.getUserId());
        attempt.setUserEmail(session.getUserEmail());
        attempt.setTestSeriesId(testSeries.getId());
        attempt.setTestTitle(testSeries.getTitle());
        attempt.setStateSlug(testSeries.getStateSlug());
        attempt.setDistrictSlug(testSeries.getDistrictSlug());
        attempt.setTestType(testSeries.getTestType());
        attempt.setSubmitType(submitType != null ? submitType : "MANUAL");
        attempt.setAttemptedAt(Instant.now());

        // Calculate time taken
        long startTime = session.getStartTime() != null ? session.getStartTime().getTime() : System.currentTimeMillis();
        long endTime = session.getEndTime() != null ? session.getEndTime().getTime() : System.currentTimeMillis();
        int timeTakenSeconds = (int) Math.max(1, (endTime - startTime) / 1000);
        attempt.setTimeTakenSeconds(timeTakenSeconds);

        // Fetch questions
        List<String> questionIds = session.getQuestionOrder() != null && !session.getQuestionOrder().isEmpty()
                ? session.getQuestionOrder()
                : testSeries.getQuestionIds();

        List<Question> questions = questionRepo.findByIdInAndIsDeletedFalse(questionIds);
        Map<String, Question> questionMap = new HashMap<>();
        for (Question q : questions) {
            questionMap.put(q.getId(), q);
        }

        double positiveScore = 0.0;
        double negativeScore = 0.0;
        int correctCount = 0;
        int incorrectCount = 0;
        int unattemptedCount = 0;

        double posMarksPerQ = testSeries.getPositiveMarksPerQuestion() != null ? testSeries.getPositiveMarksPerQuestion() : 2.0;
        double negMarksPerQ = Boolean.TRUE.equals(testSeries.getAllowNegativeMarking()) && testSeries.getNegativeMarksPerQuestion() != null
                ? testSeries.getNegativeMarksPerQuestion() : 0.0;

        Map<String, UserResponse> responses = session.getResponses() != null ? session.getResponses() : new HashMap<>();
        attempt.setQuestionResponses(responses);

        Map<String, TopicStats> topicMap = new HashMap<>();

        for (String qId : questionIds) {
            Question q = questionMap.get(qId);
            if (q == null) continue;

            UserResponse userResp = responses.get(qId);
            List<String> selectedOptions = userResp != null && userResp.getSelectedOptionIds() != null
                    ? userResp.getSelectedOptionIds()
                    : new ArrayList<>();

            String topic = q.getTopicId() != null ? q.getTopicId() : "General";
            TopicStats tStats = topicMap.computeIfAbsent(topic, k -> new TopicStats());
            tStats.setTotal(tStats.getTotal() + 1);

            if (selectedOptions.isEmpty()) {
                unattemptedCount++;
            } else {
                boolean isCorrect = evaluateQuestionResponse(q, selectedOptions);
                if (isCorrect) {
                    correctCount++;
                    positiveScore += posMarksPerQ;
                    tStats.setCorrect(tStats.getCorrect() + 1);
                } else {
                    incorrectCount++;
                    negativeScore += negMarksPerQ;
                }
            }
        }

        double finalScore = Math.max(0.0, positiveScore - negativeScore);
        int totalQuestions = questionIds.size();
        double maxPossibleMarks = totalQuestions * posMarksPerQ;

        double percentage = maxPossibleMarks > 0 ? Math.round((finalScore / maxPossibleMarks) * 100.0 * 100.0) / 100.0 : 0.0;
        int attemptedCount = correctCount + incorrectCount;
        double accuracy = attemptedCount > 0 ? Math.round(((double) correctCount / attemptedCount) * 100.0 * 100.0) / 100.0 : 0.0;

        attempt.setTotalMarks(maxPossibleMarks);
        attempt.setScore(Math.round(finalScore * 100.0) / 100.0);
        attempt.setPositiveMarks(Math.round(positiveScore * 100.0) / 100.0);
        attempt.setNegativeMarks(Math.round(negativeScore * 100.0) / 100.0);
        attempt.setPercentage(percentage);
        attempt.setAccuracy(accuracy);
        attempt.setTotalQuestions(totalQuestions);
        attempt.setCorrectCount(correctCount);
        attempt.setIncorrectCount(incorrectCount);
        attempt.setUnattemptedCount(unattemptedCount);
        attempt.setTopicAnalysis(topicMap);

        return attempt;
    }

    private boolean evaluateQuestionResponse(Question question, List<String> selectedOptionIds) {
        List<String> correctIds = question.getCorrectOptionIds() != null ? question.getCorrectOptionIds() : new ArrayList<>();
        if (correctIds.isEmpty() && question.getOptions() != null) {
            for (Option opt : question.getOptions()) {
                if (Boolean.TRUE.equals(opt.getIsCorrect())) {
                    correctIds.add(opt.getOptionId());
                }
            }
        }

        if (correctIds.size() != selectedOptionIds.size()) {
            return false;
        }

        Set<String> set1 = new HashSet<>(correctIds);
        Set<String> set2 = new HashSet<>(selectedOptionIds);
        return set1.equals(set2);
    }
}
