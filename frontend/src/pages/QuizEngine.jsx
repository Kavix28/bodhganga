import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../services/api';

// Exam Components
import ExamHeader from '../components/exam/ExamHeader';
import ExamInstructionsModal from '../components/exam/ExamInstructionsModal';
import QuestionWorkspace from '../components/exam/QuestionWorkspace';
import QuestionPalette from '../components/exam/QuestionPalette';
import SubmitConfirmModal from '../components/exam/SubmitConfirmModal';

const QuizEngine = () => {
    const { stateId, districtId, testType } = useParams(); // 'easy', 'medium', 'hard', 'extra', 'master'
    const navigate = useNavigate();

    // Core Data & API State
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isComingSoon, setIsComingSoon] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Exam Flow State
    const [examState, setExamState] = useState('INSTRUCTIONS'); // 'INSTRUCTIONS' | 'IN_PROGRESS' | 'SUBMITTING'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { [questionIndex]: optionIndex }
    const [visited, setVisited] = useState({ 0: true }); // { [questionIndex]: boolean }
    const [markedForReview, setMarkedForReview] = useState({}); // { [questionIndex]: boolean }
    const [bookmarks, setBookmarks] = useState({}); // { [questionIndex]: boolean }
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(1500); // 25 mins default
    const isUntimed = testType === 'extra' || testType === 'practice';
    const totalTimeAllowedRef = useRef(1500);

    // Modals & Drawers
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showMobilePalette, setShowMobilePalette] = useState(false);

    // Fetch Questions from API
    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        setIsComingSoon(false);
        try {
            const response = await api.get('/quiz/questions', {
                params: {
                    stateSlug: stateId,
                    districtSlug: districtId,
                    testType: testType
                }
            });

            if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
                const fetchedQs = response.data;
                setQuestions(fetchedQs);
                
                // Set appropriate duration based on test type & total questions
                let initialSeconds = 1500; // 25 minutes
                if (testType === 'easy' || testType === 'medium' || testType === 'hard') {
                    initialSeconds = 1500;
                } else if (testType === 'master') {
                    initialSeconds = Math.min(fetchedQs.length * 75, 7200); // ~1.25 mins per Q up to 2 hours
                }

                totalTimeAllowedRef.current = initialSeconds;
                setTimeLeft(initialSeconds);
            } else if (response && response.success && Array.isArray(response.data) && response.data.length === 0) {
                setFetchError('No published questions available for this district test yet.');
                setQuestions([]);
            } else {
                setFetchError(response?.message || 'Failed to load questions from backend.');
                setQuestions([]);
            }
        } catch (err) {
            console.error('Backend questions fetch error:', err);
            const comingSoonCode = err?.code === 'QUESTION_BANK_COMING_SOON' || err?.data?.code === 'QUESTION_BANK_COMING_SOON' || err?.status === 403;
            if (comingSoonCode) {
                setIsComingSoon(true);
                setFetchError('Tests for this district are coming soon.');
            } else {
                setFetchError(err.message || 'Unable to connect to server to load quiz. Please try again.');
            }
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [stateId, districtId, testType]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // Timer Countdown Effect
    useEffect(() => {
        if (loading || questions.length === 0 || fetchError || isUntimed || examState !== 'IN_PROGRESS') {
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Time expired auto-submit
                    handleAutoSubmitOnTimeExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, questions, fetchError, isUntimed, examState]);

    // Prevent accidental page reload / navigate away while test is in progress
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (examState === 'IN_PROGRESS') {
                e.preventDefault();
                e.returnValue = 'Your active examination responses will be lost if you leave this page.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [examState]);

    // Action Handlers
    const handleStartExam = () => {
        setExamState('IN_PROGRESS');
    };

    const handleOptionSelect = (optionIdx) => {
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: optionIdx
        }));
        setVisited(prev => ({
            ...prev,
            [currentIndex]: true
        }));
    };

    const handleClearResponse = () => {
        setAnswers(prev => {
            const next = { ...prev };
            delete next[currentIndex];
            return next;
        });
    };

    const handleToggleMarkForReview = () => {
        setMarkedForReview(prev => ({
            ...prev,
            [currentIndex]: !prev[currentIndex]
        }));
    };

    const handleToggleBookmark = () => {
        setBookmarks(prev => ({
            ...prev,
            [currentIndex]: !prev[currentIndex]
        }));
    };

    const handleSelectQuestion = (index) => {
        if (index < 0 || index >= questions.length) return;
        setCurrentIndex(index);
        setVisited(prev => ({
            ...prev,
            [index]: true
        }));
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            handleSelectQuestion(currentIndex - 1);
        }
    };

    const handleSaveAndNext = () => {
        setVisited(prev => ({
            ...prev,
            [currentIndex]: true
        }));
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setVisited(prev => ({
                ...prev,
                [currentIndex + 1]: true
            }));
        } else {
            // Reached last question, open submit confirmation modal
            setShowSubmitModal(true);
        }
    };

    // Submission Logic
    const executeSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        const questionIds = questions.map(q => q.id);
        const answersMap = {};
        questions.forEach((q, idx) => {
            if (answers[idx] !== undefined && answers[idx] !== null && answers[idx] >= 0) {
                answersMap[q.id] = answers[idx];
            }
        });

        const bookmarkedQuestionIds = Object.keys(bookmarks)
            .filter(idxKey => bookmarks[idxKey])
            .map(idxKey => questions[parseInt(idxKey)]?.id)
            .filter(Boolean);

        const timeTaken = isUntimed ? 0 : (totalTimeAllowedRef.current - timeLeft);

        const submissionData = {
            stateSlug: stateId,
            districtSlug: districtId,
            testType,
            timeTaken,
            questionIds,
            answers: answersMap,
            bookmarkedQuestionIds
        };

        try {
            const response = await api.post('/quiz/submit', submissionData);
            if (response && response.success && response.data) {
                const serverResult = response.data;
                setShowSubmitModal(false);
                navigate(`/test-series/${stateId}/${districtId}/result`, {
                    state: {
                        result: {
                            ...serverResult,
                            questions,
                            selectedAnswers: answers
                        }
                    }
                });
            } else {
                setSubmitError(response?.message || 'Failed to grade quiz submission on server.');
            }
        } catch (error) {
            console.error('Server-side grading submission error:', error);
            const comingSoonCode = error?.code === 'QUESTION_BANK_COMING_SOON' || error?.data?.code === 'QUESTION_BANK_COMING_SOON' || error?.status === 403;
            if (comingSoonCode) {
                setSubmitError('Tests for this district are coming soon.');
            } else {
                setSubmitError(error.message || 'Backend connection required to submit this quiz. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoSubmitOnTimeExpire = () => {
        setShowSubmitModal(true);
        executeSubmit();
    };

    // Calculate Status Counts
    const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null && answers[k] >= 0).length;
    const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
    const unansweredCount = questions.length - answeredCount;

    // Render Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24">
                <div className="flex flex-col items-center gap-3 bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                    <span className="text-sm font-bold text-slate-300 font-serif">Loading Examination Environment...</span>
                </div>
            </div>
        );
    }

    // Render Error or Coming Soon State
    if (fetchError || questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24 px-4">
                <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4 max-w-md shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                    <h2 className="text-xl font-serif font-bold text-white">
                        {isComingSoon ? 'Content Coming Soon' : 'Question Bank Unavailable'}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {fetchError || 'Tests for this district are coming soon.'}
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        {!isComingSoon && (
                            <button
                                onClick={fetchQuestions}
                                className="px-5 py-2.5 rounded-xl bg-gold text-slate-950 font-bold text-xs uppercase flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Retry Connection
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/test-series/${stateId}/${districtId}`)}
                            className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase shadow-md flex items-center gap-2 hover:bg-white/20"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to District
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-gold selection:text-slate-950">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[170px]" />
                <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* 1. Header (Sticky Top Bar) */}
                <ExamHeader
                    stateName={stateId?.toUpperCase()}
                    districtName={districtId?.toUpperCase()}
                    testType={testType}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    answeredCount={answeredCount}
                    unansweredCount={unansweredCount}
                    markedCount={markedCount}
                    timeLeft={timeLeft}
                    isUntimed={isUntimed}
                    onTimeExpired={handleAutoSubmitOnTimeExpire}
                    onSubmitClick={() => setShowSubmitModal(true)}
                    onTogglePaletteMobile={() => setShowMobilePalette(true)}
                />

                {/* 2. Main Workspace Layout Grid */}
                <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
                    {/* Primary Question Paper */}
                    <div className="flex-1">
                        <QuestionWorkspace
                            question={currentQuestion}
                            currentIndex={currentIndex}
                            totalQuestions={questions.length}
                            selectedOption={answers[currentIndex]}
                            isMarkedForReview={Boolean(markedForReview[currentIndex])}
                            isBookmarked={Boolean(bookmarks[currentIndex])}
                            onOptionSelect={handleOptionSelect}
                            onClearResponse={handleClearResponse}
                            onToggleMarkForReview={handleToggleMarkForReview}
                            onToggleBookmark={handleToggleBookmark}
                            onPrevious={handlePrevious}
                            onSaveAndNext={handleSaveAndNext}
                        />
                    </div>

                    {/* Right Question Palette (Desktop Sidebar & Mobile Drawer) */}
                    <QuestionPalette
                        totalQuestions={questions.length}
                        currentIndex={currentIndex}
                        answers={answers}
                        visited={visited}
                        markedForReview={markedForReview}
                        onSelectQuestion={handleSelectQuestion}
                        isOpenMobile={showMobilePalette}
                        onCloseMobile={() => setShowMobilePalette(false)}
                    />
                </div>
            </div>

            {/* 3. Instructions Modal (Appears on initial launch until user clicks Begin Examination) */}
            <ExamInstructionsModal
                isOpen={examState === 'INSTRUCTIONS'}
                onClose={() => navigate(`/test-series/${stateId}/${districtId}`)}
                onStartExam={handleStartExam}
                testType={testType}
                totalQuestions={questions.length}
                timeLimitMinutes={Math.round(totalTimeAllowedRef.current / 60)}
                districtName={districtId}
                stateName={stateId}
            />

            {/* 4. Submit Confirmation Dialog */}
            <SubmitConfirmModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirmSubmit={executeSubmit}
                submitting={submitting}
                submitError={submitError}
                totalQuestions={questions.length}
                answeredCount={answeredCount}
                unansweredCount={unansweredCount}
                markedCount={markedCount}
                timeLeft={timeLeft}
                isUntimed={isUntimed}
            />
        </div>
    );
};

export default QuizEngine;
