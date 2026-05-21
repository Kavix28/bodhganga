import { useState } from 'react';
import { BookOpen, Plus, Search, Upload } from 'lucide-react';

const AdminContent = () => {
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Content Manager</h1>
                    <p className="text-slate-500 mt-1">Upload and manage study materials</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload PDF
                    </button>
                    <button className="btn-gold flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Content
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search content..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input pl-10 py-2.5 text-sm"
                />
            </div>

            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-emerald-800 mb-1">Content API Coming Soon</h3>
                        <p className="text-sm text-emerald-700">
                            The content management API (<code>/api/content/**</code>) is being built. 
                            Once connected, you'll be able to upload PDFs, notes, and question banks directly from here.
                        </p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm p-16 text-center">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2 font-serif">No Content Yet</h3>
                <p className="text-slate-400 mb-6">
                    Start by uploading study materials for states and subjects.
                </p>
                <button className="btn-emerald">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Material
                </button>
            </div>
        </div>
    );
};

export default AdminContent;
