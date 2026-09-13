import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { statesAndUtTestData, sampleBalodNotes } from '../data/testSeriesData';
import { Award, Zap, ShieldCheck, CheckCircle2, Lock, Unlock, FileText, Download, Play, RotateCcw, ArrowLeft, ChevronRight, Eye, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';

const DistrictTestPage = () => {
    const { stateId, districtId } = useParams();
    const navigate = useNavigate();
    const [isPurchased, setIsPurchased] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    const [availability, setAvailability] = useState({
        loading: true,
        available: false,
        count: 0,
        error: false
    });

    const stateData = statesAndUtTestData.find(s => s.id === stateId) || statesAndUtTestData[0];
    const districtData = (stateData.districts || []).find(d => d.id === districtId) || {
        id: 'balod',
        name: 'Balod',
        price: 199
    };

    useEffect(() => {
        let isMounted = true;
        const checkAvailability = async () => {
            setAvailability({ loading: true, available: false, count: 0, error: false });
            try {
                const response = await api.get('/quiz/published-count', {
                    params: {
                        stateSlug: stateId,
                        districtSlug: districtId
                    }
                });
                if (isMounted) {
                    if (response && response.success && response.data) {
                        setAvailability({
                            loading: false,
                            available: Boolean(response.data.available && response.data.count > 0),
                            count: response.data.count || 0,
                            error: false
                        });
                    } else {
                        setAvailability({ loading: false, available: false, count: 0, error: false });
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setAvailability({ loading: false, available: false, count: 0, error: true });
                }
            }
        };

        checkAvailability();
        return () => { isMounted = false; };
    }, [stateId, districtId]);

    const handleUnlockBundle = () => {
        setIsPurchased(true);
        alert(`Success! You have unlocked the ${districtData.name} District Complete Learning Bundle!`);
    };

    const isTestAvailable = availability.available && availability.count > 0;

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
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-gold/40">
                            <Award className="w-4 h-4 text-gold" />
                            <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">{stateData.name} • NDDE District Portal</span>
                        </div>

                        {/* Availability Status Indicator */}
                        {availability.loading ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                                <span>Checking Live Quiz Availability...</span>
                            </div>
                        ) : isTestAvailable ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{availability.count} Published MCQs Ready</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span>Tests Coming Soon for {districtData.name}</span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                        {districtData.name} <span className="text-gradient-gold">District Test Zone</span>
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                        Complete three-tier learning assessment covering geography, history, mineral resources, culture, and administrative structures of {districtData.name} district.
                    </p>
                </div>

                {/* Four Main District Test Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* OPTION 1: Easy Timed Quiz */}
                    <div className="bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-emerald-500/30">
                            FREE TIMED
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-bold text-white">Easy Quiz</h3>
                                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">20 Questions · 25 Minutes</p>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                <li className="flex items-center gap-1.5">✓ Fundamental district facts</li>
                                <li className="flex items-center gap-1.5">✓ 25-minute timer</li>
                                <li className="flex items-center gap-1.5">✓ Instant answer explanations</li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/easy`)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Easy Quiz</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
                        )}
                    </div>

                    {/* OPTION 2: Medium Timed Quiz */}
                    <div className="bg-slate-900/80 border border-blue-500/30 hover:border-blue-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-blue-500/30">
                            FREE TIMED
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-bold text-white">Medium Quiz</h3>
                                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">20 Questions · 25 Minutes</p>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                <li className="flex items-center gap-1.5">✓ Intermediate concepts</li>
                                <li className="flex items-center gap-1.5">✓ 25-minute timer</li>
                                <li className="flex items-center gap-1.5">✓ Full score breakdown</li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/medium`)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Medium Quiz</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
                        )}
                    </div>

                    {/* OPTION 3: Hard Timed Quiz */}
                    <div className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-amber-500/30">
                            ADVANCED TIMED
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-bold text-white">Hard Quiz</h3>
                                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">20 Questions · 25 Minutes</p>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                <li className="flex items-center gap-1.5">✓ Statement-based MCQs</li>
                                <li className="flex items-center gap-1.5">✓ 25-minute timer</li>
                                <li className="flex items-center gap-1.5">✓ In-depth explanations</li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/hard`)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Hard Quiz</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
                        )}
                    </div>

                    {/* OPTION 4: Extra Practice */}
                    <div className="bg-slate-900/90 border border-gold/50 hover:border-gold rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-gold/20 text-gold font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-gold/40">
                            PRACTICE BANK
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-bold text-white">Extra Practice</h3>
                                <p className="text-[11px] font-bold text-gold uppercase tracking-widest mt-0.5">Remaining Questions · Untimed</p>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                <li className="flex items-center gap-1.5">✓ Complete question bank</li>
                                <li className="flex items-center gap-1.5">✓ No timer pressure</li>
                                <li className="flex items-center gap-1.5">✓ Unlimited revision</li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/extra`)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Extra Practice</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
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
