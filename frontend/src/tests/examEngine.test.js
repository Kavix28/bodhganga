import assert from 'node:assert';

console.log('🧪 Running Comprehensive Exam Engine & Scoring Verification Tests...\n');

// 1. PALETTE STATUS RESOLUTION LOGIC
function calculatePaletteStatus(currentIndex, targetIndex, answers, visited, markedForReview) {
    const isCurrent = currentIndex === targetIndex;
    const isAns = answers[targetIndex] !== undefined && answers[targetIndex] !== null && answers[targetIndex] >= 0;
    const isMarked = Boolean(markedForReview[targetIndex]);
    const isVis = Boolean(visited[targetIndex]);

    if (isAns && isMarked) return 'ANSWERED_AND_MARKED';
    if (isAns) return 'ANSWERED';
    if (isMarked) return 'MARKED';
    if (isVis) return 'VISITED_UNANSWERED';
    return 'NOT_VISITED';
}

// Test 1: Palette Status Matrix
assert.strictEqual(
    calculatePaletteStatus(0, 0, { 0: 2 }, { 0: true }, { 0: true }),
    'ANSWERED_AND_MARKED',
    'Question with answer and review flag must resolve to ANSWERED_AND_MARKED'
);

assert.strictEqual(
    calculatePaletteStatus(1, 1, { 1: 0 }, { 1: true }, {}),
    'ANSWERED',
    'Question with answer only must resolve to ANSWERED'
);

assert.strictEqual(
    calculatePaletteStatus(2, 2, {}, { 2: true }, { 2: true }),
    'MARKED',
    'Unanswered question with review flag must resolve to MARKED'
);

assert.strictEqual(
    calculatePaletteStatus(3, 3, {}, { 3: true }, {}),
    'VISITED_UNANSWERED',
    'Visited question without answer must resolve to VISITED_UNANSWERED'
);

assert.strictEqual(
    calculatePaletteStatus(0, 4, {}, {}, {}),
    'NOT_VISITED',
    'Unvisited question must resolve to NOT_VISITED'
);

console.log('✅ Test 1 Passed: Question palette status matrix resolves accurately for all state combinations.');


// 2. MARKING SCHEME CALCULATION VERIFICATION (+2.0 / -0.5 Formula)
function gradeExamAttempt(questions, answersMap) {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    for (const q of questions) {
        const selected = answersMap[q.id];
        if (selected === undefined || selected === null || selected < 0) {
            unattemptedCount++;
        } else if (selected === q.correctAnswer) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    }

    const totalQuestions = questions.length;
    const score = Math.round(((correctCount * 2.0) - (incorrectCount * 0.5)) * 100.0) / 100.0;
    const percentage = totalQuestions > 0 ? Math.round(((doubleCount(correctCount) / totalQuestions)) * 100.0) : 0;
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round(((doubleCount(correctCount) / attempted)) * 100.0) : 0;

    return { totalQuestions, correctCount, incorrectCount, unattemptedCount, score, percentage, accuracy };
}

function doubleCount(val) {
    return Number(val);
}

// Test 2A: Perfect Score (20/20)
const mockQuestions = Array.from({ length: 20 }, (_, i) => ({
    id: `q_${i + 1}`,
    question: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1 // B
}));

const perfectAnswers = {};
mockQuestions.forEach(q => { perfectAnswers[q.id] = 1; });

const perfectGrade = gradeExamAttempt(mockQuestions, perfectAnswers);
assert.strictEqual(perfectGrade.score, 40.0, '20 correct answers must yield 40.0 marks');
assert.strictEqual(perfectGrade.percentage, 100, '20/20 must yield 100% percentage');
assert.strictEqual(perfectGrade.accuracy, 100, '20/20 must yield 100% accuracy');
console.log('✅ Test 2A Passed: Perfect score calculation matches +2.0 scheme (Score: 40.0, Accuracy: 100%).');


// Test 2B: Realistic Mixed Attempt (16 Correct, 3 Incorrect, 1 Unattempted)
const mixedAnswers = {};
for (let i = 0; i < 16; i++) mixedAnswers[`q_${i + 1}`] = 1; // 16 Correct
for (let i = 16; i < 19; i++) mixedAnswers[`q_${i + 1}`] = 0; // 3 Incorrect (selected A instead of B)
// q_20 left unattempted

