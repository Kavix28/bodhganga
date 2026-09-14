import React from 'react';
import { Award, Send, Menu } from 'lucide-react';
import ExamTimer from './ExamTimer';

const ExamHeader = ({
    stateName,
    districtName,
    testType,
    currentIndex,
    totalQuestions,
    answeredCount,
    unansweredCount,
    markedCount,
    timeLeft,
    isUntimed,
    onTimeExpired,
    onSubmitClick,
    onTogglePaletteMobile
}) => {
    return (
        <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-white/10 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                {/* Left: Exam Branding & Title */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex p-2 rounded-xl bg-gold/10 text-gold border border-gold/30">
                        <Award className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-gold tracking-widest">
                                BodhGanga Examination Workspace
                            </span>
                        </div>
                        <h1 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-[320px] md:max-w-md">
                            {stateName || 'State'} • <span className="text-gold font-bold">{districtName || 'District'}</span> ({testType?.toUpperCase()})
                        </h1>
                    </div>
                </div>

                {/* Center: Progress & Metrics (Hidden on extra small mobile, shown on sm+) */}
                <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-1.5 rounded-2xl text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <span className="text-slate-400">Progress:</span>
                        <span className="font-bold text-white font-serif">{currentIndex + 1} / {totalQuestions}</span>
                    </div>
                    <span className="text-white/20">|</span>
                    <div className="flex items-center gap-3 font-semibold text-[11px]">
                        <span className="text-emerald-400">Answered: <strong className="text-white">{answeredCount}</strong></span>
                        <span className="text-rose-400">Unanswered: <strong className="text-white">{unansweredCount}</strong></span>
                        <span className="text-purple-400">Review: <strong className="text-white">{markedCount}</strong></span>
                    </div>
                </div>

                {/* Right: Timer, Palette Toggle (Mobile), & Submit Button */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile Palette Toggle Button */}
                    {onTogglePaletteMobile && (
                        <button
                            onClick={onTogglePaletteMobile}
                            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 text-xs font-bold"
                            aria-label="Toggle Question Palette"
                            title="Toggle Question Palette"
                        >
                            <Menu className="w-4 h-4 text-gold" />
                            <span className="hidden sm:inline text-[10px] uppercase">Palette</span>
                        </button>
                    )}

                    {/* Timer Component */}
                    <ExamTimer
                        timeLeft={timeLeft}
                        isUntimed={isUntimed}
                        onTimeExpired={onTimeExpired}
                    />

                    {/* Submit Test Button */}
                    <button
                        onClick={onSubmitClick}
                        className="px-3.5 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Submit Test</span>
                        <span className="sm:hidden">Submit</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ExamHeader;
