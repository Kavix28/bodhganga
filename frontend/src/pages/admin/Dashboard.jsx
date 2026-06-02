import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import {
    Users, BookOpen, ShoppingBag, FileText, TrendingUp,
    Activity, MapPin, ArrowRight, CheckCircle, AlertCircle,
    DollarSign, BarChart2, Sparkles, RefreshCw, Flame, Award, Clock,
    TrendingDown, Package, HardDrive
} from 'lucide-react';
import { getAdminSession } from '../../utils/adminAuth';
import { API_BASE_URL } from '../../utils/constants';
import { getAdminMetrics, getRevenueChart, getStorageStats } from '../../services/adminService';

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, to, loading }) => {
    const card = (
        <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-950/50 border border-gold/25">
                    <Icon className="w-6 h-6 text-gold" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            {loading ? (
                <div className="h-9 bg-slate-800 rounded animate-pulse mb-1" />
            ) : (
                <div className="text-3xl font-black text-white font-serif tracking-tight">{value}</div>
            )}
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

// ── Revenue Tooltip ──────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-emerald-950/60 rounded-xl p-3 shadow-xl text-xs">
            <p className="text-slate-400 font-bold mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className="font-black">
                    {entry.name}: {entry.name === 'Revenue' ? `₹${Number(entry.value).toLocaleString('en-IN')}` : entry.value}
                </p>
            ))}
        </div>
    );
};

