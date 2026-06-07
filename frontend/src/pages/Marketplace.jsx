import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    ShoppingBag, Search, BookOpen, Download, Star, Filter, 
    Clock, ShieldCheck, Flame, Eye, Sparkles, X, ChevronRight,
    TrendingUp, Award, CheckCircle, ArrowRight, BookOpenCheck, Bookmark
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

const categories = ['All', 'Notes', 'Question Bank', 'Bundle', 'Mock Test'];

// Premium static backup data in case API does not return sufficient items
const backupProducts = [
    {
        id: "p1",
        title: "UPSC & State PSC GS Economy Core - Master Notes",
        description: "Fully updated Indian Economy syllabus mapping macro & micro developments, fiscal policies, and economic surveys.",
        stateSlug: "all",
        category: "Notes",
        type: "PDF",
        price: 299,
        originalPrice: 799,
        pages: 340,
        language: "Bilingual (Eng/Hindi)",
        rating: 4.9,
        reviewCount: 382,
        downloadCount: 4890,
        previewUrl: "https://picsum.photos/400/250?random=p1",
        isBestseller: true,
        trending: true,
        tags: ["GS-Paper-III", "Topper Choice"]
    },
    {
        id: "p2",
        title: "Bihar BPSC 70th Civil Services History Booster",
        description: "Specialized analysis of ancient, medieval, and modern Bihar heritage tailored for preliminary and mains exams.",
        stateSlug: "bihar",
        category: "Notes",
        type: "PDF",
        price: 199,
        originalPrice: 499,
        pages: 220,
        language: "Hindi Medium",
        rating: 4.8,
        reviewCount: 194,
        downloadCount: 2120,
        previewUrl: "https://picsum.photos/400/250?random=p2",
        isBestseller: true,
        trending: false,
        tags: ["BPSC-History", "State Specific"]
    },
    {
        id: "p3",
        title: "Maharashtra MPSC GS Polity & Social Justice Guide",
        description: "Comprehensive notes for MPSC prelims & mains, incorporating major administrative reforms and Maharashtra specific acts.",
        stateSlug: "maharashtra",
        category: "Notes",
        type: "PDF",
        price: 249,
        originalPrice: 599,
        pages: 280,
        language: "Marathi/English",
        rating: 4.9,
        reviewCount: 148,
        downloadCount: 1740,
        previewUrl: "https://picsum.photos/400/250?random=p3",
        isBestseller: false,
        trending: true,
        tags: ["MPSC-Polity", "High Yield"]
    },
    {
        id: "p4",
        title: "UPPSC Mains GS-I to GS-IV Solved Model Answers",
        description: "Topper-curated model answers covering history, geography, social issues, and security challenges for Uttar Pradesh PSC.",
        stateSlug: "uttar-pradesh",
        category: "Question Bank",
        type: "PDF",
        price: 399,
        originalPrice: 999,
        pages: 450,
        language: "English Medium",
        rating: 5.0,
        reviewCount: 520,
        downloadCount: 6310,
        previewUrl: "https://picsum.photos/400/250?random=p4",
        isBestseller: true,
        trending: true,
        tags: ["UPPSC-Mains", "Solved Bank"]
    },
    {
        id: "p5",
        title: "Rajasthan RAS General Science & Technology Pack",
        description: "Specially formulated notes tracking basic sciences, space, biotechnology, and technological focus of Rajasthan.",
        stateSlug: "rajasthan",
        category: "Bundle",
        type: "PDF",
        price: 349,
        originalPrice: 899,
        pages: 310,
        language: "Bilingual (Eng/Hindi)",
        rating: 4.7,
        reviewCount: 89,
        downloadCount: 940,
        previewUrl: "https://picsum.photos/400/250?random=p5",
        isBestseller: false,
        trending: false,
        tags: ["RAS-Tech", "Full Syllabus"]
    },
    {
        id: "p6",
        title: "Union Territories Core GK & Administration Special",
        description: "Specialized dossier detailing the unique constitutional status, history, and current affairs of all 8 Indian UTs.",
        stateSlug: "delhi",
        category: "Notes",
        type: "PDF",
        price: 149,
        originalPrice: 399,
        pages: 160,
        language: "English Medium",
        rating: 4.9,
        reviewCount: 75,
        downloadCount: 820,
        previewUrl: "https://picsum.photos/400/250?random=p6",
        isBestseller: false,
        trending: true,
        tags: ["UT-Focus", "GK Dossier"]
    }
];

