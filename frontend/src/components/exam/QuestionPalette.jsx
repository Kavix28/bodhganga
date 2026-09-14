import React from 'react';
import { Layers, X } from 'lucide-react';

const QuestionPalette = ({
    totalQuestions,
    currentIndex,
    answers,
    visited,
    markedForReview,
    onSelectQuestion,
    isOpenMobile,
    onCloseMobile
}) => {
    // Helper function to resolve exact palette status for question at index
    const getStatus = (idx) => {
        const isCurrent = currentIndex === idx;
        const isAns = answers[idx] !== undefined && answers[idx] !== null && answers[idx] >= 0;
        const isMarked = Boolean(markedForReview[idx]);
        const isVis = Boolean(visited[idx]);

        if (isAns && isMarked) return { label: 'Answered & Marked', class: 'bg-purple-600 text-white ring-2 ring-cyan-400' };
        if (isAns) return { label: 'Answered', class: 'bg-emerald-600 text-white' };
        if (isMarked) return { label: 'Marked for Review', class: 'bg-purple-600 text-white' };
        if (isVis) return { label: 'Not Answered', class: 'bg-rose-600 text-white' };
        return { label: 'Not Visited', class: 'bg-slate-800 text-slate-400 hover:bg-slate-700' };
    };

    const content = (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gold" />
                    <h2 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                        Question Palette
                    </h2>
                </div>
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                        aria-label="Close question palette"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Legend Matrix */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 p-3 rounded-2xl border border-white/5 font-medium">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-600 flex-shrink-0" />
                    <span className="text-slate-300">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-rose-600 flex-shrink-0" />
                    <span className="text-slate-300">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-purple-600 flex-shrink-0" />
                    <span className="text-slate-300">Marked Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-purple-600 ring-1 ring-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300">Ans & Marked</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                    <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-600 flex-shrink-0" />
                    <span className="text-slate-400">Not Visited</span>
                </div>
            </div>

            {/* Questions Number Grid */}
            <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Question Number
                </span>
                <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {Array.from({ length: totalQuestions }).map((_, idx) => {
                        const status = getStatus(idx);
                        const isCurrent = currentIndex === idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    onSelectQuestion(idx);
                                    if (onCloseMobile) onCloseMobile();
                                }}
                                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center relative ${
                                    status.class
                                } ${
                                    isCurrent ? 'ring-2 ring-gold ring-offset-2 ring-offset-slate-900 font-extrabold scale-105 shadow-md' : 'hover:scale-105'
                                }`}
                                title={`Question ${idx + 1}: ${status.label}${isCurrent ? ' (Current)' : ''}`}
                                aria-label={`Jump to Question ${idx + 1}, Status: ${status.label}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Visible lg+) */}
            <aside className="hidden lg:block w-72 bg-slate-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl h-fit sticky top-24">
                {content}
            </aside>

            {/* Mobile Drawer Overlay */}
            {isOpenMobile && (
                <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
                    <div className="bg-slate-900 w-80 max-w-[85vw] h-full p-6 space-y-4 border-l border-white/10 overflow-y-auto shadow-2xl animate-slide-left">
                        {content}
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionPalette;
