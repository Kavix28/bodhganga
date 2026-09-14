import React, { useState } from 'react';
import { ShieldCheck, Clock, FileText, CheckSquare, AlertTriangle, ArrowRight, X } from 'lucide-react';

const ExamInstructionsModal = ({ isOpen, onClose, onStartExam, testType, totalQuestions, timeLimitMinutes, districtName, stateName }) => {
    const [acknowledged, setAcknowledged] = useState(false);

    if (!isOpen) return null;

    const isUntimed = testType === 'extra' || testType === 'practice';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="exam-instructions-title">
            <div className="bg-slate-900 border border-gold/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-gold/30 text-xs font-bold text-gradient-gold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                            Official Examination Portal
                        </div>
                        <h2 id="exam-instructions-title" className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                            Examination Instructions
                        </h2>
                        <p className="text-xs text-slate-300">
                            {stateName || 'State'} • <span className="text-gold font-semibold">{districtName || 'District'}</span> ({testType?.toUpperCase()} Test)
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            aria-label="Close instructions"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Exam Details Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Questions</span>
                        <div className="text-lg font-serif font-bold text-white">{totalQuestions} MCQs</div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Time Allowed</span>
                        <div className="text-lg font-serif font-bold text-gold">
                            {isUntimed ? 'Untimed' : `${timeLimitMinutes} Minutes`}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Marking Scheme</span>
                        <div className="text-lg font-serif font-bold text-emerald-400">+2.0 / -0.5</div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pass Criteria</span>
                        <div className="text-lg font-serif font-bold text-amber-400">60% Minimum</div>
                    </div>
                </div>

                {/* Instructions List */}
                <div className="overflow-y-auto space-y-4 pr-2 text-xs sm:text-sm text-slate-300 leading-relaxed custom-scrollbar max-h-60">
                    <div className="space-y-2">
                        <h3 className="font-bold text-white font-serif text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gold" /> General Rules & Navigation:
                        </h3>
                        <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-300">
                            <li>Each correct answer earns <strong>+2.0 marks</strong>. Each incorrect response incurs a negative penalty of <strong>-0.5 marks</strong>.</li>
                            <li>Unanswered questions receive <strong>0 marks</strong>. There is no penalty for skipping questions.</li>
                            <li>You can change your selected answer any number of times before final submission.</li>
                            <li>Use the <strong>Mark for Review</strong> button if you wish to revisit a question later. Marked questions will be flagged in purple on the palette.</li>
                            {!isUntimed && (
                                <li>The examination will <strong>automatically submit</strong> when the countdown timer reaches 00:00.</li>
                            )}
                            <li>Closing or refreshing the browser window during the active test may forfeit your current progress.</li>
                        </ul>
                    </div>

                    <div className="space-y-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                        <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4 text-amber-400" /> Question Palette Status Legend:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Answered</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Visited, Unanswered</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Marked for Review</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Answered & Marked</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-700 inline-block" /> Not Visited</span>
                        </div>
                    </div>
                </div>

                {/* Checkbox & Start Action */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-gold focus:ring-gold focus:ring-offset-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                            I have read, understood, and agree to abide by all the examination rules and instructions stated above.
                        </span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400 font-medium">
                            Status: {acknowledged ? <span className="text-emerald-400 font-bold">Ready to Start</span> : 'Confirmation Required'}
                        </span>

                        <button
                            onClick={onStartExam}
                            disabled={!acknowledged}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
                                acknowledged
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark hover:scale-105 active:scale-95 shadow-gold/20'
                                    : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            <span>Begin Examination</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamInstructionsModal;