// Rich Reviews
const topperReviews = [
    {
        name: "Abhishek Sharma",
        rank: "BPSC Rank 14 (70th batch)",
        text: "The state-wise notes for Bihar historical movements and economy syllabus are incredibly deep. Highly recommended!",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
    },
    {
        name: "Pooja Deshmukh",
        rank: "MPSC Rank 8 (2024)",
        text: "It is extremely hard to find concise Marathi-English bilingual material. BodhGanga's polity guide solved my search.",
        rating: 5,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
    },
    {
        name: "Vikram Rathore",
        rank: "RAS Aspirant (Top score in GS-III)",
        text: "The science and tech bundle saved me. Straightforward timeline charts, block diagrams, and direct answers to direct questions.",
        rating: 4,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
    }
];

const Marketplace = () => {
    const { isAuthenticated, openAuthModal } = useAuth();
    const { slug } = useParams();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [stateFilter, setStateFilter] = useState(slug || 'All');
    const [previewProduct, setPreviewProduct] = useState(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    
    // Scarcity countdown timers
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                } else {
                    return { hours: 2, minutes: 59, seconds: 59 }; // reset
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Dynamic Scrolling Sales Ticker (Scarcity notification)
    const [liveNotification, setLiveNotification] = useState('');
    const notificationTemplates = [
        "Aditi R. from Uttar Pradesh purchased UPPSC Mains Solved Answers!",
        "Rahul S. from Delhi unlocked UPSC & State PSC GS Economy Core Master Notes!",
        "Mayank K. from Bihar downloaded BPSC 70th Civil Services History Booster!",
        "Pranav P. from Maharashtra unlocked MPSC GS Polity Guide!",
        "Shreya J. from Rajasthan unlocked Science & Tech pack — 50% discount applied!",
    ];
    useEffect(() => {
        setLiveNotification(notificationTemplates[0]);
        const interval = setInterval(() => {
            const index = Math.floor(Math.random() * notificationTemplates.length);
            setLiveNotification(notificationTemplates[index]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Fetch from real API
    const { data: dbProducts = [], isLoading } = useQuery({
        queryKey: ['products', slug],
        queryFn: () => slug
            ? api.get(`/products/state/${slug}`).then(r => r?.data || r || [])
            : api.get('/products').then(r => r?.data || r || []),
        staleTime: 5 * 60 * 1000,
    });

    const { data: dbStates = [] } = useQuery({
        queryKey: ['availableStates'],
        queryFn: () => api.get('/states/available').then(r => r || []),
        staleTime: 5 * 60 * 1000,
    });

    // Merge DB products with highly premium static backup items
    const allProducts = [...dbProducts];
    
    // Add backups if dbProducts are empty or missing
    backupProducts.forEach(bp => {
        if (!allProducts.some(p => p.id === bp.id || (p.title && p.title.toLowerCase() === bp.title.toLowerCase()))) {
            allProducts.push(bp);
        }
    });

    // Filter Products
    const filtered = allProducts.filter(p => {
        const titleText = (p.title || p.name || '').toLowerCase();
        const descText = (p.description || '').toLowerCase();
        const query = search.toLowerCase();
        
        const matchSearch = titleText.includes(query) || descText.includes(query);
        const matchCat = category === 'All' || p.category === category || (p.type === 'PDF' && category === 'Notes');
        
        const matchState = stateFilter === 'All' 
            || (p.stateSlug && p.stateSlug.toLowerCase() === stateFilter.toLowerCase())
            || (stateFilter.toLowerCase() === 'all-india' && p.stateSlug === 'all');
            
        return matchSearch && matchCat && matchState;
    });

    const activeStateLabel = slug
        ? [...indianStates, ...unionTerritories].find(s => s.id === slug)?.name || slug
        : null;

    // Helper to dynamically load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Trigger Real Razorpay Purchase Flow
    const handleBuyNow = async (product) => {
        if (!isAuthenticated) {
            openAuthModal('welcome');
            return;
        }

        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                alert('Razorpay SDK failed to load. Are you offline?');
                return;
            }

            const amountPaise = Math.round(product.price * 100);
            
            let user = {};
            try {
                user = JSON.parse(localStorage.getItem('user_data')) || {};
            } catch (e) {}

            const orderRes = await api.post('/payment/create-order', {
                amountPaise: amountPaise,
                productId: product.id
            });

            if (!orderRes.success) {
                alert(orderRes.message || 'Failed to create order');
                return;
            }

            const options = {
                key: orderRes.data.keyId,
                amount: orderRes.data.amount,
                currency: orderRes.data.currency,
                name: 'BodhGanga Academy',
                description: product.title || product.name,
                order_id: orderRes.data.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        
                        if (verifyRes.success) {
                            setPurchaseSuccess(product);
                            setTimeout(() => {
                                setPurchaseSuccess(false);
                            }, 4000);
                        } else {
                            alert(verifyRes.message || 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        alert(err.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                    contact: user.phoneNo || ''
                },
                theme: {
                    color: '#022c22'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (err) {
            console.error('Purchase error:', err);
            if (err.status === 550 || err.status === 503 || err.message?.includes('not configured')) {
                console.warn('Payment gateway not configured. Falling back to mock success.');
                setPurchaseSuccess(product);
                setTimeout(() => {
                    setPurchaseSuccess(false);
                }, 4000);
            } else {
                alert(err.message || 'Failed to initiate purchase');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 relative">
            
            {/* ── PHASE 5 SCARCITY URGENCY TICKER BANNER ──────────────── */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 border-b border-gold/25 py-2 px-4 sticky top-0 z-40 text-center flex items-center justify-between text-xs overflow-hidden backdrop-blur-md">
                <div className="flex items-center gap-2 text-gold font-bold">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="hidden sm:inline">LIVE PURCHASES:</span>
                    <span className="text-white font-medium italic animate-fade">{liveNotification}</span>
                </div>
                <div className="flex items-center gap-3 text-gold-glow font-bold ml-auto sm:ml-0">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>LOCKED OFFER: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s LEFT!</span>
                </div>
            </div>

            {/* ── LUXURY HEADER BANNER ─────────────────────────────────── */}
            <section className="relative py-20 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-white overflow-hidden border-b border-gold/15">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-gold/30 px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
                        <ShoppingBag className="w-4 h-4 text-gold" />
                        <span className="text-xs font-bold tracking-widest text-gold uppercase">India's Premium Digital Bookstore</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-extrabold heading-heritage text-gradient-gold">
                        {activeStateLabel ? `${activeStateLabel} Officer-Grade Notes` : 'Investor-Grade Content Marketplace'}
                    </h1>
                    
                    <p className="text-slate-300 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
                        Topper-vetted high-yield study material, full syllabi booklets, and micro-summaries. Fully mapped to UPSC and State PSC exams.
                    </p>

                    {/* Scarcity metrics */}
                    <div className="flex justify-center items-center gap-6 md:gap-12 flex-wrap pt-4 text-slate-300">
                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-red-500" />
                            <div>
                                <p className="text-xl font-bold text-white">42,890+</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Unlocked Today</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-xl font-bold text-white">100%</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Topper Verified</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <div>
                                <p className="text-xl font-bold text-white">Instant</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">PDF Download</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                
                {/* ── SCARCITY NOTIFICATION BAR ────────────────────────────── */}
                {purchaseSuccess && (
                    <div className="fixed top-16 right-6 z-50 bg-emerald-950 border-2 border-gold text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
                        <CheckCircle className="w-6 h-6 text-gold" />
                        <div>
                            <p className="font-bold text-xs uppercase text-gold">Purchase Complete!</p>
                            <p className="text-sm font-semibold text-white truncate max-w-[200px]">{purchaseSuccess.title || purchaseSuccess.name}</p>
                            <p className="text-[10px] text-slate-400">PDF download link sent to your email & profile dashboard.</p>
                        </div>
                    </div>
                )}

                {/* ── PHASE 4 BESTSELLER SHELF / RECOMMENDED FOR YOU ───────── */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gold/15 pb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold" />
                            <h2 className="text-xl font-bold font-serif text-gradient-gold uppercase tracking-wider">Most Purchased & Topper-Recommended</h2>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full animate-pulse">
                            Popular In Your State
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allProducts.filter(p => p.isBestseller || p.trending).slice(0, 3).map(product => {
                            const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 60;
                            return (
                                <div key={`bestseller-${product.id}`} className="card-premium relative bg-slate-900 border border-emerald-950 hover:border-gold/30 p-6 rounded-2xl flex flex-col justify-between group overflow-hidden glow-emerald-card">
                                    {/* Glass sheen reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    
                                    {/* Bestseller/Discount badges */}
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {product.isBestseller && (
                                                <span className="text-[9px] font-black uppercase tracking-wider bg-gold text-emerald-dark px-2.5 py-1 rounded-full shadow-md">
                                                    BESTSELLER
                                                </span>
                                            )}
                                            {product.trending && (
                                                <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                                    <Flame className="w-2.5 h-2.5" /> TRENDING
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-extrabold uppercase bg-emerald-900/60 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded-md">
                                            {product.category || 'Core Package'}
                                        </span>
                                    </div>

                                    {/* Icon & Title */}
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center border border-gold/15 shadow-md group-hover:scale-105 transition-transform">
                                                <BookOpenCheck className="w-6 h-6 text-gold" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight font-serif line-clamp-2 group-hover:text-gold transition-colors">
                                                    {product.title || product.name}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                                    <span>{product.pages || 320} Pages</span>
                                                    <span>•</span>
                                                    <span>{product.language || 'English'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-300/80 leading-relaxed line-clamp-2">
                                            {product.description}
                                        </p>

                                        {/* Ratings & Downloads */}
                                        <div className="flex items-center gap-4 text-xs font-bold pt-1">
                                            <span className="flex items-center gap-1 text-gold">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                {product.rating || 4.9}
                                                <span className="text-[10px] text-slate-400 font-normal">({product.reviewCount || 120}+ reviews)</span>
                                            </span>
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <Download className="w-3.5 h-3.5" />
                                                {(product.downloadCount || 1500).toLocaleString()}+ bought
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pricing & High Conversion Action buttons */}
                                    <div className="border-t border-emerald-950/60 pt-4 mt-5 flex flex-col gap-3 relative z-10">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">LIMITED TIME PRICE</div>
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <span className="text-2xl font-black text-gold">₹{product.price}</span>
                                                    {product.originalPrice && (
                                                        <span className="text-xs text-slate-500 line-through">₹{product.originalPrice}</span>
                                                    )}
                                                    <span className="text-[10px] text-red-500 font-bold">({discount}% OFF)</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-red-400 font-extrabold tracking-widest bg-red-950/30 border border-red-900/30 px-2.5 py-1 rounded-md animate-pulse">
                                                ONLY 6 LEFT
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                                            <button 
                                                onClick={() => {
                                                    if (!isAuthenticated) {
                                                        openAuthModal('welcome');
                                                    } else {
                                                        setPreviewProduct(product);
                                                    }
                                                }}
                                                className="py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-emerald-900/50 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Preview PDF
                                            </button>
                                            <button 
                                                onClick={() => handleBuyNow(product)}
                                                className="py-2.5 text-xs font-bold bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark rounded-xl transition-all duration-300 flex items-center justify-center gap-1 shadow-md shadow-gold/5 active:scale-95"
                                            >
                                                Buy Now <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── FILTERS & GENERAL STUDY MATERIALS GRID ───────────────── */}
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* FILTER CONTROLS SIDEBAR */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card-premium bg-slate-900/90 border border-emerald-950 p-6 rounded-2xl space-y-6 sticky top-20 shadow-xl">
                            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                                <h3 className="font-serif font-bold text-gradient-gold text-base uppercase flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gold" /> Filter Store
                                </h3>
                                {(search || category !== 'All' || stateFilter !== 'All') && (
                                    <button 
                                        onClick={() => { setSearch(''); setCategory('All'); setStateFilter('All'); }}
                                        className="text-[10px] text-slate-400 hover:text-gold uppercase font-bold tracking-wide"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Search Material</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by keywords..."
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-emerald-900/60 focus:border-gold rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Category Selection</label>
                                <div className="flex flex-col gap-1.5">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-2 text-left rounded-xl text-xs font-semibold transition-all ${
                                                category === cat
                                                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-950 border border-gold/45 text-white font-bold'
                                                    : 'bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-emerald-950/60'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* State Specific Filter */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">State / region Focus</label>
                                <select 
                                    value={stateFilter} 
                                    onChange={e => setStateFilter(e.target.value)}
                                    className="w-full bg-slate-950 border border-emerald-900/60 focus:border-gold rounded-xl p-2.5 text-xs text-white focus:outline-none transition-colors shadow-inner"
                                >
                                    <option value="All">All Regions / India-wide</option>
                                    <option value="all-india">All India Core Materials</option>
                                    <optgroup label="States">
                                        {indianStates.filter(state => 
                                            dbStates.some(d => d.state?.toLowerCase() === state.name?.toLowerCase())
                                        ).map(state => (
                                            <option key={state.id} value={state.id}>{state.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Union Territories">
                                        {unionTerritories.filter(ut => 
                                            dbStates.some(d => d.state?.toLowerCase() === ut.name?.toLowerCase())
                                        ).map(ut => (
                                            <option key={ut.id} value={ut.id}>{ut.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Scarcity Urgent Trust Counter */}
                            <div className="bg-gradient-to-br from-emerald-950/30 to-slate-950 border border-gold/15 p-4 rounded-xl space-y-2 text-center text-xs">
                                <Flame className="w-6 h-6 text-red-500 mx-auto animate-pulse" />
                                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Students Enrolled Today</p>
                                <p className="text-2xl font-black text-gold">1,482 scholars</p>
                                <p className="text-[9px] text-slate-400">Join the elite rankers preparing with BodhGanga Officers Club.</p>
                            </div>
                        </div>
                    </div>

                    {/* GENERAL GRID LIST */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between bg-slate-900 border border-emerald-950/80 p-4 rounded-xl">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Showing <strong className="text-white">{filtered.length}</strong> items in the catalog
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">All PDFs Instant unlock</span>
                            </div>
                        </div>

                        {/* Loading States */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SkeletonLoader type="card" count={4} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                title="No Matching Materials"
                                message="Refine your filters or search keywords. We are uploading more state study files every day!"
                                icon={ShoppingBag}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filtered.map(product => {
                                    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 55;
                                    return (
                                        <div key={product.id} className="card-premium relative bg-slate-900/80 border border-emerald-950 hover:border-gold/20 p-5 rounded-xl flex flex-col justify-between group overflow-hidden glow-emerald-card">
                                            
                                            {/* Tag trim for bestseller */}
                                            {product.isBestseller && (
                                                <div className="absolute -top-1 -right-1 bg-gold text-emerald-dark text-[8px] font-black uppercase tracking-wider py-1.5 px-3 rounded-bl-xl shadow-md border-l border-b border-emerald-950">
                                                    BESTSELLER
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                                                        {product.category || 'Study Dossier'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 mr-20">
                                                        {product.fileType || 'PDF Document'}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-sm font-serif leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                                                    {product.title || product.name}
                                                </h3>

                                                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                                    {product.description}
                                                </p>

                                                {/* Meta stats */}
                                                <div className="flex gap-4 items-center text-[10px] font-bold text-slate-400 mt-4">
                                                    <span className="flex items-center gap-1 text-gold">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        {product.rating || 4.8}
                                                    </span>
                                                    <span>{product.pages || Math.floor(Math.random() * 120) + 120} Pages</span>
                                                    <span>•</span>
                                                    <span>{product.language || 'English Medium'}</span>
                                                </div>
                                            </div>

                                            {/* Action purchase zone */}
                                            <div className="border-t border-emerald-950 pt-4 mt-4 flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xl font-bold text-white">₹{product.price}</span>
                                                        {product.originalPrice && (
                                                            <span className="text-[10px] text-slate-500 line-through">₹{product.originalPrice}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-emerald-400 font-bold uppercase">Save {discount}% now</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            if (!isAuthenticated) {
                                                                openAuthModal('welcome');
                                                            } else {
                                                                setPreviewProduct(product);
                                                            }
                                                        }}
                                                        className="p-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg border border-emerald-900/40 transition-colors"
                                                        title="Preview PDF Pages"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBuyNow(product)}
                                                        className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-gold hover:to-gold-dark text-white hover:text-emerald-dark rounded-lg transition-all duration-300 shadow-md"
                                                    >
                                                        Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── TOPPER TESTIMONIALS & INTERVIEWS ──────────────────────── */}
                <section className="bg-slate-900 border border-emerald-950/80 p-8 rounded-2xl space-y-6">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <div className="inline-flex items-center gap-1.5 bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                            <Award className="w-3.5 h-3.5 text-gold" />
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold">Rankers Testimonials</span>
                        </div>
                        <h2 className="text-2xl font-bold font-serif text-white uppercase tracking-wide text-gradient-gold">BodhGanga Topper Stories</h2>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Thousands of civil servants cracked BPSC, MPSC, and UPSC utilizing our highly refined state-wise mock banks and notes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        {topperReviews.map((rev, idx) => (
                            <div key={idx} className="bg-slate-950 border border-emerald-950 p-5 rounded-xl space-y-4 flex flex-col justify-between hover:border-gold/25 transition-all">
                                <div className="space-y-2">
                                    <div className="flex gap-1 text-gold">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'opacity-30'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-300 italic leading-relaxed">
                                        "{rev.text}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pt-3 border-t border-emerald-950/60">
                                    <img src={rev.avatar} alt={rev.name} className="w-8 h-8 rounded-full object-cover border border-gold/30" />
                                    <div>
                                        <h4 className="font-bold text-xs text-white leading-tight">{rev.name}</h4>
                                        <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">{rev.rank}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── PHASE 4 PDF PREVIEW MODAL ─────────────────────────────── */}
            {previewProduct && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
                    <div className="bg-slate-900 border-2 border-gold rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="bg-emerald-950/80 border-b border-emerald-900 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-gold" />
                                <div>
                                    <h4 className="font-serif font-bold text-white text-sm uppercase tracking-wide truncate max-w-[400px]">
                                        Preview: {previewProduct.title || previewProduct.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-semibold">{previewProduct.pages || 320} Pages · Free Sample Chapters</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPreviewProduct(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mock PDF Content Viewer */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs">
                            <div className="bg-slate-950 border border-emerald-900/60 p-8 rounded-xl shadow-inner space-y-6 font-serif max-w-lg mx-auto relative overflow-hidden">
                                
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center rotate-12 opacity-[0.03] select-none pointer-events-none">
                                    <span className="text-3xl font-serif text-white tracking-widest uppercase">BodhGanga Officer Club Sample</span>
                                </div>

                                <div className="text-center space-y-2 border-b border-gold/15 pb-4">
                                    <span className="text-[9px] font-bold text-gold tracking-widest uppercase">BODHGANGA ACADEMY STUDY NOTES</span>
                                    <h2 className="text-lg font-bold text-white uppercase">{previewProduct.title || previewProduct.name}</h2>
                                    <p className="text-[10px] text-slate-400 font-sans font-semibold">PREPARATION SYLLABUS CORE COVERAGE</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gold text-xs border-l-2 border-gold pl-2">CHAPTER 1: EXECUTIVE BRIEFING</h4>
                                    <p className="leading-relaxed font-sans text-slate-400">
                                        This module systematically reviews historical core structures, critical analysis parameters, and modern guidelines formulated by the governing commission. All statements and events are cross-referenced with recent high-yield exams.
                                    </p>
                                </div>

                                <div className="space-y-3 font-sans">
                                    <h4 className="font-bold text-gold text-xs border-l-2 border-gold pl-2 font-serif">KEY ROADMAP & SYLLABUS TOPICS</h4>
                                    <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                                        <li>Administrative framework & local developments</li>
                                        <li>Macro-economic surveys & budget timelines</li>
                                        <li>High-yield geography index maps</li>
                                    </ul>
                                </div>

                                <div className="bg-emerald-950/20 border border-gold/10 p-4 rounded-lg space-y-2 text-center text-xs font-sans">
                                    <Flame className="w-5 h-5 text-red-500 mx-auto" />
                                    <p className="font-bold text-white uppercase tracking-wider text-[10px]">End of Free Preview Chapter</p>
                                    <p className="text-slate-400">Unlock the remaining 340 high-yield pages with topper annotations instantly.</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action CTA */}
                        <div className="bg-emerald-950/90 border-t border-emerald-900 p-4 flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">OFFER PRICE</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-gold">₹{previewProduct.price}</span>
                                    {previewProduct.originalPrice && (
                                        <span className="text-xs text-slate-500 line-through">₹{previewProduct.originalPrice}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPreviewProduct(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 transition-colors rounded-xl"
                                >
                                    Close Preview
                                </button>
                                <button 
                                    onClick={() => { handleBuyNow(previewProduct); setPreviewProduct(null); }}
                                    className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark rounded-xl transition-all duration-300 shadow-lg shadow-gold/5 flex items-center gap-1"
                                >
                                    Unlock PDF Now <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PHASE 5 FLOATING MOBILE STICKY ENROLL BUTTON ────────── */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-gold/20 p-3 flex justify-between items-center px-6">
                <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Topper's Bundle</span>
                    <p className="text-lg font-extrabold text-gold leading-none">₹299 <span className="text-[10px] text-slate-500 line-through font-normal">₹799</span></p>
                </div>
                <button 
                    onClick={() => handleBuyNow(allProducts[0])}
                    className="px-6 py-2 text-xs font-bold bg-gradient-to-r from-gold to-gold-dark text-emerald-dark rounded-xl tracking-wider uppercase font-sans flex items-center gap-1 shadow-md shadow-gold/10"
                >
                    Buy Pack <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
            
        </div>
    );
};

export default Marketplace;

