import { useState } from 'react';
import { 
    MapPin, Search, Eye, Plus, BookOpen, Video, Trash, 
    X, CheckCircle, ShieldCheck, Sparkles, AlertCircle, Edit, DollarSign
} from 'lucide-react';
import { indianStates } from '../../data/states';
import { unionTerritories } from '../../data/unionTerritories';
import { Link } from 'react-router-dom';

const AdminStates = () => {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('states');
    const [selectedState, setSelectedState] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Mock Database for State-specific Content (Phase 6 CRUD)
    const [stateNotes, setStateNotes] = useState([
        { id: "sn1", stateId: "bihar", title: "70th BPSC Prelims History Special", price: 199, originalPrice: 499, pages: 180 },
        { id: "sn2", stateId: "uttar-pradesh", title: "UPPSC Mains Answer Writing Blueprint", price: 299, originalPrice: 699, pages: 240 },
        { id: "sn3", stateId: "maharashtra", title: "MPSC GS Geography & Demography", price: 249, originalPrice: 599, pages: 210 }
    ]);

    const [stateVideos, setStateVideos] = useState([
        { id: "sv1", stateId: "bihar", title: "Bihar Budget & Economic Survey 2025 Analysis", videoId: "bYg_51_yP-0", category: "Economy" },
        { id: "sv2", stateId: "uttar-pradesh", title: "UP PSC History Mains Syllabus Simplified", videoId: "9o4bJ9HjB8M", category: "History" }
    ]);

    // Form states
    const [noteForm, setNoteForm] = useState({ title: '', price: '', originalPrice: '', pages: '' });
    const [videoForm, setVideoForm] = useState({ title: '', videoId: '', category: 'All' });

    const regions = tab === 'states' ? indianStates : unionTerritories;
    const filtered = regions.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code?.toLowerCase().includes(search.toLowerCase())
    );

    // Save Handlers
    const handleAddNote = (e) => {
        e.preventDefault();
        if (!noteForm.title || !noteForm.price) return;
        const newNote = {
            id: `sn-${Date.now()}`,
            stateId: selectedState.id,
            title: noteForm.title,
            price: Number(noteForm.price),
            originalPrice: Number(noteForm.originalPrice || noteForm.price * 2),
            pages: Number(noteForm.pages || 150)
        };
        setStateNotes(prev => [...prev, newNote]);
        setNoteForm({ title: '', price: '', originalPrice: '', pages: '' });
        triggerSuccess('Premium Study Note added successfully!');
    };

    const handleAddVideo = (e) => {
        e.preventDefault();
        if (!videoForm.title || !videoForm.videoId) return;
        const newVideo = {
            id: `sv-${Date.now()}`,
            stateId: selectedState.id,
            title: videoForm.title,
            videoId: videoForm.videoId,
            category: videoForm.category
        };
        setStateVideos(prev => [...prev, newVideo]);
        setVideoForm({ title: '', videoId: '', category: 'All' });
        triggerSuccess('YouTube Video Lecture added successfully!');
    };

    const handleDeleteNote = (id) => {
        setStateNotes(prev => prev.filter(n => n.id !== id));
        triggerSuccess('Study Note removed.');
    };

    const handleDeleteVideo = (id) => {
        setStateVideos(prev => prev.filter(v => v.id !== id));
        triggerSuccess('Video lecture removed.');
    };

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="space-y-6 bg-slate-950 text-slate-100 p-6 min-h-screen font-sans select-none">
            
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-1 bg-emerald-950 border border-gold/30 px-3 py-1 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold">Syllabus & Asset Manager</span>
                </div>
                <h1 className="text-3xl font-black text-white font-serif tracking-wide uppercase text-gradient-gold">State PSC Admin Hub</h1>
                <p className="text-slate-400 mt-1 text-xs font-semibold">Deploy and regulate study materials, eligibility timelines, and video carousels for all 36 regions.</p>
            </div>

            {/* Success Banner */}
            {successMessage && (
                <div className="fixed top-20 right-6 z-50 bg-emerald-900 border-2 border-gold text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider">{successMessage}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-emerald-950/60 pb-1">
                {['states', 'uts'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            tab === t ? 'border-gold text-gold font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {t === 'states' ? `States (${indianStates.length})` : `Union Territories (${unionTerritories.length})`}
                    </button>
                ))}
            </div>

            {/* Search Box */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Filter by name or code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-900/60 focus:border-gold rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900/80 border border-emerald-950 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 border-b border-emerald-950 text-slate-400 uppercase tracking-widest text-[9px]">
                        <tr>
                            <th className="px-6 py-4 font-bold">Administrative Region</th>
                            <th className="px-6 py-4 font-bold">Code</th>
                            <th className="px-6 py-4 font-bold">Capital</th>
                            <th className="px-6 py-4 font-bold text-center">Active Notes</th>
                            <th className="px-6 py-4 font-bold text-center">Video Carousels</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/40 text-slate-300">
                        {filtered.map(region => {
                            const notesCount = stateNotes.filter(n => n.stateId === region.id).length + 3; // add base
                            const videosCount = stateVideos.filter(v => v.stateId === region.id).length + 4;
                            return (
                                <tr key={region.id} className="hover:bg-slate-850/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-emerald-950/60 border border-gold/15 rounded-lg flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-gold" />
                                            </div>
                                            <span className="font-extrabold text-white">{region.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono font-bold uppercase">{region.code}</td>
                                    <td className="px-6 py-4 text-slate-400 font-semibold">{region.capital}</td>
                                    <td className="px-6 py-4 text-center font-bold text-emerald-400">{notesCount} Notes</td>
                                    <td className="px-6 py-4 text-center font-bold text-gold">{videosCount} Lectures</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedState(region)}
                                                className="inline-flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 border border-gold/20 text-gold px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"
                                            >
                                                <Edit className="w-3.5 h-3.5" /> Manage Assets
                                            </button>
                                            <Link
                                                to={`/states/${region.id}`}
                                                className="inline-flex items-center gap-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View Portal
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider">No regions found</div>
                )}
            </div>

            {/* ── PHASE 6 MODAL STATE ASSET MANAGER ───────────────────────── */}
            {selectedState && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
                    <div className="bg-slate-900 border-2 border-gold rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="bg-emerald-950 border-b border-emerald-900 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <MapPin className="w-6 h-6 text-gold animate-bounce" />
                                <div>
                                    <h4 className="font-serif font-black text-white text-base uppercase tracking-wider">
                                        Asset Control: {selectedState.name} ({selectedState.code})
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                        {selectedState.capital} · Exam Mapped: {selectedState.exams?.[0] || `${selectedState.code}PSC`}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedState(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* LEFT COLUMN: NOTES MANAGER */}
                            <div className="space-y-6">
                                <div className="border-b border-emerald-950 pb-3 flex items-center justify-between">
                                    <h3 className="font-serif font-bold text-gradient-gold text-sm uppercase flex items-center gap-1.5">
                                        <BookOpen className="w-4.5 h-4.5 text-gold" /> Study Notes Portfolio
                                    </h3>
                                    <span className="text-[9px] font-black bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full">
                                        {stateNotes.filter(n => n.stateId === selectedState.id).length} Active
                                    </span>
                                </div>

                                {/* Add Note Form */}
                                <form onSubmit={handleAddNote} className="bg-slate-950 border border-emerald-950 p-4 rounded-xl space-y-3">
                                    <div className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Deploy New Study Pack
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Note Title (e.g. History Core Chapter 1)"
                                        value={noteForm.title}
                                        onChange={e => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                        required
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="Price (₹)"
                                            value={noteForm.price}
                                            onChange={e => setNoteForm(prev => ({ ...prev, price: e.target.value }))}
                                            className="bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2 text-xs text-white focus:outline-none"
                                            required
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Original Price"
                                            value={noteForm.originalPrice}
                                            onChange={e => setNoteForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                                            className="bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2 text-xs text-white focus:outline-none"
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Pages"
                                            value={noteForm.pages}
                                            onChange={e => setNoteForm(prev => ({ ...prev, pages: e.target.value }))}
                                            className="bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2 text-xs text-white focus:outline-none"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark text-[10px] font-black uppercase tracking-wider rounded-lg transition-all">
                                        Deploy Study Pack
                                    </button>
                                </form>

                                {/* Notes List */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPLOYED NOTES</div>
                                    {stateNotes.filter(n => n.stateId === selectedState.id).length === 0 ? (
                                        <p className="text-[11px] text-slate-500 italic">No notes custom uploaded. Using core syllabus packages.</p>
                                    ) : (
                                        stateNotes.filter(n => n.stateId === selectedState.id).map(note => (
                                            <div key={note.id} className="flex justify-between items-center p-3 bg-slate-950/80 border border-emerald-950/40 rounded-lg">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-bold text-white truncate">{note.title}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">₹{note.price} · {note.pages} pages</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="p-1.5 hover:bg-red-950/30 text-slate-500 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: YOUTUBE LECTURES MANAGER */}
                            <div className="space-y-6">
                                <div className="border-b border-emerald-950 pb-3 flex items-center justify-between">
                                    <h3 className="font-serif font-bold text-gradient-gold text-sm uppercase flex items-center gap-1.5">
                                        <Video className="w-4.5 h-4.5 text-gold" /> Video Lectures Desk
                                    </h3>
                                    <span className="text-[9px] font-black bg-emerald-950 border border-emerald-800 text-gold px-2 py-0.5 rounded-full">
                                        {stateVideos.filter(v => v.stateId === selectedState.id).length} Active
                                    </span>
                                </div>

                                {/* Add Video Form */}
                                <form onSubmit={handleAddVideo} className="bg-slate-950 border border-emerald-950 p-4 rounded-xl space-y-3">
                                    <div className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Embed New YouTube Lecture
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Lecture Title (e.g. Budget Breakdown 2025)"
                                        value={videoForm.title}
                                        onChange={e => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="YouTube Video ID (11 chars)"
                                            value={videoForm.videoId}
                                            onChange={e => setVideoForm(prev => ({ ...prev, videoId: e.target.value }))}
                                            className="bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2 text-xs text-white focus:outline-none"
                                            required
                                        />
                                        <select 
                                            value={videoForm.category}
                                            onChange={e => setVideoForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="bg-slate-900 border border-emerald-900 focus:border-gold rounded-lg p-2 text-xs text-white focus:outline-none"
                                        >
                                            <option value="All">All Categories</option>
                                            <option value="Economy">Economy</option>
                                            <option value="History">History</option>
                                            <option value="Geography">Geography</option>
                                            <option value="Polity">Polity</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-gold hover:to-gold-dark text-white hover:text-emerald-dark text-[10px] font-black uppercase tracking-wider rounded-lg transition-all">
                                        Deploy Video Lecture
                                    </button>
                                </form>

                                {/* Videos List */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPLOYED YOUTUBE EMBEDS</div>
                                    {stateVideos.filter(v => v.stateId === selectedState.id).length === 0 ? (
                                        <p className="text-[11px] text-slate-500 italic">No custom videos embedded. Cycling default playlist.</p>
                                    ) : (
                                        stateVideos.filter(v => v.stateId === selectedState.id).map(video => (
                                            <div key={video.id} className="flex justify-between items-center p-3 bg-slate-950/80 border border-emerald-950/40 rounded-lg">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-bold text-white truncate">{video.title}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">ID: {video.videoId} · Cat: {video.category}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    className="p-1.5 hover:bg-red-950/30 text-slate-500 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action CTA */}
                        <div className="bg-emerald-950/80 border-t border-emerald-900 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                                <ShieldCheck className="w-4 h-4 text-gold" />
                                All asset registries successfully synced to primary cluster databases.
                            </div>
                            <button 
                                onClick={() => setSelectedState(null)}
                                className="px-5 py-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                            >
                                Complete Sync & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default AdminStates;
