import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Lock, Mail, User, Phone, MapPin, Eye, EyeOff, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { login as loginService } from '../../services/authService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Logo from './Logo';

const AuthGateModal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { authModalState, closeAuthModal, login } = useAuth();
    
    // modalState contains { isOpen: false, mode: 'welcome' }
    const isOpen = authModalState?.isOpen || false;
    const initialMode = authModalState?.mode || 'welcome';
    
    const [mode, setMode] = useState(initialMode); // 'welcome' | 'login' | 'signup'
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPw, setShowPw] = useState(false);
    
    // Login form state
    const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
    
    // Signup form state
    const [signupForm, setSignupForm] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        city: '',
        state: '',
        country: 'India'
    });

    // Reset when modal opens/changes mode
    useState(() => {
        if (isOpen) {
            setMode(initialMode);
            setErrors({});
            setLoading(false);
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const handleClose = () => {
        closeAuthModal();
    };

    const handleContinueAsGuest = () => {
        sessionStorage.setItem('guestDismissed', 'true');
        closeAuthModal();
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSignupChange = (e) => {
        const { name, value } = e.target;
        setSignupForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Password login submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!loginForm.phone.trim()) {
            errs.phone = 'Mobile number is required';
        } else if (loginForm.phone.trim().length < 10) {
            errs.phone = 'Mobile number must be 10 digits';
        }
        if (!loginForm.password) errs.password = 'Password is required';
        
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);
        try {
            // Service expects phone and password
            const res = await loginService(loginForm.phone, loginForm.password);
            if (res?.success && res.data?.token) {
                login(res.data.token, res.data.user);
                toast.success(`Welcome back, ${res.data.user?.name?.split(' ')[0] || 'Scholar'}!`);
                closeAuthModal();
                const fromPath = location.state?.from || "/";
                setTimeout(() => navigate(fromPath), 150);
            } else {
                throw new Error(res?.message || 'Login failed');
            }
        } catch (err) {
            const msg = err?.message || 'Invalid credentials';
            setErrors({ phone: msg });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Signup submit
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        
        if (!signupForm.fullName.trim()) errs.fullName = 'Name is required';
        
        if (!signupForm.phoneNumber.trim()) {
            errs.phoneNumber = 'Phone number is required';
        } else if (signupForm.phoneNumber.trim().length !== 10) {
            errs.phoneNumber = 'Phone number must be 10 digits';
        }
        
        if (signupForm.email && signupForm.email.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) {
                errs.email = 'Please enter a valid email';
            }
        }
        
        if (!signupForm.password) {
            errs.password = 'Password is required';
        } else if (signupForm.password.length < 6) {
            errs.password = 'Password must be at least 6 characters';
        }
        
        if (signupForm.password !== signupForm.confirmPassword) {
            errs.confirmPassword = 'Passwords do not match';
        }
        
        if (!signupForm.city.trim()) errs.city = 'City is required';
        if (!signupForm.state.trim()) errs.state = 'State is required';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);
        try {
            const signupData = {
                fullName: signupForm.fullName,
                email: signupForm.email,
                phoneNumber: signupForm.phoneNumber,
                city: signupForm.city,
                state: signupForm.state,
                country: signupForm.country,
                password: signupForm.password
            };

            localStorage.setItem("signupData", JSON.stringify(signupData));
            closeAuthModal();
            navigate("/verify-mobile-otp", { state: { phone: signupData.phoneNumber } });
        } catch (err) {
            console.error(err);
            toast.error("Registration initiation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-lg bg-gradient-to-b from-emerald-dark to-emerald-950 border border-gold/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-scale-in">
                {/* Close Button */}
                <button 
                    onClick={handleClose} 
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header / Logo */}
                <div className="text-center mb-6">
                    <Logo variant="navbar" size="md" showGlow={true} />
                </div>

                {/* ── WELCOME MODE ────────────────────────────────────────── */}
                {mode === 'welcome' && (
                    <div className="space-y-6 text-center">
                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                                Welcome to <span className="text-gradient-gold">BodhGanga</span>
                            </h2>
                            <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                                Join the premier digital knowledge network. Master civil services syllabus district by district, with hand-crafted PDF notes and visual roadmap guides.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
                            <button
                                onClick={() => setMode('login')}
                                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" /> Sign In
                            </button>
                            <button
                                onClick={() => setMode('signup')}
                                className="w-full py-3 border border-gold/30 hover:border-gold text-gold hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" /> Create Free Account
                            </button>
                            <button
                                onClick={handleContinueAsGuest}
                                className="w-full py-3 text-white/50 hover:text-white/80 font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                )}

                {/* ── LOGIN MODE ──────────────────────────────────────────── */}
                {mode === 'login' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Welcome Back</h2>
                            <p className="text-white/60 text-xs">Sign in to unlock notes, dashboards, and downloads.</p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            {/* Mobile Phone Number */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Mobile Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">+91</span>
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={loginForm.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                                            setLoginForm(p => ({ ...p, phone: val }));
                                            if (errors.phone) setErrors(p => ({ ...p, phone: '' }));
                                        }}
                                        placeholder="9876543210"
                                        disabled={loading}
                                        className="w-full py-2.5 pl-14 pr-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none transition-colors"
                                    />
                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                </div>
                                {errors.phone && <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1">{errors.phone}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPw ? 'text' : 'password'}
                                        value={loginForm.password}
                                        onChange={handleLoginChange}
                                        placeholder="••••••••"
                                        disabled={loading}
                                        className="w-full py-2.5 pl-11 pr-11 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none transition-colors"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-6"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Signing In...</>
                                ) : (
                                    <><Lock className="w-4 h-4" /> Sign In</>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-xs text-white/60">
                                New to BodhGanga?{' '}
                                <button onClick={() => setMode('signup')} className="font-bold text-gold hover:underline">
                                    Create Account
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* ── SIGNUP MODE ─────────────────────────────────────────── */}
                {mode === 'signup' && (
                    <div className="space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Create Free Account</h2>
                            <p className="text-white/60 text-xs">Fill details to initialize your academic credentials.</p>
                        </div>

                        <form onSubmit={handleSignupSubmit} className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Full Name *</label>
                                <div className="relative">
                                    <input
                                        name="fullName"
                                        type="text"
                                        value={signupForm.fullName}
                                        onChange={handleSignupChange}
                                        placeholder="Arjun Sharma"
                                        className="w-full py-2 px-4 pl-11 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                </div>
                                {errors.fullName && <p className="text-[9px] text-red-400 mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Phone Number *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">+91</span>
                                    <input
                                        name="phoneNumber"
                                        type="tel"
                                        value={signupForm.phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                                            setSignupForm(p => ({ ...p, phoneNumber: val }));
                                            if (errors.phoneNumber) setErrors(p => ({ ...p, phoneNumber: '' }));
                                        }}
                                        placeholder="9876543210"
                                        className="w-full py-2 pl-14 pr-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                </div>
                                {errors.phoneNumber && <p className="text-[9px] text-red-400 mt-1">{errors.phoneNumber}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Email (Optional)</label>
                                <div className="relative">
                                    <input
                                        name="email"
                                        type="email"
                                        value={signupForm.email}
                                        onChange={handleSignupChange}
                                        placeholder="arjun@domain.com"
                                        className="w-full py-2 px-4 pl-11 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                </div>
                                {errors.email && <p className="text-[9px] text-red-400 mt-1">{errors.email}</p>}
                            </div>

                            {/* City & State */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">City *</label>
                                    <input
                                        name="city"
                                        type="text"
                                        value={signupForm.city}
                                        onChange={handleSignupChange}
                                        placeholder="Jaipur"
                                        className="w-full py-2 px-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    {errors.city && <p className="text-[9px] text-red-400 mt-1">{errors.city}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">State *</label>
                                    <input
                                        name="state"
                                        type="text"
                                        value={signupForm.state}
                                        onChange={handleSignupChange}
                                        placeholder="Rajasthan"
                                        className="w-full py-2 px-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    {errors.state && <p className="text-[9px] text-red-400 mt-1">{errors.state}</p>}
                                </div>
                            </div>

                            {/* Password & Confirm */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Password *</label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={signupForm.password}
                                        onChange={handleSignupChange}
                                        placeholder="••••••"
                                        className="w-full py-2 px-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    {errors.password && <p className="text-[9px] text-red-400 mt-1">{errors.password}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Confirm *</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        value={signupForm.confirmPassword}
                                        onChange={handleSignupChange}
                                        placeholder="••••••"
                                        className="w-full py-2 px-4 rounded-xl border border-white/10 bg-black/40 text-white text-xs font-semibold focus:border-gold focus:outline-none"
                                    />
                                    {errors.confirmPassword && <p className="text-[9px] text-red-400 mt-1">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Submitting...</>
                                ) : (
                                    <span>Continue & Verify OTP</span>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-xs text-white/60">
                                Already have an account?{' '}
                                <button onClick={() => setMode('login')} className="font-bold text-gold hover:underline">
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthGateModal;

