import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, BookOpen, HelpCircle, CheckCircle, MapPin, Award, Star, ChevronDown, Check, Globe } from 'lucide-react';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

import Logo from '../components/common/Logo';

// ── Animated counter hook ─────────────────────────────────────────
const useCounter = (target, duration = 1800) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            let start = 0;
            const step = target / (duration / 16);
            const timer = setInterval(() => {
                start += step;
                if (start >= target) { setCount(target); clearInterval(timer); }
                else setCount(Math.floor(start));
            }, 16);
        }, { threshold: 0.2 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);
    return [count, ref];
};

// ── Static data ───────────────────────────────────────────────────
const totalNotes = [...indianStates, ...unionTerritories].reduce((s, r) => s + (r.notesCount || 0), 0);
const totalQuestions = [...indianStates, ...unionTerritories].reduce((s, r) => s + (r.questionsCount || 0), 0);

const features = [
    { icon: MapPin,       title: '36 Regions Covered',     desc: 'All 28 States and 8 Union Territories mapped with high-yield, curated syllabus.',  color: 'bg-emerald/10 text-emerald' },
    { icon: BookOpen,     title: 'Structured Notes',        desc: 'Syllabus-aligned study materials prepared by former civil servants and experts.',             color: 'bg-gold/10 text-gold-dark' },
    { icon: HelpCircle,   title: 'Practice Questions',      desc: 'Robust repository of past years and dynamic practice questions with model answers.',   color: 'bg-saffron/10 text-saffron-dark' },
    { icon: CheckCircle,  title: 'Explanatory Solutions',  desc: 'Rigorous step-by-step guides so you master concepts instead of rote memorization.',     color: 'bg-emerald/10 text-emerald' },
];

const testimonials = [
    { name: 'Priya Sharma',    state: 'Rajasthan', exam: 'RPSC 2024 (Rank 12)', text: 'BodhGanga\'s state-specific notes are exceptionally well-organized. The caliber of the material helped me clear my exam in my very first attempt.', rating: 5 },
    { name: 'Arjun Mehta',     state: 'Maharashtra', exam: 'MPSC 2024', text: 'The mock question bank is extremely thorough and closely mirrors actual exam patterns. I practiced over 2,000 questions.', rating: 5 },
    { name: 'Kavitha Nair',    state: 'Kerala',    exam: 'Kerala PSC', text: 'Finally, a platform that truly understands state-specific exam formats. Essential study portal for Kerala PSC aspirants.', rating: 5 },
];

const examTypes = ['UPSC Civil Services', 'SSC CGL', 'State PSC', 'State Police Services', 'Railway Recruitment', 'Banking & IBPS', 'National & State Teaching Exams', 'Forest & Revenue Services', 'Judicial Services'];

