import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    ArrowRight, BookOpen, HelpCircle, CheckCircle, MapPin, 
    Award, Star, ChevronDown, Check, Globe, TrendingUp, Play, 
    Sparkles, ShieldCheck, Flame, Users, BookOpenCheck 
} from 'lucide-react';
import Logo from '../components/common/Logo';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';
import { API_BASE_URL } from '../utils/constants';

// ── Animated Counter Component ─────────────────────────────────────
const Counter = ({ target, suffix = '', duration = 1500 }) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            
            let start = 0;
            const step = Math.ceil(target / (duration / 16));
            const timer = setInterval(() => {
                start += step;
                if (start >= target) {
                    setCount(target);
                    clearInterval(timer);
                } else {
                    setCount(start);
                }
            }, 16);
        }, { threshold: 0.2 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return (
        <span ref={elementRef} className="font-serif">
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const Landing = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 5420,
        totalCourses: 18,
        totalEnrollments: 12480,
        totalBlogs: 24,
        totalStates: 36,
        totalNotes: 580,
        totalProducts: 48,
        totalPurchases: 3240,
    });

    const [activeFaq, setActiveFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 200);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Fetch real-time statistics if available
        fetch(`${API_BASE_URL}/auth/public-stats`)
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    setStats(prev => ({ ...prev, ...res.data }));
                }
            })
            .catch(err => console.error("Error loading public stats:", err));

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 2, minutes: 44, seconds: 12 };
            });
        }, 1000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
        };
    }, []);

    const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/register');

    // Live Purchase Ticker Data
    const livePurchases = [
        "Aspirant from Indore just purchased MPPSC Polity Notes (Prelims)",
        "Scholar from Jaipur enrolled in RAS Rajasthan GK Core Bundle",
        "Aspirant from Lucknow purchased UPPSC Mains Answer Writing Booster",
        "Scholar from Patna just bought BPSC Bihar GK Master PDF Guide",
        "Aspirant from Bengaluru unlocked KPSC General Studies MCQ Pack"
    ];

    const featuredStates = [
        { id: "bihar", name: "Bihar", exam: "BPSC", prepExplanation: "Comprehensive Bihar specific history, polity, and economic surveys.", notesCount: 18, videosCount: 42, aspirants: "4,820+", image: "https://picsum.photos/400/250?random=bpsc" },
        { id: "maharashtra", name: "Maharashtra", exam: "MPSC", prepExplanation: "Fully updated MPSC prelims & mains, Marathi bilingual syllabus coverage.", notesCount: 15, videosCount: 38, aspirants: "3,210+", image: "https://picsum.photos/400/250?random=mpsc" },
        { id: "rajasthan", name: "Rajasthan", exam: "RAS", prepExplanation: "Highly specialized local GK, history, culture, and science packages.", notesCount: 12, videosCount: 29, aspirants: "2,940+", image: "https://picsum.photos/400/250?random=ras" },
        { id: "uttar-pradesh", name: "Uttar Pradesh", exam: "UPPSC", prepExplanation: "Topper-annotated core GS guides, mains model answer writing modules.", notesCount: 22, videosCount: 56, aspirants: "6,130+", image: "https://picsum.photos/400/250?random=uppsc" }
    ];

    const popularNotes = [
        { title: "MPPSC General Studies Master Notes", state: "Madhya Pradesh", price: "₹299", discount: "40% OFF", rating: 4.9, sales: "1,240 sold", badge: "Bestseller" },
        { title: "Rajasthan History & Heritage (RAS)", state: "Rajasthan", price: "₹199", discount: "50% OFF", rating: 4.8, sales: "982 sold", badge: "Trending" },
        { title: "UPPSC Core Polity & Governance", state: "Uttar Pradesh", price: "₹349", discount: "30% OFF", rating: 4.9, sales: "1,520 sold", badge: "Bestseller" }
    ];

    const toppers = [
        { name: "Ananya Deshmukh", exam: "MPPSC 2024", rank: "Rank 3 (SDM)", quote: "BodhGanga's state-specific notes are exceptionally well-organized and mapped precisely to the latest syllabus. Absolute life-saver!" },
        { name: "Vikram Rathore", exam: "RAS 2023", rank: "Rank 11", quote: "The mock questions and historical geographical breakdown matching local GK questions helped me clear my exam on the first attempt." },
        { name: "Shruti Srivastava", exam: "UPPSC 2024", rank: "Rank 8 (DSP)", quote: "Mains answer writing strategy PDFs and structured regional polity guides are premium quality. Highly recommended!" }
    ];

    const faqs = [
        { q: "Are these notes aligned with the latest syllabus?", a: "Yes! All notes are compiled by top educators and former civil servants. They are updated dynamically for the latest state PSC and UPSC patterns." },
        { q: "Can I download and print the purchased study materials?", a: "Absolutely. Once purchased, you get permanent PDF access in your dashboard. You can read online, download, and print them for offline study." },
        { q: "Is there mock test support available on BodhGanga?", a: "Yes, our interactive question banks feature high-yield questions with detailed step-by-step explanatory models." },
        { q: "How do I access state-specific courses?", a: "Navigate to the 'States & UTs' portal, select your desired state or union territory, and explore maps, notes, playlists, and customized study packages." }
    ];

    return (
        <div className="min-h-screen bg-ivory-light overflow-x-hidden text-emerald-dark select-none relative font-sans">
            
            {/* ── LIVE SCARCITY TICKER ───────────────────────────────── */}
            <div className="bg-emerald-950 text-gold-glow border-b border-gold/15 py-2.5 px-4 overflow-hidden relative z-40 text-center">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                    </span>
                    <div className="h-5 overflow-hidden inline-block relative text-xs font-bold uppercase tracking-widest text-gold">
                        <div className="ticker-activity flex flex-col space-y-1">
                            {livePurchases.map((purchase, i) => (
                                <span key={i} className="h-5 block">{purchase}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── HERO BANNER SECTION ────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-light/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative w-full max-w-7xl mx-auto py-16 lg:py-24 z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-7 text-left space-y-8 animate-fade-in">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gold/20 backdrop-blur-md">
                                <Award className="w-4 h-4 text-gold" />
                                <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-gold" /> India's Premium PSC & UPSC Ecosystem
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl sm:text-6xl xl:text-7xl font-serif text-white font-bold leading-[1.1] tracking-tight">
                                    Where Knowledge <br />
                                    <span className="text-gradient-gold">Takes Root.</span>
                                </h1>
                                <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl font-medium">
                                    Empowering civil servants and administrative leaders with structured syllabi, hand-crafted PDF notes, and curated YouTube video playlists for all <strong className="text-gold">36 States and Union Territories</strong>.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    onClick={handleCTA}
                                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link 
                                    to="/states"
                                    className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                                >
                                    <Globe className="w-4 h-4 text-gold" />
                                    Explore 36 Regions
                                </Link>
                            </div>

                            {/* Trust signals */}
                            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/10 max-w-xl">
                                {[
                                    { label: 'Enrolled Scholars', value: <Counter target={stats.totalUsers * 4} suffix="+" /> },
                                    { label: 'Mapped Territories', value: <Counter target={36} suffix=" regions" /> },
                                    { label: 'High-Yield Notes', value: <Counter target={stats.totalNotes} suffix="+" /> },
                                ].map((b, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="text-xl sm:text-2xl font-bold text-white font-serif tracking-tight">{b.value}</div>
                                        <div className="text-[9px] text-gold font-bold uppercase tracking-widest">{b.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive UI Mockup */}
                        <div className="lg:col-span-5 hidden lg:block relative">
                            <div className="relative mx-auto w-[420px] bg-emerald-950/80 backdrop-blur-xl border border-gold/20 rounded-3xl p-8 shadow-2xl shadow-black/40 glow-emerald-card">
                                <div className="absolute -top-3.5 -right-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                                    LIVE PORTAL
                                </div>
                                <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/10">
                                    <Logo />
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📚</span>
                                            <div className="text-left">
                                                <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Premium Materials</p>
                                                <p className="text-xs font-serif font-bold text-white">UPPSC, BPSC, RAS, MPPSC Mapped</p>
                                            </div>
                                        </div>
                                        <ShieldCheck className="w-4 h-4 text-gold" />
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📹</span>
                                            <div className="text-left">
                                                <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Netflix-Style Player</p>
                                                <p className="text-xs font-serif font-bold text-white">Interactive State GK Playlists</p>
                                            </div>
                                        </div>
                                        <Play className="w-3.5 h-3.5 text-gold fill-gold" />
                                    </div>

                                    <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20 text-center">
                                        <div className="flex justify-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />)}
                                        </div>
                                        <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Trusted by 5,000+ aspirants nationwide</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ────────────────────────────────────────── */}
            <section className="bg-white border-b border-emerald/5 py-10 shadow-sm relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: <Counter target={stats.totalNotes} suffix="+" />, label: 'Exhaustive PDFs', icon: '📖' },
                            { value: <Counter target={stats.totalNotes * 6} suffix="+" />, label: 'Mock MCQs', icon: '❓' },
                            { value: <Counter target={36} />, label: 'Mapped Territories', icon: '🗺️' },
                            { value: <Counter target={stats.totalUsers * 4} suffix="+" />, label: 'Active Learners', icon: '🎓' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1">
                                <div className="text-2xl mb-1">{stat.icon}</div>
                                <div className="text-3xl font-extrabold text-emerald font-serif tracking-tight">{stat.value}</div>
                                <div className="text-[9px] text-emerald/60 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
 
            {/* ── TRUSTED BY ASPIRANTS BANNER ───────────────────────────── */}
            <div className="bg-emerald-950/95 py-6 border-b border-gold/15 overflow-hidden relative z-20">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest leading-none">TRUSTED BY ASPIRANTS NATIONWIDE IN EVERY MAJOR PSC STATE</p>
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2">
                        {['UPSC CSE', 'BPSC (BIHAR)', 'MPSC (MAHARASHTRA)', 'UPPSC (UTTAR PRADESH)', 'RAS (RAJASTHAN)', 'MPPSC (MADHYA PRADESH)', 'KPSC (KARNATAKA)'].map((p, idx) => (
                            <span key={idx} className="px-4 py-1.5 bg-white/5 border border-gold/10 hover:border-gold/30 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300">
                                🛡️ {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── BRANDS & BENEFITS ───────────────────────────────────── */}
            <section className="py-24 bg-ivory-light px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Flame className="w-3 h-3 text-gold fill-gold" /> Why Serious Aspirants Choose BodhGanga
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">Rigorous EdTech Architecture</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: MapPin, title: "All 36 Regions Mapped", desc: "No more hunting for local GK. We map history, geography, economy, and administrative dynamics for all 28 states and 8 UTs." },
                            { icon: BookOpenCheck, title: "Bilingual Premium Notes", desc: "Structured, syllabus-aligned PDF textbooks crafted by top civil services strategists, featuring crisp roadmaps and high-yield layouts." },
                            { icon: Users, title: "Cinematic Learning Ecosystem", desc: "Seamlessly integrates direct notes store, visual roadmap timelines, curated mock tests, and a Netflix-style YouTube video playlist hub." }
                        ].map((f, i) => (
                            <div key={i} className="card-premium bg-white p-8 flex flex-col group hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center mb-6 group-hover:bg-emerald group-hover:text-white transition-all duration-300 shadow-sm">
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-dark mb-3 font-serif tracking-tight">{f.title}</h3>
                                <p className="text-xs text-emerald-dark/60 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED STATES & UTS SHOWCASE ──────────────────────── */}
            <section className="py-24 bg-gradient-to-b from-emerald-950 to-slate-950 text-white px-6 relative overflow-hidden border-y border-gold/15">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                        <div className="text-left space-y-3">
                            <div className="inline-flex items-center gap-1.5 bg-gold/10 px-3 py-1 rounded-full border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" /> Regional Academic Portals
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-serif text-white font-bold leading-tight uppercase tracking-wide">
                                Featured <span className="text-gradient-gold">PSC Hubs</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                                Dedicated study rooms with micro-syllabi, topper roadmaps, regional questionnaires, and specialized video lecture libraries.
                            </p>
                        </div>
                        <Link 
                            to="/states" 
                            className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors"
                        >
                            Explore All 36 Regions <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredStates.map(state => (
                            <div key={state.id} className="card-premium relative bg-slate-900 border border-emerald-950/60 hover:border-gold/30 rounded-2xl overflow-hidden group flex flex-col justify-between h-[360px] glow-emerald-card">
                                {/* Thumbnail */}
                                <div className="h-40 overflow-hidden relative border-b border-emerald-950/60">
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors z-10" />
                                    <img 
                                        src={state.image} 
                                        alt={state.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    />
                                    <span className="absolute top-4 left-4 z-20 text-[10px] font-black uppercase bg-gold text-emerald-dark px-3 py-1 rounded-full shadow-md">
                                        {state.exam} Exam
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <h3 className="font-serif font-bold text-white text-lg group-hover:text-gold transition-colors">
                                            {state.name} Civil Services
                                        </h3>
                                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                            {state.prepExplanation}
                                        </p>
                                    </div>

                                    {/* Stats & CTA */}
                                    <div className="pt-4 border-t border-emerald-950 mt-4">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-4">
                                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gold" /> {state.notesCount} Books</span>
                                            <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" /> {state.videosCount} Lectures</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/states/${state.id}`)}
                                            className="w-full py-2 bg-slate-800 hover:bg-gradient-to-r hover:from-gold hover:to-gold-dark text-slate-200 hover:text-emerald-dark font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 border border-emerald-900/40"
                                        >
                                            Enter Portal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── YOUTUBE PREVIEW SHOWCASE ──────────────────────────────── */}
            <section className="py-24 bg-slate-950 border-b border-gold/15 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-emerald-light/5 rounded-full blur-[140px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-gold fill-gold" /> Cinema Hall Lectures
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white leading-tight">
                            Netflix-Style <span className="text-gradient-gold">Lecture Showcase</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-medium">
                            Preview our ultra-premium high-production UPSC & State PSC syllabus courses. Click to start learning instantly in cinema-grade definition.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { 
                                id: "vid1", 
                                title: "UPSC & State PSC Strategy: Crack local GK & Current Affairs", 
                                duration: "42:15", 
                                views: "124K views",
                                category: "UPSC GS CORE",
                                thumbnail: "https://img.youtube.com/vi/W4rR48C6B14/maxresdefault.jpg", 
                                youtubeUrl: "https://www.youtube.com/embed/W4rR48C6B14" 
                            },
                            { 
                                id: "vid2", 
                                title: "State PSC Art, Heritage, Geography and Resources Master Class", 
                                duration: "1:24:10", 
                                views: "86K views",
                                category: "STATE GK",
                                thumbnail: "https://img.youtube.com/vi/P1u4QG2x6y4/maxresdefault.jpg", 
                                youtubeUrl: "https://www.youtube.com/embed/P1u4QG2x6y4" 
                            },
                            { 
                                id: "vid3", 
                                title: "UPSC/PSC Mains Solved PYQ - High-Yield Answer Structure Blueprint", 
                                duration: "56:30", 
                                views: "98K views",
                                category: "MAINS WRITING",
                                thumbnail: "https://img.youtube.com/vi/6p9N0_m59mI/maxresdefault.jpg", 
                                youtubeUrl: "https://www.youtube.com/embed/6p9N0_m59mI" 
                            }
                        ].map((video) => (
                            <div 
                                key={video.id} 
                                className="netflix-card shadow-2xl hover:scale-[1.03] transition-all duration-500 relative group border border-gold/10 hover:border-gold/30 rounded-2xl overflow-hidden glow-emerald-card aspect-video h-auto"
                                onClick={() => setSelectedVideo(video)}
                            >
                                <img 
                                    src={video.thumbnail} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover group-hover:brightness-[0.7] group-hover:scale-105 transition-all duration-700"
                                />
                                
                                <span className="absolute top-4 left-4 z-20 text-[8px] font-black uppercase bg-gold text-emerald-dark px-2.5 py-0.5 rounded-md tracking-wider">
                                    {video.category}
                                </span>

                                <span className="absolute bottom-3 right-3 text-[8px] font-extrabold uppercase px-2 py-0.5 bg-black/80 rounded tracking-widest text-white z-20">
                                    {video.duration}
                                </span>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gold/90 text-emerald-dark rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-125 pointer-events-none z-20">
                                    <Play className="w-6 h-6 fill-emerald-dark text-emerald-dark ml-1" />
                                </div>

                                <div className="netflix-card-overlay text-left p-6">
                                    <h4 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide line-clamp-2 mb-1 group-hover:text-gold transition-colors">
                                        {video.title}
                                    </h4>
                                    <p className="text-[9px] text-gold font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                        <Users className="w-3 h-3 text-gold" /> {video.views} · High Rating
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BESTSELLERS STUDY NOTES SHELF ───────────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
                        <div className="text-left space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Premium Notes Store</span>
                            <h2 className="text-3xl font-bold font-serif text-emerald-dark">Trending Study Packages</h2>
                        </div>
                        <Link to="/store" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald hover:text-gold transition-colors">
                            Browse Bookstore <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {popularNotes.map((note, i) => (
                            <div key={i} className="card-premium bg-ivory-light border border-emerald/5 p-6 flex flex-col relative group">
                                <span className="absolute top-4 right-4 bg-emerald-dark text-gold font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-gold/15">
                                    {note.badge}
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center mb-4">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h3 className="font-serif font-bold text-emerald-dark text-base leading-snug mb-2 group-hover:text-emerald transition-colors">
                                    {note.title}
                                </h3>
                                <p className="text-[10px] text-emerald-dark/50 uppercase tracking-widest font-bold mb-4">{note.state} Category</p>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-0.5 text-gold">
                                        {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                                    </div>
                                    <span className="text-[10px] text-emerald-dark/60 font-bold">{note.rating} ({note.sales})</span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald/5 mt-auto">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl font-bold text-emerald-dark">{note.price}</span>
                                        <span className="text-[9px] text-emerald font-extrabold tracking-wider bg-emerald/10 px-2 py-0.5 rounded uppercase">{note.discount}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/store')}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-800 hover:to-emerald text-white text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TOPPERS & SOCIAL VALIDATION ──────────────────────────── */}
            <section className="py-24 bg-gradient-to-b from-ivory to-white px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Toppers Gallery</span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">Trusted by Civil Service Rankers</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {toppers.map((t, i) => (
                            <div key={i} className="card-premium bg-white p-8 flex flex-col justify-between hover:shadow-xl transition-all">
                                <div className="space-y-4">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-gold fill-gold" />)}
                                    </div>
                                    <p className="text-emerald-dark/80 text-xs italic leading-relaxed font-semibold">"{t.quote}"</p>
                                </div>
                                <div className="flex items-center gap-4.5 pt-6 border-t border-emerald/5 mt-8">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald to-emerald-dark rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                                        {t.name[0]}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-emerald-dark text-xs">{t.name}</div>
                                        <div className="text-[9px] text-gold font-bold uppercase tracking-wider mt-0.5">{t.exam} · {t.rank}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ SECTION ────────────────────────────────────────── */}
            <section className="py-24 bg-ivory-light px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Support Portal</span>
                        <h2 className="text-3xl font-bold font-serif text-emerald-dark">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="card-premium bg-white p-5 cursor-pointer transition-all duration-300"
                                onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-serif font-bold text-sm text-emerald-dark pr-6">{faq.q}</h3>
                                    <ChevronDown className={`w-4 h-4 text-emerald/60 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                                </div>
                                {activeFaq === i && (
                                    <p className="text-xs text-emerald-dark/70 font-semibold leading-relaxed mt-4 pt-4 border-t border-emerald/5 animate-fade-in">
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER HERO CTA ────────────────────────────────────── */}
            <section className="py-24 bg-emerald-dark relative overflow-hidden px-6 text-center border-t border-gold/15 mb-16 md:mb-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[130px] pointer-events-none" />
                
                <div className="relative max-w-4xl mx-auto space-y-8 z-10">
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white font-serif leading-tight">
                        Begin Your Modern Learning Path
                    </h2>
                    <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto font-medium">
                        Join over <strong className="text-gold">5,400+ serious aspirants</strong> utilizing BodhGanga Academy resources to master regional civil service examinations.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button 
                            onClick={handleCTA}
                            className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link 
                            to="/states"
                            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                        >
                            <Globe className="w-4 h-4 text-gold" />
                            Browse State Catalogs
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── STICKY FOOTER ACTION BUTTON BAR ────────────────────── */}
            {scrolled && (
                <div className="sticky-cta-bar flex items-center justify-between animate-fade-in block md:hidden z-[9999]">
                    <div className="text-left pr-4">
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">BodhGanga Academy</p>
                        <p className="text-xs font-serif font-bold text-white">Start preparation today</p>
                    </div>
                    <button 
                        onClick={handleCTA}
                        className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
                    >
                        Enroll Now
                    </button>
                </div>
            )}

            {/* ── VIDEO PLAYER MODAL ────────────────────────────────────── */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-4xl bg-emerald-950 border border-gold/30 rounded-3xl overflow-hidden shadow-2xl">
                        <button 
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 bg-emerald/10 hover:bg-emerald/30 border border-gold/30 text-white font-bold px-3 py-1 rounded-full text-xs uppercase z-[10000]"
                        >
                            ✕ Close
                        </button>
                        
                        <div className="aspect-video w-full">
                            <iframe 
                                className="w-full h-full"
                                src={selectedVideo.youtubeUrl}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        
                        <div className="p-6 text-left space-y-2">
                            <span className="text-[8px] text-gold font-bold uppercase tracking-widest">{selectedVideo.category}</span>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug pr-12">{selectedVideo.title}</h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;
