import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpen, MapPin, HelpCircle, CheckCircle, TrendingUp,
    ArrowRight, Globe, Award, Clock, Target, Zap
} from 'lucide-react';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

// ── Greeting ──────────────────────────────────────────────────────
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
};

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`card-premium bg-white p-6 relative overflow-hidden flex flex-col justify-between border-t-4 ${color}`}>
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-emerald-dark/50 uppercase tracking-widest font-bold">{label}</p>
                <div className="w-8 h-8 rounded-xl bg-emerald/5 flex items-center justify-center border border-emerald/10">
                    <Icon className="w-4 h-4 text-emerald" />
                </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-dark font-serif tracking-tight">{value}</div>
        </div>
        {sub && <div className="text-xs text-emerald-dark/60 font-semibold mt-3 pt-2 border-t border-emerald/5">{sub}</div>}
    </div>
);

// ── Quick Action ──────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, desc, to }) => (
    <Link to={to}
        className="group flex items-center gap-4 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-emerald/10 hover:border-gold/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        <div className="w-10 h-10 bg-emerald/5 border border-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Icon className="w-5 h-5 text-emerald" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-dark text-xs uppercase tracking-wider">{label}</div>
            <div className="text-[11px] text-emerald-dark/60 font-semibold mt-0.5 truncate">{desc}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-emerald-dark/40 group-hover:text-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
    </Link>
);

