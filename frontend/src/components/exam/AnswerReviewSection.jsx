import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, BookOpen, Filter, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

const AnswerReviewSection = ({ gradedQuestions = [], bookmarkedQuestionIds = [] }) => {
    const [filter, setFilter] = useState('ALL'); // 'ALL', 'INCORRECT', 'CORRECT', 'UNATTEMPTED', 'BOOKMARKED'
    const [expandedQuestionId, setExpandedQuestionId] = useState(null);

    if (!gradedQuestions || gradedQuestions.length === 0) return null;

    const bookmarkedSet = new Set(bookmarkedQuestionIds || []);

    const filtered = gradedQuestions.filter((q) => {
        if (filter === 'INCORRECT') return !q.isCorrect && !q.isUnattempted;
        if (filter === 'CORRECT') return q.isCorrect;
        if (filter === 'UNATTEMPTED') return q.isUnattempted;
        if (filter === 'BOOKMARKED') return bookmarkedSet.has(q.id);
        return true;
    });

    const toggleExpand = (id) => {
        setExpandedQuestionId(prev => prev === id ? null : id);
    };

    return (
        <section className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
            {/* Header & Filter Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gold">
                        <BookOpen className="w-4 h-4" />
                        <h3 className="text-lg font-serif font-bold text-white">
                            Detailed Question Review & Explanations
                        </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                        Review your answers alongside official rationales to identify and correct conceptual gaps.
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'ALL', label: `All (${gradedQuestions.length})` },
                        { id: 'INCORRECT', label: 'Incorrect' },
                        { id: 'CORRECT', label: 'Correct' },
                        { id: 'UNATTEMPTED', label: 'Unattempted' },
                        { id: 'BOOKMARKED', label: 'Bookmarked' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                filter === btn.id
                                    ? 'bg-gold text-emerald-950 font-black shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Questions Review Accordion List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium bg-white/5 rounded-2xl p-6">
                        No questions match the selected filter.
                    </div>
                ) : (
                    filtered.map((q, idx) => {
                        const isExpanded = expandedQuestionId === q.id || filtered.length <= 5;
                        const isBookmarked = bookmarkedSet.has(q.id);

                        return (
                            <div
                                key={q.id || idx}
                                className={`rounded-2xl border transition-all ${
                                    q.isCorrect
                                        ? 'bg-emerald-950/20 border-emerald-500/30'
                                        : q.isUnattempted
                                        ? 'bg-slate-900 border-white/10'
                                        : 'bg-rose-950/20 border-rose-500/30'
                                }`}
                            >
                                {/* Collapsible Header Bar */}
                                <button
                                    onClick={() => toggleExpand(q.id)}
                                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                            q.isCorrect
                                                ? 'bg-emerald-500 text-slate-950'
                                                : q.isUnattempted
                                                ? 'bg-slate-700 text-slate-300'
                                                : 'bg-rose-500 text-white'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {q.isCorrect ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                                        <CheckCircle2 className="w-3 h-3" /> Correct (+2.0)
                                                    </span>
                                                ) : q.isUnattempted ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                                                        <HelpCircle className="w-3 h-3" /> Unattempted (0.0)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                                                        <XCircle className="w-3 h-3" /> Incorrect (-0.5)
                                                    </span>
                                                )}

                                                {isBookmarked && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md font-bold border border-amber-500/30">
                                                        <Bookmark className="w-3 h-3" /> Bookmarked
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                                                {q.question}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 pt-1">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </button>

                                {/* Expanded Content Details */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4 text-xs sm:text-sm">
                                        {/* Full Question Text */}
                                        <div className="text-slate-200 font-medium whitespace-pre-line leading-relaxed bg-white/5 p-3.5 rounded-xl">
                                            {q.question}
                                        </div>

                                        {/* Options Grid */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Option Choices:</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options && q.options.map((opt, optIdx) => {
                                                    const isUserSelected = q.selectedAnswer === optIdx;
                                                    const isCorrectOption = q.correctAnswer === optIdx;

                                                    let cardStyle = 'bg-white/5 border-white/5 text-slate-300';
                                                    if (isCorrectOption) {
                                                        cardStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                                                    } else if (isUserSelected && !q.isCorrect) {
                                                        cardStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold';
                                                    }

                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${cardStyle}`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[11px]">
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span>{opt}</span>
                                                            </div>
                                                            {isCorrectOption && (
                                                                <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                                                                    Correct
                                                                </span>
                                                            )}
                                                            {isUserSelected && !isCorrectOption && (
                                                                <span className="text-[10px] font-extrabold uppercase text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                                                                    Your Choice
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Rationale / Explanation Box */}
                                        {q.explanation && (
                                            <div className="bg-gold/10 border border-gold/30 p-4 rounded-xl space-y-1 text-xs">
                                                <h5 className="font-serif font-bold text-gold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                                    <BookOpen className="w-3.5 h-3.5" /> Answer Explanation & Rationale:
                                                </h5>
                                                <p className="text-slate-200 leading-relaxed font-sans">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default AnswerReviewSection;
