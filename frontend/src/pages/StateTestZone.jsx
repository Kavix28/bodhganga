import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { statesAndUtTestData } from '../data/testSeriesData';
import { Search, MapPin, CheckCircle, Clock, ChevronRight, BookOpen, Sparkles, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';

const StateTestZone = () => {
    const { stateId } = useParams();
    const [searchDistrict, setSearchDistrict] = useState('');
    const [activeTab, setActiveTab] = useState('DISTRICTS'); // 'DISTRICTS' or 'SUBJECTS'

    const stateData = statesAndUtTestData.find(s => s.id === stateId) || statesAndUtTestData[0];

    const filteredDistricts = (stateData.districts || []).filter(d => 
        d.name.toLowerCase().includes(searchDistrict.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Top Navigation Breadcrumb */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <Link to="/test-series" className="hover:text-gold flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Explore Tests Across India
                    </Link>
                    <span>/</span>
                    <span className="text-gold font-bold">{stateData.name} Test Zone</span>
                </div>

                {/* State Hero Header */}
                <div className="relative rounded-3xl overflow-hidden border border-gold/20 bg-slate-900/80 p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-gold/30">
                                <MapPin className="w-3.5 h-3.5 text-gold" />
                                <span className="text-[11px] font-bold text-gradient-gold uppercase tracking-wider">{stateData.name} • {stateData.type}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                                {stateData.name} <span className="text-gradient-gold">Test Zone</span>
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                Access district-specific learning modules, free quick challenges, advanced tests, and complete state-level subject mock series.
                            </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
                            <div className="flex-1 md:w-48 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                <div className="text-[10px] uppercase font-bold text-slate-400">Total Districts</div>
                                <div className="text-2xl font-serif font-bold text-white">{stateData.totalDistricts} Districts</div>
                            </div>
                            <div className="flex-1 md:w-48 bg-white/5 border border-gold/20 p-3.5 rounded-2xl">
                                <div className="text-[10px] uppercase font-bold text-gold">Covered Districts</div>
                                <div className="text-2xl font-serif font-bold text-gold">{stateData.coveredDistrictsCount} Ready</div>
                            </div>
                        </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex gap-4 border-t border-white/10 pt-6 mt-8">
                        <button
                            onClick={() => setActiveTab('DISTRICTS')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'DISTRICTS'
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            Section 1: District-Wise Tests
                        </button>
                        <button
                            onClick={() => setActiveTab('SUBJECTS')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'SUBJECTS'
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Section 2: State Subject-Wise Tests
                        </button>
                    </div>
                </div>

                {/* SECTION 1: DISTRICT-WISE TESTS */}
                {activeTab === 'DISTRICTS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white">Section 1: District-Wise Tests</h2>
                                <p className="text-xs text-slate-400">Select a district to view available Quick Challenges, Advanced Challenges, and Learning Bundles.</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={`Search district in ${stateData.name}...`}
                                    value={searchDistrict}
                                    onChange={(e) => setSearchDistrict(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-gold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredDistricts.map((dist) => (
                                <div
                                    key={dist.id}
                                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                                        dist.isAvailable
                                            ? 'bg-slate-900/80 hover:bg-slate-900 border-gold/30 hover:border-gold shadow-md hover:shadow-gold/10 hover:-translate-y-1'
                                            : 'bg-slate-900/30 border-white/5 opacity-60'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold uppercase text-gold tracking-widest">District</span>
                                            {dist.isAvailable ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    <CheckCircle className="w-3 h-3" /> Tests Available
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    <Clock className="w-3 h-3" /> Coming Soon
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-white">{dist.name}</h3>
                                        <p className="text-xs text-slate-300 line-clamp-2">
                                            {dist.description || 'Complete coverage of district history, geography, economy, and administration.'}
                                        </p>
                                    </div>

                                    {dist.isAvailable ? (
                                        <Link
                                            to={`/test-series/${stateData.id}/${dist.id}`}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
                                        >
                                            <span>Open {dist.name} Test Page</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <button disabled className="w-full py-2.5 px-4 rounded-xl bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                                            Coming Soon
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION 2: STATE SUBJECT-WISE TESTS */}
                {activeTab === 'SUBJECTS' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white">Section 2: State Subject-Wise Tests</h2>
                            <p className="text-xs text-slate-400">Tests covering the complete state rather than individual districts across 9+ subject categories.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(stateData.subjectTests || []).map((sub) => (
                                <div key={sub.id} className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-gold/50 transition-all duration-300 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 uppercase tracking-widest">
                                            {sub.category}
                                        </span>
                                        <span className="text-xs text-slate-400 font-semibold">{sub.testsCount} Tests</span>
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-white">{sub.title}</h3>
                                    <p className="text-xs text-slate-400">Full-length state level practice modules with comprehensive answer rationales.</p>
                                    <Link
                                        to={`/test-series/${stateData.id}/${stateData.districts?.[0]?.id || ''}`}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-gold hover:text-emerald-dark text-white font-bold text-xs uppercase tracking-wider transition-all duration-300"
                                    >
                                        <span>Start Practice</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StateTestZone;
