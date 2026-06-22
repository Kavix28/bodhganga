import { Link } from 'react-router-dom';
import {
    BookOpen, CheckCircle, Clock, Trophy, Bell, Lock, ArrowRight,
    Video, Award
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// ── Hardcoded Dummy Data at top of the file ───────────────────────
const WELCOME_INFO = {
    name: 'Pranjal',
    initials: 'PR',
    subtitle: 'Your UPSC preparation journey continues. Stay consistent.',
    lastLogin: 'Today, 9:45 AM'
};

const STATS_CARDS = [
    { id: 'enrolled', emoji: '📚', value: '5', label: 'Courses Enrolled' },
    { id: 'completed', emoji: '✅', value: '2', label: 'Courses Completed' },
    { id: 'hours', emoji: '⏱️', value: '124 hrs', label: 'Total Study Time' },
    { id: 'score', emoji: '🏆', value: '78%', label: 'Average Score' }
];

const MY_COURSES = [
    { id: 1, title: 'UPSC Prelims GS Paper 1', category: 'UPSC', mentor: 'Dr. Ramesh Sharma', progress: 68 },
    { id: 2, title: 'Indian History Deep Dive', category: 'UPSC', mentor: 'Prof. Meera Iyer', progress: 45 },
    { id: 3, title: 'SSC CGL Mathematics', category: 'SSC', mentor: 'Amit Verma', progress: 90 },
    { id: 4, title: 'Current Affairs Monthly', category: 'State PSC', mentor: 'Neha Gupta', progress: 30 }
];

const WEEKLY_ACTIVITY = [
    { day: 'Mon', hours: 3 },
    { day: 'Tue', hours: 5 },
    { day: 'Wed', hours: 2 },
    { day: 'Thu', hours: 6 },
    { day: 'Fri', hours: 4 },
    { day: 'Sat', hours: 7 },
    { day: 'Sun', hours: 3 }
];

const TEST_RESULTS = [
    { id: 1, name: 'UPSC GS Paper 1 Full Length Mock', course: 'UPSC Prelims GS Paper 1', score: '136/200', date: 'June 20, 2026', result: 'PASS' },
    { id: 2, name: 'Modern Indian History Sectional', course: 'Indian History Deep Dive', score: '78/100', date: 'June 18, 2026', result: 'PASS' },
    { id: 3, name: 'SSC CGL Geometry & Algebra Test', course: 'SSC CGL Mathematics', score: '42/100', date: 'June 14, 2026', result: 'FAIL' },
    { id: 4, name: 'Monthly Current Affairs Quiz (May)', course: 'Current Affairs Monthly', score: '88/100', date: 'June 10, 2026', result: 'PASS' },
    { id: 5, name: 'CSAT Comprehension Sectional', course: 'UPSC Prelims GS Paper 1', score: '62/100', date: 'June 05, 2026', result: 'PASS' }
];

const ACHIEVEMENTS = [
    { emoji: '🔥', title: '7-Day Streak', desc: 'Active study for 7 days straight', locked: false },
    { emoji: '📖', title: 'First Course', desc: 'Enrolled in your first module', locked: false },
    { emoji: '⭐', title: 'Top 10%', desc: 'Scored above 90% in sectional test', locked: false },
    { emoji: '🎯', title: 'Mock Test Champion', desc: 'Clear 5 mock exam series', locked: true },
    { emoji: '🥇', title: 'Course Completer', desc: 'Complete a full syllabus module', locked: true },
    { emoji: '💡', title: 'Knowledge Seeker', desc: 'Read 20 references from archive', locked: true }
];

const UPCOMING_CLASSES = [
    { id: 1, name: 'Indian Polity: Basic Structure', mentor: 'M. Laxmikanth Sir', time: 'Tomorrow, 10:00 AM' },
    { id: 2, name: 'UPSC Geography: Monsoon Patterns', mentor: 'Savindra Singh Sir', time: 'June 24, 02:00 PM' },
    { id: 3, name: 'SSC CGL Reasoning Tricks', mentor: 'R.S. Aggarwal Sir', time: 'June 25, 11:30 AM' }
];

// ── Custom Tooltip for Recharts ───────────────────────────────────
const ActivityTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f2518] border border-[#C9A84C]/30 rounded-xl p-3 shadow-xl text-xs">
            <p className="text-[#C9A84C] font-bold mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-[#e8e0d0] font-semibold">
                    Study Time: <span className="text-[#C9A84C] font-black">{entry.value} Hours</span>
                </p>
            ))}
        </div>
    );
};

