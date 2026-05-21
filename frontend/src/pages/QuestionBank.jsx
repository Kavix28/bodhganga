import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Filter, MapPin } from 'lucide-react';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const QuestionBank = () => {
    const [search, setSearch] = useState('');
    const allRegions = [...indianStates, ...unionTerritories];
    const filtered = allRegions.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-ivory py-12">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-12 slide-up">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full mb-4">
                        <HelpCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Question Bank</span>
                    </div>
                    <h1 className="text-4xl font-bold text-emerald-700 mb-3 font-serif">Practice Question Bank</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Access thousands of practice questions organized by state and subject for all major government exams.
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-xl mx-auto mb-10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by state or territory..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input pl-12 text-lg"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filtered.map(region => (
                        <Link
                            key={region.id}
                            to={`/states/${region.id}`}
                            className="heritage-card group"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {region.code}
                                </span>
                            </div>
                            <h3 className="font-bold text-emerald-700 mb-1 font-serif">{region.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{region.capital}</p>
                            <div className="flex items-center justify-between text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3 text-gold-600" />
                                    {region.questionsCount} Questions
                                </span>
                                <span className="text-emerald-600 font-semibold group-hover:underline">
                                    Practice →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No results found for "{search}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBank;
