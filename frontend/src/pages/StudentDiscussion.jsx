import { useState } from 'react';
import { Search, Plus, Send, X, MessageSquare, Heart, ChevronDown, ChevronUp, Award } from 'lucide-react';

// ── Initial Mock Data ─────────────────────────────────────────────
const INITIAL_COURSES = [
    { name: 'UPSC Prelims GS Paper 1', unread: 3 },
    { name: 'Indian History Deep Dive', unread: 1 },
    { name: 'SSC CGL Mathematics', unread: 5 },
    { name: 'Current Affairs Monthly', unread: 2 },
    { name: 'Essay Writing Mastery', unread: 0 }
];

const INITIAL_THREADS = [
    {
        id: 1,
        title: 'How to cover Art & Culture effectively?',
        course: 'UPSC Prelims GS Paper 1',
        preview: 'I am struggling with Nitin Singhania\'s book. Is it necessary to read it cover-to-cover or should I focus on specific chapters?',
        content: 'I have been going through the chapters on temple architecture and classical dance, which seem very detailed. However, the chapters at the end regarding science & technology in ancient India and festivals seem less high-yielding. Should I memorize every single page, or are there selected themes I should stick to? Appreciate suggestions!',
        author: 'Rahul Verma',
        initials: 'RV',
        time: '2 hours ago',
        tag: 'Doubt',
        likes: 12,
        liked: false,
        replies: [
            { author: 'Ananya Sen', initials: 'AS', own: false, text: 'Just focus on chapters like Architecture, Painting, and Music. S&T in ancient India can be read selectively, and festivals are best covered from annual compilations.' },
            { author: 'Pranjal', initials: 'PR', own: true, text: 'Thanks, Ananya. That helps save a lot of study time!' }
        ]
    },
    {
        id: 2,
        title: 'Ancient History chronology notes',
        course: 'Indian History Deep Dive',
        preview: 'Created a detailed timeline chart from Harappan Civilization to Gupta Period. Attaching the summary table for quick revision.',
        content: 'Hey guys, I consolidated all dates, rulers, and major developments from the Indus Valley Civilization, the Vedic Age, Mauryan Dynasty, post-Mauryan kingdoms, and the Gupta Empire. Having a chronological flow in one place really makes answer writing easier. Let me know if you want any modifications or expansions on this!',
        author: 'Neha Gupta',
        initials: 'NG',
        time: '1 day ago',
        tag: 'Resource',
        likes: 28,
        liked: false,
        replies: [
            { author: 'Vikram Seth', initials: 'VS', own: false, text: 'This timeline is extremely clear. The Post-Mauryan layout is especially helpful! Thanks for sharing.' }
        ]
    },
    {
        id: 3,
        title: 'Shortcuts for Algebra equations in Tier 2',
        course: 'SSC CGL Mathematics',
        preview: 'Here\'s a quick trick to solve quadratic equations without factorizing. Saves about 30 seconds per question!',
        content: 'For questions where you need to check roots, instead of solving the full formula, check product of roots (c/a) and sum of roots (-b/a) against the options. You can eliminate at least 2 options in 5 seconds. Let me show you a couple of examples below...',
        author: 'Amit Verma',
        initials: 'AV',
        time: '3 days ago',
        tag: 'Discussion',
        likes: 15,
        liked: false,
        replies: []
    },
    {
        id: 4,
        title: 'Budget 2026 key highlights document',
        course: 'Current Affairs Monthly',
        preview: 'Sharing my curated PDF containing the most crucial exam-oriented data from the latest Union Budget.',
        content: 'I have compiled a 10-page document highlighting GDP growth targets, capital expenditure allocations, tax regime tweaks, and new government scheme launches. It is fully formatted as bullet points for quick retention.',
        author: 'Suresh Kumar',
        initials: 'SK',
        time: '4 days ago',
        tag: 'Resource',
        likes: 42,
        liked: false,
        replies: [
            { author: 'Kriti Sharma', initials: 'KS', own: false, text: 'Amazing notes, Suresh! Especially the scheme summaries.' },
            { author: 'Pranjal', initials: 'PR', own: true, text: 'Very comprehensive, will definitely revise this multiple times.' }
        ]
    },
    {
        id: 5,
        title: 'Is CSAT getting tougher each year?',
        course: 'UPSC Prelims GS Paper 1',
        preview: 'Looking at the 2025 and 2026 prelims, the Quant section in CSAT seems to be on par with CAT. What\'s your strategy?',
        content: 'CSAT is no longer just a qualifying paper you can ignore till the last week. The number systems and permutations questions are highly complex. Do you think we need regular daily math practice?',
        author: 'Priya Nair',
        initials: 'PN',
        time: '5 days ago',
        tag: 'Doubt',
        likes: 9,
        liked: false,
        replies: [
            { author: 'Rajesh Patel', initials: 'RP', own: false, text: 'Yes, definitely. I\'m spending at least 2 hours daily on Quant now to stay safe.' }
        ]
    }
];

