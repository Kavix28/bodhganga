import { useState, useEffect } from 'react';
import { BookOpen, Search, Download, Eye, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/common/Breadcrumb';

const Library = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PURCHASED' | 'FREE'
    const [actionId, setActionId] = useState(null);

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payment/my-purchases');
            setPurchases(res.data || res || []);
        } catch (error) {
            console.error("Error loading library:", error);
            toast.error("Failed to load library resources");
        } finally {
            setLoading(false);
        }
    };

    const handleAccessFile = async (item, directDownload = false) => {
        const storageKey = item.storageKey || item.product?.storageKey;
        if (!storageKey) {
            toast.error("No S3 storage key associated with this item");
            return;
        }

        try {
            setActionId(item.id);
            // Request presigned URL from secure API
            const res = await api.get(`/pdf/${storageKey}`);
            const signedUrl = res.url || res.data?.url;
            
            if (signedUrl) {
                if (directDownload) {
                    // Force download by creating a temporary link
                    const link = document.createElement('a');
                    link.href = signedUrl;
                    link.setAttribute('download', `${item.title || 'Note'}.pdf`);
                    link.setAttribute('target', '_blank');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Download started");
                } else {
                    // Open in new tab for viewing
                    window.open(signedUrl, '_blank');
                }
            } else {
                throw new Error("Could not resolve document download URL");
            }
        } catch (error) {
            console.error("Access error:", error);
            toast.error(error.message || "Failed to access document. Access forbidden.");
        } finally {
            setActionId(null);
        }
    };

    // Filter and search logic
    const filtered = purchases.filter(item => {
        const title = item.title || item.product?.title || '';
        const stateName = item.state || item.product?.state || '';
        const districtName = item.district || item.product?.district || '';
        const price = item.price || item.product?.price || 0;
        
        // Search filter
        const matchesSearch = 
            title.toLowerCase().includes(search.toLowerCase()) ||
            stateName.toLowerCase().includes(search.toLowerCase()) ||
            districtName.toLowerCase().includes(search.toLowerCase());
            
        if (!matchesSearch) return false;

        // Type filter
        if (filter === 'FREE') {
            return price === 0;
        }
        if (filter === 'PURCHASED') {
            return price > 0;
        }
        return true;
    });

    return (
        <div className="min-h-screen bg-ivory-light">
            {/* Header */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white py-16 border-b border-gold/15 px-6">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                
                <div className="relative max-w-7xl mx-auto space-y-4">
                    <Breadcrumb items={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'My Library', path: '/library' }]} />
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/20 text-gold text-[9px] font-bold tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> Personal Scholar Archive
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">My Library</h1>
                    <p className="text-white/60 text-xs sm:text-sm max-w-2xl leading-relaxed">
                        Access all your unlocked premium state materials, purchased notes, and claimed free resources in one secure dashboard.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                {/* Search & Filter Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                        <input
                            type="text"
                            placeholder="Search by title, state, district..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/15 bg-white text-xs font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/5 outline-none shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 bg-emerald/5 p-1 rounded-xl self-start">
                        {[
                            { id: 'ALL', label: 'All Resources' },
                            { id: 'PURCHASED', label: 'Purchased Notes' },
                            { id: 'FREE', label: 'Free Resources' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                    filter === tab.id
                                        ? 'bg-emerald-dark text-white shadow-sm'
                                        : 'text-emerald-dark/60 hover:text-emerald'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20 text-xs font-extrabold uppercase tracking-widest text-emerald-dark/50">
                        Loading your library archive...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-emerald/5 p-12 max-w-xl mx-auto space-y-4">
                        <AlertCircle className="w-12 h-12 text-emerald/20 mx-auto" />
                        <h3 className="text-lg font-serif font-bold text-emerald-dark">No Resources Available</h3>
                        <p className="text-xs text-emerald-dark/60 leading-relaxed">
                            You don't have any resources in this section yet. Head over to the Store or Free Resources page to build your collection.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(item => {
                            const title = item.title || item.product?.title || 'Study Material';
                            const stateName = item.state || item.product?.state || 'All India';
                            const districtName = item.district || item.product?.district || '';
                            const thumbnail = item.thumbnail || item.product?.thumbnail || "https://picsum.photos/400/250?random=pdf";
                            const dateStr = item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric'
                            }) : 'N/A';
                            const price = item.price || item.product?.price || 0;

                            return (
                                <div key={item.id} className="card-premium bg-white border border-emerald/5 hover:border-gold/30 rounded-2xl overflow-hidden group flex flex-col justify-between h-[360px]">
                                    {/* Thumbnail */}
                                    <div className="h-40 overflow-hidden relative bg-slate-900 border-b border-emerald/5">
                                        <img 
                                            src={thumbnail} 
                                            alt={title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <span className="absolute top-4 left-4 z-20 text-[8px] font-black uppercase bg-emerald-dark text-gold px-2.5 py-0.5 rounded-full shadow-md">
                                            {price === 0 ? 'FREE' : 'PURCHASED'}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex-grow flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex gap-2 text-[8px] font-black uppercase text-gold">
                                                <span>{stateName}</span>
                                                {districtName && <span>· {districtName}</span>}
                                            </div>
                                            <h3 className="font-serif font-bold text-emerald-dark text-sm group-hover:text-gold transition-colors line-clamp-2" title={title}>
                                                {title}
                                            </h3>
                                            <p className="text-[9px] text-emerald-dark/50 font-bold uppercase mt-1">Unlocked: {dateStr}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-emerald/5 mt-4">
                                            <button
                                                onClick={() => handleAccessFile(item, false)}
                                                disabled={actionId === item.id}
                                                className="py-2.5 bg-emerald/5 hover:bg-emerald text-emerald-dark hover:text-white border border-emerald/10 font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                            <button
                                                onClick={() => handleAccessFile(item, true)}
                                                disabled={actionId === item.id}
                                                className="py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