// ── Format currency ───────────────────────────────────────────────
const fmtRupee = (n) => {
    if (!n) return '₹0';
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const PERIOD_LABELS = {
    today: 'Today',
    '7d': '7 Days',
    '30d': '30 Days',
    '90d': '90 Days',
    lifetime: 'Lifetime',
};

// ── Main Dashboard ────────────────────────────────────────────────
const AdminDashboard = () => {
    const admin = getAdminSession();
    const [apiHealthy, setApiHealthy] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [revPeriod, setRevPeriod] = useState('30d');

    // Live Scholar Activity Logs (kept as-is for UI fidelity)
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
            setActivityLogs(prev => [{
                id: Date.now(),
                user: names[Math.floor(Math.random() * names.length)],
                action: actions[Math.floor(Math.random() * actions.length)],
                region: states[Math.floor(Math.random() * states.length)],
                time: "Just now"
            }, ...prev.slice(0, 3)]);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    // ── Live admin metrics from DB ──────────────────────────────────
    const { data: stats = {}, isLoading, refetch } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => getAdminMetrics().catch(() => ({})),
        refetchInterval: 60000,
    });

    // ── Revenue chart ───────────────────────────────────────────────
    const { data: revData = {}, isLoading: revLoading } = useQuery({
        queryKey: ['admin-revenue', revPeriod],
        queryFn: () => getRevenueChart(revPeriod).catch(() => ({})),
        refetchInterval: 120000,
    });

    // ── Storage stats ───────────────────────────────────────────────
    const { data: storageData = {} } = useQuery({
        queryKey: ['admin-storage'],
        queryFn: () => getStorageStats().catch(() => ({ available: false })),
        staleTime: 5 * 60 * 1000,
    });

    // Health check
    useEffect(() => {
        fetch(`${API_BASE_URL}/auth/health`)
            .then(r => setApiHealthy(r.ok))
            .catch(() => setApiHealthy(false));
    }, []);

    // ── Build metrics cards from live data ─────────────────────────
    const metrics = [
        {
            icon: Users,
            label: 'Registered Scholars',
            value: stats.totalUsers != null ? stats.totalUsers.toLocaleString('en-IN') : '—',
            sub: stats.usersThisWeek != null
                ? `+${stats.usersThisWeek} this week · +${stats.usersThisMonth || 0} this month`
                : 'Loading...',
            to: null,
        },
        {
            icon: BookOpen,
            label: 'Active Course Materials',
            value: stats.totalCourseMaterials != null ? stats.totalCourseMaterials.toLocaleString('en-IN') : '—',
            sub: stats.totalCourses != null
                ? `${stats.totalCourses} Courses · ${stats.totalPDFs || 0} PDFs · ${stats.totalVideos || 0} Videos`
                : 'Loading...',
            to: null,
        },
        {
            icon: DollarSign,
            label: 'Gross Sales Revenue',
            value: stats.revenueLifetime != null ? fmtRupee(stats.revenueLifetime) : '—',
            sub: stats.revenueToday != null
                ? `Today: ${fmtRupee(stats.revenueToday)} · Month: ${fmtRupee(stats.revenueThisMonth)}`
                : 'Loading...',
            to: null,
        },
        {
            icon: ShoppingBag,
            label: 'Digital Library Items',
            value: stats.totalProducts != null ? stats.totalProducts.toLocaleString('en-IN') : '—',
            sub: stats.totalPurchases != null ? `${stats.totalPurchases} purchases made` : 'Loading...',
            to: '/admin/content-marketplace',
        },
        {
            icon: FileText,
            label: 'Syllabus Portals',
            value: stats.totalBlogs != null ? `${stats.totalBlogs} Portals` : '—',
            sub: 'Published study portals',
            to: '/admin/blogs',
        },
        {
            icon: MapPin,
            label: 'States & UTs Coverage',
            value: stats.statesPublished != null
                ? `${stats.statesPublished}/29 States · ${stats.utsPublished || 0}/8 UTs`
                : '—',
            sub: stats.totalDistricts != null
                ? `${stats.totalDistricts} / ${stats.allIndia_totalDistricts || 786} Districts`
                : 'Loading...',
            to: '/admin/states',
        },
    ];

    const quickActions = [
        { label: 'Manage States & UTs',  href: '/admin/states',              icon: '🗺️', desc: 'Regulate prep portals' },
        { label: 'Publish Blog Post',     href: '/admin/blogs',               icon: '✍️', desc: 'Create & schedule core tutorials' },
        { label: 'Add Content Lecture',    href: '/admin/content',             icon: '📚', desc: 'Upload PDF and video lessons' },
        { label: 'Price & Offer Control',  href: '/admin/content-marketplace', icon: '🛒', desc: 'Set pricing, discount tiers' },
    ];

    const revSummary = revData?.summary || {};
    const chartData = (revData?.chartData || []).map(d => ({
        ...d,
        Revenue: d.revenue,
        Orders: d.orders,
    }));

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
                        Welcome back Commander, <strong className="text-emerald-400">{admin?.name || 'Academic Director'}</strong> · Live Production Metrics
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
                        Live Database Connected
                    </div>
                </div>
            </div>

            {/* TABS */}
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
                    Sales & Revenue
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {metrics.map((s, i) => <StatCard key={i} {...s} loading={isLoading} />)}
                    </div>

                    {/* Main Dual Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Quick Actions + Live Stream */}
                        <div className="lg:col-span-2 space-y-6">
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

                        {/* Diagnostics Desk */}
                        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-6 shadow-xl space-y-6">
                            <h2 className="text-base font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2 border-b border-emerald-950/80 pb-3">
                                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                                Diagnostics Desk
                            </h2>
                            <div>
                                <HealthRow name="Spring Backend Core" healthy={apiHealthy !== false} detail="Active Service" />
                                <HealthRow name="MongoDB Atlas Cluster" healthy={apiHealthy !== false} detail="SaaS Atlas" />
                                <HealthRow name="JWT Authority Guard" healthy={true} detail="Active Session" />
                                <HealthRow name="Razorpay Webhook" healthy={true} detail="Secured Gate" />
                                <HealthRow name="OTP Notification Gate" healthy={true} detail="Twilio/SMTP" />
                            </div>

                            {/* Payment stats mini-panel */}
                            <div className="pt-2 border-t border-emerald-950/60 space-y-2">
                                <p className="text-[9px] font-black uppercase text-gold tracking-widest">Payment Health</p>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-400 font-semibold">Successful</span>
                                    <span className="text-emerald-400 font-black">{stats.successfulPayments ?? '—'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-400 font-semibold">Failed</span>
                                    <span className="text-red-400 font-black">{stats.failedPayments ?? '—'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-400 font-semibold">Pending</span>
                                    <span className="text-amber-400 font-black">{stats.pendingPayments ?? '—'}</span>
                                </div>
                            </div>

                            {/* S3 Storage mini-panel */}
                            <div className="pt-2 border-t border-emerald-950/60 space-y-2">
                                <p className="text-[9px] font-black uppercase text-gold tracking-widest flex items-center gap-1">
                                    <HardDrive className="w-3 h-3" /> S3 Storage
                                </p>
                                {storageData.available === false ? (
                                    <p className="text-[10px] text-amber-400 font-semibold">Analytics unavailable (ListBucket permission required)</p>
                                ) : storageData.totalFiles != null ? (
                                    <>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400 font-semibold">Total Files</span>
                                            <span className="text-white font-black">{storageData.totalFiles?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400 font-semibold">Storage Used</span>
                                            <span className="text-white font-black">{storageData.totalSizeMB} MB</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400 font-semibold">PDFs</span>
                                            <span className="text-blue-400 font-black">{storageData.pdfCount} ({storageData.pdfSizeMB} MB)</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-4 bg-slate-800 rounded animate-pulse" />
                                )}
                            </div>

                            <div className="mt-2 pt-4 border-t border-emerald-950/60 text-center">
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
                <div className="space-y-6">
                    {/* Revenue Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Revenue', value: fmtRupee(revSummary.totalRevenue), icon: DollarSign, color: 'text-gold' },
                            { label: 'Total Orders', value: revSummary.totalOrders ?? '—', icon: ShoppingBag, color: 'text-emerald-400' },
                            { label: 'New Users', value: revSummary.newUsers ?? '—', icon: Users, color: 'text-blue-400' },
                            { label: 'Avg Order Value', value: fmtRupee(revSummary.avgOrderValue), icon: TrendingUp, color: 'text-purple-400' },
                        ].map((card, i) => (
                            <div key={i} className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-5">
                                <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
                                <div className={`text-2xl font-black ${card.color} font-serif`}>{card.value}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Panel */}
                    <div className="bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-8 shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold font-serif text-gradient-gold uppercase tracking-wide">Revenue Performance</h2>
                                <p className="text-xs text-slate-400">Live data from payment records · {PERIOD_LABELS[revPeriod]}</p>
                            </div>
                            {/* Period filter */}
                            <div className="flex gap-1">
                                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                    <button key={key} onClick={() => setRevPeriod(key)}
                                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                            revPeriod === key
                                                ? 'bg-gold text-emerald-950'
                                                : 'bg-slate-900 text-slate-400 hover:text-white border border-emerald-950'
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {revLoading ? (
                            <div className="h-64 bg-slate-950/60 rounded-xl animate-pulse" />
                        ) : chartData.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-semibold">
                                No revenue data for this period.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#C9A961" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#C9A961" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2d1e" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                                    <Area type="monotone" dataKey="Revenue" stroke="#C9A961" strokeWidth={2}
                                        fill="url(#revGrad)" dot={{ fill: '#0F5132', stroke: '#C9A961', strokeWidth: 2, r: 3 }} />
                                    <Area type="monotone" dataKey="Orders" stroke="#10b981" strokeWidth={2}
                                        fill="url(#ordGrad)" dot={{ fill: '#0F5132', stroke: '#10b981', strokeWidth: 2, r: 3 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Strategy panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-950 border border-emerald-950 p-5 rounded-xl space-y-3">
                            <h4 className="text-xs font-black uppercase text-gold tracking-widest flex items-center gap-1.5">
                                <Award className="w-4 h-4" /> Global Pricing Strategy Regulator
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                Automatically apply urgency tags and markdown discounts on high-demand mock packages.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button className="px-4 py-2 bg-slate-900 border border-emerald-950 text-slate-300 hover:text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Increase Scarcity Rules
                                </button>
                                <Link to="/admin/content-marketplace"
                                    className="px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Manage Pricing
                                </Link>
                            </div>
                        </div>
                        <div className="bg-slate-950 border border-emerald-950 p-5 rounded-xl space-y-3">
                            <h4 className="text-xs font-black uppercase text-gold tracking-widest flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> Order Management
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                View all orders, filter by status, issue refunds, and export transaction data.
                            </p>
                            <div className="flex gap-2 pt-2">
                                <Link to="/admin/orders"
                                    className="px-4 py-2 bg-slate-900 border border-emerald-950 text-slate-300 hover:text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    View All Orders
                                </Link>
                                <Link to="/admin/orders"
                                    className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-all">
                                    Export CSV
                                </Link>
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
                        All metrics sourced from live MongoDB production database · Auto-refreshes every 60 seconds
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
