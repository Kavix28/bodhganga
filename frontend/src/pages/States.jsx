import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, BookOpen, HelpCircle } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAnalytics } from '../hooks/useAnalytics';
import api from '../services/api';
import StateCard from '../components/states/StateCard';
import Breadcrumb from '../components/common/Breadcrumb';
import EmptyState from '../components/ui/EmptyState';

const States = () => {
    const navigate = useNavigate();
    const { trackEvent } = useAnalytics('States & UTs');
    const [activeTab, setActiveTab ] = useState('states');   // 'states' | 'uts'
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    
    const [allData, setAllData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        trackEvent('viewed_states_page');
        fetchStates();
    }, [trackEvent]);

    const fetchStates = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/states');
            setAllData(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to load states:", error);
            setAllData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const statesData = allData.filter(s => s.type !== 'UT');
    const utsData = allData.filter(s => s.type === 'UT');

    const allItems = activeTab === 'states' ? statesData : utsData;
    const type  = activeTab === 'states' ? 'state' : 'union-territory';

    const filteredItems = useMemo(() => {
        let results = allItems;
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            results = results.filter(item =>
                item.name?.toLowerCase().includes(q) ||
                item.code?.toLowerCase().includes(q) ||
                item.capital?.toLowerCase().includes(q)
            );
        }
        return results;
    }, [allItems, debouncedSearch]);

    return (
        <div className="min-h-screen bg-ivory-light">
            {/* Header Banner */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white relative overflow-hidden py-16 border-b border-gold/15 px-4">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                <div className="relative max-w-7xl mx-auto space-y-4">
                    <div className="mb-2">
                        <Breadcrumb items={[
                            { label: activeTab === 'states' ? 'States' : 'Union Territories',
                               path: activeTab === 'states' ? '/states' : '/union-territories' }
                        ]} />
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">
                        {activeTab === 'states' ? 'States' : 'Union Territories'} and Capitals
                    </h1>

                    <p className="text-white/60 text-sm max-w-3xl leading-relaxed font-medium">
                        Explore local GK, History, Geography, and administrative syllabus mapped meticulously for each of India's administrative regions.
                    </p>

                    {/* Premium tab toggler */}
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-start inline-flex mt-6">
                        {[
                            { id: 'states', label: 'States of India' },
                            { id: 'uts',    label: 'Union Territories' },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                                    activeTab === tab.id
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

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
                {/* Search Bar */}
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'states' ? 'states' : 'territories'} capital or code...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3.5 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none"
                    />
                </div>

                {/* Subtitle count */}
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                    {debouncedSearch 
                        ? `Found ${filteredItems.length} matching territories`
                        : `Showing all ${filteredItems.length} regions`
                    }
                </p>

                {/* Main list grid */}
                {isLoading ? (
                    <div className="text-center py-16 text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                        Retrieving regional mapping database...
                    </div>
                ) : (
                    <>
                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredItems.map((item) => (
                                    <StateCard key={item.id} state={item} type={type} />
                                ))}
                            </div>
                        ) : (
                            <div className="card-premium bg-white p-12">
                                <EmptyState 
                                    title={`No results for "${searchTerm}"`}
                                    message={`Please refine your query or try another spelling.`}
                                    actionLabel="Clear Search"
                                    onAction={() => setSearchTerm('')}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Academic Section */}
                <div className="card-premium bg-white/80 border border-emerald/5 p-8 sm:p-10 space-y-6 mt-16">
                    <h2 className="text-xl font-bold font-serif text-emerald-dark tracking-tight pb-3 border-b border-emerald/5">Comprehensive Study Resources Mapped</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <p className="text-emerald-dark/70 text-sm leading-relaxed font-medium">
                            BodhGanga Academy maps detailed regional syllabus updates, historical landmarks, geographic breakdowns, and previous examination questions for public administration exams.
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-emerald-dark/60">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Mapped GK & Current Affairs
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Regional Geography Focus
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Previous Exam Bank Modules
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Bilingual Core Notes
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default States;
