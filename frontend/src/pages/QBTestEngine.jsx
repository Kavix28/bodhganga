import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight,
    Bookmark, ShieldCheck, Zap, RotateCcw, BookOpen, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Phase constants ────────────────────────────────────────────────────────

const PHASE = {
    LOADING:  'LOADING',
    ERROR:    'ERROR',
    EMPTY:    'EMPTY',
    EXAM:     'EXAM',
    REVIEW:   'REVIEW',
    RESULT:   'RESULT',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

const QuizEngine = () => {
    const { testId } = useParams();          // Route: /question-bank/tests/:testId
    const navigate   = useNavigate();
    const { user, isAuthenticated } = useContext(AuthContext);

    // ── Data state ────────────────────────────────────────────────────────────
    const [phase,        setPhase]        = useState(PHASE.LOADING);
    const [errorMessage, setErrorMessage] = useState('');
    const [test,         setTest]         = useState(null);
    const [questions,    setQuestions]    = useState([]);

    // ── Exam state ────────────────────────────────────────────────────────────
    const [currentIndex,     setCurrentIndex]     = useState(0);
    const [selectedAnswers,  setSelectedAnswers]  = useState({});   // { questionId: 'optionText' }
    const [bookmarked,       setBookmarked]       = useState({});   // { questionId: boolean }
    const [timeLeft,         setTimeLeft]         = useState(0);
    const [startTime]                             = useState(Date.now());
    const timerRef                                = useRef(null);

    // ── Result state ──────────────────────────────────────────────────────────
    const [attemptResult, setAttemptResult] = useState(null);
    const [submitting,    setSubmitting]    = useState(false);

    // ── Load test on mount ────────────────────────────────────────────────────
    useEffect(() => {
        if (!testId) {
            setErrorMessage('No test ID provided.');
            setPhase(PHASE.ERROR);
            return;
        }
        loadTest();
    }, [testId]);

    const loadTest = async () => {
        setPhase(PHASE.LOADING);
        setErrorMessage('');
        try {
            const response = await api.get(`/api/question-bank/tests/${testId}`);
            const dataObj = response.data ?? response;
            const loadedTest = dataObj.test || dataObj;
            const loadedQuestions = dataObj.questions || loadedTest.questions;
            const remainingSecs = dataObj.remainingTimeSeconds || (loadedTest.durationMinutes ? loadedTest.durationMinutes * 60 : 1800);

            if (!loadedTest || !loadedQuestions || loadedQuestions.length === 0) {
                setPhase(PHASE.EMPTY);
                return;
            }

            setTest(loadedTest);
            setQuestions(loadedQuestions);
            setTimeLeft(remainingSecs);
            setSelectedAnswers({});
            setBookmarked({});
            setCurrentIndex(0);
            setPhase(PHASE.EXAM);
        } catch (err) {
            const msg = err?.message ?? 'Failed to load test. Please try again.';
            setErrorMessage(msg);
            setPhase(PHASE.ERROR);
        }
    };

    // ── Anti-cheating window focus/blur listener ──────────────────────────────
    useEffect(() => {
        if (phase !== PHASE.EXAM) return;

        const handleBlur = () => {
            toast?.error ? toast.error('Warning: Tab switch detected. Please stay on the examination window.') : console.warn('Tab switch detected.');
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [phase]);

    // ── Timer — starts when exam begins, cleared on submit/unmount ────────────
    useEffect(() => {
        if (phase !== PHASE.EXAM) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [phase]);

    // ── Answer selection ──────────────────────────────────────────────────────
    const handleOptionSelect = (questionId, optionVal) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionVal }));
    };

    // ── Bookmark toggle ───────────────────────────────────────────────────────
    const toggleBookmark = (questionId) => {
        setBookmarked(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    // ── Build the userAnswers payload in the format the backend expects ────────
    // Backend: Map<String, String>  where key = questionId, value = selected option text
    const buildUserAnswers = useCallback(() => {
        return { ...selectedAnswers };
    }, [selectedAnswers]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (auto = false) => {
        if (submitting) return;
        clearInterval(timerRef.current);

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/question-bank/tests/${testId}` } });
            return;
        }

        setSubmitting(true);
        setPhase(PHASE.REVIEW); // Show review screen while we wait for the result

        const bookmarkedIds = Object.keys(bookmarked).filter(id => bookmarked[id]);
        const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

        try {
            const response = await api.post(`/api/question-bank/tests/${testId}/submit`, {
                userAnswers:       buildUserAnswers(),
                bookmarks:         bookmarkedIds,
                timeSpentSeconds,
            });

            const payload = response.data ?? response;
            setAttemptResult(payload);
            setPhase(PHASE.RESULT);
        } catch (err) {
            // If submit fails, stay in review mode so the user doesn't lose their answers
            const msg = err?.status === 401
                ? 'Please log in to save your test result.'
                : (err?.message ?? 'Failed to submit test. Your answers are preserved — please retry.');
            setErrorMessage(msg);
            // Do not switch to ERROR phase — keep review so they can retry submit
        } finally {
            setSubmitting(false);
        }
    }, [submitting, isAuthenticated, testId, bookmarked, selectedAnswers, buildUserAnswers, startTime, navigate]);

    const handleAutoSubmit = useCallback(() => {
        handleSubmit(true);
    }, [handleSubmit]);

    // ─── Derived helpers ──────────────────────────────────────────────────────

    const currentQuestion    = questions[currentIndex];
    const totalQ             = questions.length;
    const attemptedCount     = Object.keys(selectedAnswers).length;
    const unattemptedCount   = totalQ - attemptedCount;

    // ─── Phase renders ────────────────────────────────────────────────────────

    if (phase === PHASE.LOADING) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm font-medium">Loading test…</p>
                </div>
            </div>
        );
    }

    if (phase === PHASE.ERROR) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24 px-4">
                <div className="max-w-md text-center space-y-6">
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 inline-flex">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Could not load test</h2>
                    <p className="text-slate-400 text-sm">{errorMessage}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={loadTest}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-emerald-950 font-bold text-sm hover:brightness-110 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" /> Retry
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === PHASE.EMPTY) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-24 px-4">
                <div className="max-w-md text-center space-y-6">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 inline-flex">
                        <BookOpen className="w-10 h-10 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">No questions found</h2>
                    <p className="text-slate-400 text-sm">This test has no published questions yet. Check back after the Question Bank pipeline has processed the PDFs.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>
        );
    }

    if (phase === PHASE.RESULT && attemptResult) {
        const { attempt, questionsWithExplanations } = attemptResult;
        const pct = attempt?.totalMarks > 0
            ? Math.round((attempt.score / attempt.totalMarks) * 100)
            : 0;

        return (
            <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Score Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 text-center space-y-4">
                        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                        <h1 className="text-2xl font-bold text-white">{test?.title}</h1>
                        <div className="text-6xl font-black text-gold">{pct}%</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {[
                                { label: 'Score',     value: `${attempt?.score ?? 0} / ${attempt?.totalMarks ?? 0}` },
                                { label: 'Accuracy',  value: `${attempt?.accuracy ?? 0}%` },
                                { label: 'Time',      value: formatTime(attempt?.timeSpentSeconds ?? 0) },
                                { label: 'Attempted', value: `${totalQ - unattemptedCount} / ${totalQ}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white/5 rounded-2xl p-3">
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-widest">{label}</div>
                                    <div className="text-lg font-bold text-white mt-1">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Topic Performance */}
                    {attempt?.topicPerformance && Object.keys(attempt.topicPerformance).length > 0 && (
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-bold text-gold uppercase tracking-wider">Topic Performance</h3>
                            {Object.entries(attempt.topicPerformance).map(([topic, acc]) => (
                                <div key={topic} className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-300 truncate flex-1">{topic}</span>
                                    <div className="w-32 bg-slate-800 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${acc >= 70 ? 'bg-emerald-500' : acc >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${acc}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300 w-10 text-right">{acc}%</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Question Review */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gold uppercase tracking-wider px-1">Question Review</h3>
                        {(questionsWithExplanations ?? questions).map((q, idx) => {
                            const userAnswer = selectedAnswers[q.id];
                            const isCorrect  = userAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase();
                            const isSkipped  = userAnswer === undefined;
                            return (
                                <div key={q.id ?? idx} className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isSkipped  ? 'bg-slate-700 text-slate-400'
                                          : isCorrect  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                          :              'bg-red-500/20 text-red-400 border border-red-500/40'
                                        }`}>
                                            {isSkipped ? '—' : isCorrect ? '✓' : '✗'}
                                        </span>
                                        <p className="text-sm text-slate-200 leading-relaxed">{q.questionText ?? q.question}</p>
                                    </div>
                                    {!isSkipped && !isCorrect && (
                                        <div className="ml-9 space-y-1">
                                            <p className="text-xs text-red-400">Your answer: <span className="font-medium">{userAnswer}</span></p>
                                            <p className="text-xs text-emerald-400">Correct answer: <span className="font-medium">{q.correctAnswer}</span></p>
                                        </div>
                                    )}
                                    {q.explanation && (
                                        <div className="ml-9 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200">
                                            <span className="font-bold text-blue-400">Explanation: </span>{q.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => navigate('/question-bank')}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-emerald-950 font-black text-sm uppercase tracking-widest hover:shadow-gold/30 hover:shadow-lg transition-all mx-auto"
                    >
                        Back to Question Bank <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // ─── EXAM phase ────────────────────────────────────────────────────────────

    const q               = currentQuestion;
    const isBookmarked    = q ? !!bookmarked[q.id] : false;
    const selectedForQ    = q ? selectedAnswers[q.id] : undefined;

    // In REVIEW phase (post-submit, waiting for result) we still show the exam layout
    // but disable all interaction so the user can see their answers.
    const isReviewLock = phase === PHASE.REVIEW;

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Error banner (submit failed — still in review) */}
                {errorMessage && phase === PHASE.REVIEW && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300 flex-1">{errorMessage}</p>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry Submit
                        </button>
                    </div>
                )}

                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-white/10 p-4 sm:px-6 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30">
                            {test?.testType === 'FREE_POOL' ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase text-gold tracking-widest">
                                {test?.state} · {test?.exam}
                            </span>
                            <h2 className="text-base font-bold text-white">{test?.title}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Progress */}
                        <span className="text-xs text-slate-400 font-medium hidden sm:block">
                            {attemptedCount}/{totalQ} answered
                        </span>

                        {/* Timer */}
                        <div className={`flex items-center gap-2 border px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm ${
                            timeLeft < 60
                                ? 'bg-red-950/60 border-red-500/30 text-red-400 animate-pulse'
                                : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                        }`}>
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting || isReviewLock}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-emerald-950 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting…' : 'Submit Test'}
                        </button>
                    </div>
                </div>

                {/* Main Question Card */}
                {q && (
                    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                        {/* Meta row */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-bold text-gold">
                                    Question {currentIndex + 1} of {totalQ}
                                </span>
                                {q.topic && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                                        {q.topic}
                                    </span>
                                )}
                                {q.difficulty && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                        q.difficulty === 'EASY'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : q.difficulty === 'HARD'   ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      :                             'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    }`}>
                                        {q.difficulty}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => toggleBookmark(q.id)}
                                disabled={isReviewLock}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 ${
                                    isBookmarked
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                }`}
                            >
                                <Bookmark className="w-3.5 h-3.5" />
                                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                        </div>

                        {/* Question text */}
                        <div className="text-base sm:text-lg font-medium text-slate-100 whitespace-pre-line leading-relaxed">
                            {q.questionText ?? q.question}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {(q.options ?? []).map((opt, idx) => {
                                const optId      = (typeof opt === 'object' && opt?.id) ? opt.id : String.fromCharCode(65 + idx);
                                const optText    = typeof opt === 'string' ? opt : (opt?.text ?? opt?.value ?? String(opt));
                                const isSelected = selectedForQ === optId || selectedForQ === optText;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !isReviewLock && handleOptionSelect(q.id, optId)}
                                        disabled={isReviewLock}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm font-medium ${
                                            isSelected
                                                ? 'bg-gold/15 border-gold text-gold font-bold shadow-md'
                                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-default'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                isSelected ? 'bg-gold text-emerald-950' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {optId}
                                            </span>
                                            <span>{optText}</span>
                                        </div>
                                        {isSelected && <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Marks info */}
                        {(q.marks != null || q.negativeMarks != null) && (
                            <div className="flex gap-4 pt-2 border-t border-white/5">
                                {q.marks      != null && <span className="text-xs text-emerald-400">+{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
                                {q.negativeMarks != null && <span className="text-xs text-red-400">−{q.negativeMarks} negative</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Navigation + Palette */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-white/10 p-4 rounded-2xl">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    {/* Question palette */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                        {questions.map((qItem, idx) => {
                            const answered    = selectedAnswers[qItem.id] !== undefined;
                            const isActive    = currentIndex === idx;
                            const isMarked    = bookmarked[qItem.id];
                            return (
                                <button
                                    key={qItem.id ?? idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    title={`Q${idx + 1}${answered ? ' — answered' : ''}${isMarked ? ' — bookmarked' : ''}`}
                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                                        isActive
                                            ? 'ring-2 ring-gold bg-gold text-emerald-950'
                                            : answered && isMarked
                                            ? 'bg-amber-500/40 text-amber-300 border border-amber-500/50'
                                            : answered
                                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                            : isMarked
                                            ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        disabled={currentIndex === totalQ - 1}
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase tracking-wider"
                    >
                        Next <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Summary footer */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                        { label: 'Answered',    value: attemptedCount,   color: 'text-emerald-400' },
                        { label: 'Unanswered',  value: unattemptedCount, color: 'text-red-400'     },
                        { label: 'Bookmarked',  value: Object.values(bookmarked).filter(Boolean).length, color: 'text-amber-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-900/60 border border-white/10 rounded-xl py-3">
                            <div className={`text-xl font-black ${color}`}>{value}</div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizEngine;
