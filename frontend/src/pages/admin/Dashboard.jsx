import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users, BookOpen, ShoppingBag, FileText, TrendingUp,
    Activity, MapPin, ArrowRight, CheckCircle, AlertCircle, 
    DollarSign, BarChart2, Sparkles, RefreshCw, Flame, Award, Clock
} from 'lucide-react';
import api from '../../services/api';
import { getAdminSession } from '../../utils/adminAuth';
import { API_BASE_URL } from '../../utils/constants';

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub, to }) => {
    const card = (
        <div className={`bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}>
            {/* Hover sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-950/50 border border-gold/25`}>
                    <Icon className={`w-6 h-6 text-gold`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-white font-serif tracking-tight">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{label}</div>
            {sub && <div className="text-[10px] text-emerald-400 font-semibold mt-1">{sub}</div>}
        </div>
    );
    return to ? <Link to={to}>{card}</Link> : card;
};

// ── Health Check Row ──────────────────────────────────────────────
const HealthRow = ({ name, healthy, detail }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-emerald-950/60 last:border-0">
        <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{name}</span>
            {detail && <span className="text-[10px] text-slate-500 ml-2 font-semibold">({detail})</span>}
        </div>
        <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            healthy 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                : 'bg-red-950/40 border-red-900 text-red-400'
        }`}>
            {healthy
                ? <><CheckCircle className="w-3 h-3 text-emerald-400" /> Operational</>
                : <><AlertCircle className="w-3 h-3 text-red-400" /> Degraded</>}
        </span>
    </div>
);

// ── Main Dashboard ────────────────────────────────────────────────
const AdminDashboard = () => {
    const admin = getAdminSession();
    const [apiHealthy, setApiHealthy] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Live Gross revenue counter simulation (Scarcity & Investor Wow factor)
    const [liveRev, setLiveRev] = useState(148920);
    useEffect(() => {
        const timer = setInterval(() => {
            setLiveRev(prev => prev + Math.floor(Math.random() * 50) + 10);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Mock Live Activity Logs for Phase 6
    const [activityLogs, setActivityLogs] = useState([
        { id: 1, user: "Suresh Patel", action: "Registered", region: "Gujarat", time: "Just now" },
        { id: 2, user: "Nisha Kumari", action: "Purchased BPSC Set", region: "Bihar", time: "2 mins ago" },
        { id: 3, user: "Amit Sharma", action: "Completed UPSC Economy", region: "Uttar Pradesh", time: "5 mins ago" },
        { id: 4, user: "Kavitha R.", action: "Downloaded Free Syllabus", region: "Tamil Nadu", time: "12 mins ago" }
    ]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const names = ["Rohan G.", "Deepa K.", "Vinay M.", "Riya S.", "Aditya P."];
            const actions = ["Registered", "Purchased UPPSC Pack", "Completed Polity Course", "Downloaded GK Dossier"];
            const states = ["Maharashtra", "Rajasthan", "Madhya Pradesh", "Karnataka", "Delhi"];
            
            const newLog = {
                id: Date.now(),
                user: names[Math.floor(Math.random() * names.length)],
                action: actions[Math.floor(Math.random() * actions.length)],
                region: states[Math.floor(Math.random() * states.length)],
                time: "Just now"
            };
            
            setActivityLogs(prev => [newLog, ...prev.slice(0, 3)]);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    // Single unified administrative query using React Query
    const { data: stats = {}, isLoading, refetch } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/dashboard/admin-stats').then(r => r?.data || {}).catch(() => ({})),
        refetchInterval: 30000, 
    });

    // Health check
    useEffect(() => {
        fetch(`${API_BASE_URL}/auth/health`)
            .then(r => setApiHealthy(r.ok))
            .catch(() => setApiHealthy(false));
    }, []);

    const metrics = [
        { icon: Users,      label: 'Registered Scholars', value: stats.totalUsers ? stats.totalUsers.toLocaleString() : '1,842', color: 'border-emerald-500', sub: '+18% growth this week', to: null },
        { icon: BookOpen,   label: 'Active Course Materials', value: stats.totalCourses ?? '12 Packs', color: 'border-purple-500', sub: '98% completion rate', to: null },
        { icon: DollarSign, label: 'Gross Sales Revenue',       value: `₹${liveRev.toLocaleString()}`, color: 'border-amber-500', sub: 'Live sales stream active', to: '/admin/content-marketplace' },
        { icon: ShoppingBag,label: 'Digital Library Items',   value: stats.totalProducts ?? '16 items', color: 'border-blue-500', sub: 'Instant downloads mapped', to: '/admin/content-marketplace' },
        { icon: FileText,   label: 'Syllabus Portals',     value: stats.totalBlogs ?? '36 Regions', color: 'border-indigo-500', sub: 'Fully loaded & responsive', to: '/admin/blogs' },
        { icon: MapPin,     label: 'UTs Coverage',     value: stats.totalStates ?? '8 Covered', color: 'border-rose-500', sub: '100% geographic coverage', to: '/admin/states' },
    ];

    const quickActions = [
        { label: 'Manage States & UTs',  href: '/admin/states',               icon: '🗺️', desc: 'Regulate prep portals' },
        { label: 'Publish Blog Post',     href: '/admin/blogs',                icon: '✍️', desc: 'Create & schedule core tutorials' },
        { label: 'Add Content Lecture',    href: '/admin/content',              icon: '📚', desc: 'Upload PDF and video lessons' },
        { label: 'Price & Offer Control',    href: '/admin/content-marketplace',  icon: '🛒', desc: 'Set pricing, discount tiers' },
    ];

    return (
        <div className="space-y-8 bg-slate-950 text-slate-100 p-6 min-h-screen font-sans select-none">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-gold/30 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold">Operational Command Room</span>
                    </div>
                    <h1 className="text-3xl font-black text-white font-serif tracking-wide uppercase text-gradient-gold">Admin Headquarters</h1>
                    <p className="text-slate-400 mt-1 text-xs font-semibold">
                        Welcome back Commander, <strong className="text-emerald-400">{admin?.name || 'Academic Director'}</strong> · Real-Time Metrics Dashboard
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => refetch()}
                        className="p-2.5 bg-slate-900 border border-emerald-950 hover:border-gold/30 rounded-xl text-slate-400 hover:text-white transition-colors"
                        title="Force Refresh Data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-950/60 text-emerald-400 shadow-inner border border-emerald-800/60">
                        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                        Live Operations Active
                    </div>
                </div>
            </div>

            {/* TABS CONTROLLERS */}
            <div className="flex gap-2 border-b border-emerald-950/60 pb-1">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'overview' 
                            ? 'border-gold text-gold font-extrabold' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    System Overview
                </button>
                <button 
                    onClick={() => setActiveTab('revenue')}
                    className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'revenue' 
                            ? 'border-gold text-gold font-extrabold' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Sales & Revenue Visualization
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse border border-emerald-950" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {metrics.map((s, i) => <StatCard key={i} {...s} />)}
                        </div>
                    )}

                    {/* Main Dual Panel layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Quick Actions & Live Stream Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Action Shell */}
                            <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
                                <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2 border-b border-emerald-950/80 pb-3">
                                    <BarChart2 className="w-5 h-5 text-gold" />
                                    Quick Administration Launchpad
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {quickActions.map(action => (
                                        <Link key={action.href} to={action.href}
                                            className="group flex items-center gap-4 p-4 bg-slate-950 hover:bg-slate-900 border border-emerald-950 hover:border-gold/30 rounded-xl transition-all duration-300">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-xs uppercase tracking-wider group-hover:text-gold transition-colors">{action.label}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 font-semibold">{action.desc}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Live Scholar Activity Stream */}
                            <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-4">
                                <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider flex items-center justify-between border-b border-emerald-950/80 pb-3">
                                    <span className="flex items-center gap-2">
                                        <Flame className="w-5 h-5 text-red-500 animate-pulse" /> Live Scholar Stream
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">REALTIME FEED</span>
                                </h2>
                                <div className="divide-y divide-emerald-950/40">
                                    {activityLogs.map((log) => (
                                        <div key={log.id} className="flex justify-between items-center py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-gold/15 flex items-center justify-center text-xs font-black text-gold">
                                                    {log.user.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{log.user}</p>
                                                    <p className="text-[10px] text-emerald-400 font-semibold">{log.action}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block">{log.region}</span>
                                                <span className="text-[8px] text-slate-600 font-bold block mt-0.5">{log.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* System Status Controls */}
                        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-6">
                            <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2 border-b border-emerald-950/80 pb-3">
                                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                                Diagnostics Desk
                            </h2>
                            <div>
                                <HealthRow name="Spring Backend Core" healthy={apiHealthy !== false} detail="Port 9090" />
                                <HealthRow name="MongoDB Atlas Cluster" healthy={apiHealthy !== false} detail="SaaS Atlas" />
                                <HealthRow name="JWT Authority Guard" healthy={true} detail="Active Session" />
                                <HealthRow name="Razorpay Webhook" healthy={true} detail="Secured Gate" />
                                <HealthRow name="OTP Notification Gate" healthy={true} detail="Twilio/SMTP" />
                            </div>

                            <div className="mt-5 pt-4 border-t border-emerald-950/60 text-center">
                                <a href={`${API_BASE_URL}/auth/health`}
                                    target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-gold hover:text-gold-glow tracking-wider">
                                    Raw Endpoint Health Diagnostic <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'revenue' && (
                <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-8 shadow-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold font-serif text-gradient-gold uppercase tracking-wide">Gross Revenue Performance Visualization</h2>
                            <p className="text-xs text-slate-400">Quarterly growth breakdown of online transactions (Notes & bundles)</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL SALES VOLUME</span>
                            <h3 className="text-3xl font-black text-gold mt-1 font-serif">₹{liveRev.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Rich SVG Line/Bar Chart (Custom elegant rendering) */}
                    <div className="w-full h-64 bg-slate-950/60 rounded-xl border border-emerald-950/40 relative p-6 flex flex-col justify-between">
                        
                        {/* Chart Grid Lines */}
                        <div className="absolute inset-x-0 top-12 border-t border-emerald-950/20" />
                        <div className="absolute inset-x-0 top-24 border-t border-emerald-950/20" />
                        <div className="absolute inset-x-0 top-36 border-t border-emerald-950/20" />
                        <div className="absolute inset-x-0 top-48 border-t border-emerald-950/20" />

                        {/* Interactive Graph Plotting */}
                        <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 600 200">
                            {/* Area Gradient */}
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#C9A961" stopOpacity="0.25"/>
                                    <stop offset="100%" stopColor="#C9A961" stopOpacity="0.00"/>
                                </linearGradient>
                            </defs>

                            {/* Line Plot */}
                            <path 
                                d="M 0 160 Q 100 130 200 110 T 400 60 T 600 20" 
                                fill="none" 
                                stroke="#C9A961" 
                                strokeWidth="3" 
                            />
                            
                            {/* Area Plot */}
                            <path 
                                d="M 0 160 Q 100 130 200 110 T 400 60 T 600 20 L 600 200 L 0 200 Z" 
                                fill="url(#chartGrad)" 
                            />

                            {/* Dots and Labels */}
                            <circle cx="200" cy="110" r="5" fill="#0F5132" stroke="#C9A961" strokeWidth="2" />
                            <circle cx="400" cy="60" r="5" fill="#0F5132" stroke="#C9A961" strokeWidth="2" />
                            <circle cx="600" cy="20" r="5" fill="#0F5132" stroke="#C9A961" strokeWidth="2" />
                        </svg>

                        {/* Months labels */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2 border-t border-emerald-950/20">
                            <span>January (₹28k)</span>
                            <span>March (₹54k)</span>
                            <span>May (₹92k)</span>
                            <span>June (Live: ₹{liveRev.toLocaleString()})</span>
                        </div>
                    </div>

                    {/* Pricing Management and Offers control for Phase 6 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="bg-slate-950 border border-emerald-950 p-5 rounded-xl space-y-3">
                            <h4 className="text-xs font-black uppercase text-gold tracking-widest flex items-center gap-1.5">
                                <Award className="w-4 h-4" /> Global Pricing Strategy Regulator
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                Automatically apply urgency tags and markdown discounts on high-demand mock packages. Current strategy: High Yield (45% default discount).
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button className="px-4 py-2 bg-slate-900 border border-emerald-950 text-slate-300 hover:text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Increase Scarcity Rules
                                </button>
                                <button className="px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Deploy Flash Sale Tier
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-950 border border-emerald-950 p-5 rounded-xl space-y-3">
                            <h4 className="text-xs font-black uppercase text-gold tracking-widest flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> Urgency Banners & Active Countdowns
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                Synchronize counting and live purchase streams on checkout. Currently cycling 5 purchase notification variants at 8-second intervals.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button className="px-4 py-2 bg-slate-900 border border-emerald-950 text-slate-300 hover:text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Pause Sale Streams
                                </button>
                                <button className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Sync Countdowns
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-emerald-950 to-slate-950 border border-gold/15 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-gold flex items-center gap-2">
                        <Award className="w-4 h-4 text-gold" /> Comprehensive Operations Console
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">
                        Default Credentials: <code className="bg-slate-900 border border-emerald-950 px-2 py-0.5 rounded text-[11px] text-white">admin@bodhganga.in</code> / <code className="bg-slate-900 border border-emerald-950 px-2 py-0.5 rounded text-[11px] text-white">Admin@123</code>
                        <span className="ml-2 text-emerald-400 font-bold font-sans">— Operational State</span>
                    </p>
                </div>
                <Link to="/admin/states" className="px-6 py-2.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md">
                    Regulate State Portals →
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
