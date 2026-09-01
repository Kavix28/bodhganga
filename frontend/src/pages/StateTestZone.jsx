import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { statesAndUtTestData } from '../data/testSeriesData';
import { Search, MapPin, CheckCircle, Clock, ChevronRight, BookOpen, Sparkles, Layers, ShieldCheck, ArrowLeft, Award, Lock, PlayCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const StateTestZone = () => {
    const { stateId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [searchDistrict, setSearchDistrict] = useState('');
    const [activeTab, setActiveTab] = useState('STATE_EXAMS'); // 'STATE_EXAMS', 'DISTRICTS', 'SUBJECTS'
    const [difficultyFilter, setDifficultyFilter] = useState('ALL'); // 'ALL', 'EASY', 'MEDIUM', 'HARD'

    const [stateTests, setStateTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [unlockingId, setUnlockingId] = useState(null);

    const stateData = statesAndUtTestData.find(s => s.id === stateId || s.code.toLowerCase() === stateId?.toLowerCase()) || statesAndUtTestData[0];

    useEffect(() => {
        const fetchTests = async () => {
            setLoadingTests(true);
            try {
                const res = await api.get(`/question-bank/state-tests/${stateId || stateData.id}`);
                const data = res?.data?.data || res?.data || res || [];
                setStateTests(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load state tests", err);
                toast.error("Could not load state tests. Using default configuration.");
            } finally {
                setLoadingTests(false);
            }
        };
        fetchTests();
    }, [stateId, stateData.id]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUnlockTest = async (test) => {
        if (!user) {
            toast.error("Please login to unlock this test bundle");
            navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
            return;
        }

        setUnlockingId(test.id);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error("Razorpay SDK failed to load. Please check your network connection.");
                setUnlockingId(null);
                return;
            }

            const payload = {
                stateSlug: test.stateSlug || stateId || stateData.id,
                amountPaise: Math.round((test.price || 99) * 100)
            };

            const orderRes = await api.post("/payment/create-order", payload);
            if (!orderRes.success && !orderRes.data?.orderId) {
                toast.error(orderRes.message || "Failed to create payment order");
                setUnlockingId(null);
                return;
            }

            const orderData = orderRes.data || orderRes;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "BodhGanga Academy",
                description: `Unlock ${test.title}`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post("/payment/verify", {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            stateSlug: test.stateSlug || stateId || stateData.id
                        });

                        if (verifyRes.success) {
                            toast.success("State Test Bundle Unlocked!");
                            // Refresh test status
                            const refreshed = await api.get(`/question-bank/state-tests/${stateId || stateData.id}`);
                            const data = refreshed?.data?.data || refreshed?.data || [];
                            setStateTests(Array.isArray(data) ? data : []);
                        } else {
                            toast.error("Payment verification failed: " + (verifyRes.message || "Unknown error"));
                        }
                    } catch (e) {
                        toast.error("Error verifying payment: " + (e.message || "Network error"));
                    } finally {
                        setUnlockingId(null);
                    }
                },
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                    contact: user.phoneNo || '',
                },
                theme: { color: '#022c22' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                toast.error('Payment failed: ' + resp.error.description);
                setUnlockingId(null);
            });
            rzp.open();

        } catch (err) {
            console.error("Unlock error:", err);
            toast.error("Failed to process unlock order");
            setUnlockingId(null);
        }
    };

    const filteredDistricts = (stateData.districts || []).filter(d => 
        d.name.toLowerCase().includes(searchDistrict.toLowerCase())
    );

    const filteredStateTests = stateTests.filter(t => {
        if (difficultyFilter === 'ALL') return true;
        return t.difficulty === difficultyFilter;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Top Navigation Breadcrumb */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <Link to="/test-series" className="hover:text-gold flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Explore Tests Across India
                    </Link>
                    <span>/</span>
                    <span className="text-gold font-bold">{stateData.name} Test Zone</span>
                </div>

                {/* State Hero Header */}
                <div className="relative rounded-3xl overflow-hidden border border-gold/20 bg-slate-900/80 p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-gold/30">
                                <MapPin className="w-3.5 h-3.5 text-gold" />
                                <span className="text-[11px] font-bold text-gradient-gold uppercase tracking-wider">{stateData.name} • {stateData.type}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                                {stateData.name} <span className="text-gradient-gold">Examination Zone</span>
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                Access 15-question 30-minute state examination sets across 3 difficulty levels, free quick challenges, and complete district learning bundles.
                            </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex flex-wrap md:flex-col gap-3 w-full md:w-auto">
                            <div className="flex-1 md:w-48 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                                <div className="text-[10px] uppercase font-bold text-slate-400">Total Districts</div>
                                <div className="text-2xl font-serif font-bold text-white">{stateData.totalDistricts} Districts</div>
                            </div>
                            <div className="flex-1 md:w-48 bg-white/5 border border-gold/20 p-3.5 rounded-2xl">
                                <div className="text-[10px] uppercase font-bold text-gold">Covered Districts</div>
                                <div className="text-2xl font-serif font-bold text-gold">{stateData.coveredDistrictsCount} Ready</div>
                            </div>
                        </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6 mt-8">
                        <button
                            onClick={() => setActiveTab('STATE_EXAMS')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'STATE_EXAMS'
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Award className="w-4 h-4" />
                            Section 1: State Exam Sets (15 Qs / 30 Mins)
                        </button>
                        <button
                            onClick={() => setActiveTab('DISTRICTS')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'DISTRICTS'
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            Section 2: District-Wise Tests
                        </button>
                        <button
                            onClick={() => setActiveTab('SUBJECTS')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === 'SUBJECTS'
                                    ? 'bg-gradient-to-r from-gold to-gold-dark text-emerald-dark shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Section 3: State Subject-Wise Tests
                        </button>
                    </div>
                </div>

                {/* SECTION 1: STATE MOCK EXAMS (EASY, MEDIUM, HARD) */}
                {activeTab === 'STATE_EXAMS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white">{stateData.name} State Examination Series</h2>
                                <p className="text-xs text-slate-400">15 MCQs per set • Server-Authoritative 30-Minute Timer • Instant Scoring & Review</p>
                            </div>
                            <div className="flex gap-2">
                                {[
                                    { id: 'ALL', label: 'All Levels' },
                                    { id: 'EASY', label: 'Easy (Level 1)' },
                                    { id: 'MEDIUM', label: 'Medium (Level 2)' },
                                    { id: 'HARD', label: 'Hard (Level 3)' }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setDifficultyFilter(btn.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                                            difficultyFilter === btn.id
                                                ? 'bg-gold text-emerald-dark font-extrabold'
                                                : 'bg-white/5 hover:bg-white/10 text-white/70'
                                        }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingTests ? (
                            <div className="py-16 text-center space-y-3">
                                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
                                <p className="text-xs text-slate-400">Loading state examination modules...</p>
                            </div>
                        ) : filteredStateTests.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className="text-sm text-slate-300">No test sets found for this filter level.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {filteredStateTests.map((test) => (
                                    <div
                                        key={test.id}
                                        className="relative p-6 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-gold/50 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    test.difficulty === 'HARD'
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                        : test.difficulty === 'MEDIUM'
                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                }`}>
                                                    {test.difficulty || 'EASY'} LEVEL
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {test.completedByUser && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                            <CheckCircle className="w-3 h-3" /> Attempted
                                                        </span>
                                                    )}
                                                    {test.isFree ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/40">
                                                            <Sparkles className="w-3 h-3" /> Free Test
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                                            <ShieldCheck className="w-3 h-3" /> ₹{test.price} Bundle
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-serif font-bold text-white leading-snug">{test.title}</h3>
                                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{test.description}</p>

                                            <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Questions</span>
                                                    <span className="font-bold text-white">{test.totalQuestions || 15} MCQs</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time Limit</span>
                                                    <span className="font-bold text-gold">{test.durationMinutes || 30} Mins</span>
                                                </div>
                                                {test.attemptedCount !== undefined && (
                                                    <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                                                        <span className="text-slate-400">Pool Progress:</span>
                                                        <span className="font-semibold text-emerald-400">
                                                            {test.attemptedCount} attempted • {test.remainingCount ?? 0} remaining
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {test.isAvailable === false || test.available === false ? (
                                            <button
                                                disabled
                                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 text-amber-300 font-extrabold text-xs uppercase tracking-widest cursor-not-allowed border border-amber-500/20"
                                            >
                                                <Clock className="w-4 h-4" />
                                                <span>Question Bank Ingestion ({test.availableQuestions || 0}/15 Qs)</span>
                                            </button>
                                        ) : test.isUnlocked ? (
                                            <div className="space-y-2">
                                                <Link
                                                    to={`/question-bank/tests/${test.id}`}
                                                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-md"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    <span>{test.completedByUser ? 'Retake Standard Test' : 'Attempt Test Now'}</span>
                                                </Link>
                                                {test.completedByUser && (
                                                    test.remainingCount > 0 ? (
                                                        <Link
                                                            to={`/question-bank/practice/${test.stateSlug || stateId || 'chhattisgarh'}/${test.difficulty}`}
                                                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                            <span>Practice More ({test.remainingCount} Left)</span>
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-xs uppercase tracking-widest border border-white/5 cursor-not-allowed"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            <span>All Pool Questions Completed</span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleUnlockTest(test)}
                                                disabled={unlockingId === test.id}
                                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                                            >
                                                {unlockingId === test.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-4 h-4" />
                                                        <span>Unlock Bundle (₹{test.price})</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* SECTION 2: DISTRICT-WISE TESTS */}
                {activeTab === 'DISTRICTS' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white">Section 2: District-Wise Tests</h2>
                                <p className="text-xs text-slate-400">Select a district to view available Quick Challenges, Advanced Challenges, and Learning Bundles.</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={`Search district in ${stateData.name}...`}
                                    value={searchDistrict}
                                    onChange={(e) => setSearchDistrict(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-gold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredDistricts.map((dist) => (
                                <div
                                    key={dist.id}
                                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                                        dist.isAvailable
                                            ? 'bg-slate-900/80 hover:bg-slate-900 border-gold/30 hover:border-gold shadow-md hover:shadow-gold/10 hover:-translate-y-1'
                                            : 'bg-slate-900/30 border-white/5 opacity-60'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold uppercase text-gold tracking-widest">District</span>
                                            {dist.isAvailable ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    <CheckCircle className="w-3 h-3" /> Tests Available
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    <Clock className="w-3 h-3" /> Coming Soon
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-white">{dist.name}</h3>
                                        <p className="text-xs text-slate-300 line-clamp-2">
                                            {dist.description || 'Complete coverage of district history, geography, economy, and administration.'}
                                        </p>
                                    </div>

                                    {dist.isAvailable ? (
                                        <Link
                                            to={`/test-series/${stateData.id}/${dist.id}`}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
                                        >
                                            <span>Open {dist.name} Test Page</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <button disabled className="w-full py-2.5 px-4 rounded-xl bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                                            Coming Soon
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION 3: STATE SUBJECT-WISE TESTS */}
                {activeTab === 'SUBJECTS' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white">Section 3: State Subject-Wise Tests</h2>
                            <p className="text-xs text-slate-400">Tests covering the complete state rather than individual districts across 9+ subject categories.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(stateData.subjectTests || []).map((sub) => (
                                <div key={sub.id} className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-gold/50 transition-all duration-300 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 uppercase tracking-widest">
                                            {sub.category}
                                        </span>
                                        <span className="text-xs text-slate-400 font-semibold">{sub.testsCount} Tests</span>
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-white">{sub.title}</h3>
                                    <p className="text-xs text-slate-400">Full-length state level practice modules with comprehensive answer rationales.</p>
                                    <Link
                                        to={`/test-series/${stateData.id}/${stateData.districts?.[0]?.id || ''}`}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-gold hover:text-emerald-dark text-white font-bold text-xs uppercase tracking-wider transition-all duration-300"
                                    >
                                        <span>Start Practice</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StateTestZone;
