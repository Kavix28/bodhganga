import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { statesAndUtTestData } from '../data/testSeriesData';
import { Search, MapPin, CheckCircle, Clock, Sparkles, Filter, Award, ArrowRight } from 'lucide-react';

const TestYourKnowledge = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'STATES', 'UTS'

    const filteredItems = statesAndUtTestData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.code.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterType === 'STATES') return matchesSearch && item.type === 'State';
        if (filterType === 'UTS') return matchesSearch && item.type === 'UT';
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Background Aesthetics */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                {/* Hero Header */}
                <div className="text-center space-y-4 animate-fade-in max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 border border-gold/30 backdrop-blur-md">
                        <Award className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">NDDE Test Portal</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight">
                        Explore Tests <span className="text-gradient-gold">Across India</span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
                        Master India district by district. Practice with research-backed District Quick Challenges, Advanced Knowledge Challenges, and State Subject-Wise Mock Tests.
                    </p>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md max-w-4xl mx-auto shadow-xl">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search State or Union Territory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-gold transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                        {[
                            { id: 'ALL', label: 'All Regions' },
                            { id: 'STATES', label: '28 States' },
                            { id: 'UTS', label: '8 UTs' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterType(btn.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                                    filterType === btn.id
                                        ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-md'
                                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* State Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                                item.isAvailable
                                    ? 'bg-slate-900/60 hover:bg-slate-900/90 border-gold/20 hover:border-gold/60 shadow-lg hover:shadow-gold/10 hover:-translate-y-1'
                                    : 'bg-slate-900/30 border-white/5 opacity-75'
                            }`}
                        >
                            {/* Card Image Banner */}
                            <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                                
                                {/* Status Badges */}
                                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                                    {item.isAvailable ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                                            <CheckCircle className="w-3 h-3" /> Available
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                                            <Clock className="w-3 h-3" /> Coming Soon
                                        </span>
                                    )}
                                    {item.freeTestAvailable && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gold/20 text-gold border border-gold/40 backdrop-blur-md">
                                            <Sparkles className="w-2.5 h-2.5" /> Free Tests
                                        </span>
                                    )}
                                </div>

                                <div className="absolute bottom-3 left-4 right-4">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold">{item.type} • {item.code}</span>
                                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">{item.name}</h3>
                                </div>
                            </div>

                            {/* Card Body & Specs */}
                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Available Tests</div>
                                        <div className="text-base font-bold text-white font-serif">{item.totalTests || '0'} Tests</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Districts Covered</div>
                                        <div className="text-base font-bold text-gold font-serif">{item.coveredDistrictsCount} / {item.totalDistricts}</div>
                                    </div>
                                </div>

                                {item.isAvailable ? (
                                    <Link
                                        to={`/test-series/${item.id}`}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest shadow-md hover:shadow-gold/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                    >
                                        <span>Enter Test Zone</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-3 px-4 rounded-xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed border border-white/5"
                                    >
                                        Content Coming Soon
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestYourKnowledge;
