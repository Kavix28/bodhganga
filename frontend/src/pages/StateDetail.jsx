import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    MapPin, BookOpen, Video, Users, Star, ArrowRight, ShieldAlert,
    CheckCircle2, Shield, Calendar, HelpCircle, FileText, ChevronRight, Play, Eye
} from 'lucide-react';
import api from '../services/api';
import Breadcrumb from '../components/common/Breadcrumb';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const StateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [dbContent, setDbContent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pattern'); // 'pattern' | 'eligibility' | 'syllabus' | 'subjects'
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchStateData();
    }, [id]);

    const fetchStateData = async () => {
        try {
            setIsLoading(true);
            
            // 1. Resolve State/UT Info
            const staticMatch = [...indianStates, ...unionTerritories].find(s => s.id === id);
            
            // 2. Fetch State detail from backend
            let stateData = null;
            try {
                const res = await api.get(`/states/${id}`);
                stateData = res.data.data || res.data;
            } catch (err) {
                console.warn("Backend state fetch failed, falling back to static metadata.", err);
            }

            const resolvedState = {
                ...staticMatch,
                ...stateData,
                examName: staticMatch?.exams?.[0] || `${staticMatch?.code || 'State'}PSC`,
                aspirantsCount: Math.floor(Math.random() * 95000) + 75000,
                difficulty: "High (UPSC Tier Alignment)",
                successRate: "0.85% Selection Rate"
            };
            setState(resolvedState);

            // 3. Fetch products/notes for this state
            try {
                const prodRes = await api.get(`/products/state/${id}`);
                setDbProducts(prodRes.data.data || prodRes.data || []);
            } catch (err) {
                console.warn("Products fetch failed.", err);
            }

            // 4. Fetch additional content (e.g. videos/lectures)
            try {
                const contRes = await api.get(`/content/state/${id}`);
                setDbContent(contRes.data.data || contRes.data || []);
            } catch (err) {
                console.warn("Content fetch failed.", err);
            }

        } catch (error) {
            console.error('Failed to load state detail bundle:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mapped state-specific YouTube lectures if backend has none
    const seedVideos = useMemo(() => {
        if (!state) return [];
        const baseTitle = state.examName;
        return [
            { id: "v1", title: `${baseTitle} Strategy: How to Crack local GK & Current Affairs`, duration: "42:15", thumbnail: `https://img.youtube.com/vi/W4rR48C6B14/maxresdefault.jpg`, youtubeUrl: "https://www.youtube.com/embed/W4rR48C6B14", views: "124k views" },
            { id: "v2", title: `${state.name} Geography and Art & Culture - Comprehensive Overview`, duration: "1:24:10", thumbnail: `https://img.youtube.com/vi/P1u4QG2x6y4/maxresdefault.jpg`, youtubeUrl: "https://www.youtube.com/embed/P1u4QG2x6y4", views: "86k views" },
            { id: "v3", title: `Previous Year Question Paper Analysis - Master Mains Answer Writing`, duration: "56:30", thumbnail: `https://img.youtube.com/vi/6p9N0_m59mI/maxresdefault.jpg`, youtubeUrl: "https://www.youtube.com/embed/6p9N0_m59mI", views: "98k views" }
        ];
    }, [state]);

    // Mapped state-specific Notes if backend has none
    const seedNotes = useMemo(() => {
        if (!state) return [];
        const baseName = state.name;
        const examName = state.examName;
        return [
            { id: "n1", title: `${examName} Polity & Governance Core textbook`, category: "Notes", price: 299, originalPrice: 499, pages: 320, language: "Bilingual (Eng/Hindi)", rating: 4.9, thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400" },
            { id: "n2", title: `${baseName} Complete Geography, Resources & Demography`, category: "Notes", price: 199, originalPrice: 399, pages: 210, language: "English Medium", rating: 4.8, thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400" },
            { id: "n3", title: `High-Yield local History & Archaeological Heritage of ${baseName}`, category: "Notes", price: 149, originalPrice: 299, pages: 180, language: "Hindi Medium", rating: 4.9, thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400" }
        ];
    }, [state]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center select-none">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald mx-auto"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-dark/60">Retrieving premium prep portal...</p>
                </div>
            </div>
        );
    }

    if (!state) {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center select-none">
                <div className="text-center space-y-3 card-premium p-10 bg-white">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
                    <h3 className="text-lg font-serif font-bold text-emerald-dark">Prep Center Mismatch</h3>
                    <p className="text-xs text-emerald-dark/60">The requested administrative region mapping was not found.</p>
                    <Link to="/states" className="btn-premium btn-premium-primary text-[10px] uppercase font-bold py-2 mt-4 inline-block">Return to Explorer</Link>
                </div>
            </div>
        );
    }

    // Mix backend data with high quality seed backups
    const displayNotes = dbProducts.length > 0 ? dbProducts : seedNotes;
    const displayVideos = dbContent.filter(c => c.type === 'video').length > 0 ? dbContent : seedVideos;

    return (
        <div className="min-h-screen bg-ivory-light pb-24 font-sans select-none relative">
            
            {/* ── BREADCRUMB ─────────────────────────────────────────── */}
            <div className="bg-emerald-dark/95 border-b border-gold/15 py-3 px-6 z-40 relative">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumb items={[
                        { label: 'States & UTs', path: '/states' },
                        { label: state.name, path: `/states/${state.id}` }
                    ]} />
                </div>
            </div>

            {/* ── LUXURY BANNER HERO SECTION ─────────────────────────── */}
            <section className="relative bg-gradient-to-b from-emerald-dark via-emerald-dark to-emerald-950 text-white py-16 px-6 overflow-hidden border-b border-gold/15 shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-light/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-gold/20 backdrop-blur-md">
                            <Shield className="w-3.5 h-3.5 text-gold" />
                            <span className="text-[9px] font-extrabold tracking-widest text-gold uppercase">{state.examName} Preparation Portal</span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl font-bold font-serif leading-tight tracking-tight">
                            Master {state.name} Civil Services
                        </h1>

                        <p className="text-white/70 text-xs sm:text-sm max-w-2xl leading-relaxed font-semibold">
                            Join over <strong className="text-gold">{(state.aspirantsCount / 1000).toFixed(0)}k+ serious aspirants</strong> utilizing BodhGanga Academy tools. Comprehensive notes store, custom roadmap, and Netflix-quality lecture feeds.
                        </p>

                        <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-gold-glow pt-2">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gold" /> Capital: {state.capital}</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-gold" /> Difficulty: {state.difficulty}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gold" /> {state.successRate}</span>
                        </div>
                    </div>

                    <div className="lg:col-span-4 hidden lg:block">
                        <div className="bg-white/5 backdrop-blur-xl border border-gold/20 p-6 rounded-3xl space-y-4 glow-emerald-card text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-emerald-dark font-serif text-3xl font-bold shadow-md">
                                {state.code}
                            </div>
                            <p className="text-xs text-white/80 font-bold uppercase tracking-widest leading-none pt-2">{state.examName} Academy Channel</p>
                            <p className="text-[10px] text-gold/60 font-semibold tracking-wider">{state.notesCount || 180}+ Curated PDFs Published</p>
                            <button 
                                onClick={() => document.getElementById('notes-shelf')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md hover:scale-[1.02]"
                            >
                                View Study Store
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── METRIC TILES ───────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Capital Center", val: state.capital, desc: "Administrative Hub", icon: "🏛️" },
                        { label: "Territorial Area", val: state.area || "N/A", desc: "Geographic Boundary", icon: "🗺️" },
                        { label: "Population Metrics", val: state.population || "N/A", desc: "Regional Demographic", icon: "👥" },
                        { label: "Core Language", val: state.language || "N/A", desc: "Exam Media Medium", icon: "🗣️" }
                    ].map((tile, i) => (
                        <div key={i} className="card-premium bg-white p-5 flex items-center gap-4 border border-emerald/5 shadow-md">
                            <div className="text-3xl">{tile.icon}</div>
                            <div className="text-left min-w-0">
                                <p className="text-[8px] text-emerald-dark/40 font-bold uppercase tracking-widest leading-none mb-1">{tile.label}</p>
                                <p className="text-xs font-serif font-bold text-emerald-dark truncate leading-tight">{tile.val}</p>
                                <p className="text-[9px] text-emerald/60 font-medium tracking-wide mt-0.5">{tile.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">

                {/* ── PHASE 2: STATE DESCRIPTION & EXAM METRICS TABS ────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Syllabus Detail Tabs Layout */}
                    <div className="lg:col-span-8 card-premium bg-white p-8 sm:p-10 space-y-8">
                        <div className="border-b border-emerald/5 pb-4">
                            <h2 className="text-2xl font-bold font-serif text-emerald-dark tracking-tight">Curriculum & Examination Blueprint</h2>
                            <p className="text-xs text-emerald-dark/50 font-semibold tracking-wide mt-1">Select topics below to understand recruitment framework details.</p>
                        </div>

                        {/* Tabs Buttons */}
                        <div className="flex flex-wrap gap-2 border-b border-emerald/5 pb-2">
                            {[
                                { id: 'pattern', label: 'Exam Pattern' },
                                { id: 'eligibility', label: 'Eligibility' },
                                { id: 'syllabus', label: 'Syllabus Focus' },
                                { id: 'subjects', label: 'Important Subjects' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-emerald text-white'
                                            : 'bg-emerald-light/5 text-emerald-dark/60 hover:bg-emerald-light/10 hover:text-emerald-dark'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Contents */}
                        <div className="text-xs sm:text-sm font-semibold text-emerald-dark/75 leading-relaxed space-y-4">
                            {activeTab === 'pattern' && (
                                <div className="space-y-4">
                                    <h3 className="font-serif font-bold text-base text-emerald-dark pb-2 border-b border-emerald/5">Three-Tier Selection Process</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-light/5 border border-emerald/10 rounded-2xl text-center space-y-1">
                                            <span className="text-xl">Ⅰ</span>
                                            <p className="font-bold text-emerald-dark text-xs uppercase tracking-widest">Prelims Exam</p>
                                            <p className="text-[10px] text-emerald-dark/50">Objective Type (MCQ) papers focused on General Studies & Aptitude.</p>
                                        </div>
                                        <div className="p-4 bg-emerald-light/5 border border-emerald/10 rounded-2xl text-center space-y-1">
                                            <span className="text-xl">Ⅱ</span>
                                            <p className="font-bold text-emerald-dark text-xs uppercase tracking-widest">Mains Exam</p>
                                            <p className="text-[10px] text-emerald-dark/50">Conventional descriptive answer writing papers on regional subjects.</p>
                                        </div>
                                        <div className="p-4 bg-emerald-light/5 border border-emerald/10 rounded-2xl text-center space-y-1">
                                            <span className="text-xl">Ⅲ</span>
                                            <p className="font-bold text-emerald-dark text-xs uppercase tracking-widest">Interview</p>
                                            <p className="text-[10px] text-emerald-dark/50">Personality check and dynamic administrative suitability evaluation.</p>
                                        </div>
                                    </div>
                                    <p className="pt-2">Our prep ecosystem features customized note textbooks targeting both prelims objective facts and mains descriptive answer frameworks.</p>
                                </div>
                            )}

                            {activeTab === 'eligibility' && (
                                <div className="space-y-3">
                                    <h3 className="font-serif font-bold text-base text-emerald-dark pb-2 border-b border-emerald/5">Who Can Apply?</h3>
                                    <ul className="space-y-2 text-xs">
                                        <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" /> Minimum age limit: 21 years (relaxations applicable for specific categories).</li>
                                        <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" /> Academic: Degree graduation from any UGC-recognized national university.</li>
                                        <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" /> Language: Fluency in writing/speaking regional state mediums is highly recommended.</li>
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'syllabus' && (
                                <div className="space-y-4">
                                    <h3 className="font-serif font-bold text-base text-emerald-dark pb-2 border-b border-emerald/5">Syllabus Overview Focus</h3>
                                    <p>{state.description || `${state.name} competitive exams demand specialized knowledge of local context including history, geographical topography, tribal dynamics, agriculture patterns, and administrative notifications.`}</p>
                                    <div className="p-4 border border-gold/20 bg-gold/5 rounded-2xl">
                                        <p className="font-bold text-xs uppercase tracking-widest text-gold-dark mb-1">🔥 Critical Syllabus Weightage</p>
                                        <p className="text-[10px] text-emerald-dark/70 font-semibold leading-relaxed">State-specific General Knowledge constitutes up to 35% of total score marks in regional civil service examinations. Our textbook notes completely map this syllabus.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'subjects' && (
                                <div className="space-y-4">
                                    <h3 className="font-serif font-bold text-base text-emerald-dark pb-2 border-b border-emerald/5">High-Yield Subjects to Score</h3>
                                    <div className="grid grid-cols-2 gap-3 text-xs uppercase font-extrabold tracking-wider">
                                        {state.exams?.map((ex, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-emerald-light/5 border border-emerald/5 rounded-xl">
                                                <span className="w-1.5 h-1.5 bg-gold rounded-full" /> {ex} GK Modules
                                            </div>
                                        )) || (
                                            <>
                                                <div className="flex items-center gap-2 p-2 bg-emerald-light/5 border border-emerald/5 rounded-xl"><span className="w-1.5 h-1.5 bg-gold rounded-full" /> History & Landmarks</div>
                                                <div className="flex items-center gap-2 p-2 bg-emerald-light/5 border border-emerald/5 rounded-xl"><span className="w-1.5 h-1.5 bg-gold rounded-full" /> Geography & Mapping</div>
                                            </>
                                        )}
                                        <div className="flex items-center gap-2 p-2 bg-emerald-light/5 border border-emerald/5 rounded-xl"><span className="w-1.5 h-1.5 bg-gold rounded-full" /> Local Polity & Governance</div>
                                        <div className="flex items-center gap-2 p-2 bg-emerald-light/5 border border-emerald/5 rounded-xl"><span className="w-1.5 h-1.5 bg-gold rounded-full" /> Economic Survey & Budget</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick District Directory Sidebar */}
                    <div className="lg:col-span-4 card-premium bg-white p-6 space-y-6">
                        <h3 className="font-serif font-bold text-emerald-dark text-base pb-2.5 border-b border-emerald/5">Administrative Details</h3>
                        
                        <div className="space-y-4 text-xs font-semibold text-emerald-dark/70">
                            <div>
                                <p className="text-[8px] text-emerald-dark/40 font-bold uppercase tracking-widest">Principal Exam Body</p>
                                <p className="text-sm font-serif font-bold text-emerald-dark mt-0.5">{state.examName}</p>
                            </div>
                            
                            {state.districts && (
                                <div>
                                    <p className="text-[8px] text-emerald-dark/40 font-bold uppercase tracking-widest">Administrative Divisions</p>
                                    <p className="text-sm font-serif font-bold text-emerald-dark mt-0.5">{state.districts.length} Districts Mapped</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                                        {state.districts.map((dist, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-emerald-light/5 border border-emerald/5 text-[9px] font-bold tracking-wide uppercase rounded-md text-emerald">
                                                {dist}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── INTERACTIVE TIMELINE ROADMAP ─────────────────────────── */}
                <section className="space-y-8 bg-white card-premium p-8 sm:p-10 border border-emerald/5">
                    <div className="border-b border-emerald/5 pb-5 text-center">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Preparation Timeline</span>
                        <h2 className="text-3xl font-serif font-bold text-emerald-dark mt-1.5">7-Step State PSC Preparation Roadmap</h2>
                        <p className="text-xs text-emerald-dark/60 font-semibold max-w-xl mx-auto mt-1">A rigorous, step-by-step pipeline mapped from basic standard NCERTs to the final interview stage.</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-8 py-4">
                        {[
                            { step: "Step 1", title: "NCERT & Foundation Blocks", desc: "Build standard concepts in History, Geography, Polity, and Economics via 6th-12th grade textbooks." },
                            { step: "Step 2", title: "Comprehensive State GK Coverage", desc: "Deep dive into regional geographic coordinates, local dynasties, tribal communities, and cultural festivals." },
                            { step: "Step 3", title: "Current Affairs & Government Schemes", desc: "Read regional economic surveys, annual state budgets, and major welfare schemes launched." },
                            { step: "Step 4", title: "Descriptive Answer Writing Practice", desc: "Master structuring core answers with map drawings, regional diagrams, and references to actual commissions." },
                            { step: "Step 5", title: "BodhGanga Digital MCQ Test Series", desc: "Practice high-yield objective previous year questions paired with extensive step-by-step diagnostic models." },
                            { step: "Step 6", title: "Full-Length Mocks & Revision Drills", desc: "Participate in simulated three-hour exams under timed conditions to refine writing speed and exam endurance." },
                            { step: "Step 7", title: "Personality Mock Interviews", desc: "Work with retired administrators to sharpen posture, tone, situational analysis, and local presence." }
                        ].map((timeline, idx) => (
                            <div key={idx} className="timeline-premium-item group">
                                <div className="timeline-premium-badge group-hover:scale-125 transition-transform" />
                                <div className="text-left space-y-1">
                                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-gold">{timeline.step}</span>
                                    <h4 className="text-sm font-bold text-emerald-dark font-serif tracking-tight leading-snug">{timeline.title}</h4>
                                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">{timeline.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── NOTES STOREGRID ──────────────────────────────────────── */}
                <section id="notes-shelf" className="space-y-8 scroll-mt-24">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-emerald/5 pb-5 gap-3">
                        <div className="text-left space-y-1">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Digital Bookstore</span>
                            <h2 className="text-3xl font-serif font-bold text-emerald-dark mt-0.5">Premium Mapped Textbooks for Sale</h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-dark/60 bg-white/5 border border-emerald/5 px-3 py-1.5 rounded-full">
                            <Star className="w-4 h-4 text-gold fill-gold" /> Mapped Syllabus Aligned
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {displayNotes.map((note) => (
                            <div key={note.id} className="card-premium bg-white border border-emerald/5 p-6 flex flex-col group relative">
                                <span className="absolute top-4 right-4 bg-emerald-light/10 text-emerald text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald/10">
                                    {note.category || 'Notes'}
                                </span>
                                
                                <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold-dark flex items-center justify-center mb-5">
                                    <FileText className="w-6 h-6" />
                                </div>

                                <h3 className="font-serif font-bold text-emerald-dark text-base leading-snug mb-3 group-hover:text-emerald transition-colors line-clamp-2">
                                    {note.title}
                                </h3>

                                <div className="text-[9px] text-emerald-dark/50 uppercase tracking-widest font-extrabold space-y-1 mb-6 flex-grow">
                                    <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Mapped for {state.examName}</p>
                                    <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold" /> {note.pages || 250} Pages PDF Textbook</p>
                                    <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Language: {note.language || 'Bilingual'}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald/5 mt-auto">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl font-bold text-emerald-dark">₹{note.price}</span>
                                        {note.originalPrice && (
                                            <span className="text-xs text-emerald-dark/30 line-through">₹{note.originalPrice}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate('/store')}
                                            className="px-4 py-2 bg-emerald text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-dark shadow-sm transition-all duration-300"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── PHASE 3: NETFLIX-STYLE YOUTUBE VIDEO FEED ─────────────── */}
                <section className="space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-emerald/5 pb-5 gap-3">
                        <div className="text-left space-y-1">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Video Lecture Feeds</span>
                            <h2 className="text-3xl font-serif font-bold text-emerald-dark mt-0.5">High-Production Syllabus Classes</h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-dark/60">
                            <Video className="w-4 h-4 text-gold" /> Auto-Feeds Synchronized
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {displayVideos.map((video) => (
                            <div 
                                key={video.id} 
                                className="netflix-card shadow-lg hover:scale-[1.02] transition-transform duration-300 relative group"
                                onClick={() => setSelectedVideo(video)}
                            >
                                <img 
                                    src={video.thumbnail || "https://picsum.photos/400/225"} 
                                    alt={video.title} 
                                    className="w-full h-full object-cover group-hover:brightness-[0.75] transition-all"
                                />
                                
                                <span className="absolute bottom-3 right-3 text-[8px] font-extrabold uppercase px-2 py-0.5 bg-black/80 rounded tracking-widest text-white">
                                    {video.duration || 'LECTURE'}
                                </span>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gold/90 text-emerald-dark rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 pointer-events-none">
                                    <Play className="w-5 h-5 fill-emerald-dark text-emerald-dark ml-0.5" />
                                </div>

                                <div className="netflix-card-overlay text-left">
                                    <h4 className="text-xs font-bold text-white font-serif tracking-wide line-clamp-2 mb-1">
                                        {video.title}
                                    </h4>
                                    <p className="text-[8px] text-gold font-extrabold uppercase tracking-widest">{video.views || 'Strategy Video'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Subscriber CTA Banner */}
                    <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gold/20 shadow-md">
                        <div className="text-left space-y-2">
                            <span className="text-[8px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-gold/20">Official Channel Feed</span>
                            <h3 className="text-lg font-serif font-bold tracking-wide">Never Miss a Strategy Class Notification</h3>
                            <p className="text-xs text-white/70 max-w-xl font-medium">Get notifications for daily analysis of current affairs and UPSC strategy maps.</p>
                        </div>
                        <a 
                            href="https://youtube.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark font-extrabold text-[9px] uppercase tracking-widest rounded-2xl shadow-lg hover:-translate-y-0.5 transition-transform"
                        >
                            Subscribe on YouTube
                        </a>
                    </div>
                </section>
            </div>

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
                                src={selectedVideo.youtubeUrl || `https://www.youtube.com/embed/${selectedVideo.youtubeId || 'W4rR48C6B14'}`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        
                        <div className="p-6 text-left space-y-2">
                            <span className="text-[8px] text-gold font-bold uppercase tracking-widest">{state.examName} Core Class</span>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug pr-12">{selectedVideo.title}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FLOATING STICKY ENROLL CTA BAR ─────────────────────────── */}
            <div className="sticky-cta-bar flex items-center justify-between z-[99]">
                <div className="text-left pr-4 hidden sm:block">
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Prep Center Channel Mapped</p>
                    <p className="text-xs font-serif font-bold text-white">Enroll in {state.name} Civil Services program today</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest leading-none font-bold">Mock Exams Bundle</p>
                        <p className="text-sm font-serif font-extrabold text-gold">₹499 <span className="text-[8px] text-white/60 line-through">₹999</span></p>
                    </div>
                    <button 
                        onClick={() => navigate('/store')}
                        className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg"
                    >
                        Enroll Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StateDetail;
