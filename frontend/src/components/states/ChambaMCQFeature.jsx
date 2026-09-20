import { useState, useEffect } from 'react';
import chambaMcqs from '../../data/chamba_mcqs.json';

export default function ChambaMCQFeature({ onBack }) {
    const [screen, setScreen] = useState('level');
    const [level, setLevel] = useState(null);
    const [answers, setAnswers] = useState({});
    const [marked, setMarked] = useState({});
    const [visited, setVisited] = useState({});
    const [activeQId, setActiveQId] = useState(null);
    const [tempHighlightId, setTempHighlightId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [toastText, setToastText] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showMobilePanel, setShowMobilePanel] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showStartConfirm, setShowStartConfirm] = useState(false);
    const [pendingLevel, setPendingLevel] = useState(null);

    const levels = ['easy', 'medium', 'hard'];

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (screen === 'quiz' && !isSubmitted) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [screen, isSubmitted]);

    useEffect(() => {
        if (screen === 'quiz') {
            window.history.pushState(null, '', window.location.href);
            const handlePopState = () => {
                window.history.pushState(null, '', window.location.href);
            };
            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [screen]);

    useEffect(() => {
        if (screen !== 'quiz' || isSubmitted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;
                if (next === 600) {
                    setToastText('Manage your time efficiently');
                    setTimeout(() => setToastText(''), 6000);
                } else if (next === 180) {
                    setToastText('Only 3 minutes left');
                    setTimeout(() => setToastText(''), 6000);
                } else if (next <= 0) {
                    clearInterval(timer);
                    handleSubmitQuiz();
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [screen, isSubmitted, timeLeft]);

    const handleSubmitQuiz = () => {
        setIsSubmitted(true);
        setShowSubmitConfirm(false);
        setScreen('submitted');
    };

    if (screen === 'level') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-amber-400">Select Difficulty Level</h2>
                    <button
                        onClick={onBack}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Back to Resources
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {levels.map((lvl) => {
                        const count = chambaMcqs.levels[lvl]?.length || 0;
                        return (
                            <button
                                key={lvl}
                                onClick={() => {
                                    setPendingLevel(lvl);
                                    setShowStartConfirm(true);
                                }}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left hover:border-amber-500 transition-all duration-200"
                            >
                                <h3 className="text-lg font-bold text-white capitalize mb-1">{lvl}</h3>
                                <p className="text-sm text-gray-400">{count} Questions</p>
                            </button>
                        );
                    })}
                </div>
                {showStartConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-amber-400 border-b border-gray-800 pb-2 capitalize">
                                    Confirm {pendingLevel} Test
                                </h3>
                                <p className="text-xs text-gray-400 mt-2">
                                    Please review the test instructions and details before starting:
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-300">
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Difficulty Level</p>
                                    <p className="text-base font-bold text-white capitalize mt-0.5">{pendingLevel}</p>
                                </div>
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Total Questions</p>
                                    <p className="text-base font-bold text-white mt-0.5">
                                        {chambaMcqs.levels[pendingLevel]?.length || 0}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800 col-span-2">
                                    <p className="text-gray-500 text-[10px]">Time Allotted</p>
                                    <p className="text-base font-bold text-white mt-0.5">
                                        {Math.ceil((chambaMcqs.levels[pendingLevel]?.length || 0) / 10) * 10} Minutes
                                    </p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-950 rounded-lg border border-gray-850 space-y-2">
                                <p className="text-xs text-gray-400 flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>You can mark questions for review and change your answers anytime before submitting.</span>
                                </p>
                                <p className="text-xs text-gray-400 flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>The test auto-submits when the timer reaches zero.</span>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowStartConfirm(false);
                                        setPendingLevel(null);
                                    }}
                                    className="flex-1 bg-gray-850 hover:bg-gray-800 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => {
                                        const lvl = pendingLevel;
                                        setLevel(lvl);
                                        setAnswers({});
                                        setMarked({});
                                        const qs = chambaMcqs.levels[lvl] || [];
                                        const mins = Math.ceil(qs.length / 10) * 10;
                                        setTimeLeft(mins * 60);
                                        setVisited({ [qs[0]?.id]: true });
                                        setActiveQId(qs[0]?.id);
                                        setScreen('quiz');
                                        setIsSubmitted(false);
                                        setShowSummary(false);
                                        setShowSubmitConfirm(false);
                                        setToastText('');
                                        setShowStartConfirm(false);
                                        setPendingLevel(null);
                                    }}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                    Start Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const questions = chambaMcqs.levels[level] || [];

    const getSummaryCounts = () => {
        const total = questions.length;
        let answered = 0;
        let markedForReview = 0;
        let answeredAndMarked = 0;
        let notVisited = 0;

        questions.forEach((q) => {
            const hasAns = answers[q.id] !== undefined;
            const hasMark = marked[q.id] === true;
            const hasVisit = visited[q.id] === true;

            if (hasAns) answered++;
            if (hasMark) markedForReview++;
            if (hasAns && hasMark) answeredAndMarked++;
            if (!hasVisit) notVisited++;
        });

        const notAnswered = total - answered;

        return {
            total,
            answered,
            notAnswered,
            markedForReview,
            answeredAndMarked,
            notVisited
        };
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleGridClick = (qId) => {
        setVisited((prev) => ({ ...prev, [qId]: true }));
        setActiveQId(qId);
        setTempHighlightId(qId);
        setShowMobilePanel(false);
        const element = document.getElementById('question-card-' + qId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => {
            setTempHighlightId((curr) => (curr === qId ? null : curr));
        }, 3000);
    };

    let timerBoxClass = 'bg-gray-950/60 border border-amber-500/30';
    let timerTextClass = 'text-gray-200';
    if (timeLeft < 180) {
        timerBoxClass = 'bg-red-950/30 border border-red-600/40';
        timerTextClass = 'text-red-500';
    } else if (timeLeft < 600) {
        timerBoxClass = 'bg-amber-950/20 border border-amber-600/40';
        timerTextClass = 'text-amber-500';
    }

    const counts = getSummaryCounts();

    if (screen === 'quiz') {
        return (
            <div className="w-full">
                <div className="w-full lg:pr-[312px] mb-6">
                    <div className="w-full bg-gradient-to-r from-emerald-950/60 via-gray-900/60 to-emerald-950/60 border border-gold/30 rounded-xl p-5 text-center shadow-lg">
                        <h2 className="text-xl md:text-2xl font-black text-amber-400 uppercase tracking-wider mb-1">
                            Chamba District MCQ
                        </h2>
                        <p className="text-xs md:text-sm font-semibold text-gray-300">
                            {level.charAt(0).toUpperCase() + level.slice(1)} Level — All the Best!
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 relative items-start">
                    {toastText && (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg border shadow-lg text-sm font-bold z-50 transition-opacity ${
                            timeLeft < 180
                                ? 'bg-red-950/90 border-red-800 text-red-300'
                                : 'bg-amber-950/90 border-amber-800 text-amber-300'
                        }`}>
                            {toastText}
                        </div>
                    )}

                    <div className="flex-1 w-full space-y-6 lg:pr-[312px]">
                        <div className="lg:hidden sticky top-24 z-20 bg-gray-950/95 backdrop-blur-sm border border-gray-800 py-3.5 px-4 flex items-center justify-between rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Time:</span>
                                <span className={`text-lg font-mono font-bold tracking-tight transition-colors ${timerTextClass}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSummary(true)}
                                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-850 text-gray-200 border border-gray-800 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setShowSubmitConfirm(true)}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-extrabold transition-colors"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, idx) => {
                                const isTempHighlighted = tempHighlightId === q.id;
                                const isCardActive = activeQId === q.id;

                                return (
                                    <div
                                        key={q.id}
                                        id={`question-card-${q.id}`}
                                        onClick={() => {
                                            setVisited((prev) => ({ ...prev, [q.id]: true }));
                                            setActiveQId(q.id);
                                        }}
                                        className={`bg-gray-900 border rounded-xl p-5 space-y-4 transition-all duration-300 ${
                                            isTempHighlighted
                                                ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                                                : isCardActive
                                                ? 'border-gray-700 bg-gray-850'
                                                : 'border-gray-800'
                                        }`}
                                    >
                                        <h3 className="text-white font-semibold">
                                            {idx + 1}. {q.question}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {Object.entries(q.options).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    onClick={() => {
                                                        setAnswers(prev => {
                                                            const newAns = { ...prev };
                                                            if (newAns[q.id] === key) {
                                                                delete newAns[q.id];
                                                            } else {
                                                                newAns[q.id] = key;
                                                            }
                                                            return newAns;
                                                        });
                                                    }}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        answers[q.id] === key
                                                            ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                                                            : 'bg-gray-950/40 border-gray-800 text-gray-300 hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-600 text-xs uppercase font-bold">
                                                        {key}
                                                    </span>
                                                    <span className="text-sm">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-800/40">
                                            <button
                                                onClick={() => setMarked(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                                                    marked[q.id]
                                                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300'
                                                        : 'bg-gray-950/40 border-gray-800 text-gray-400 hover:text-gray-200'
                                                }`}
                                            >
                                                {marked[q.id] ? 'Marked for Review' : 'Mark for Review'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden lg:flex w-72 bg-gray-900 border border-gray-800 rounded-xl p-5 fixed top-[112px] shrink-0 flex-col h-[calc(100vh-136px)] space-y-5 shadow-2xl right-4 xl:left-[calc(50%+288px)] z-30">
                        <div className={`flex flex-col items-center justify-center p-3.5 rounded-lg shrink-0 transition-colors ${timerBoxClass}`}>
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400 mb-1">Time Remaining</span>
                            <span className={`text-2xl font-mono font-bold tracking-tight transition-colors ${timerTextClass}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-extrabold transition-colors shadow-md shadow-amber-500/10 uppercase tracking-wider"
                            >
                                Submit Test
                            </button>
                            <button
                                onClick={() => setShowSummary(true)}
                                className="w-full py-2 bg-gray-950 hover:bg-gray-850 text-gray-200 border border-gray-800 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider"
                            >
                                Test Summary
                            </button>
                        </div>

                        <div className="border-t border-gray-850 shrink-0" />

                        <div className="flex-1 min-h-0 flex flex-col space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                                Questions Navigation
                            </h3>
                            <div className="grid grid-cols-5 gap-2 overflow-y-auto flex-1 pr-1">
                                {questions.map((q, idx) => {
                                    const hasAns = answers[q.id] !== undefined;
                                    const hasMark = marked[q.id] === true;
                                    const hasVisit = visited[q.id] === true;
                                    const isCellActive = activeQId === q.id;

                                    let btnBg = 'bg-gray-800 border-gray-700 text-gray-400';
                                    if (hasAns && hasMark) {
                                        btnBg = 'bg-indigo-600 border-indigo-500 text-white';
                                    } else if (hasAns) {
                                        btnBg = 'bg-green-700 border-green-600 text-white';
                                    } else if (hasMark) {
                                        btnBg = 'bg-gray-800 border-indigo-500 border-2 text-indigo-300';
                                    } else if (!hasVisit) {
                                        btnBg = 'bg-gray-900 border-gray-800 text-gray-600';
                                    }

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => handleGridClick(q.id)}
                                            className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${btnBg} ${
                                                isCellActive ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' : ''
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowMobilePanel(true)}
                    className="lg:hidden fixed bottom-24 right-4 bg-amber-500 hover:bg-amber-400 text-black font-bold p-3 rounded-full shadow-lg z-40 flex items-center justify-center"
                >
                    <span className="text-xs uppercase font-extrabold px-1">Questions</span>
                </button>

                {showMobilePanel && (
                    <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end">
                        <div className="w-80 bg-gray-900 border-l border-gray-800 p-5 h-full relative flex flex-col space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                                    Questions Navigation
                                </h3>
                                <button
                                    onClick={() => setShowMobilePanel(false)}
                                    className="p-1.5 text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2 overflow-y-auto flex-1 pr-1">
                                {questions.map((q, idx) => {
                                    const hasAns = answers[q.id] !== undefined;
                                    const hasMark = marked[q.id] === true;
                                    const hasVisit = visited[q.id] === true;
                                    const isCellActive = activeQId === q.id;

                                    let btnBg = 'bg-gray-800 border-gray-700 text-gray-400';
                                    if (hasAns && hasMark) {
                                        btnBg = 'bg-indigo-600 border-indigo-500 text-white';
                                    } else if (hasAns) {
                                        btnBg = 'bg-green-700 border-green-600 text-white';
                                    } else if (hasMark) {
                                        btnBg = 'bg-gray-800 border-indigo-500 border-2 text-indigo-300';
                                    } else if (!hasVisit) {
                                        btnBg = 'bg-gray-900 border-gray-800 text-gray-600';
                                    }

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => handleGridClick(q.id)}
                                            className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${btnBg} ${
                                                isCellActive ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' : ''
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {showSummary && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-6">
                            <h3 className="text-lg font-bold text-amber-400 border-b border-gray-800 pb-2">Test Summary</h3>
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-300">
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500">Total Questions</p>
                                    <p className="text-lg font-bold text-white mt-1">{counts.total}</p>
                                </div>
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500">Answered</p>
                                    <p className="text-lg font-bold text-green-400 mt-1">{counts.answered}</p>
                                </div>
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500">Not Answered</p>
                                    <p className="text-lg font-bold text-red-400 mt-1">{counts.notAnswered}</p>
                                </div>
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500">Marked for Review</p>
                                    <p className="text-lg font-bold text-indigo-400 mt-1">{counts.markedForReview}</p>
                                </div>
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 col-span-2">
                                    <p className="text-gray-500">Answered & Marked for Review</p>
                                    <p className="text-lg font-bold text-purple-400 mt-1">{counts.answeredAndMarked}</p>
                                </div>
                                <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 col-span-2">
                                    <p className="text-gray-500">Not Visited</p>
                                    <p className="text-lg font-bold text-gray-400 mt-1">{counts.notVisited}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                            >
                                Close Summary
                            </button>
                        </div>
                    </div>
                )}

                {showSubmitConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-amber-400 border-b border-gray-800 pb-2">Confirm Submission</h3>
                                <p className="text-xs text-gray-400 mt-2">
                                    Are you sure you want to end and submit the test? Review your summary counts below:
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-300">
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Total Questions</p>
                                    <p className="text-base font-bold text-white mt-0.5">{counts.total}</p>
                                </div>
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Answered</p>
                                    <p className="text-base font-bold text-green-400 mt-0.5">{counts.answered}</p>
                                </div>
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Not Answered</p>
                                    <p className="text-base font-bold text-red-400 mt-0.5">{counts.notAnswered}</p>
                                </div>
                                <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800">
                                    <p className="text-gray-500 text-[10px]">Marked for Review</p>
                                    <p className="text-base font-bold text-indigo-400 mt-0.5">{counts.markedForReview}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowSubmitConfirm(false)}
                                    className="flex-1 bg-gray-850 hover:bg-gray-800 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitQuiz}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-lg transition-colors text-sm"
                                >
                                    Submit Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (screen === 'submitted') {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-green-950/40 border border-green-800 text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                        ✓
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Test submitted successfully</h2>
                        <p className="text-sm text-gray-400">Your responses have been saved and evaluated.</p>
                    </div>
                    <button
                        onClick={() => setScreen('results')}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-lg transition-colors"
                    >
                        Result
                    </button>
                </div>
            </div>
        );
    }

    if (screen === 'results') {
        const correctCount = questions.reduce((acc, q) => {
            return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
        }, 0);

        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-amber-400">Quiz Completed</h2>
                        <p className="text-lg text-white font-semibold">
                            You scored {correctCount} / {questions.length}
                        </p>
                    </div>
                    <div className="flex justify-center gap-4 pt-2 border-t border-gray-850">
                        <button
                            onClick={() => {
                                setAnswers({});
                                setMarked({});
                                setVisited({});
                                setScreen('level');
                            }}
                            className="text-xs font-bold text-gray-400 hover:text-amber-400 border border-gray-800 hover:border-amber-500/50 bg-gray-950/40 hover:bg-amber-950/10 px-3.5 py-1.5 rounded-lg transition-all"
                        >
                            Retry
                        </button>
                        <button
                            onClick={onBack}
                            className="text-xs font-bold text-gray-400 hover:text-amber-400 border border-gray-800 hover:border-amber-500/50 bg-gray-950/40 hover:bg-amber-950/10 px-3.5 py-1.5 rounded-lg transition-all"
                        >
                            Resources
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    {questions.map((q, idx) => {
                        const picked = answers[q.id];
                        const correct = q.correctAnswer;
                        const isCorrect = picked === correct;

                        return (
                            <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                                <h3 className="text-white font-semibold">
                                    {idx + 1}. {q.question}
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(q.options).map(([key, val]) => {
                                        let borderClass = 'border-gray-800';
                                        let bgClass = 'bg-gray-950/40';
                                        let textClass = 'text-gray-300';

                                        if (picked !== undefined && key === picked) {
                                            if (isCorrect) {
                                                borderClass = 'border-green-500';
                                                bgClass = 'bg-green-950/40';
                                                textClass = 'text-green-300';
                                            } else {
                                                borderClass = 'border-red-500';
                                                bgClass = 'bg-red-950/40';
                                                textClass = 'text-red-300';
                                            }
                                        } else if (key === correct) {
                                            borderClass = 'border-green-800/60';
                                            bgClass = 'bg-green-950/20';
                                            textClass = 'text-green-400';
                                        }

                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} ${bgClass} ${textClass}`}
                                            >
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-600 text-xs uppercase font-bold">
                                                    {key}
                                                </span>
                                                <span className="text-sm">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg space-y-1">
                                    <p className="text-xs font-bold text-amber-400">
                                        Correct answer: {correct}) {q.options[correct]}
                                    </p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {q.explanation}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setAnswers({});
                            setMarked({});
                            setVisited({});
                            setScreen('level');
                        }}
                        className="flex-1 py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Try Another Difficulty
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
                    >
                        Back to Resources
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
