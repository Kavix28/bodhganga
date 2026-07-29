import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { statesAndUtTestData, sampleBalodNotes } from '../data/testSeriesData';
import { Award, Zap, ShieldCheck, CheckCircle2, Lock, Unlock, FileText, Download, Play, RotateCcw, ArrowLeft, ChevronRight, Eye } from 'lucide-react';

const DistrictTestPage = () => {
    const { stateId, districtId } = useParams();
    const navigate = useNavigate();
    const [isPurchased, setIsPurchased] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    const stateData = statesAndUtTestData.find(s => s.id === stateId) || statesAndUtTestData[0];
    const districtData = (stateData.districts || []).find(d => d.id === districtId) || {
        id: 'balod',
        name: 'Balod',
        price: 199
    };

    const handleUnlockBundle = () => {
        // Simulating Purchase process for District Master Bundle
        setIsPurchased(true);
        alert(`Success! You have unlocked the ${districtData.name} District Complete Learning Bundle!`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Aesthetic Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-emerald-600/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[130px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-10">
                {/* Navigation Breadcrumbs: State -> District */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <Link to="/test-series" className="hover:text-gold transition-colors">Explore Tests Across India</Link>
                    <span>→</span>
                    <Link to={`/test-series/${stateData.id}`} className="hover:text-gold transition-colors">{stateData.name}</Link>
                    <span>→</span>
                    <span className="text-gold font-bold">{districtData.name} District</span>
                </div>

                {/* Header Banner */}
                <div className="bg-slate-900/80 border border-gold/30 rounded-3xl p-6 sm:p-10 backdrop-blur-xl space-y-4 shadow-2xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-gold/40">
                        <Award className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">{stateData.name} • NDDE District Portal</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                        {districtData.name} <span className="text-gradient-gold">District Test Zone</span>
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                        Complete three-tier learning assessment covering geography, history, mineral resources, culture, and administrative structures of {districtData.name} district.
                    </p>
                </div>

                {/* Three Main District Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* OPTION 1: District Quick Challenge — Free */}
                    <div className="bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-emerald-500/30">
                            FREE TEST 1
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">{districtData.name} Quick Challenge</h3>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">20 Easy Questions | Free</p>
                            </div>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-center gap-2">✓ Basic district facts</li>
                                <li className="flex items-center gap-2">✓ Simple MCQs</li>
                                <li className="flex items-center gap-2">✓ Suitable for beginners</li>
                                <li className="flex items-center gap-2">✓ Instant score summary</li>
                                <li className="flex items-center gap-2">✓ Basic answer explanations</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/easy`)}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Attempt Quick Challenge</span>
                        </button>
                    </div>

                    {/* OPTION 2: District Advanced Knowledge Challenge — Free */}
                    <div className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-amber-500/30">
                            FREE TEST 2
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">{districtData.name} Knowledge Challenge</h3>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">20 Advanced Questions | Free</p>
                            </div>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-center gap-2">✓ Statement-based questions</li>
                                <li className="flex items-center gap-2">✓ UPSC & CGPSC orientation</li>
                                <li className="flex items-center gap-2">✓ Chronology & Match-the-following</li>
                                <li className="flex items-center gap-2">✓ Detailed answer rationales</li>
                                <li className="flex items-center gap-2">✓ Performance analysis</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/advanced`)}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Attempt Advanced Challenge</span>
                        </button>
                    </div>

                    {/* OPTION 3: District Complete Learning Bundle — Paid */}
                    <div className="bg-slate-900/90 border border-gold/50 hover:border-gold rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-gold/20 text-gold font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-gold/40">
                            PREMIUM BUNDLE
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">{districtData.name} District Complete Bundle</h3>
                                <p className="text-xs font-bold text-gold uppercase tracking-widest mt-1">Complete Notes + 75-100 Question Master Test</p>
                            </div>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-center gap-2">✓ Complete {districtData.name} District Notes</li>
                                <li className="flex items-center gap-2">✓ Quick revision material</li>
                                <li className="flex items-center gap-2">✓ Prelims-focused revision points</li>
                                <li className="flex items-center gap-2">✓ 75–100 Master Test Questions</li>
                                <li className="flex items-center gap-2">✓ Weak-area identification & reattempts</li>
                            </ul>
                        </div>

                        {/* BUTTONS: Pre-purchase vs Post-purchase */}
                        {!isPurchased ? (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs px-1">
                                    <span className="text-slate-400 font-medium">One-time Unlock:</span>
                                    <span className="text-xl font-serif font-bold text-gold">₹{districtData.price || 199}</span>
                                </div>
                                <button
                                    onClick={handleUnlockBundle}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest hover:shadow-gold/20 hover:-translate-y-0.5 transition-all shadow-xl"
                                >
                                    <Unlock className="w-4 h-4" />
                                    <span>Unlock Bundle (₹{districtData.price || 199})</span>
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowNotesModal(true)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-bold border border-white/10 transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-gold" /> Preview Notes
                                    </button>
                                    <button
                                        onClick={() => alert(`Details: Complete ${districtData.name} District Notes + Master Test Bundle.`)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-bold border border-white/10 transition-colors"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-gold" /> Bundle Details
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5 pt-2 border-t border-gold/20">
                                <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded-full border border-emerald-500/40">
                                    ✓ Bundle Unlocked & Ready
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowNotesModal(true)}
                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold text-xs font-bold border border-gold/40 transition-colors"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Read Notes
                                    </button>
                                    <button
                                        onClick={() => alert('Downloading Balod District Study Notes PDF...')}
                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/master`)}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>Attempt Master Test</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes Modal Preview */}
            {showNotesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-gold/30 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">{sampleBalodNotes.title}</h3>
                                <p className="text-xs text-gold font-semibold">{sampleBalodNotes.subtitle}</p>
                            </div>
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            {sampleBalodNotes.sections.map((sec, idx) => (
                                <div key={idx} className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <h4 className="text-sm font-bold text-gold font-serif">{sec.heading}</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">{sec.content}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DistrictTestPage;
