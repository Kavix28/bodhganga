import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleQuestionsData } from '../data/testSeriesData';
import { bengaluruQuestions } from '../data/bengaluruQuestions';
import { ernakulamQuestions } from '../data/ernakulamQuestions';
import { kargilQuestions } from '../data/kargilQuestions';
import { anantnagQuestions } from '../data/anantnagQuestions';
import { chatraQuestions } from '../data/chatraQuestions';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Bookmark, ShieldCheck, Zap } from 'lucide-react';

import api from '../services/api';

// District-specific question banks — add new imports and entries here as more districts get questions
const districtQuestionBanks = {
    'bengaluru': bengaluruQuestions,
    'ernakulam': ernakulamQuestions,
    'kargil': kargilQuestions,
    'anantnag': anantnagQuestions,
    'chatra': chatraQuestions,
};

const QuizEngine = () => {
    const { stateId, districtId, testType } = useParams(); // 'easy', 'advanced', 'master'
    const navigate = useNavigate();

    // Use district-specific questions if available, otherwise fall back to sample data
    const questionBank = districtQuestionBanks[districtId] || sampleQuestionsData;
    const questions = questionBank[testType] || questionBank.easy || sampleQuestionsData.easy;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [bookmarks, setBookmarks] = useState({});
    const [timeLeft, setTimeLeft] = useState(questions.length * 60); // 1 min per question

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIndex) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [currentIndex]: optionIndex
        }));
    };

    const toggleBookmark = () => {
        setBookmarks(prev => ({
            ...prev,
            [currentIndex]: !prev[currentIndex]
        }));
    };

    const handleSubmitQuiz = async () => {
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;
        const topicAnalysis = {};

        questions.forEach((q, idx) => {
            const userAns = selectedAnswers[idx];
            const topic = q.topic || 'General';
            if (!topicAnalysis[topic]) {
                topicAnalysis[topic] = { total: 0, correct: 0, incorrect: 0 };
            }
            topicAnalysis[topic].total += 1;

            if (userAns === undefined) {
                unattemptedCount += 1;
            } else if (userAns === q.correctAnswer) {
                correctCount += 1;
                topicAnalysis[topic].correct += 1;
            } else {
                incorrectCount += 1;
                topicAnalysis[topic].incorrect += 1;
            }
        });

        const scoreData = {
            stateId,
            districtId,
            testType,
            totalQuestions: questions.length,
            correctCount,
            incorrectCount,
            unattemptedCount,
            score: correctCount * 2 - incorrectCount * 0.5,
            percentage: Math.round((correctCount / questions.length) * 100),
            accuracy: Math.round((correctCount / (correctCount + incorrectCount || 1)) * 100),
            timeTaken: questions.length * 60 - timeLeft,
            topicAnalysis,
            questions,
            selectedAnswers,
            bookmarks
        };

        const bookmarkedQuestionIds = Object.keys(bookmarks)
            .filter(idxKey => bookmarks[idxKey])
            .map(idxKey => questions[parseInt(idxKey)]?.id || String(idxKey));

        const attemptData = {
            stateSlug: stateId,
            districtSlug: districtId,
            testType,
            totalQuestions: questions.length,
            correctCount,
            incorrectCount,
            unattemptedCount,
            score: scoreData.score,
            percentage: scoreData.percentage,
            accuracy: scoreData.accuracy,
            timeTaken: scoreData.timeTaken,
            topicAnalysis,
            bookmarkedQuestionIds
        };

        try {
            await api.post('/quiz/attempt', attemptData);
        } catch (error) {
            console.error('Failed to save quiz attempt:', error);
        }

        navigate(`/test-series/${stateId}/${districtId}/result`, { state: { result: scoreData } });
    };

    const q = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-white/10 p-4 sm:px-6 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/30">
                            {testType === 'easy' ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-extrabold uppercase text-gold tracking-widest">{districtId} District Test</span>
                            <h2 className="text-lg font-serif font-bold text-white uppercase">
                                {testType === 'easy' ? 'District Quick Challenge (Free)' : testType === 'advanced' ? 'District Advanced Challenge (Free)' : 'District Master Test (Paid)'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-emerald-400 font-mono font-bold text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                        <button
                            onClick={handleSubmitQuiz}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all"
                        >
                            Submit Test
                        </button>
                    </div>
                </div>

                {/* Main Question Card */}
                <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
                    {/* Top Meta info */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gold">Question {currentIndex + 1} of {questions.length}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                                {q.topic}
                            </span>
                        </div>
                        <button
                            onClick={toggleBookmark}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                bookmarks[currentIndex]
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                            }`}
                        >
                            <Bookmark className="w-3.5 h-3.5" />
                            {bookmarks[currentIndex] ? 'Bookmarked' : 'Bookmark'}
                        </button>
                    </div>

                    {/* Question text */}
                    <div className="text-base sm:text-lg font-medium text-slate-100 whitespace-pre-line leading-relaxed">
                        {q.question}
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                        {q.options.map((opt, idx) => {
                            const isSelected = selectedAnswers[currentIndex] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between text-xs sm:text-sm font-medium ${
                                        isSelected
                                            ? 'bg-gold/15 border-gold text-gold font-bold shadow-md'
                                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                                            isSelected ? 'bg-gold text-emerald-950' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span>{opt}</span>
                                    </div>
                                    {isSelected && <CheckCircle className="w-4 h-4 text-gold" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Question Palette & Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-white/10 p-4 rounded-2xl">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    {/* Question Palette Dots */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                                    currentIndex === idx
                                        ? 'ring-2 ring-gold bg-gold text-emerald-950'
                                        : selectedAnswers[idx] !== undefined
                                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={currentIndex === questions.length - 1}
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase tracking-wider"
                    >
                        Next <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizEngine;