const INITIAL_MENTOR_QUESTIONS = [
    {
        id: 1,
        course: 'UPSC Prelims GS Paper 1',
        student: 'Pranjal',
        initials: 'PR',
        date: 'June 21, 2026',
        question: 'Mentor, how should I structure my answers for GS Paper 2 governance topics? I struggle with the word limit.',
        status: 'Answered',
        mentor: 'Dr. Ramesh Sharma (Senior IAS Trainer)',
        reply: 'Start with a direct constitutional provision or definition. Devote 50% of the body space to current issue context, and conclude with a proactive recommendation of a commission (like 2nd ARC). Practice writing within a box layout daily to get a feel of the space limits.'
    },
    {
        id: 2,
        course: 'SSC CGL Mathematics',
        student: 'Pranjal',
        initials: 'PR',
        date: 'June 20, 2026',
        question: 'In Geometry, what is the fastest way to solve questions on circumcentre coordinates?',
        status: 'Answered',
        mentor: 'Amit Verma (Maths Expert)',
        reply: 'For right-angled triangles, the circumcentre is always the midpoint of the hypotenuse. For others, check options using distance formula from all three vertices, as they must be equal. Memorize the general formula only as a last resort: x = (x1*sin2A + x2*sin2B + x3*sin2C)/(sin2A + sin2B + sin2C).'
    },
    {
        id: 3,
        course: 'Indian History Deep Dive',
        student: 'Pranjal',
        initials: 'PR',
        date: 'June 19, 2026',
        question: 'Is it recommended to reference primary source quotes in UPSC history optional answers?',
        status: 'Pending',
        mentor: null,
        reply: null
    },
    {
        id: 4,
        course: 'Current Affairs Monthly',
        student: 'Pranjal',
        initials: 'PR',
        date: 'June 18, 2026',
        question: 'Will questions on green hydrogen policy details be asked in the Prelims or Mains?',
        status: 'Pending',
        mentor: null,
        reply: null
    }
];

