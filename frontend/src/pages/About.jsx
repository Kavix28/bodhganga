import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSEO } from '../hooks/useSEO';
import { 
    ArrowRight, BookOpen, HelpCircle, CheckCircle, MapPin, 
    Award, Star, Globe, TrendingUp, Play, Sparkles, ShieldCheck, 
    Flame, Users, BookOpenCheck, Landmark, Compass, Award as Medal 
} from 'lucide-react';
import Logo from '../components/common/Logo';
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
        title: "About BodhGanga Academy",
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
                    opacity: 0.03,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* ── HERO BANNER ────────────────────────────────────────── */}
            <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 px-6 border-b border-gold/15 py-20 text-center overflow-hidden">
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

                    <p className="text-sm sm:text-base text-white/70 max-w-3xl mx-auto leading-relaxed">
                        A pioneering, research-driven educational initiative dedicated to documenting, mapping, and unlocking the academic wealth of every region in India in a structured, multi-dimensional, and digitally accessible format.
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

            {/* ── WHY BODHGANGA EXISTS ────────────────────────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-7 space-y-6 text-left">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">The Educational Problem</span>
                            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Why BodhGanga Exists</h2>
                            <div className="w-12 h-1 bg-gold rounded-full" />
                        </div>
                        <div className="space-y-4 text-emerald-dark/85 text-sm sm:text-base leading-relaxed font-medium">
                            <p>
                                Traditional academic study and test preparation environments treat regional topics in isolation. Students are forced to consult fragmented sources, dry statistics tables, and incomplete maps to piece together local general knowledge.
                            </p>
                            <p>
                                BodhGanga Academy was created to revolutionize this landscape. We believe that state exams, public service preparation, and civic awareness require a unified, intuitive, and highly rigorous visual knowledge system.
                            </p>
                            <p>
                                By bridging the gap between textbook geography and actual field knowledge, we help serious aspirants master complex regional frameworks seamlessly.
                            </p>
                        </div>
                    </div>
                    <div className="md:col-span-5 flex justify-center">
                        <div className="card-premium p-8 bg-emerald-950 text-white border border-gold/25 rounded-3xl max-w-sm shadow-xl flex flex-col justify-center space-y-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                                <Flame className="w-6 h-6 text-gold fill-gold" />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-gold">The Disconnect</h3>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                "Most textbooks explain state geography, local history, and district administration as completely separate fields, leaving the student to manually synthesize connections. BodhGanga fixes this."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── UNDERSTANDING INDIA THROUGH DISTRICTS ─────────────────── */}
            <section className="py-20 bg-white border-y border-emerald/5 px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Grassroots Foundations</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Understanding India Through Districts</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>
                    <p className="text-base sm:text-lg text-emerald font-serif font-bold max-w-3xl mx-auto leading-relaxed">
                        India is not just a collection of states—it is a network of districts, each carrying its own unique physical, historical, administrative, and cultural footprint.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-6">
                        {[
                            { title: "Grassroots Administration", desc: "The district serves as the primary unit of governance, policy execution, and resource allocation. Understanding it is key for prospective civil servants." },
                            { title: "Localized Economics", desc: "From unique mineral deposits to localized industrial zones and regional crops, each district drives a specific pillar of state revenue." },
                            { title: "Socio-Cultural Tapestry", desc: "Every local district boasts specific tribal heritages, folklore, dialects, monuments, and sacred sanctuaries that define regional diversity." }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-3 bg-ivory-light p-6 rounded-2xl border border-emerald/5 shadow-sm">
                                <span className="text-gold font-bold text-lg font-serif">0{idx + 1}.</span>
                                <h3 className="text-base font-bold font-serif text-emerald-dark">{item.title}</h3>
                                <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HORIZONTAL INTEGRATION FRAMEWORK ──────────────────────── */}
            <section className="py-20 max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block text-[10px] font-bold text-gold uppercase tracking-widest leading-none">The Core Philosophy</span>
                    <h2 className="text-3xl sm:text-5xl font-bold font-serif text-emerald-dark">Horizontal Integration Framework</h2>
                    <p className="text-xs sm:text-sm text-emerald-dark/60 max-w-2xl mx-auto">
                        Connecting isolated subjects into a single, cohesive, multi-dimensional learning map.
                    </p>
                    <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Compass, title: "Geography & Ecology", desc: "River systems, soil structures, agricultural terrains, weather patterns, forest reserves, and environmental sanctuaries." },
                        { icon: Landmark, title: "History & Heritage", desc: "Fortresses, local dynasties, freedom struggle landmarks, administrative histories, archaeological ruins, and tribal chronicles." },
                        { icon: TrendingUp, title: "Economy & Resources", desc: "Industrial belts, minor/major minerals, GI-tagged crafts, regional agriculture outputs, transport maps, and tourism clusters." },
                        { icon: ShieldCheck, title: "Governance & Polity", desc: "District administration structure, panchayat configurations, municipal corporations, strategic border posts, and development indicators." }
                    ].map((item, idx) => (
                        <div key={idx} className="card-premium bg-white p-8 flex flex-col group hover:-translate-y-1 transition-all duration-300 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald/5 text-emerald flex items-center justify-center mb-6 group-hover:bg-emerald group-hover:text-white transition-all duration-300 shadow-sm border border-emerald/5">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-emerald-dark mb-3 font-serif tracking-tight">{item.title}</h3>
                            <p className="text-xs text-emerald-dark/60 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── WHAT WE CREATE ──────────────────────────────────────── */}
            <section className="py-20 bg-emerald-950 text-white border-y border-gold/15 px-6 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                        <div className="md:col-span-5 space-y-6 text-left">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-gold" /> Mapped Educational Assets
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-serif text-white font-bold leading-tight">
                                What We Create
                            </h2>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                We design state-of-the-art educational materials combining rigorous scholarship, visual mapping, and tech-enabled delivery.
                            </p>
                        </div>
                        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {[
                                { title: "District Lectures", desc: "Interactive, research-backed video sessions decoding districts as complex living units." },
                                { title: "Bilingual Study Notes", desc: "Expertly structured PDF textbooks formatted precisely for state PSC exams." },
                                { title: "High-Yield MCQ Banks", desc: "High-yield state specific questionnaires for rigorous exam prep." },
                                { title: "Thematic Infographics", desc: "Micro-learning visuals for rapid geographical and historical retention." }
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:border-gold/30 transition-all duration-300">
                                    <h3 className="text-sm font-bold font-serif text-gold">{item.title}</h3>
                                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHY THIS INITIATIVE MATTERS ─────────────────────────── */}
            <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest">National Reform</span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Why This Initiative Matters</h2>
                    <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left items-stretch">
                    <div className="md:col-span-6 bg-white p-8 rounded-3xl border border-emerald/5 shadow-sm space-y-4">
                        <div className="text-xl">🎓</div>
                        <h3 className="text-lg font-bold font-serif text-emerald-dark">Syllabus Synchronization</h3>
                        <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">
                            State Civil Services and competitive exams increasingly demand localized general knowledge. BodhGanga aligns its archives perfectly with updated boards to prevent aspirants from studying outdated databases.
                        </p>
                    </div>
                    <div className="md:col-span-6 bg-white p-8 rounded-3xl border border-emerald/5 shadow-sm space-y-4">
                        <div className="text-xl">🗺️</div>
                        <h3 className="text-lg font-bold font-serif text-emerald-dark">Grassroots Awareness</h3>
                        <p className="text-xs text-emerald-dark/70 leading-relaxed font-medium">
                            Beyond examination success, building regional, cultural, and environmental literacy at a local scale helps citizens, civil society, and policymakers understand district potentials and issues correctly.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── WHO WE SERVE ────────────────────────────────────────── */}
            <section className="py-20 bg-white border-t border-emerald/5 px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Our Community</span>
                        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark">Who We Serve</h2>
                        <div className="w-16 h-1 bg-gold rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                        {[
                            { name: "UPSC & State PSC", desc: "Aspirants looking for regional studies and local GS papers." },
                            { name: "Academic Researchers", desc: "Educators and writers seeking authenticated regional resources." },
                            { name: "School Educators", desc: "Teachers utilizing maps and visual infographics in class." },
                            { name: "Pragmatic Citizens", desc: "Anyone eager to explore India's geography, history, and resources." }
                        ].map((grp, idx) => (
                            <div key={idx} className="p-5 bg-ivory-light border border-emerald/5 rounded-2xl flex flex-col justify-between">
                                <h3 className="text-sm font-bold font-serif text-emerald-dark mb-2">{grp.name}</h3>
                                <p className="text-[10px] text-emerald-dark/60 leading-relaxed font-medium">{grp.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MISSION & VISION ────────────────────────────────────── */}
            <section className="py-20 bg-gradient-to-b from-emerald-950 to-emerald-dark text-white px-6 border-b border-gold/15 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-gold/25 rounded-3xl space-y-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">🎯</div>
                        <h3 className="text-xl font-bold font-serif text-white">Our Mission</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            To create the most detailed, structured, research-backed district-level digital knowledge repository for India. We seek to present districts as complete entities to simplify exam preparation and empower grassroots learners.
                        </p>
                    </div>
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-gold/25 rounded-3xl space-y-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">👁️</div>
                        <h3 className="text-xl font-bold font-serif text-white">Our Vision</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            To establish a permanent digital archive documenting India's local geography, culture, history, and economy. By fusing visual storytelling with technology, we aim to inspire future generations of researchers and administrators.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── INDIA UNLOCKED BANNER ───────────────────────────────── */}
            <section className="bg-gradient-to-r from-emerald-dark via-emerald-950 to-emerald-dark py-14 border-b border-gold/15 text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[rgba(212,175,55,0.2)]" />
                <div className="max-w-4xl mx-auto px-6 space-y-3">
                    <p className="text-[10px] text-gold font-bold uppercase tracking-[0.25em] leading-none mb-1">Decentralizing Knowledge</p>
                    <h2 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                        India Unlocked — District by District
                    </h2>
                    <p className="text-xs text-white/60 max-w-xl mx-auto leading-relaxed">
                        Join our mission to explore, map, and document the administrative, historical, and geological wealth of all districts across India.
                    </p>
                </div>
            </section>

            {/* ── CALL TO ACTION ──────────────────────────────────────── */}
            <section className="py-24 bg-white text-center px-6 relative z-10">
                <div className="max-w-xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-4xl font-bold font-serif text-emerald-dark tracking-tight">
                        Start Mapped Learning Today
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-dark/60 leading-relaxed">
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
                            to="/states"
                            className="w-full sm:w-auto px-8 py-4 bg-ivory-light border border-emerald/10 hover:border-gold/30 text-emerald font-bold text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 text-center"
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