const StudentDashboard = () => {
    return (
        <div className="min-h-screen bg-[#e5e7eb] text-[#374151] font-sans pb-16">
            
            {/* ── 1. Welcome Header Banner ─────────────────────────────────── */}
            <header className="bg-[#0f2518] border-b border-[#C9A84C]/20 py-8 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-[#e8e0d0]">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif text-[#C9A84C]">
                            Namaste, {WELCOME_INFO.name} 🙏
                        </h1>
                        <p className="text-[#a0a0a0] text-sm font-medium">
                            {WELCOME_INFO.subtitle}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-[#0f2518]/60 border border-[#C9A84C]/15 rounded-2xl p-4.5">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#8A7032] flex items-center justify-center text-[#0f2518] font-serif font-black text-lg shadow-md">
                            {WELCOME_INFO.initials}
                        </div>
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest">Aspirant Workspace</span>
                                <button className="p-1 hover:bg-[#C9A84C]/10 rounded-lg transition-colors group">
                                    <Bell className="w-4 h-4 text-[#C9A84C] group-hover:scale-105 transition-transform" />
                                </button>
                            </div>
                            <div className="text-[11px] text-[#a0a0a0]/80 font-semibold">
                                Last login: {WELCOME_INFO.lastLogin}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-10">
                
                {/* ── 2. Stats Row ────────────────────────────────────────────── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STATS_CARDS.map((stat) => (
                        <div key={stat.id} className="bg-[#1a3a2a] border border-[#C9A84C]/20 border-t-2 border-t-[#C9A84C] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-[#C9A84C]/45 transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden group shadow-md">
                            <div className="absolute inset-0 bg-[#C9A84C]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-[#a0a0a0] font-bold uppercase tracking-wider">{stat.label}</span>
                                <span className="text-xl">{stat.emoji}</span>
                            </div>
                            <div className="text-3xl font-extrabold text-white font-serif tracking-tight mt-3">
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </section>

                {/* ── Main Layout Grid ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Panel: Content (2 columns) */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* ── 3. Course Progress Grid ────────────────────────── */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                    My Courses
                                </h2>
                                <Link to="/courses" className="text-xs font-bold text-[#0f2518] hover:underline flex items-center gap-1">
                                    View Syllabus Catalog <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {MY_COURSES.map((course) => (
                                    <div key={course.id} className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-5 flex flex-col justify-between hover:border-[#C9A84C]/45 transition-all duration-300 group shadow-lg text-[#e8e0d0]">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-white text-base font-serif tracking-wide leading-tight group-hover:text-[#C9A84C] transition-colors">
                                                    {course.title}
                                                </h3>
                                                <span className="bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/25 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                                    {course.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#a0a0a0] font-medium">
                                                Mentor: {course.mentor}
                                            </p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 mt-5 mb-4">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-[#a0a0a0]">Course Progress</span>
                                                <span className="text-[#C9A84C] font-black">{course.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#0f2518] rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Link 
                                            to={`/courses/${course.id}/player`} 
                                            className="w-full py-2 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0f2518] font-bold text-xs uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                                        >
                                            Continue Learning →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── 4. Weekly Study Activity Chart ─────────────────────── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                This Week's Activity
                            </h2>
                            <div className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-6 shadow-lg">
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={WEEKLY_ACTIVITY} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                        <XAxis 
                                            dataKey="day" 
                                            tick={{ fill: '#a0a0a0', fontSize: 11, fontWeight: 500 }}
                                            axisLine={{ stroke: 'rgba(201, 168, 76, 0.2)' }}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 8]}
                                            tick={{ fill: '#a0a0a0', fontSize: 11, fontWeight: 500 }}
                                            axisLine={{ stroke: 'rgba(201, 168, 76, 0.2)' }}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<ActivityTooltip />} cursor={{ stroke: 'rgba(201, 168, 76, 0.15)', strokeWidth: 1 }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="hours" 
                                            name="Hours Studied"
                                            stroke="#C9A84C" 
                                            strokeWidth={3}
                                            dot={{ fill: '#C9A84C', stroke: '#1a3a2a', strokeWidth: 2, r: 4 }}
                                            activeDot={{ fill: '#0f2518', stroke: '#C9A84C', strokeWidth: 2, r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* ── 5. Test Results Table ────────────────────────── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                Recent Results
                            </h2>
                            <div className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl overflow-hidden shadow-lg">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#C9A84C] text-[#0f2518] text-xs font-bold uppercase tracking-wider font-serif">
                                                <th className="px-6 py-4">Test Name</th>
                                                <th className="px-6 py-4">Course</th>
                                                <th className="px-6 py-4 text-center">Score</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-center">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#C9A84C]/10 text-sm">
                                            {TEST_RESULTS.map((test, index) => (
                                                <tr 
                                                    key={test.id} 
                                                    className={`hover:bg-[#C9A84C]/5 transition-colors ${
                                                        index % 2 === 0 ? 'bg-[#0f2518]/30' : 'bg-[#1a3a2a]'
                                                    }`}
                                                >
                                                    <td className="px-6 py-4 font-bold text-white">{test.name}</td>
                                                    <td className="px-6 py-4 text-[#e8e0d0]/75">{test.course}</td>
                                                    <td className="px-6 py-4 text-center font-mono font-bold text-white">{test.score}</td>
                                                    <td className="px-6 py-4 text-[#a0a0a0] text-xs font-semibold">{test.date}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {test.result === 'PASS' ? (
                                                            <span className="bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/35 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                                                PASS
                                                            </span>
                                                        ) : (
                                                            <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                                                                FAIL
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* ── 6. Achievement Badges ───────────────────────────────── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                Achievements
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#C9A84C]/30 scrollbar-track-transparent">
                                {ACHIEVEMENTS.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex-shrink-0 w-52 bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-5 flex flex-col justify-between text-center relative overflow-hidden transition-all duration-300 ${
                                            item.locked ? 'opacity-50 select-none' : 'hover:-translate-y-1 hover:border-[#C9A84C]/45 shadow-lg'
                                        }`}
                                    >
                                        <div className="space-y-3 relative z-10">
                                            <div className="text-4xl">{item.emoji}</div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-sm text-white font-serif tracking-wide">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[10px] text-[#a0a0a0] leading-normal font-medium">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>

                                        {item.locked && (
                                            <div className="absolute inset-0 bg-[#0f2518]/70 backdrop-blur-[1px] flex items-center justify-center z-20">
                                                <div className="bg-[#1a3a2a] border border-[#C9A84C]/30 w-8 h-8 rounded-full flex items-center justify-center text-[#C9A84C] shadow-lg">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right Panel: Sidebar (1 column) */}
                    <div className="space-y-10 lg:col-span-1">
                        
                        {/* ── 7. Upcoming Live Classes Card ────────────────────────── */}
                        <aside className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-6 shadow-lg space-y-6">
                            <div className="border-b border-[#C9A84C]/15 pb-4">
                                <h3 className="font-bold text-lg font-serif text-[#C9A84C] uppercase tracking-wide flex items-center gap-2">
                                    <Video className="w-5 h-5 text-[#C9A84C]" />
                                    Upcoming Live Classes
                                </h3>
                                <p className="text-[10px] text-[#a0a0a0] font-bold uppercase tracking-widest mt-1">
                                    Interactive Revision Sessions
                                </p>
                            </div>

                            <div className="space-y-5">
                                {UPCOMING_CLASSES.map((item) => (
                                    <div key={item.id} className="p-4 bg-[#0f2518]/50 border border-[#C9A84C]/10 rounded-2xl space-y-3 hover:border-[#C9A84C]/25 transition-colors">
                                        <div className="flex gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#C9A84C] mt-1.5 flex-shrink-0 animate-pulse" />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-white leading-tight font-serif">
                                                    {item.name}
                                                </h4>
                                                <p className="text-xs text-[#a0a0a0] font-semibold">
                                                    {item.mentor}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C9A84C]/10">
                                            <span className="text-[10px] font-mono text-[#C9A84C] font-black tracking-wide uppercase">
                                                {item.time}
                                            </span>
                                            <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-inner active:scale-95">
                                                Join Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* Extra motivational banner */}
                        <div className="bg-[#1a3a2a] border border-[#C9A84C]/25 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden shadow-lg text-[#e8e0d0]">
                            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:12px_12px]" />
                            <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full flex items-center justify-center mx-auto text-[#C9A84C]">
                                <Award className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5 relative z-10">
                                <h3 className="font-bold text-base text-[#C9A84C] font-serif uppercase tracking-wide">
                                    Aim For Excellence
                                </h3>
                                <p className="text-xs text-[#a0a0a0] leading-relaxed font-medium">
                                    "Success is not final, failure is not fatal: it is the courage to continue that counts."
                                </p>
                            </div>
                            <div className="text-[10px] text-[#C9A84C] font-black uppercase tracking-widest mt-2 border-t border-[#C9A84C]/10 pt-3">
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