const Landing = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalUsers: 1248,
        totalCourses: 10,
        totalEnrollments: 4380,
        totalBlogs: 5,
        totalStates: 36,
        totalNotes: 185,
        totalProducts: 12,
        totalPurchases: 310,
        activeLearners: 1060,
        completionRate: 94
    });

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
        fetch(`${baseUrl}/auth/public-stats`)
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    setStats(res.data);
                }
            })
            .catch(err => console.error("Error loading public stats:", err));
    }, []);
    
    const [notesCount, notesRef]     = useCounter(stats.totalNotes);
    const [questionsCount, qRef]     = useCounter(stats.totalNotes * 8);
    const [studentsCount, studRef]   = useCounter(stats.totalUsers);

    const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/register');

    return (
        <div className="min-h-screen bg-ivory-light overflow-x-hidden text-emerald-dark">

            {/* ── HERO SECTION ────────────────────────────────────────── */}
            <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-4">
                {/* Modern subtle grids and glows */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-light/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative w-full max-w-7xl mx-auto py-20 lg:py-32 z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                        {/* Left Content */}
                        <div className="lg:col-span-7 text-left space-y-8 animate-fade-in">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gold/20 backdrop-blur-md">
                                <Award className="w-4 h-4 text-gold" />
                                <span className="text-xs font-bold tracking-widest text-gold uppercase">India's Premier Exam Prep Portal</span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-5xl md:text-6xl xl:text-7xl font-serif text-white font-bold leading-[1.1] tracking-tight">
                                    Where Knowledge <br />
                                    <span className="text-gradient-gold">Takes Root.</span>
                                </h1>
                                <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl font-medium">
                                    Empowering next-generation civil servants and professionals with elegant, syllabus-aligned resources for all <strong className="text-gold">36 States and Union Territories</strong>.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    onClick={handleCTA}
                                    className="group flex items-center justify-center gap-3 px-8 py-4.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                >
                                    {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link 
                                    to="/states"
                                    className="flex items-center justify-center gap-2.5 px-8 py-4.5 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-sm uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                                >
                                    <MapPin className="w-4 h-4 text-gold" />
                                    Explore Regions
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-lg">
                                {[
                                    { label: 'Registered Scholars', value: `${stats.totalUsers.toLocaleString()}+` },
                                    { label: 'Mapped Regions', value: `${stats.totalStates} Covered` },
                                    { label: 'Resource Packages', value: `${stats.totalNotes + stats.totalProducts} Active` },
                                ].map((b, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="text-2xl font-bold text-white font-serif tracking-tight">{b.value}</div>
                                        <div className="text-[10px] text-gold font-bold uppercase tracking-widest">{b.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Interactive Dashboard Graphic */}
                        <div className="lg:col-span-5 hidden lg:block relative">
                            {/* Main Platform Mockup Card */}
                            <div className="relative mx-auto w-[380px] bg-emerald-950/80 backdrop-blur-xl border border-gold/20 rounded-3xl p-8 shadow-2xl shadow-black/40">
                                <div className="absolute -top-3.5 -right-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                                    LIVE PORTAL
                                </div>
                                 <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-white/10">
                                     <Logo />
                                 </div>

                                <div className="space-y-4">
                                    {/* Stat 1 */}
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📖</span>
                                            <div className="text-left"><p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Curated Notes</p><p className="text-sm font-serif font-bold text-white">{stats.totalNotes} Documents</p></div>
                                        </div>
                                        <Check className="w-4 h-4 text-gold" />
                                    </div>

                                    {/* Stat 2 */}
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">❓</span>
                                            <div className="text-left"><p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Practice Bank</p><p className="text-sm font-serif font-bold text-white">{stats.totalNotes * 8} Questions</p></div>
                                        </div>
                                        <Check className="w-4 h-4 text-gold" />
                                    </div>

                                    {/* Ratings */}
                                    <div className="pt-4 text-center">
                                        <div className="flex justify-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-gold fill-gold" />)}
                                        </div>
                                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">4.9 / 5 rated by 2,400+ aspirants</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </section>

            {/* ── STATS BAR ────────────────────────────────────── */}
            <section className="bg-white border-y border-emerald/5 py-12 shadow-sm" ref={notesRef}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        {[
                            { value: `${notesCount}`, label: 'Study Documents', icon: '📖' },
                            { value: `${questionsCount}`, label: 'Interactive MCQs', icon: '❓', ref: qRef },
                            { value: `${stats.totalStates}`, label: 'Mapped Regions', icon: '🗺️' },
                            { value: `${studentsCount}`, label: 'Active Scholars', icon: '🎓', ref: studRef },
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-2" ref={stat.ref}>
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <div className="text-4xl font-extrabold text-emerald font-serif tracking-tight">{stat.value}</div>
                                <div className="text-[10px] text-emerald/60 font-bold uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES SECTION ───────────────────────────────── */}
            <section className="py-24 bg-ivory px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Built for Serious Aspirants</span>
                        <h2 className="text-4xl md:text-5xl font-bold font-serif text-emerald-dark">Rigorous Pedagogical Framework</h2>
                        <p className="text-emerald-dark/60 max-w-2xl mx-auto text-base font-medium">
                            Every aspect of BodhGanga is engineered to accelerate retention and enhance competitive preparedness.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="card-premium bg-white p-8 flex flex-col group">
                                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-dark mb-3 font-serif tracking-tight">{f.title}</h3>
                                <p className="text-xs text-emerald-dark/60 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── EXAM COVERAGE ───────────────────────────────────── */}
            <section className="py-24 bg-white border-y border-emerald/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Global Standards</span>
                        <h2 className="text-4xl font-bold font-serif text-emerald-dark">Exam Portals Covered</h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3.5 max-w-4xl mx-auto">
                        {examTypes.map(exam => (
                            <span 
                                key={exam}
                                className="px-6 py-3 bg-emerald-light/5 border border-emerald/10 text-emerald font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-emerald hover:text-white hover:border-emerald transition-all duration-300 cursor-default"
                            >
                                {exam}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────── */}
            <section className="py-24 bg-gradient-to-b from-ivory to-white px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest">Validation</span>
                        <h2 className="text-4xl md:text-5xl font-bold font-serif text-emerald-dark">Aspirant Testimonials</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <div key={i} className="card-premium bg-white/70 p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex gap-1">
                                        {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 text-gold fill-gold" />)}
                                    </div>
                                    <p className="text-emerald-dark/80 text-sm italic leading-relaxed font-medium">"{t.text}"</p>
                                </div>
                                <div className="flex items-center gap-4.5 pt-6 border-t border-emerald/5 mt-8">
                                    <div className="w-11 h-11 bg-gradient-to-br from-emerald to-emerald-dark rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                                        {t.name[0]}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-emerald-dark text-sm">{t.name}</div>
                                        <div className="text-[10px] text-gold font-bold uppercase tracking-wider mt-0.5">{t.exam} · {t.state}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA SECTION ──────────────────────────────────────── */}
            <section className="py-28 bg-emerald-dark relative overflow-hidden px-4 text-center border-t border-gold/15">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative max-w-4xl mx-auto space-y-8 z-10">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-serif leading-tight">
                        Begin Your Modern Learning Path
                    </h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto font-medium">
                        Join over <strong className="text-gold">{stats.totalUsers.toLocaleString()}+ serious scholars</strong> utilizing BodhGanga Academy resources to master state syllabus.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button 
                            onClick={handleCTA}
                            className="group flex items-center justify-center gap-3 px-10 py-4.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link 
                            to="/states"
                            className="flex items-center justify-center gap-2.5 px-10 py-4.5 bg-white/5 border border-white/10 hover:border-gold/30 text-white font-bold text-sm uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all duration-300"
                        >
                            <Globe className="w-4 h-4 text-gold" />
                            Browse Regions
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