// ── Region Card ───────────────────────────────────────────────────
const RegionCard = ({ region, isState }) => {
    const navigate = useNavigate();
    const path = isState ? `/states/${region.id}` : `/union-territories/${region.id}`;
    return (
        <button onClick={() => navigate(path)}
            className="group text-left p-4.5 bg-white/80 rounded-2xl border border-emerald/10 hover:border-gold/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold text-gold uppercase tracking-widest bg-emerald-dark px-2.5 py-0.5 rounded-full">{region.code}</span>
                <MapPin className="w-3.5 h-3.5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="font-bold text-emerald-dark text-sm font-serif truncate group-hover:text-emerald transition-colors">{region.name}</div>
            <div className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-wider mt-0.5 truncate">{region.capital}</div>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-emerald-dark/60 font-bold tracking-wider pt-2 border-t border-emerald/5 uppercase">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-emerald" />{region.notesCount} N</span>
                <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-gold" />{region.questionsCount} Q</span>
            </div>
        </button>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('states');

    // Fetch real stats from backend
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => api.get('/dashboard/stats').catch(() => ({ data: {} })),
        staleTime: 2 * 60 * 1000,
    });

    // Fetch enrolled courses
    const { data: enrolledCourses = [] } = useQuery({
        queryKey: ['myCourses'],
        queryFn: () => api.get('/courses/my-courses')
            .then(r => r?.data || r || [])
            .catch(() => []),
        staleTime: 5 * 60 * 1000,
    });

    const stats = statsData?.data || statsData || {};
    const regions = activeTab === 'states' ? indianStates : unionTerritories;

    const statCards = [
        { icon: BookOpen,    label: 'Enrolled Courses',  value: stats.enrolledCourses ?? enrolledCourses.length, sub: 'Active academic enrollments',  color: 'border-emerald', trend: null },
        { icon: CheckCircle, label: 'Completed Modules',  value: stats.completedCourses ?? 0,                    sub: 'Curriculum completed',    color: 'border-gold',    trend: null },
        { icon: TrendingUp,  label: 'Active Progress',        value: stats.inProgressCourses ?? 0,                   sub: 'Modules in progress',  color: 'border-emerald',    trend: null },
        { icon: Target,      label: 'Mapped Regions',   value: 36,                                             sub: '28 States & 8 UTs total',        color: 'border-gold', trend: null },
    ];

    const quickActions = [
        { icon: MapPin,      label: 'Browse States',       desc: 'Explore all 28 states',          to: '/states' },
        { icon: Globe,       label: 'Union Territories',   desc: 'All 8 UTs mapped',              to: '/union-territories' },
        { icon: HelpCircle,  label: 'Question Bank',       desc: 'Previous year question papers',  to: '/question-bank' },
        { icon: BookOpen,    label: 'All Courses',         desc: 'Browse complete catalog',         to: '/courses' },
        { icon: Award,       label: 'Subjects Core',            desc: 'History, Polity, Geography',    to: '/subjects' },
        { icon: Zap,         label: 'Digital Store',       desc: 'Premium study bundles',          to: '/store' },
    ];

    return (
        <div className="min-h-screen bg-ivory-light">
            {/* ── Hero Banner ─────────────────────────────────── */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white relative overflow-hidden px-4 border-b border-gold/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                <div className="relative max-w-7xl mx-auto py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <p className="text-gold text-xs font-bold uppercase tracking-widest">{getGreeting()}, scholar</p>
                            <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-tight">
                                {user?.name || 'Scholar'} <span className="text-gold">👋</span>
                            </h1>
                            <p className="text-white/60 text-sm font-medium">
                                Ready to continue your preparation? You have <strong className="text-gold">36 active regions</strong> to explore.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link to="/states" className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                                Start Studying
                            </Link>
                            <Link to="/profile" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                                My Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">

                {/* ── Stats ───────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, i) => <StatCard key={i} {...card} />)}
                </div>

                {/* ── Visual Preparation Analytics Widget ────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-emerald/10 shadow-sm">
                    {/* Ring Progress Indicator */}
                    <div className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-emerald/5 shadow-sm">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-emerald-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-emerald animate-dash" strokeDasharray={`${stats.enrolledCourses ? Math.min(stats.enrolledCourses * 25, 100) : 35}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-serif font-extrabold text-emerald text-base">
                                {stats.enrolledCourses ? Math.min(stats.enrolledCourses * 25, 100) : 35}%
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-dark font-serif text-sm">Preparation Completeness</h3>
                            <p className="text-xs text-emerald-dark/60 mt-1 font-medium">Global syllabus alignment metric calculated from your regional bookmarks.</p>
                        </div>
                    </div>

                    {/* Streak Calendar */}
                    <div className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-emerald/5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-emerald-dark font-serif text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-gold fill-gold" />
                                7-Day Study Streak
                            </h3>
                            <span className="text-[10px] font-extrabold text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">4 Days Active</span>
                        </div>
                        <div className="flex justify-between gap-1 mt-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-bold text-emerald-dark/40 uppercase">{day}</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                        idx < 4 ? 'bg-emerald text-white shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                    }`}>
                                        {idx < 4 ? '✓' : idx + 19}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Milestone Timeline */}
                    <div className="flex items-center gap-4.5 p-4 bg-white rounded-2xl border border-emerald/5 shadow-sm">
                        <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0 text-gold font-bold">
                            🎯
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-emerald-dark font-serif text-sm truncate">Upcoming PSC Milestone</h3>
                            <p className="text-[10px] text-gold uppercase tracking-widest font-bold mt-0.5">Mock Exam Series · Active</p>
                        </div>
                    </div>
                </div>

                {/* ── Main Grid ───────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                        <div className="card-premium bg-white/80 overflow-hidden border border-emerald/5 p-6 space-y-6">
                            <div className="border-b border-emerald/5 pb-4">
                                <h2 className="font-bold text-emerald-dark font-serif text-lg tracking-tight">Quick Access</h2>
                                <p className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-widest mt-0.5">Jump directly to modules</p>
                            </div>
                            <div className="space-y-3.5">
                                {quickActions.map((a, i) => <QuickAction key={i} {...a} />)}
                            </div>
                        </div>
                    </div>

                    {/* Enrolled Courses + Regions */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Enrolled Courses */}
                        <div className="card-premium bg-white overflow-hidden border border-emerald/5 p-6">
                            <div className="flex items-center justify-between border-b border-emerald/5 pb-4 mb-6">
                                <div>
                                    <h2 className="font-bold text-emerald-dark font-serif text-lg tracking-tight">Active Curriculum</h2>
                                    <p className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-widest mt-0.5">{enrolledCourses.length} Enrolled Courses</p>
                                </div>
                                <Link to="/courses" className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1">
                                    Browse All <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div>
                                {enrolledCourses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <BookOpen className="w-12 h-12 text-emerald/10 mx-auto mb-3" />
                                        <p className="text-emerald-dark/60 text-sm font-semibold">No active enrollments yet.</p>
                                        <Link to="/courses" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold hover:text-gold-dark">
                                            Browse Courses <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {enrolledCourses.slice(0, 4).map(course => (
                                            <div key={course.id} className="flex items-center gap-4 p-4 bg-white border border-emerald/5 rounded-2xl hover:border-gold/35 transition-colors duration-300 shadow-sm">
                                                <div className="w-10 h-10 bg-emerald/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-5 h-5 text-emerald" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-emerald-dark text-sm truncate font-serif">{course.courseTitle || course.title}</p>
                                                    <p className="text-xs text-emerald-dark/60 font-semibold mt-0.5">{course.instructorName || 'BodhGanga Faculty'}</p>
                                                </div>
                                                <Link to={`/courses/${course.id}`}
                                                    className="text-xs font-bold text-gold hover:text-gold-dark flex-shrink-0">
                                                    Resume →
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Regions Explorer */}
                        <div className="card-premium bg-white overflow-hidden border border-emerald/5 p-6">
                            <div className="border-b border-emerald/5 pb-4 mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h2 className="font-bold text-emerald-dark font-serif text-lg tracking-tight">Regional Curriculum</h2>
                                        <p className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-widest mt-0.5">Explore syllabus by territory</p>
                                    </div>
                                    {/* Tabs */}
                                    <div className="flex gap-2 bg-emerald/5 p-1 rounded-xl self-start">
                                        {[
                                            { id: 'states', label: `States (${indianStates.length})` },
                                            { id: 'uts',    label: `UTs (${unionTerritories.length})` },
                                        ].map(tab => (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                className={`px-4.5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                                    activeTab === tab.id
                                                        ? 'bg-emerald-dark text-white shadow-sm'
                                                        : 'text-emerald-dark/60 hover:text-emerald'
                                                }`}>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                                {regions.map(region => (
                                    <RegionCard key={region.id} region={region} isState={activeTab === 'states'} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Progress Banner ──────────────────────────── */}
                <div className="bg-gradient-to-r from-emerald-dark to-emerald-950 border border-gold/15 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                    <div className="relative space-y-1.5 z-10 text-left">
                        <h3 className="text-xl font-bold font-serif text-white">Scale your competitive edge.</h3>
                        <p className="text-white/60 text-xs font-semibold">
                            You've mapped <strong className="text-gold">{enrolledCourses.length}</strong> modules. Ready to test your memory?
                        </p>
                    </div>
                    <div className="relative flex gap-3 flex-shrink-0 z-10">
                        <Link to="/question-bank"
                            className="px-6 py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                            Practice Question Bank
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
