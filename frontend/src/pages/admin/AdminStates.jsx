import { useState } from 'react';
import { MapPin, Search, Eye } from 'lucide-react';
import { indianStates } from '../../data/states';
import { unionTerritories } from '../../data/unionTerritories';
import { Link } from 'react-router-dom';

const AdminStates = () => {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('states');

    const regions = tab === 'states' ? indianStates : unionTerritories;
    const filtered = regions.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif">States & Content</h1>
                <p className="text-slate-500 mt-1">Manage state-wise study content</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                {['states', 'uts'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                            tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t === 'states' ? `States (${indianStates.length})` : `Union Territories (${unionTerritories.length})`}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search regions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input pl-10 py-2.5 text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Region</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Code</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Capital</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-600">Notes</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-600">Questions</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(region => (
                            <tr key={region.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="font-medium text-slate-800">{region.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 font-mono">{region.code}</td>
                                <td className="px-4 py-3 text-slate-500">{region.capital}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{region.notesCount}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{region.questionsCount}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        to={`/states/${region.id}`}
                                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold text-xs"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-400">No regions found</div>
                )}
            </div>
        </div>
    );
};

export default AdminStates;
