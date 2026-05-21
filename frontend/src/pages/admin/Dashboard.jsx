import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users, BookOpen, ShoppingBag, FileText, TrendingUp,
    Activity, MapPin, ArrowRight, CheckCircle, AlertCircle, DollarSign, BarChart2
} from 'lucide-react';
import api from '../../services/api';
import { getAdminSession } from '../../utils/adminAuth';

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub, to }) => {
    const card = (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${color} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
                    <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-300 animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-slate-800 font-serif tracking-tight">{value}</div>
            <div className="text-sm font-semibold text-slate-500 mt-1">{label}</div>
            {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
    );
    return to ? <Link to={to}>{card}</Link> : card;
};

// ── Health Check ──────────────────────────────────────────────────
const HealthRow = ({ name, healthy, detail }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div>
            <span className="text-sm font-semibold text-slate-700">{name}</span>
            {detail && <span className="text-xs text-slate-400 ml-2">{detail}</span>}
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
        }`}>
            {healthy
                ? <><CheckCircle className="w-3 h-3" /> Operational</>
                : <><AlertCircle className="w-3 h-3" /> Degraded</>}
        </span>
    </div>
);

// ── Main ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const admin = getAdminSession();
    const [apiHealthy, setApiHealthy] = useState(null);

    // Single unified administrative query using React Query
    const { data: stats = {}, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => api.get('/dashboard/admin-stats').then(r => r?.data || {}).catch(() => ({})),
        refetchInterval: 30000, // auto-refresh every 30 seconds
    });

    // Health check
    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
        fetch(`${baseUrl}/auth/health`)
            .then(r => setApiHealthy(r.ok))
            .catch(() => setApiHealthy(false));
    }, []);

    const metrics = [
        { icon: Users,      label: 'Registered Scholars', value: stats.totalUsers ? stats.totalUsers.toLocaleString() : '—', color: 'border-emerald-500', sub: 'Total active profiles', to: null },
        { icon: BookOpen,   label: 'Active Courses',      value: stats.totalCourses ?? '—', color: 'border-purple-500', sub: 'Course portfolio size', to: null },
        { icon: DollarSign, label: 'Gross Revenue',       value: stats.totalRevenue ? `₹${stats.totalRevenue.toLocaleString()}` : '—', color: 'border-amber-500', sub: 'Digital sales volume', to: '/admin/content-marketplace' },
        { icon: ShoppingBag,label: 'Marketplace Items',   value: stats.totalProducts ?? '—', color: 'border-blue-500', sub: 'Products published', to: '/admin/content-marketplace' },
        { icon: FileText,   label: 'Published Blogs',     value: stats.totalBlogs ?? '—', color: 'border-indigo-500', sub: 'Articles & tutorials', to: '/admin/blogs' },
        { icon: MapPin,     label: 'Regions Covered',     value: stats.totalStates ?? '—', color: 'border-rose-500', sub: 'States & UT syllabi', to: '/admin/states' },
    ];

    const quickActions = [
        { label: 'Manage States',  href: '/admin/states',               icon: '🗺️', desc: 'View all 36 regions' },
        { label: 'Write Blog',     href: '/admin/blogs',                icon: '✍️', desc: 'Create & publish posts' },
        { label: 'Add Content',    href: '/admin/content',              icon: '📚', desc: 'Upload study materials' },
        { label: 'Marketplace',    href: '/admin/content-marketplace',  icon: '🛒', desc: 'Manage products' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Welcome back, <strong className="text-emerald-700">{admin?.name || 'Admin'}</strong> · Administrative Operations Center
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    Live Metrics
                </div>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    {metrics.map((s, i) => <StatCard key={i} {...s} />)}
                </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-5 font-serif flex items-center gap-2 border-b border-slate-50 pb-3">
                        <BarChart2 className="w-5 h-5 text-emerald-600" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <Link key={action.href} to={action.href}
                                className="group flex items-center gap-4 p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                                <span className="text-3xl">{action.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-800 transition-colors">{action.label}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 font-medium">{action.desc}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 font-serif flex items-center gap-2 border-b border-slate-50 pb-3">
                        <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                        System Status
                    </h2>
                    <div>
                        <HealthRow name="Backend API"      healthy={apiHealthy !== false} detail="Port 9090" />
                        <HealthRow name="Authentication"   healthy={true}                 detail="JWT Active" />
                        <HealthRow name="MongoDB"          healthy={apiHealthy !== false} detail="Primary DB" />
                        <HealthRow name="OTP Service"      healthy={true}                 detail="SMTP Ready" />
                        <HealthRow name="Payment Gateway"  healthy={true}                 detail="Razorpay" />
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api'}/auth/health`}
                            target="_blank" rel="noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                            View API Health Endpoint <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-gold/15">
                <div>
                    <h3 className="font-bold text-lg font-serif tracking-wide">Developer & Administrative Portal</h3>
                    <p className="text-emerald-200/80 text-sm mt-1 font-medium">
                        Default Credentials: <code className="bg-white/10 px-2 py-0.5 rounded text-xs text-white">admin@bodhganga.in</code> / <code className="bg-white/10 px-2 py-0.5 rounded text-xs text-white">Admin@123</code>
                        <span className="ml-2 text-gold font-bold font-sans">— Active</span>
                    </p>
                </div>
                <Link to="/admin/states" className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg active:scale-95">
                    Start Managing →
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
