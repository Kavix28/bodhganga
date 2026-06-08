import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Globe, Sparkles, Filter } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAnalytics } from '../hooks/useAnalytics';
import api from '../services/api';
import StateCard from '../components/states/StateCard';
import Breadcrumb from '../components/common/Breadcrumb';
import EmptyState from '../components/ui/EmptyState';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const regionMap = {
    // North
    'jammu-kashmir': 'North India',
    'ladakh': 'North India',
    'himachal-pradesh': 'North India',
    'punjab': 'North India',
    'haryana': 'North India',
    'uttarakhand': 'North India',
    'delhi': 'North India',
    'chandigarh': 'North India',
    // South
    'andhra-pradesh': 'South India',
    'karnataka': 'South India',
    'kerala': 'South India',
    'tamil-nadu': 'South India',
    'telangana': 'South India',
    'lakshadweep': 'South India',
    'puducherry': 'South India',
    // East
    'bihar': 'East India',
    'jharkhand': 'East India',
    'odisha': 'East India',
    'west-bengal': 'East India',
    // West
    'goa': 'West India',
    'gujarat': 'West India',
    'maharashtra': 'West India',
    'dadra-nagar-haveli': 'West India',
    'dnh-dd': 'West India',
    'rajasthan': 'West India',
    // Central
    'madhya-pradesh': 'Central India',
    'chhattisgarh': 'Central India',
    // North-East
    'arunachal-pradesh': 'North-East India',
    'assam': 'North-East India',
    'manipur': 'North-East India',
    'meghalaya': 'North-East India',
    'mizoram': 'North-East India',
    'nagaland': 'North-East India',
    'sikkim': 'North-East India',
    'tripura': 'North-East India',
    'andaman-nicobar': 'East India',
    'andaman-and-nicobar': 'East India',
};

const States = () => {
    const { trackEvent } = useAnalytics('States & UTs');
    const [activeTypeTab, setActiveTypeTab] = useState('all');   // 'all' | 'states' | 'uts'
    const [activeRegion, setActiveRegion] = useState('All');    // 'All' | 'North India' | etc.
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    
    const [dbData, setDbData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        trackEvent('viewed_states_page');
        fetchStates();
    }, [trackEvent]);

    const fetchStates = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/states/available');
            setDbData(res || []);
        } catch (error) {
            console.error("Failed to load states:", error);
            setDbData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Build list dynamically from MongoDB
    const mergedData = useMemo(() => {
        return dbData.map(item => {
            return {
                ...item,
                notesCount: item.notesCount || 0,
                questionsCount: Math.floor(Math.random() * 500) + 1200,
                solutionsCount: Math.floor(Math.random() * 400) + 1000,
                region: regionMap[item.id] || 'Other',
                examName: `${item.code || 'State'}PSC`,
                aspirantCount: Math.floor(Math.random() * 80000) + 60000,
                thumbnail: `https://picsum.photos/400/250?random=${item.code || item.id}`
            };
        });
    }, [dbData]);

    const filteredItems = useMemo(() => {
        return mergedData.filter(item => {
            // Filter by States/UTs Type Tab
            if (activeTypeTab === 'states' && item.type !== 'STATE') return false;
            if (activeTypeTab === 'uts' && item.type !== 'UT') return false;

            // Filter by Geographic Region
            if (activeRegion !== 'All' && item.region !== activeRegion) return false;

            // Filter by Search Query
            if (debouncedSearch.trim()) {
                const q = debouncedSearch.toLowerCase();
                return (
                    item.name?.toLowerCase().includes(q) ||
                    item.code?.toLowerCase().includes(q) ||
                    item.capital?.toLowerCase().includes(q) ||
                    item.exams?.some(ex => ex.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [mergedData, activeTypeTab, activeRegion, debouncedSearch]);

    const regionsList = ['All', 'North India', 'South India', 'East India', 'West India', 'Central India', 'North-East India'];

    return (
        <div className="min-h-screen bg-ivory-light">
            
            {/* ── LUXURY BANNER HEADER ───────────────────────────────── */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white relative overflow-hidden py-16 border-b border-gold/15 px-6">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                
                <div className="relative max-w-7xl mx-auto space-y-5">
                    <div className="mb-2">
                        <Breadcrumb items={[{ label: 'Explore Regions', path: '/states' }]} />
                    </div>
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/20">
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                        <span className="text-[9px] font-bold tracking-widest text-gold uppercase">India-Wide Preparation Hub</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">
                        State PSC & Union Territories
                    </h1>

                    <p className="text-white/60 text-xs sm:text-sm max-w-3xl leading-relaxed font-medium">
                        Access dedicated exam portals for all administrative zones. Mapped syllabus, current affairs questions, hand-crafted PDF notes, and Netflix-style lecture carousels.
                    </p>

                    {/* Filters: States vs UTs */}
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-start inline-flex mt-4">
                        {[
                            { id: 'all', label: 'All Regions (36)' },
                            { id: 'states', label: '28 States' },
                            { id: 'uts', label: '8 UTs' },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { setActiveTypeTab(tab.id); }}
                                className={`px-4 py-2 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                                    activeTypeTab === tab.id
                                        ? 'bg-gold text-emerald-dark shadow-md'
                                        : 'text-white/70 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                
                {/* ── SEARCH & GEOGRAPHIC REGION FILTERS ─────────────────── */}
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                        <input
                            type="text"
                            placeholder="Search state, capital, exam (e.g. BPSC)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-3.5 pl-11 pr-4 rounded-xl border border-emerald/15 bg-white text-xs font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/5 outline-none shadow-sm"
                        />
                    </div>

                    {/* Regional Geographic Filters */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="text-[10px] font-bold text-emerald/60 uppercase tracking-widest flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" /> Zone:
                        </div>
                        {regionsList.map(region => (
                            <button
                                key={region}
                                onClick={() => setActiveRegion(region)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                                    activeRegion === region
                                        ? 'bg-emerald text-white shadow-sm border border-emerald'
                                        : 'bg-white text-emerald-dark/60 border border-emerald/10 hover:border-emerald/30'
                                }`}
                            >
                                {region.replace(' India', '')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subtitle Count */}
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-dark/50">
                    {debouncedSearch 
                        ? `Found ${filteredItems.length} matching administrative regions`
                        : `Showing all ${filteredItems.length} curated prep channels`
                    }
                </p>

                {/* ── GRID OF STATE CARDS ────────────────────────────────── */}
                {isLoading ? (
                    <div className="text-center py-20 text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                        Gathering civil services database...
                    </div>
                ) : (
                    <>
                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredItems.map((item) => (
                                    <StateCard key={item.id} state={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="card-premium bg-white p-12">
                                <EmptyState 
                                    title={`No results for "${searchTerm}"`}
                                    message={`Please modify your query or try selecting another geographic region zone.`}
                                    actionLabel="Clear Filter & Search"
                                    onAction={() => { setSearchTerm(''); setActiveRegion('All'); }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Academic Section */}
                <div className="card-premium bg-white/90 border border-emerald/5 p-8 sm:p-10 space-y-6 mt-16">
                    <h2 className="text-xl font-bold font-serif text-emerald-dark tracking-tight pb-3 border-b border-emerald/5">Comprehensive Study Resources Mapped</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <p className="text-emerald-dark/70 text-xs leading-relaxed font-semibold">
                            BodhGanga Academy maps detailed regional syllabus updates, historical landmarks, geographic breakdowns, and previous examination questions for public administration exams.
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wider text-emerald-dark/60">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Mapped GK & Current Affairs
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Regional Geography Focus
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Previous Exam Bank Modules
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Bilingual Core Notes
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default States;
