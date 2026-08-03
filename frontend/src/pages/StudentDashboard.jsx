import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
    BookOpen, CheckCircle, Clock, Trophy, Bell, Lock, ArrowRight,
    Flame, Target, Award, Calendar, Activity, ShieldCheck,
    GraduationCap, Compass, Zap, Landmark, Scale, ClipboardList
} from 'lucide-react';
import api from '../services/api';

const formatSlug = (slug) => {
    if (!slug) return '';
    let clean = slug;
    if (slug.startsWith('district-')) {
        const parts = slug.split('-');
        clean = parts.slice(2).join(' ');
    } else {
        clean = slug.replace(/-/g, ' ');
    }
    return clean.replace(/\b\w/g, c => c.toUpperCase());
};

const formatActivityDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

const getTopicIcon = (topicName) => {
    const name = (topicName || '').toLowerCase();
    if (name.includes('history')) return <Landmark className="w-4 h-4 text-gold flex-shrink-0" />;
    if (name.includes('geography')) return <Compass className="w-4 h-4 text-gold flex-shrink-0" />;
    if (name.includes('polity')) return <Scale className="w-4 h-4 text-gold flex-shrink-0" />;
    return <BookOpen className="w-4 h-4 text-gold flex-shrink-0" />;
};

const StudentDashboard = () => {
    const { user, isAuthenticated, openAuthModal } = useAuth();

    const { data: statsRes, isLoading: statsLoading } = useQuery({
        queryKey: ['quizStats'],
        queryFn: () => api.get('/quiz/stats'),
        staleTime: 0,
        enabled: isAuthenticated,
    });

    const { data: attemptsRes, isLoading: attemptsLoading } = useQuery({
        queryKey: ['quizAttempts'],
        queryFn: () => api.get('/quiz/attempts'),
        staleTime: 0,
        enabled: isAuthenticated && !statsLoading,
    });

    const stats = statsRes?.data || {};
    const attempts = attemptsRes?.data || [];



    if (statsLoading || attemptsLoading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
                    <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-pulse">
                    <div className="h-32 bg-slate-900/60 border border-white/5 rounded-3xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="h-28 bg-slate-900/60 border border-white/5 rounded-2xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-64 bg-slate-900/60 border border-white/5 rounded-2xl" />
                            <div className="h-64 bg-slate-900/60 border border-white/5 rounded-2xl" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-48 bg-slate-900/60 border border-white/5 rounded-2xl" />
                            <div className="h-64 bg-slate-900/60 border border-white/5 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const quizCount = stats.totalAttempts ?? 0;
    const avgScore = stats.averageScore ?? 0.0;
    const avgAccuracy = stats.averageAccuracy ?? 0;
    const bestScore = stats.bestScore ?? 0.0;
    const currentStreak = stats.currentStreak ?? 0;
    const longestStreak = stats.longestStreak ?? 0;
    const districtCount = Math.max(stats.districtsAttempted ?? 0, new Set(attempts.map(a => a.districtSlug).filter(Boolean)).size);
    const weakTopics = stats.weakTopics || [];
    const recentActivity = stats.recentActivity || [];

    const name = user?.name || 'Aspirant';
    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'A';

    const hasHighAccuracy = attempts.some(a => (a.accuracy ?? 0) >= 90);

    const achievementsList = [
        {
            emoji: '🌱',
            title: 'First Step',
            desc: 'Completed your first test challenge',
            unlocked: quizCount >= 1
        },
        {
            emoji: '🔥',
            title: 'Streak Master',
            desc: 'Achieved a 5-day quiz streak',
            unlocked: longestStreak >= 5
        },
        {
            emoji: '🎯',
            title: 'Sharp Shooter',
            desc: 'Scored 90%+ accuracy on any test',
            unlocked: hasHighAccuracy
        },
        {
            emoji: '🗺️',
            title: 'District Explorer',
            desc: 'Attempted tests in 2+ districts',
            unlocked: districtCount >= 2
        }
    ];

    const displayAttempts = attempts.slice(0, 10);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            <header className="bg-slate-900/80 border-b border-gold/15 py-12 px-6 md:px-12 relative overflow-hidden backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-slate-100">
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/20">Student Workspace</span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mt-2">
                            Namaste, <span className="text-gold">{name}</span> 🙏
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Your UPSC & State preparation journey continues. Stay consistent, aim higher.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/60 border border-white/10 rounded-2xl p-4.5">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gold to-gold-dark flex items-center justify-center text-emerald-dark font-serif font-black text-lg shadow-md">
                            {initials}
                        </div>
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gold uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Admin' : 'Scholar'}</span>
                                <button className="p-1 hover:bg-white/5 rounded-lg transition-colors group">
                                    <Bell className="w-4 h-4 text-gold group-hover:scale-105 transition-transform" />
                                </button>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                                ID: {user?.id || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-14 relative z-10">
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Challenges', value: quizCount, icon: GraduationCap, color: 'border-t-gold' },
                        { label: 'Average Accuracy', value: `${avgAccuracy}%`, icon: Compass, color: 'border-t-emerald-500' },
                        { label: 'Average Score', value: avgScore, icon: Zap, color: 'border-t-amber-500' },
                        { label: 'Best Score', value: bestScore, icon: Trophy, color: 'border-t-gold' }
                    ].map((stat, i) => (
                        <div key={i} className={`bg-slate-900/80 border border-white/10 border-t-4 ${stat.color} rounded-3xl py-6 px-7 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gold/5 hover:border-gold/30 transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group shadow-lg`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
                                <stat.icon className="w-5 h-5 text-gold group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="text-4xl sm:text-5xl font-serif font-black text-gold tracking-tight mt-4">
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-14">
                        <section className="space-y-4">
                            <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                                Performance Timeline
                            </h2>
                            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-lg backdrop-blur-md">
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={recentActivity} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#C9A961" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#C9A961" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(tick) => {
                                                try {
                                                    const d = new Date(tick);
                                                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                                } catch(e) {
                                                    return tick;
                                                }
                                            }}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            allowDecimals={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload?.length) return null;
                                                return (
                                                    <div className="bg-slate-950/95 border border-gold/30 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans">
                                                        <p className="text-gold font-bold mb-1 font-serif">
                                                            {new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                        <p className="text-slate-300 font-semibold">
                                                            Attempts: <span className="text-gold font-black">{payload[0].value}</span>
                                                        </p>
                                                    </div>
                                                );
                                            }} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#C9A961" 
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                                Focus Areas & Weak Topics
                            </h2>
                            {weakTopics.length === 0 ? (
                                <div className="text-center py-8 bg-slate-900/30 border border-white/5 rounded-2xl text-slate-400 text-xs font-medium">
                                    No weak topics identified yet. Start taking challenges to view analysis!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {weakTopics.map((topic, i) => {
                                        const pct = topic.accuracy;
                                        let barColor = 'bg-emerald-500';
                                        if (pct < 50) barColor = 'bg-red-500';
                                        else if (pct < 75) barColor = 'bg-amber-500';

                                        return (
                                            <div key={i} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/5 hover:border-gold/30 transition-all duration-300 shadow-md">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-white text-base font-serif tracking-wide leading-tight flex items-center gap-2">
                                                        {getTopicIcon(topic.topic)}
                                                        {topic.topic}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        Total Questions: {topic.totalQuestions}
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5 mt-5">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-slate-400">Accuracy Rate</span>
                                                        <span className="text-gold font-black">{pct}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-950/80 border border-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                                Recent Test Results
                            </h2>
                            <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/80 border-b border-white/10 text-gold text-xs font-bold uppercase tracking-wider font-serif">
                                                <th className="px-6 py-4">Test Name</th>
                                                <th className="px-6 py-4">Difficulty</th>
                                                <th className="px-6 py-4 text-center">Score</th>
                                                <th className="px-6 py-4 text-center">Accuracy</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-center">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {displayAttempts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-16 text-slate-400 text-sm font-medium">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 mb-1">
                                                                <ClipboardList className="w-6 h-6 text-slate-400 animate-pulse" />
                                                            </div>
                                                            <p className="max-w-md text-xs sm:text-sm text-slate-400 font-medium">
                                                                No test attempts recorded yet. Head over to the <Link to="/test-series" className="text-gold hover:underline font-bold">Test Zone</Link> to start your first test!
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayAttempts.map((attempt, index) => (
                                                    <tr key={attempt.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-white text-sm">{formatSlug(attempt.districtSlug)} District</div>
                                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{formatSlug(attempt.stateSlug)}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase tracking-wider">
                                                                {attempt.testType || 'Quiz'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="font-mono font-bold text-white text-sm">{attempt.score} pts</div>
                                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{attempt.correctCount}/{attempt.totalQuestions} Qs</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-300">{attempt.accuracy}%</td>
                                                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">
                                                            {new Date(attempt.attemptedAt).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {attempt.percentage >= 40 ? (
                                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                                                    PASS
                                                                </span>
                                                            ) : (
                                                                <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                                                    FAIL
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-14 lg:col-span-1">
                        <aside className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6 backdrop-blur-md">
                            <div className="border-b border-white/5 pb-4">
                                <h3 className="font-bold text-lg font-serif text-gold uppercase tracking-wide flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-gold animate-pulse" />
                                    Active Streak
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Keep the flame burning
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-center">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Current Streak</div>
                                    <div className="text-3xl font-serif font-bold text-gold mt-1 flex items-center justify-center gap-1">
                                        {currentStreak} <span className="text-sm">Days</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-center">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Longest Streak</div>
                                    <div className="text-3xl font-serif font-bold text-gold mt-1 flex items-center justify-center gap-1">
                                        {longestStreak} <span className="text-sm">Days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">7-Day Study Matrix</h4>
                                <div className="flex gap-1.5 justify-between">
                                    {recentActivity.map((day, idx) => {
                                        let cellBg = "bg-slate-950 border-white/5";
                                        let textStyle = "text-slate-400";
                                        if (day.count === 1) {
                                            cellBg = "bg-amber-500/10 border-gold/30";
                                            textStyle = "text-gold";
                                        } else if (day.count === 2) {
                                            cellBg = "bg-amber-500/25 border-gold/45";
                                            textStyle = "text-gold";
                                        } else if (day.count >= 3) {
                                            cellBg = "bg-gold text-slate-950 font-bold border-gold";
                                            textStyle = "text-slate-950";
                                        }
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1 flex-1 min-w-[42px]">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatActivityDate(day.date).split(' ')[0]}</span>
                                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs transition-all duration-300 ${cellBg}`}>
                                                    {day.count > 0 ? `+${day.count}` : '0'}
                                                </div>
                                                <span className="text-[8px] text-slate-500 font-semibold">{formatActivityDate(day.date).split(' ')[1]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        <aside className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6 backdrop-blur-md">
                            <div className="border-b border-white/5 pb-4">
                                <h3 className="font-bold text-lg font-serif text-gold uppercase tracking-wide flex items-center gap-2">
                                    <Award className="w-5 h-5 text-gold" />
                                    Achievements
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Track milestones
                                </p>
                            </div>

                            <div className="space-y-4">
                                {achievementsList.map((item, idx) => (
                                    <div key={idx} className={`relative flex items-center gap-4 p-4.5 rounded-3xl border transition-all duration-300 ${
                                        item.unlocked 
                                            ? 'bg-slate-900/60 border-gold/30 shadow-[0_0_15px_rgba(201,169,97,0.03)] hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(201,169,97,0.08)] text-white' 
                                            : 'bg-slate-950/20 border-white/5 opacity-35 text-slate-500'
                                    }`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                                            item.unlocked 
                                                ? 'bg-gold/10 border border-gold/20' 
                                                : 'bg-slate-950/40 border border-white/5 grayscale opacity-60'
                                        }`}>
                                            {item.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">{item.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-normal">{item.desc}</p>
                                        </div>
                                        {!item.unlocked && (
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-slate-950 border border-white/10 w-7 h-7 rounded-full flex items-center justify-center text-slate-400">
                                                <Lock className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </aside>

                        <div className="bg-slate-900/80 border border-gold/25 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden shadow-lg text-slate-300">
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:12px_12px]" />
                            <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto text-gold">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5 relative z-10">
                                <h3 className="font-bold text-base text-gold font-serif uppercase tracking-wide">
                                    Aim For Excellence
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    "Success is not final, failure is not fatal: it is the courage to continue that counts."
                                </p>
                            </div>
                            <div className="text-[10px] text-gold font-black uppercase tracking-widest mt-2 border-t border-white/5 pt-3">
                                BodhGanga Academy Elite
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
