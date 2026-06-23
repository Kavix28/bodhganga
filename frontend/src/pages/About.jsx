import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSEO } from '../hooks/useSEO';
import { 
    ArrowRight, BookOpen, CheckCircle, MapPin, 
    Globe, TrendingUp, Play, Sparkles, ShieldCheck, 
    Flame, Users, BookOpenCheck, Landmark, Compass, Heart
} from 'lucide-react';
import indiaMap from '../assets/images/india-map.webp';

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

const About = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useSEO({
        title: "About BodhGanga Academy - Grassroots Knowledge",
        description: "BodhGanga Academy is a research-driven educational platform built to help learners understand India in its truest grassroots form through India's First Digital District Encyclopedia.",
        keywords: "BodhGanga Academy, Digital District Encyclopedia, NDDE, Horizontal Integration, State Exams, UPSC, State GK",
        ogTitle: "About BodhGanga Academy - Grassroots Knowledge Portal",
        ogDescription: "Decode India district by district. Experience a highly integrated multi-dimensional learning framework designed for serious competitive exam preparation.",
        ogImage: "/logo.png"
    });

    const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/register');

    return (
        <div className="min-h-screen bg-ivory-light text-emerald-dark font-sans relative select-none">
            {/* Faint India Map Watermark Background */}
            <div 
                className="absolute inset-0 pointer-events-none select-none bg-contain bg-no-repeat z-0" 
                style={{
                    backgroundImage: `url(${indiaMap})`,
                    backgroundPosition: 'right 5% center',
                    opacity: 0.02,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* ── HERO BANNER ────────────────────────────────────────── */}
            <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15 py-24 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-light/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative max-w-4xl mx-auto space-y-6 z-10">
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-900/40 border border-gold/30 shadow-lg shimmer-badge mx-auto">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span className="text-xs sm:text-sm font-bold tracking-widest text-gold uppercase">Where Knowledge Takes Root</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-serif text-white font-bold leading-tight tracking-tight">
                        About <span className="text-gradient-gold">BodhGanga Academy</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gold-glow-soft font-serif max-w-2xl mx-auto leading-relaxed italic">
                        "Decoding India, District by District"
                    </p>
                </div>
            </section>

            {/* ── STATS HUB ───────────────────────────────────────────── */}
            <section className="bg-white border-b border-emerald/5 py-10 shadow-sm relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: <Counter target={580} suffix="+" />, label: 'Exhaustive PDFs', icon: '📖' },
                            { value: <Counter target={3480} suffix="+" />, label: 'Mock MCQs', icon: '❓' },
                            { value: <Counter target={36} />, label: 'Mapped Territories', icon: '🗺️' },
                            { value: <Counter target={21680} suffix="+" />, label: 'Active Scholars', icon: '🎓' },
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

            {/* ── BODHGANGA INTRO & THE DISCONNECT ────────────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-7 space-y-6 text-left">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Our Genesis</span>
                            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">About Us</h2>
                            <div className="w-12 h-1 bg-gold rounded-full" />
                        </div>
                        <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                            <p>
                                India is one of the most diverse civilizations in the world. Its geography, history, culture, governance, economy, and traditions vary dramatically from one region to the next. Yet, traditional educational resources almost exclusively explain India at the macro national or state level.
                            </p>
                            <p className="font-semibold text-emerald">
                                The real India, however, exists at the grassroots—at the district level.
                            </p>
                            <p>
                                Every district has its own distinct historical journey, ecological identity, economic engine, and developmental challenge. Understanding India in its truest form requires understanding its districts.
                            </p>
                            <p>
                                BodhGanga Academy’s flagship initiative, the National Digital District Encyclopedia (NDDE), is a pioneering research-backed project dedicated to documenting every single district of India in a structured, multi-dimensional, and digitally accessible format.
                            </p>
                        </div>
                    </div>
                    <div className="md:col-span-5 flex justify-center">
                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl max-w-sm shadow-xl flex flex-col justify-center space-y-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Flame className="w-6 h-6 text-gold fill-gold" />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-gold">The Grassroots Reality</h3>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                "Traditional educational resources almost exclusively explain India at the macro national or state level, while the true civilizational depth, economy, and culture function at the district unit."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONCEPT OF HORIZONTAL INTEGRATION ────────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-left space-y-8">
                    <div className="space-y-2 text-center">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Our Learning Philosophy</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">The Concept of Horizontal Integration</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>
                    
                    <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                        <p>
                            At the core of NDDE lies the concept of **Horizontal Integration**. Traditional learning often treats subjects such as Geography, History, Polity, Economy, Environment, and Culture as separate disciplines. In reality, however, these domains are deeply interconnected.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
                        {[
                            { title: "Geography's Impact", desc: "A district’s geography directly influences its agricultural capacity, mineral resources, and regional economy." },
                            { title: "History's Shadow", desc: "Historical events, dynasties, and battles shape local demographic patterns and cultural identities." },
                            { title: "Ecological Patterns", desc: "Rivers, forests, wetlands, and micro-climates impact settlement configurations and developmental challenges." },
                            { title: "Strategic Security", desc: "Strategic geographical location influences border administration, local governance, trade routes, and security." },
                            { title: "Social Tapestry", desc: "Tribal traditions, regional folk heritage, and local cultural assets structure the local social systems." }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-3 bg-ivory-light p-5 rounded-2xl border border-emerald/5 shadow-sm">
                                <span className="text-gold font-bold text-lg font-serif">0{idx + 1}.</span>
                                <h3 className="text-sm font-bold font-serif text-emerald-dark">{item.title}</h3>
                                <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium pt-4">
                        <p>
                            NDDE integrates all these dimensions into one unified district-wise framework, enabling learners to understand India contextually rather than through disconnected information. This approach not only strengthens conceptual clarity but also aligns closely with the analytical requirements of competitive examinations such as UPSC and State PSCs.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── WHAT WE CREATE ──────────────────────────────────────── */}
            <section className="py-20 max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest leading-none">Our Deliverables</span>
                    <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">What We Create</h2>
                    <p className="text-xs sm:text-sm text-emerald-dark/60 max-w-2xl mx-auto">
                        The National Digital District Encyclopedia is designed as a layered digital learning ecosystem consisting of multiple interconnected formats.
                    </p>
                    <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { 
                            icon: Play, 
                            title: "1. District-Wise Comprehensive Lectures", 
                            desc: "In-depth district analysis covering: Geography, History, Economy, Culture, Environment, Governance, Agriculture, Infrastructure, Strategic relevance, and Current developments." 
                        },
                        { 
                            icon: BookOpenCheck, 
                            title: "2. Quick Revision Modules", 
                            desc: "Structured revision content designed for UPSC, State PSCs, SSC, CUET, Defence exams, and School learning. These modules simplify large amounts of information into concise and exam-oriented frameworks." 
                        },
                        { 
                            icon: Compass, 
                            title: "3. Digital Infographics & Visual Learning", 
                            desc: "To improve retention and accessibility, NDDE creates infographics, visual fact sheets, revision grids, maps, data-based explainers, and comparative district frameworks." 
                        },
                        { 
                            icon: Sparkles, 
                            title: "4. Micro-Learning Content", 
                            desc: "The initiative develops short educational formats such as fact capsules, quiz-based learning, “Where Am I Going in India?” geography challenges, historical storytelling, cultural heritage explainers, and environmental awareness content." 
                        },
                        { 
                            icon: Globe, 
                            title: "5. Thematic National Knowledge Series", 
                            desc: "Beyond district documentation, NDDE builds thematic educational archives on Tribes of India, Festivals and Folk Traditions, National Movements and Wars, Biodiversity and Protected Areas, Ramsar Sites, Strategic Border Regions, Legends of India, and Cultural Landscapes of India." 
                        }
                    ].map((item, idx) => (
                        <div key={idx} className="card-premium bg-white p-8 flex flex-col group hover:-translate-y-1 transition-all duration-300 text-left justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald/5 text-emerald flex items-center justify-center mb-6 group-hover:bg-emerald group-hover:text-white transition-all duration-300 shadow-sm border border-emerald/5">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-dark mb-3 font-serif tracking-tight">{item.title}</h3>
                                <p className="text-xs text-emerald-dark/65 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── WHY THIS INITIATIVE MATTERS ─────────────────────────── */}
            <section className="py-20 bg-emerald-950 text-white border-y border-gold/15 px-6 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">National Knowledge Reform</span>
                        <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold">Why This Initiative Matters</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>
                    <p className="text-lg text-gold font-serif leading-relaxed italic max-w-2xl mx-auto">
                        "India is not merely a political map. It is a civilizational mosaic built through thousands of local identities, ecological systems, historical processes, and cultural traditions."
                    </p>
                    <div className="space-y-4 text-white/80 text-xs sm:text-sm leading-relaxed font-medium text-left max-w-3xl mx-auto">
                        <p>
                            Unfortunately, district-level knowledge often remains scattered across reports, archives, textbooks, government documents, and fragmented internet sources. There has never been a unified digital platform dedicated to systematically organizing and presenting India district by district.
                        </p>
                        <p>
                            NDDE seeks to fill this gap. The initiative aims to preserve district-level knowledge in a structured digital format for:
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2 font-bold text-gold">
                            <div className="flex items-center gap-2">✔ Education</div>
                            <div className="flex items-center gap-2">✔ Competitive Examinations</div>
                            <div className="flex items-center gap-2">✔ Research</div>
                            <div className="flex items-center gap-2">✔ Governance Awareness</div>
                            <div className="flex items-center gap-2">✔ Cultural Preservation</div>
                            <div className="flex items-center gap-2">✔ Future Academic Reference</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHO WE SERVE ────────────────────────────────────────── */}
            <section className="py-20 bg-white px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-center space-y-12">
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Our Target Audience</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Who We Serve</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Competitive Exam Aspirants", desc: "UPSC, State PSCs, SSC, CUET, Defence and allied examinations." },
                            { title: "Educators & Institutions", desc: "Teachers, schools, colleges, and coaching institutions seeking structured India-focused educational resources." },
                            { title: "Researchers & Policy Enthusiasts", desc: "Individuals interested in grassroots governance, development studies, district administration, and regional diversity." },
                            { title: "Lifelong Learners", desc: "Anyone seeking a deeper and more meaningful understanding of India beyond textbook-level information." }
                        ].map((grp, idx) => (
                            <div key={idx} className="p-6 bg-ivory-light border border-emerald/5 rounded-3xl flex flex-col justify-between text-left shadow-sm">
                                <div>
                                    <div className="p-3 bg-emerald-50 text-emerald rounded-2xl h-fit shrink-0 w-fit mb-4">
                                        <Users className="w-5 h-5 text-emerald" />
                                    </div>
                                    <h3 className="text-sm font-bold font-serif text-emerald-dark mb-2">{grp.title}</h3>
                                    <p className="text-[11px] text-emerald-dark/70 leading-relaxed font-medium">{grp.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CALL TO ACTION ──────────────────────────────────────── */}
            <section className="py-20 bg-ivory-light text-center px-6 relative z-10 border-t border-emerald/5">
                <div className="max-w-xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark tracking-tight">
                        Start Mapped Learning Today
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-dark/60 leading-relaxed font-medium">
                        Access our state-specific courses, digital note bundles, maps, and high-yield question banks instantly from your academic dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button 
                            onClick={handleCTA}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Enroll Now — Free'}
                        </button>
                        <Link 
                            to="/state"
                            className="w-full sm:w-auto px-8 py-4 bg-white border border-emerald/10 hover:border-gold/30 text-emerald font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 text-center shadow-sm"
                        >
                            Explore States & UTs
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;