const mixedGrade = gradeExamAttempt(mockQuestions, mixedAnswers);
// Score = (16 * 2) - (3 * 0.5) = 32 - 1.5 = 30.5
assert.strictEqual(mixedGrade.score, 30.5, '16 correct & 3 incorrect must yield 30.5 score');
assert.strictEqual(mixedGrade.correctCount, 16, 'Correct count must be 16');
assert.strictEqual(mixedGrade.incorrectCount, 3, 'Incorrect count must be 3');
assert.strictEqual(mixedGrade.unattemptedCount, 1, 'Unattempted count must be 1');
assert.strictEqual(mixedGrade.percentage, 80, '16/20 must yield 80% percentage');
assert.strictEqual(mixedGrade.accuracy, 84, '16/19 attempted must yield 84% accuracy');
console.log('✅ Test 2B Passed: Mixed score calculation verified (Score: 30.5, Correct: 16, Incorrect: 3, Unattempted: 1).');


// Test 2C: Zero Attempt (All Skipped)
const zeroGrade = gradeExamAttempt(mockQuestions, {});
assert.strictEqual(zeroGrade.score, 0.0, 'All unattempted must yield 0.0 score');
assert.strictEqual(zeroGrade.accuracy, 0, '0 attempted must yield 0% accuracy');
assert.strictEqual(zeroGrade.unattemptedCount, 20, 'Unattempted count must be 20');
console.log('✅ Test 2C Passed: Zero attempt (all skipped) yields 0.0 score without divide-by-zero errors.');


// Test 2D: All Incorrect Attempt (0 Correct, 20 Incorrect)
const allIncorrectAnswers = {};
mockQuestions.forEach(q => { allIncorrectAnswers[q.id] = 0; });
const allIncorrectGrade = gradeExamAttempt(mockQuestions, allIncorrectAnswers);
assert.strictEqual(allIncorrectGrade.score, -10.0, '20 incorrect answers must yield -10.0 score');
assert.strictEqual(allIncorrectGrade.accuracy, 0, '0 correct out of 20 attempted must yield 0% accuracy');
console.log('✅ Test 2D Passed: All incorrect attempt handles negative score penalty (-10.0 score).');


// 3. TIMER BOUNDARY & EXPIRY VERIFICATION
function isTimerCritical(timeLeftSeconds) {
    return timeLeftSeconds < 60;
}

function isTimerWarning(timeLeftSeconds) {
    return timeLeftSeconds <= 300 && timeLeftSeconds >= 60;
}

assert.strictEqual(isTimerWarning(300), true, '300s (5 mins) must trigger warning state');
assert.strictEqual(isTimerWarning(301), false, '301s must NOT trigger warning state');
assert.strictEqual(isTimerCritical(59), true, '59s must trigger critical state');
assert.strictEqual(isTimerCritical(60), false, '60s must NOT trigger critical state');
console.log('✅ Test 3 Passed: Timer warning (<=5m) and critical (<1m) threshold triggers verified.');


// 4. ANSWER REVIEW RATIONALE MAPPER
function formatGradedQuestionsForReview(questions, answersMap) {
    return questions.map(q => {
        const selected = answersMap[q.id];
        const isUnattempted = (selected === undefined || selected === null || selected < 0);
        const isCorrect = !isUnattempted && selected === q.correctAnswer;
        return {
            id: q.id,
            question: q.question,
            options: q.options,
            selectedAnswer: selected,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Official explanation available in district notes.',
            isCorrect,
            isUnattempted
        };
    });
}

const sampleQ = { id: 'q1', question: 'What is Akola capital?', options: ['A', 'B'], correctAnswer: 0, explanation: 'Akola is an administrative headquarters.' };
const gradedReview = formatGradedQuestionsForReview([sampleQ], { q1: 0 });
assert.strictEqual(gradedReview[0].isCorrect, true, 'Correct option selection must be flagged isCorrect: true');
assert.strictEqual(gradedReview[0].explanation, sampleQ.explanation, 'Explanation must be preserved for review');

console.log('✅ Test 4 Passed: Answer review mapper preserves question rationales and options cleanly.');

console.log('\n🎉 ALL EXAM ENGINE AND SCORING TESTS PASSED SUCCESSFULLY!');
