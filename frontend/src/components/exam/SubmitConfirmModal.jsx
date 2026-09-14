import React from 'react';
import { AlertTriangle, Send, ArrowLeft, Loader2, CheckCircle2, HelpCircle, Flag, Clock } from 'lucide-react';

const SubmitConfirmModal = ({
    isOpen,
    onClose,
    onConfirmSubmit,
    submitting,
    submitError,
    totalQuestions,
    answeredCount,
    unansweredCount,
    markedCount,
    timeLeft,
    isUntimed
}) => {
    if (!isOpen) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes}m ${seconds}s`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="submit-modal-title">
            <div className="bg-slate-900 border border-gold/30 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="space-y-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Final Examination Submission
                    </div>
                    <h2 id="submit-modal-title" className="text-2xl font-serif font-bold text-white tracking-tight">
                        Are you sure you want to submit?
                    </h2>
                    <p className="text-xs text-slate-300">
                        Please review your submission summary below before confirming.
                    </p>
                </div>

                {/* Error Banner */}
                {submitError && (
                    <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-center justify-between text-rose-200 text-xs font-bold space-x-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                            <span>{submitError}</span>
                        </div>
                    </div>
                )}

                {/* Summary Matrix Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-emerald-500/30 p-3 rounded-2xl text-center space-y-0.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        <span className="text-[10px] uppercase font-bold text-emerald-400">Answered</span>
                        <div className="text-xl font-serif font-bold text-white">{answeredCount}</div>
                    </div>
                    <div className="bg-white/5 border border-rose-500/30 p-3 rounded-2xl text-center space-y-0.5">
                        <HelpCircle className="w-5 h-5 text-rose-400 mx-auto" />
                        <span className="text-[10px] uppercase font-bold text-rose-400">Unanswered</span>
                        <div className="text-xl font-serif font-bold text-white">{unansweredCount}</div>
                    </div>
                    <div className="bg-white/5 border border-purple-500/30 p-3 rounded-2xl text-center space-y-0.5">
                        <Flag className="w-5 h-5 text-purple-400 mx-auto" />
                        <span className="text-[10px] uppercase font-bold text-purple-400">Review</span>
                        <div className="text-xl font-serif font-bold text-white">{markedCount}</div>
                    </div>
                    <div className="bg-white/5 border border-gold/30 p-3 rounded-2xl text-center space-y-0.5">
                        <Clock className="w-5 h-5 text-gold mx-auto" />
                        <span className="text-[10px] uppercase font-bold text-gold">Time Left</span>
                        <div className="text-sm font-mono font-bold text-white truncate pt-1">
                            {isUntimed ? 'N/A' : formattedTime}
                        </div>
                    </div>
                </div>

                {/* Warning note */}
                <div className="bg-amber-950/30 border border-amber-500/20 p-3.5 rounded-2xl text-xs text-amber-200/90 leading-relaxed">
                    <strong>Notice:</strong> Once submitted, your examination attempt will be graded immediately on the server. You will not be able to modify any responses after submission.
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Examination
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmSubmit}
                        disabled={submitting}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-950" />
                                <span>Grading Test...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Confirm & Final Submit</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitConfirmModal;
