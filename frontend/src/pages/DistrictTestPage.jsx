import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { statesAndUtTestData } from '../data/testSeriesData';
import {
    Award, Zap, ShieldCheck, CheckCircle2, Lock, Unlock, FileText,
    Play, Clock, Loader2, AlertCircle, ShoppingBag, Eye, BookOpen,
    ChevronLeft, ChevronRight, X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const DistrictTestPage = () => {
    const { stateId, districtId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    // Access entitlement state
    const [hasAccess, setHasAccess] = useState(false);
    const [accessLoading, setAccessLoading] = useState(true);

    // Live Availability State
    const [availability, setAvailability] = useState({
        loading: true,
        available: false,
        count: 0,
        error: false
    });

    // Payment Processing State
    const [purchasing, setPurchasing] = useState(false);

    // Question Bank Modal & Pagination State
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankPage, setBankPage] = useState(0);
    const [bankData, setBankData] = useState({ content: [], totalElements: 0, totalPages: 0 });

    const stateData = statesAndUtTestData.find(s => s.id === stateId) || statesAndUtTestData[0];
    const districtData = (stateData.districts || []).find(d => d.id === districtId) || {
        id: districtId || 'akola',
        name: (districtId ? districtId.charAt(0).toUpperCase() + districtId.slice(1) : 'Akola'),
        price: 49
    };

    // 1. Fetch District Access Entitlement
    const checkAccess = useCallback(async () => {
        if (!districtId) return;
        setAccessLoading(true);
        try {
            const res = await api.get(`/quiz/districts/${districtId}/question-bank/access`);
            if (res && res.success && res.data) {
                setHasAccess(Boolean(res.data.unlocked));
            } else {
                setHasAccess(false);
            }
        } catch (err) {
            setHasAccess(false);
        } finally {
            setAccessLoading(false);
        }
    }, [districtId]);

    // 2. Fetch Live Question Availability
    const checkAvailability = useCallback(async () => {
        setAvailability({ loading: true, available: false, count: 0, error: false });
        try {
            const res = await api.get('/quiz/published-count', {
                params: { stateSlug: stateId, districtSlug: districtId }
            });
            if (res && res.success && res.data) {
                setAvailability({
                    loading: false,
                    available: Boolean(res.data.available && res.data.count > 0),
                    count: res.data.count || 0,
                    error: false
                });
            } else {
                setAvailability({ loading: false, available: false, count: 0, error: false });
            }
        } catch (err) {
            setAvailability({ loading: false, available: false, count: 0, error: true });
        }
    }, [stateId, districtId]);

    useEffect(() => {
        checkAccess();
        checkAvailability();
    }, [checkAccess, checkAvailability]);

    // 3. Fetch Paginated Question Bank Data
    const fetchQuestionBank = async (page = 0) => {
        setBankLoading(true);
        try {
            const res = await api.get(`/quiz/districts/${districtId}/question-bank`, {
                params: { stateSlug: stateId, page, size: 10 }
            });
            if (res && res.success && res.data) {
                setBankData({
                    content: res.data.content || [],
                    totalElements: res.data.totalElements || 0,
                    totalPages: res.data.totalPages || 0
                });
                setBankPage(page);
            }
        } catch (err) {
            toast.error(err?.message || 'Failed to load question bank data.');
        } finally {
            setBankLoading(false);
        }
    };

    const handleOpenQuestionBank = () => {
        setShowBankModal(true);
        fetchQuestionBank(0);
    };

    // 4. Handle ₹49 Razorpay Lifetime Access Purchase Flow
    const handlePurchaseLifetimeAccess = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to purchase district question bank access.');
            navigate('/login');
            return;
        }

        setPurchasing(true);
        try {
            const orderRes = await api.post('/payment/create-order', {
                districtSlug: districtId,
                stateSlug: stateId,
                amountPaise: 4900
            });

            if (!orderRes || !orderRes.success || !orderRes.data) {
                throw new Error(orderRes?.message || 'Failed to initiate Razorpay order.');
            }

            const { orderId, amountPaise, keyId } = orderRes.data;

            if (!window.Razorpay) {
                throw new Error('Razorpay SDK failed to load. Please refresh the page.');
            }

            const options = {
                key: keyId,
                amount: amountPaise,
                currency: 'INR',
                name: 'BodhGanga Academy',
                description: `${districtData.name} District Question Bank Lifetime Access`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            districtSlug: districtId,
                            stateSlug: stateId
                        });

                        if (verifyRes && verifyRes.success) {
                            toast.success(`Congratulations! You unlocked ${districtData.name} Question Bank Lifetime Access!`);
                            setHasAccess(true);
                            checkAccess();
                        } else {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                    } catch (verifyErr) {
                        toast.error(verifyErr?.message || 'Payment verification error.');
                    }
                },
                prefill: {
                    name: user?.fullName || user?.name || '',
                    email: user?.email || '',
                    contact: user?.phoneNo || ''
                },
                theme: {
                    color: '#10b981'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                toast.error(`Payment failed: ${resp.error.description}`);
            });
            rzp.open();
        } catch (err) {
            toast.error(err?.message || 'Failed to start checkout process.');
        } finally {
            setPurchasing(false);
        }
    };

    const isTestAvailable = availability.available && availability.count > 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-emerald-600/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[130px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-10">
                {/* Navigation Breadcrumb */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <Link to="/test-series" className="hover:text-gold transition-colors">Explore Tests</Link>
                    <span>→</span>
                    <Link to={`/test-series/${stateData.id}`} className="hover:text-gold transition-colors">{stateData.name}</Link>
                    <span>→</span>
                    <span className="text-gold font-bold">{districtData.name} District</span>
                </div>

                {/* Header Banner */}
                <div className="bg-slate-900/80 border border-gold/30 rounded-3xl p-6 sm:p-10 backdrop-blur-xl space-y-4 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-gold/40">
                            <Award className="w-4 h-4 text-gold" />
                            <span className="text-xs font-bold text-gradient-gold uppercase tracking-widest">
                                {stateData.name} • Test Your Skill V2
                            </span>
                        </div>

                        {/* Availability & Access Badge */}
                        <div className="flex items-center gap-3">
                            {availability.loading ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                                    <span>Checking Quiz Bank...</span>
                                </div>
                            ) : isTestAvailable ? (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>{availability.count} Published MCQs Ready</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span>Tests Coming Soon</span>
                                </div>
                            )}

                            {hasAccess && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-xs font-extrabold text-gold">
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>LIFETIME UNLOCKED</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
                        {districtData.name} <span className="text-gradient-gold">Test Your Skill</span>
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed font-sans">
                        Structured district assessment featuring server-randomized free tests (Foundation & Statement-Based) and a secure ₹49 complete district question bank.
                    </p>
                </div>

                {/* Main 3 Tier Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* TIER 1: FOUNDATION TEST (10 FREE QUESTIONS) */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group transition-all">
                        <div className="absolute top-0 right-0 px-3.5 py-1 bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-emerald-500/30">
                            FREE ACCESSIBLE
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">Foundation Test</h3>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">10 Questions · Server Randomized</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Fundamental district MCQs covering geography, administrative history, and essential facts. Randomized on every attempt.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span>10 Free Questions per session</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span>Server-side question randomization</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span>Instant scoring & rationale review</span>
                                </li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/foundation`)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg cursor-pointer"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Foundation Test</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3.5 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
                        )}
                    </div>

                    {/* TIER 2: STATEMENT BASED TEST (10 FREE QUESTIONS) */}
                    <div className="bg-slate-900/90 border border-blue-500/30 hover:border-blue-500/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group transition-all">
                        <div className="absolute top-0 right-0 px-3.5 py-1 bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-blue-500/30">
                            FREE ACCESSIBLE
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">Statement-Based Test</h3>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">10 Questions · Server Randomized</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Multi-statement analytical MCQs (UPSC/MPSC pattern) evaluating deep conceptual understanding of {districtData.name}.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                    <span>10 Free Multi-Statement MCQs</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                    <span>Server-side question randomization</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                    <span>Analytical UPSC/MPSC style layout</span>
                                </li>
                            </ul>
                        </div>
                        {isTestAvailable ? (
                            <button
                                onClick={() => navigate(`/test-series/${stateId}/${districtId}/quiz/statement-based`)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all shadow-lg cursor-pointer"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Statement Test</span>
                            </button>
                        ) : (
                            <button disabled className="w-full py-3.5 px-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                                Coming Soon
                            </button>
                        )}
                    </div>

                    {/* TIER 3: COMPLETE QUESTION BANK (₹49 LIFETIME ACCESS) */}
                    <div className="bg-slate-900/90 border border-gold/50 hover:border-gold rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 transition-all">
                        <div className="absolute top-0 right-0 px-3.5 py-1 bg-gold/20 text-gold font-black text-[10px] uppercase tracking-wider rounded-bl-2xl border-l border-b border-gold/40">
                            {hasAccess ? 'UNLOCKED' : 'LIFETIME ₹49'}
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                                {hasAccess ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white">Complete Question Bank</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-2xl font-serif font-bold text-gold">₹49</span>
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">One-Time Lifetime</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Complete untruncated district question bank ({availability.count || '136+'} questions) with full question browser and rationales.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    <span>Full district question bank ({availability.count || '136+'} MCQs)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    <span>Paginated question browser & search</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                    <span>Razorpay secure verified purchase</span>
                                </li>
                            </ul>
                        </div>

                        {accessLoading ? (
                            <button disabled className="w-full py-3.5 px-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                                <span>Verifying Access...</span>
                            </button>
                        ) : hasAccess ? (
                            <button
                                onClick={handleOpenQuestionBank}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all cursor-pointer shadow-lg"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Open Question Bank</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePurchaseLifetimeAccess}
                                disabled={purchasing}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-slate-950 font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                            >
                                {purchasing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Opening Razorpay...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        <span>Unlock Question Bank — ₹49</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Complete Question Bank Modal (for Unlocked Users) */}
            {showBankModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
                    <div className="bg-slate-900 border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-4xl w-full space-y-6 max-h-[90vh] flex flex-col justify-between shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-gold" />
                                    <h3 className="text-xl font-serif font-bold text-white">
                                        {districtData.name} District Question Bank
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        UNLOCKED
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Showing page {bankPage + 1} of {bankData.totalPages} (Total {bankData.totalElements} Questions)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBankModal(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content - Question List */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            {bankLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                                    <span className="text-xs font-bold text-slate-400">Loading district questions...</span>
                                </div>
                            ) : bankData.content.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 text-xs">
                                    No questions available in this district question bank.
                                </div>
                            ) : (
                                bankData.content.map((q, idx) => (
                                    <div key={q.id || idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gold font-serif font-bold">
                                            <span>Question {bankPage * 10 + idx + 1}</span>
                                            {q.difficulty && (
                                                <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-gold/10 text-gold border border-gold/20 uppercase font-sans">
                                                    {q.difficulty}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-100 whitespace-pre-line leading-relaxed">
                                            {q.question}
                                        </p>

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                            {q.options && q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="p-3 rounded-xl bg-slate-800/80 border border-white/5 text-xs text-slate-200 flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-[11px] text-gold">
                                                        {String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <span>{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer Pagination */}
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-xs text-slate-400">
                                Page {bankPage + 1} of {Math.max(1, bankData.totalPages)}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={bankPage === 0 || bankLoading}
                                    onClick={() => fetchQuestionBank(bankPage - 1)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <button
                                    disabled={bankPage >= bankData.totalPages - 1 || bankLoading}
                                    onClick={() => fetchQuestionBank(bankPage + 1)}
                                    className="px-4 py-2 rounded-xl bg-gold text-slate-950 hover:bg-gold-light disabled:opacity-40 text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DistrictTestPage;