const StudentDiscussion = () => {
    // ── Local States ──────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('peer'); // 'peer' or 'mentor'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null); // Course name filter
    
    const [threads, setThreads] = useState(INITIAL_THREADS);
    const [expandedThreadId, setExpandedThreadId] = useState(null);
    const [replyText, setReplyText] = useState('');

    const [mentorQuestions, setMentorQuestions] = useState(INITIAL_MENTOR_QUESTIONS);
    const [askMentorCourse, setAskMentorCourse] = useState('UPSC Prelims GS Paper 1');
    const [askMentorText, setAskMentorText] = useState('');

    // Modal state for New Discussion
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [newThreadTag, setNewThreadTag] = useState('Doubt'); // Doubt, Discussion, Resource
    const [newThreadCourse, setNewThreadCourse] = useState('UPSC Prelims GS Paper 1');

    // Tag styles
    const getTagStyles = (tag) => {
        switch (tag) {
            case 'Doubt':
                return 'bg-red-500/10 text-red-400 border border-red-500/30';
            case 'Discussion':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
            case 'Resource':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
            default:
                return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
        }
    };

    // ── Thread Handling (Peer Discussion) ─────────────────────────
    const handleLike = (id, e) => {
        e.stopPropagation(); // Prevents expanding accordion on like click
        setThreads(threads.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    likes: t.liked ? t.likes - 1 : t.likes + 1,
                    liked: !t.liked
                };
            }
            return t;
        }));
    };

    const handleToggleExpand = (id) => {
        setExpandedThreadId(expandedThreadId === id ? null : id);
        setReplyText(''); // Clear input
    };

    const handlePostReply = (threadId) => {
        if (!replyText.trim()) return;
        setThreads(threads.map(t => {
            if (t.id === threadId) {
                return {
                    ...t,
                    replies: [
                        ...t.replies,
                        {
                            author: 'Pranjal',
                            initials: 'PR',
                            own: true,
                            text: replyText
                        }
                    ]
                };
            }
            return t;
        }));
        setReplyText('');
    };

    const handleCreateThread = (e) => {
        e.preventDefault();
        if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

        const newThread = {
            id: Date.now(),
            title: newThreadTitle,
            course: newThreadCourse,
            preview: newThreadContent.substring(0, 120) + (newThreadContent.length > 120 ? '...' : ''),
            content: newThreadContent,
            author: 'Pranjal',
            initials: 'PR',
            time: 'Just now',
            tag: newThreadTag,
            likes: 0,
            liked: false,
            replies: []
        };

        setThreads([newThread, ...threads]);
        
        // Reset and close modal
        setNewThreadTitle('');
        setNewThreadContent('');
        setNewThreadTag('Doubt');
        setIsModalOpen(false);
    };

    // ── Mentor Question Handling ──────────────────────────────────
    const handleAskMentor = (e) => {
        e.preventDefault();
        if (!askMentorText.trim()) return;

        const newQuestion = {
            id: Date.now(),
            course: askMentorCourse,
            student: 'Pranjal',
            initials: 'PR',
            date: 'June 22, 2026',
            question: askMentorText,
            status: 'Pending',
            mentor: null,
            reply: null
        };

        setMentorQuestions([newQuestion, ...mentorQuestions]);
        setAskMentorText('');
    };

    // ── Filters & Search logic ────────────────────────────────────
    const filteredThreads = threads.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.preview.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse = selectedCourse ? t.course === selectedCourse : true;
        return matchesSearch && matchesCourse;
    });

    const filteredMentorQuestions = mentorQuestions.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse = selectedCourse ? q.course === selectedCourse : true;
        return matchesSearch && matchesCourse;
    });

    return (
        <div className="min-h-screen bg-[#e5e7eb] text-[#374151] font-sans pb-16">
            
            {/* ── Header Section ────────────────────────────────────────── */}
            <header className="bg-[#0f2518] border-b border-[#C9A84C]/20 py-8 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C9A84C_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="max-w-7xl mx-auto space-y-6 relative z-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold font-serif text-[#C9A84C]">
                            Student Discussion Forum
                        </h1>
                        <p className="text-[#a0a0a0] text-sm">
                            Clear doubts, share core resources, and interact with course mentors.
                        </p>
                    </div>

                    {/* Search & Tabs Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-4.5 w-4.5 text-[#a0a0a0]" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search queries, notes, questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1a3a2a] text-[#ffffff] placeholder-[#a0a0a0]/60 border border-[#C9A84C]/20 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none rounded-xl pl-11 pr-4 py-2.5 text-sm transition-all shadow-inner"
                            />
                        </div>

                        {/* Switch Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('peer')}
                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'peer'
                                        ? 'bg-[#C9A84C] text-[#0f2518] shadow-md'
                                        : 'border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10'
                                }`}
                            >
                                💬 Peer Discussion
                            </button>
                            <button
                                onClick={() => setActiveTab('mentor')}
                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'mentor'
                                        ? 'bg-[#C9A84C] text-[#0f2518] shadow-md'
                                        : 'border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10'
                                }`}
                            >
                                🎓 Ask Mentor
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Layout Panel ──────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Sidebar: Course filter list (25%) */}
                    <div className="lg:col-span-1 space-y-6">
                        <aside className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-5 shadow-lg space-y-4">
                            <div className="flex items-center justify-between border-b border-[#C9A84C]/15 pb-3">
                                <h3 className="font-bold text-sm font-serif text-[#C9A84C] uppercase tracking-wider">
                                    Your Courses
                                </h3>
                                {selectedCourse && (
                                    <button 
                                        onClick={() => setSelectedCourse(null)}
                                        className="text-[10px] text-[#C9A84C] hover:underline uppercase font-bold"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>

                            <ul className="space-y-2">
                                {INITIAL_COURSES.map((course, index) => {
                                    const isActive = selectedCourse === course.name;
                                    return (
                                        <li key={index}>
                                            <button
                                                onClick={() => setSelectedCourse(isActive ? null : course.name)}
                                                className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-2 transition-all text-xs font-semibold ${
                                                    isActive
                                                        ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-l-4 border-[#C9A84C]'
                                                        : 'hover:bg-[#0f2518]/50 text-white/90'
                                                }`}
                                            >
                                                <span className="truncate">{course.name}</span>
                                                {course.unread > 0 && (
                                                    <span className="bg-[#C9A84C] text-[#0f2518] font-black text-[9px] rounded-full px-1.5 py-0.5 min-w-5 text-center flex-shrink-0">
                                                        {course.unread}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </aside>
                    </div>

                    {/* Main Workspace (75%) */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* ── TAB A: Peer Discussion ─────────────────────────── */}
                        {activeTab === 'peer' && (
                            <section className="space-y-6">
                                {/* Header of list panel */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                        {selectedCourse ? selectedCourse : 'All Discussions'}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b0923e] text-[#0f2518] font-bold text-xs uppercase tracking-widest rounded-lg transition-colors active:scale-95 shadow-md"
                                    >
                                        <Plus className="w-4 h-4" /> New Discussion
                                    </button>
                                </div>

                                {/* Thread List */}
                                <div className="space-y-4">
                                    {filteredThreads.length === 0 ? (
                                        <div className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-10 text-center text-[#a0a0a0]/60">
                                            No discussion threads found matching your filter criteria.
                                        </div>
                                    ) : (
                                        filteredThreads.map((thread) => {
                                            const isExpanded = expandedThreadId === thread.id;
                                            return (
                                                <div 
                                                    key={thread.id} 
                                                    onClick={() => handleToggleExpand(thread.id)}
                                                    className="bg-[#1a3a2a] border-l-4 border-l-[#C9A84C] border border-[#C9A84C]/25 rounded-2xl p-5 hover:bg-[#1f4230] transition-colors cursor-pointer space-y-4 shadow-lg text-[#e8e0d0]"
                                                >
                                                    {/* Thread Header info */}
                                                    <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold font-mono">
                                                                {thread.initials}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-white block">{thread.author}</span>
                                                                <span className="text-[10px]">{thread.time} · {thread.course}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${getTagStyles(thread.tag)}`}>
                                                            {thread.tag}
                                                        </span>
                                                    </div>

                                                    {/* Title & Preview */}
                                                    <div className="space-y-1.5">
                                                        <h4 className="text-base font-bold text-white font-serif leading-tight">
                                                            {thread.title}
                                                        </h4>
                                                        {!isExpanded ? (
                                                            <p className="text-xs text-[#a0a0a0] leading-relaxed">
                                                                {thread.preview}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-white/95 leading-relaxed whitespace-pre-wrap pt-2 border-t border-[#C9A84C]/10">
                                                                {thread.content}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Expanded Replies Accordion */}
                                                    {isExpanded && (
                                                        <div 
                                                            className="space-y-4 pt-4 border-t border-[#C9A84C]/15"
                                                            onClick={(e) => e.stopPropagation()} // Stop accordion toggling when typing reply
                                                        >
                                                            {/* Comments Stream */}
                                                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                                                {thread.replies.length === 0 ? (
                                                                    <p className="text-xs text-[#a0a0a0]/60 italic pl-2">No replies yet. Be the first to add a reply!</p>
                                                                ) : (
                                                                    thread.replies.map((reply, idx) => (
                                                                        <div 
                                                                            key={idx} 
                                                                            className={`flex items-start gap-2.5 max-w-[85%] ${
                                                                                reply.own ? 'ml-auto flex-row-reverse' : 'mr-auto'
                                                                            }`}
                                                                        >
                                                                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                                                                reply.own 
                                                                                    ? 'bg-[#C9A84C] text-[#0f2518]' 
                                                                                    : 'bg-[#0f2518] text-[#C9A84C] border border-[#C9A84C]/25'
                                                                            }`}>
                                                                                {reply.initials || reply.author.slice(0,2).toUpperCase()}
                                                                            </div>
                                                                            <div className={`rounded-xl p-3 text-xs ${
                                                                                reply.own 
                                                                                    ? 'bg-[#C9A84C] text-[#0f2518]' 
                                                                                    : 'bg-[#0f2518] text-white/95 border border-[#C9A84C]/10'
                                                                            }`}>
                                                                                {!reply.own && <p className="font-extrabold text-[9px] mb-1 opacity-70">{reply.author}</p>}
                                                                                <p className="leading-relaxed">{reply.text}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>

                                                            {/* Reply Input Form */}
                                                            <div className="flex gap-2 pt-2 border-t border-[#C9A84C]/10">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Type your reply..."
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    className="flex-grow bg-[#0f2518] text-[#ffffff] placeholder-[#a0a0a0]/60 border border-[#C9A84C]/20 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none rounded-lg px-3 py-2 text-xs transition-all shadow-inner"
                                                                />
                                                                <button
                                                                    onClick={() => handlePostReply(thread.id)}
                                                                    className="px-3 py-2 bg-[#C9A84C] hover:bg-[#b0923e] text-[#0f2518] rounded-lg transition-colors active:scale-95 flex items-center justify-center shadow-md"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Card Bottom Panel stats */}
                                                    <div className="flex items-center justify-between text-[11px] text-[#a0a0a0] pt-2 border-t border-[#C9A84C]/10">
                                                        <div className="flex items-center gap-4">
                                                            <span className="flex items-center gap-1.5 font-semibold">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                {thread.replies.length} Replies
                                                            </span>
                                                            <button 
                                                                onClick={(e) => handleLike(thread.id, e)}
                                                                className={`flex items-center gap-1.5 font-semibold hover:text-[#C9A84C] transition-colors ${
                                                                    thread.liked ? 'text-[#C9A84C]' : ''
                                                                }`}
                                                            >
                                                                <Heart className={`w-3.5 h-3.5 ${thread.liked ? 'fill-[#C9A84C]' : ''}`} />
                                                                {thread.likes} Likes
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleExpand(thread.id);
                                                            }}
                                                            className="px-3 py-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0f2518] text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
                                                        >
                                                            Reply {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ── TAB B: Ask Mentor ───────────────────────────────── */}
                        {activeTab === 'mentor' && (
                            <section className="space-y-6">
                                {/* Banner Info */}
                                <div className="bg-[#1a3a2a] border border-[#C9A84C]/25 rounded-2xl p-5 flex items-start gap-4 shadow-lg text-[#e8e0d0]">
                                    <div className="p-3 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-xl text-[#C9A84C] flex-shrink-0">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <h3 className="font-bold text-sm font-serif text-[#C9A84C] uppercase tracking-wide">
                                            🎓 Direct line to your course mentors
                                        </h3>
                                        <p className="text-xs text-[#a0a0a0] leading-relaxed">
                                            Ask conceptual questions, clear doubts about exam syllabus structure, and request advice.
                                            <span className="block mt-1 font-bold text-white">⏱️ Mentors typically respond within 24 hours.</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold font-serif text-[#0f2518] uppercase tracking-wide">
                                        Your Q&A History
                                    </h2>

                                    {filteredMentorQuestions.map((q) => (
                                        <div key={q.id} className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-5 space-y-4 shadow-lg text-[#e8e0d0]">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-mono text-xs font-bold">
                                                        {q.initials}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-white block">{q.student}</span>
                                                        <span className="text-[10px] text-[#a0a0a0]">{q.date} · {q.course}</span>
                                                    </div>
                                                </div>
                                                {q.status === 'Answered' ? (
                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                                                        ✅ Answered
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-500/10 text-[#C9A84C] border border-[#C9A84C]/30 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full animate-pulse">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-white/95 font-medium leading-relaxed bg-[#0f2518]/30 p-3 rounded-lg border border-[#C9A84C]/5">
                                                {q.question}
                                            </p>

                                            {/* Answer box if replied */}
                                            {q.status === 'Answered' && (
                                                <div className="bg-[#0f2518]/50 border-l-4 border-[#C9A84C] border border-[#C9A84C]/15 rounded-xl p-4.5 space-y-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-[#C9A84C] font-bold">
                                                        <span>🎓</span>
                                                        <span>{q.mentor}</span>
                                                    </div>
                                                    <p className="text-xs text-[#a0a0a0] leading-relaxed">
                                                        {q.reply}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Ask a Question Box */}
                                <form onSubmit={handleAskMentor} className="bg-[#1a3a2a] border border-[#C9A84C]/20 rounded-2xl p-6 space-y-4 shadow-lg text-[#e8e0d0]">
                                    <h3 className="font-bold text-base font-serif text-[#C9A84C] uppercase tracking-wide">
                                        Ask a New Question
                                    </h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-1.5">Select Course</label>
                                            <select 
                                                value={askMentorCourse}
                                                onChange={(e) => setAskMentorCourse(e.target.value)}
                                                className="w-full bg-[#0f2518] text-white border border-[#C9A84C]/25 focus:border-[#C9A84C] rounded-lg p-2.5 text-xs outline-none cursor-pointer"
                                            >
                                                {INITIAL_COURSES.map((course, idx) => (
                                                    <option key={idx} value={course.name}>{course.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-1.5">Question Description</label>
                                            <textarea
                                                rows="4"
                                                placeholder="Explain your doubt or query in detail so mentors can answer accurately..."
                                                value={askMentorText}
                                                onChange={(e) => setAskMentorText(e.target.value)}
                                                className="w-full bg-[#0f2518] text-white placeholder-[#a0a0a0]/60 border border-[#C9A84C]/25 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] rounded-lg p-3 text-xs outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <span className="text-[10px] text-[#a0a0a0] leading-normal font-semibold max-w-[70%]">
                                            ℹ️ Questions are forwarded directly to course subject experts.
                                        </span>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-[#C9A84C] hover:bg-[#b0923e] text-[#0f2518] font-bold text-xs uppercase tracking-widest rounded-lg transition-colors active:scale-95 shadow-md flex items-center gap-1.5"
                                        >
                                            Ask Mentor 🎓
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}
                        
                    </div>
                </div>
            </main>

            {/* ── NEW DISCUSSION MODAL (Peer Discussion Tab) ──────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Dark Overlay Backdrop */}
                    <div 
                        className="fixed inset-0 bg-[#0f2518]/85 backdrop-blur-[2px]" 
                        onClick={() => setIsModalOpen(false)}
                    />
                    
                    {/* Modal Box */}
                    <form 
                        onSubmit={handleCreateThread}
                        className="relative z-10 w-full max-w-xl bg-[#1a3a2a] border border-[#C9A84C]/30 rounded-2xl p-6 space-y-4 shadow-2xl text-[#e8e0d0]"
                    >
                        <div className="flex justify-between items-center border-b border-[#C9A84C]/15 pb-3">
                            <h3 className="font-bold text-lg font-serif text-[#C9A84C] uppercase tracking-wide">
                                Create New Discussion
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-[#a0a0a0] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Course Dropdown */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-1.5">Select Course</label>
                                <select 
                                    value={newThreadCourse}
                                    onChange={(e) => setNewThreadCourse(e.target.value)}
                                    className="w-full bg-[#0f2518] text-white border border-[#C9A84C]/25 focus:border-[#C9A84C] rounded-lg p-2.5 text-xs outline-none cursor-pointer"
                                >
                                    {INITIAL_COURSES.map((course, idx) => (
                                        <option key={idx} value={course.name}>{course.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tag Selection Pills */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-2">Category Tag</label>
                                <div className="flex gap-2">
                                    {['Doubt', 'Discussion', 'Resource'].map((tag) => (
                                        <button
                                            type="button"
                                            key={tag}
                                            onClick={() => setNewThreadTag(tag)}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                newThreadTag === tag
                                                    ? 'bg-[#C9A84C] text-[#0f2518] border-transparent shadow-md'
                                                    : 'border-[#C9A84C]/25 text-[#a0a0a0] hover:bg-[#0f2518]'
                                            }`}
                                        >
                                            {tag === 'Doubt' ? '📌 Doubt' : tag === 'Discussion' ? '💡 Discussion' : '📎 Resource'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-1.5">Discussion Title</label>
                                <input
                                    type="text"
                                    placeholder="Summarize your doubt or discussion topic..."
                                    value={newThreadTitle}
                                    onChange={(e) => setNewThreadTitle(e.target.value)}
                                    className="w-full bg-[#0f2518] text-white placeholder-[#a0a0a0]/60 border border-[#C9A84C]/25 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] rounded-lg p-2.5 text-xs outline-none"
                                />
                            </div>

                            {/* Message Description */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#a0a0a0] tracking-wider mb-1.5">Detailed Message</label>
                                <textarea
                                    rows="5"
                                    placeholder="Explain your topic, write formulas, or detail your references here..."
                                    value={newThreadContent}
                                    onChange={(e) => setNewThreadContent(e.target.value)}
                                    className="w-full bg-[#0f2518] text-white placeholder-[#a0a0a0]/60 border border-[#C9A84C]/25 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] rounded-lg p-3 text-xs outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end items-center gap-4 pt-3 border-t border-[#C9A84C]/15">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-xs text-[#a0a0a0] hover:underline font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-[#C9A84C] hover:bg-[#b0923e] text-[#0f2518] font-bold text-xs uppercase tracking-widest rounded-lg transition-colors active:scale-95 shadow-md"
                            >
                                Post Discussion
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
        </div>
    );
};

export default StudentDiscussion;
