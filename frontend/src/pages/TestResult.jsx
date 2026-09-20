import React from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, HelpCircle, Clock, Zap, ShieldCheck, ArrowRight, RotateCcw, BookOpen, AlertTriangle } from 'lucide-react';
import AnswerReviewSection from '../components/exam/AnswerReviewSection';

const TestResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { stateId: paramStateId, districtId: paramDistrictId } = useParams();

    // Fallback result data if accessed directly
    const result = location.state?.result || {
        stateId: paramStateId || 'maharashtra',
        districtId: paramDistrictId || 'akola',
        testType: 'easy',
        totalQuestions: 20,
        correctCount: 16,
        incorrectCount: 3,
        unattemptedCount: 1,
        score: 30.5,
        percentage: 80,
        accuracy: 84,
        timeTaken: 720,
        topicAnalysis: {
            Geography: { total: 4, correct: 4, incorrect: 0 },
            History: { total: 4, correct: 3, incorrect: 1 },
            Economy: { total: 4, correct: 3, incorrect: 1 },
            Administration: { total: 4, correct: 3, incorrect: 1 },
            Culture: { total: 4, correct: 3, incorrect: 0 }
        },
        gradedQuestions: [],
        bookmarkedQuestionIds: []
    };

    const isEasy = result.testType === 'easy';
    const isAdvanced = result.testType === 'advanced' || result.testType === 'medium' || result.testType === 'hard';
    const isMaster = result.testType === 'master';

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-gold selection:text-slate-950">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 left-1/3 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[130px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-10">
                {/* Result Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-gold/30">
                        <Award className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">
                            {result.districtId?.toUpperCase()} District Performance Analysis
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                        Examination <span className="text-gradient-gold">Result & Analytics</span>
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm">
                        Detailed breakdown of score, accuracy, topic metrics, and official question explanations.
                    </p>
                </div>

                {/* Score Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 border border-gold/30 p-5 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-lg">
                        <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Score</div>
                        <div className="text-3xl font-serif font-bold text-gold">{result.score}</div>
                    </div>
                    <div className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-lg">
                        <div className="text-[10px] font-extrabold uppercase text-emerald-400">Percentage</div>
                        <div className="text-3xl font-serif font-bold text-emerald-400">{result.percentage}%</div>
                    </div>
                    <div className="bg-slate-900/80 border border-amber-500/30 p-5 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-lg">
                        <div className="text-[10px] font-extrabold uppercase text-amber-400">Accuracy</div>
                        <div className="text-3xl font-serif font-bold text-amber-400">{result.accuracy}%</div>
                    </div>
                    <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl text-center space-y-1 backdrop-blur-md shadow-lg">
                        <div className="text-[10px] font-extrabold uppercase text-slate-400">Time Taken</div>
                        <div className="text-3xl font-serif font-bold text-white">
                            {Math.floor((result.timeTaken || 0) / 60)}m {(result.timeTaken || 0) % 60}s
                        </div>
                    </div>
                </div>

                {/* Question Breakdown Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-md">
                        <div>
                            <div className="text-xs font-bold text-emerald-400">Correct Answers</div>
                            <div className="text-2xl font-serif font-bold text-emerald-300">{result.correctCount}</div>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-md">
                        <div>
                            <div className="text-xs font-bold text-rose-400">Incorrect Answers</div>
                            <div className="text-2xl font-serif font-bold text-rose-300">{result.incorrectCount}</div>
                        </div>
                        <XCircle className="w-8 h-8 text-rose-400" />
                    </div>
                    <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-md">
                        <div>
                            <div className="text-xs font-bold text-slate-400">Unattempted</div>
                            <div className="text-2xl font-serif font-bold text-slate-300">{result.unattemptedCount}</div>
                        </div>
                        <HelpCircle className="w-8 h-8 text-slate-400" />
                    </div>
                </div>

                {/* Recommended Next Step Funnel Banner */}
                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950/60 border-2 border-gold/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <span className="px-3 py-1 bg-gold/20 text-gold text-[10px] font-black uppercase tracking-widest rounded-full border border-gold/40">
                                Recommended Next Learning Step
                            </span>
                            {isEasy && (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                                        You scored {result.correctCount}/{result.totalQuestions}. Ready for the {result.districtId?.toUpperCase()} Medium/Advanced Challenge?
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Test your depth of knowledge with statement-based questions tailored for state competitive exams.
                                    </p>
                                </>
                            )}
                            {isAdvanced && (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                                        Complete your mastery of {result.districtId?.toUpperCase()} District with the Master Test.
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Comprehensive test series aggregating questions across history, geography, economy, and culture.
                                    </p>
                                </>
                            )}
                            {isMaster && (
                                <>
                                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                                        Master Test Completed! Review your rationales and weak topics below.
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Review detailed explanations to reinforce concepts or reattempt the examination.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        {isEasy && (
                            <button
                                onClick={() => navigate(`/test-series/${result.stateId}/${result.districtId}/quiz/medium`)}
                                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                            >
                                Attempt Medium Test →
                            </button>
                        )}
                        {isAdvanced && (
                            <button
                                onClick={() => navigate(`/test-series/${result.stateId}/${result.districtId}/quiz/master`)}
                                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                            >
                                Attempt Master Test →
                            </button>
                        )}
                        {isMaster && (
                            <button
                                onClick={() => navigate(`/test-series/${result.stateId}/${result.districtId}`)}
                                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                            >
                                Back to District Zone
                            </button>
                        )}
                    </div>
                </div>

                {/* Topic-Wise & Weak Area Breakdown */}
                {result.topicAnalysis && Object.keys(result.topicAnalysis).length > 0 && (
                    <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
                        <h3 className="text-lg font-serif font-bold text-white">Topic-Wise Performance & Weak Area Analysis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(result.topicAnalysis).map(([topic, stat]) => {
                                const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                                const isWeak = pct < 60;
                                return (
                                    <div key={topic} className={`p-4 rounded-2xl border ${isWeak ? 'bg-rose-950/20 border-rose-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                                            <span className="text-white">{topic}</span>
                                            <span className={isWeak ? 'text-rose-400' : 'text-emerald-400'}>{pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                                            <div className={`h-full ${isWeak ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        {isWeak && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                                <AlertTriangle className="w-3 h-3" /> Weak Area — Revision Recommended
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Answer Review & Rationales Section */}
                <AnswerReviewSection
                    gradedQuestions={result.gradedQuestions}
                    bookmarkedQuestionIds={result.bookmarkedQuestionIds}
                />

                {/* Navigation Action Footer */}
                <div className="flex justify-between items-center pt-4">
                    <Link
                        to={`/test-series/${result.stateId}/${result.districtId}`}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/10"
                    >
                        <RotateCcw className="w-4 h-4" /> Back to District Test Zone
                    </Link>
                    <Link
                        to="/test-series"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-wider transition-all shadow-md"
                    >
                        Explore More States
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TestResult;
