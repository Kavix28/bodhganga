import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Download, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/common/Breadcrumb';
import { getResourceBadge } from './Marketplace';

const FreeResources = () => {
    const navigate = useNavigate();
    const { isAuthenticated, openAuthModal } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [claimingId, setClaimingId] = useState(null);

    useEffect(() => {
        fetchFreeResources();
    }, []);

    const fetchFreeResources = async () => {
        try {
            setLoading(true);
            const res = await api.get('/products');
            // Filter products where isFree is true
            const allProducts = res.data || res || [];
            const freeItems = allProducts.filter(p => p.isFree || p.price === 0);
            setProducts(freeItems);
        } catch (error) {
            console.error("Failed to load free resources:", error);
            toast.error("Failed to load free resources");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (productId, title) => {
        if (!isAuthenticated) {
            openAuthModal('welcome');
            return;
        }
        
        try {
            setClaimingId(productId);
            const res = await api.post(`/payment/claim-free/${productId}`);
            if (res.success) {
                toast.success(`"${title}" claimed successfully! Added to your library.`);
                navigate('/library');
            } else {
                throw new Error(res.message || "Failed to claim resource");
            }
        } catch (error) {
            console.error("Claim error:", error);
            toast.error(error.message || "Could not claim free resource");
        } finally {
            setClaimingId(null);
        }
    };

    const filtered = products.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.state && p.state.toLowerCase().includes(search.toLowerCase())) ||
        (p.district && p.district.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-ivory-light">
            {/* Header */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white py-16 border-b border-gold/15 px-6">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                
                <div className="relative max-w-7xl mx-auto space-y-4">
                    <Breadcrumb items={[{ label: 'Free Resources', path: '/free-resources' }]} />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/20 text-gold text-[9px] font-bold tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> 100% Free Scholar Materials
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">Free Study Resources</h1>
                    <p className="text-white/60 text-xs sm:text-sm max-w-2xl leading-relaxed">
                        Claim permanent access to our curated collections, previous year question banks, model papers, and syllabus indices without paying a single rupee.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                {/* Search Bar */}
                <div className="max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                        <input
                            type="text"
                            placeholder="Search by title, state, district..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/15 bg-white text-xs font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/5 outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-20 text-xs font-extrabold uppercase tracking-widest text-emerald-dark/50">
                        Retrieving academic registry...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-emerald/5 p-12">
                        <BookOpen className="w-16 h-16 text-emerald-dark/10 mx-auto mb-4" />
                        <h3 className="text-lg font-serif font-bold text-emerald-dark mb-1">No Free Resources Found</h3>
                        <p className="text-xs text-emerald-dark/60">Please try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(product => (
                            <div key={product.id} className="card-premium bg-white border border-emerald/5 hover:border-gold/30 rounded-2xl overflow-hidden group flex flex-col justify-between h-[360px] relative">
                                <span className="absolute top-4 left-4 z-20 text-[9px] font-black uppercase bg-gold text-emerald-dark px-2.5 py-0.5 rounded-full shadow-md">
                                    FREE
                                </span>
                                
                                {/* Thumbnail */}
                                <div className="h-40 overflow-hidden relative bg-slate-900 border-b border-emerald/5">
                                    <img 
                                        src={product.previewUrl || "https://picsum.photos/400/250?random=free"} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center flex-wrap gap-1">
                                            <div className="flex gap-2 text-[8px] font-black uppercase text-gold">
                                                <span>{product.state || 'All India'}</span>
                                                {product.district && <span>· {product.district}</span>}
                                            </div>
                                            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getResourceBadge(product.contentType || product.type).color}`}>
                                                <span>{getResourceBadge(product.contentType || product.type).icon}</span> {getResourceBadge(product.contentType || product.type).text}
                                            </span>
                                        </div>
                                        <h3 className="font-serif font-bold text-emerald-dark text-sm group-hover:text-gold transition-colors line-clamp-2">
                                            {product.title}
                                        </h3>
                                    </div>

                                    {/* Claim CTA */}
                                    <div className="pt-4 border-t border-emerald/5 mt-4">
                                        <button
                                            onClick={() => handleClaim(product.id, product.title)}
                                            disabled={claimingId === product.id}
                                            className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                                        >
                                            {claimingId === product.id ? (
                                                <><div className="w-3.5 h-3.5 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Unlocking...</>
                                            ) : (
                                                <><CheckCircle className="w-3.5 h-3.5" /> Get Free Access</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreeResources;
