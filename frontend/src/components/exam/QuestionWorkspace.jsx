import React, { useEffect } from 'react';
import { CheckCircle2, Bookmark, ArrowLeft, ArrowRight, RotateCcw, Flag } from 'lucide-react';

const QuestionWorkspace = ({
    question,
    currentIndex,
    totalQuestions,
    selectedOption,
    isMarkedForReview,
    isBookmarked,
    onOptionSelect,
    onClearResponse,
    onToggleMarkForReview,
    onToggleBookmark,
    onPrevious,
    onSaveAndNext
}) => {
    // Keyboard navigation shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                return;
            }

            const key = e.key.toUpperCase();
            if (['A', '1'].includes(key) && question?.options?.[0]) onOptionSelect(0);
            if (['B', '2'].includes(key) && question?.options?.[1]) onOptionSelect(1);
            if (['C', '3'].includes(key) && question?.options?.[2]) onOptionSelect(2);
            if (['D', '4'].includes(key) && question?.options?.[3]) onOptionSelect(3);

            if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) onSaveAndNext();
            if (e.key === 'ArrowLeft' && currentIndex > 0) onPrevious();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [question, currentIndex, totalQuestions, onOptionSelect, onSaveAndNext, onPrevious]);

    if (!question) return null;

    const hasSelected = selectedOption !== undefined && selectedOption !== null && selectedOption >= 0;

    return (
        <main className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl relative flex flex-col justify-between min-h-[460px]">
            {/* Top Workspace Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gold font-serif">
                        Question {currentIndex + 1} <span className="text-slate-400 font-sans font-normal">of {totalQuestions}</span>
                    </span>
                    {question.difficulty && (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 uppercase tracking-wider">
                            {question.difficulty}
                        </span>
                    )}
                </div>

                {/* Bookmark & Review Indicators */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleBookmark}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                            isBookmarked
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title="Bookmark question for personal reference"
                    >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3 my-2">
                <div className="text-base sm:text-lg lg:text-xl font-medium text-slate-100 whitespace-pre-line leading-relaxed tracking-wide font-sans">
                    {question.question}
                </div>
            </div>

            {/* Answer Options List */}
            <div className="space-y-3 my-4" role="radiogroup" aria-label={`Options for Question ${currentIndex + 1}`}>
                {question.options && question.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                    return (
                        <button
                            key={idx}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onOptionSelect(idx)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between text-xs sm:text-sm font-medium group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold ${
                                isSelected
                                    ? 'bg-gold/15 border-gold text-gold font-bold shadow-lg ring-1 ring-gold/50'
                                    : 'bg-slate-800/60 border-white/5 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                    isSelected
                                        ? 'bg-gold text-emerald-950 shadow-md'
                                        : 'bg-slate-700/80 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                                }`}>
                                    {optionLabel}
                                </span>
                                <span className="leading-snug">{opt}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                                    Press [{optionLabel}]
                                </span>
                                {isSelected && <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Question Controls Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={onPrevious}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    {hasSelected && (
                        <button
                            type="button"
                            onClick={onClearResponse}
                            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/5 transition-colors"
                            title="Clear selected option"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Clear Response
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleMarkForReview}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                            isMarkedForReview
                                ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md'
                                : 'bg-white/5 hover:bg-purple-900/30 text-purple-300/80 hover:text-purple-200 border-white/10'
                        }`}
                        title="Mark question to review later"
                    >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onSaveAndNext}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
                    >
                        <span>{currentIndex === totalQuestions - 1 ? 'Save & Review' : 'Save & Next'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </main>
    );
};

export default QuestionWorkspace;
