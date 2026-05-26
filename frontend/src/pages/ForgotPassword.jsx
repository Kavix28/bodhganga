import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { forgotPasswordMobileRequest, forgotPasswordMobileVerify, resetPasswordMobile } from '../services/authService';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    // Tabs & Steps
    const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'mobile'
    const [otpStep, setOtpStep] = useState('INPUT_PHONE'); // 'INPUT_PHONE', 'INPUT_OTP', 'RESET_PASSWORD', 'SUCCESS'

    // Form Inputs
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI/UX States
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false); // for email reset success
    const [errors, setErrors] = useState({});
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // MSG91 states
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [timer, setTimer] = useState(0);
    const [verifiedToken, setVerifiedToken] = useState('');

    // Resend OTP countdown timer
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Dynamically load MSG91 Widget script on demand for mobile reset
    useEffect(() => {
        if (resetMethod === 'mobile') {
            window.configuration = {
                widgetId: "3657a734e31333338323730",
                exposeMethods: true,
                success: (response) => {
                    console.log("ForgotPassword MSG91 success callback:", response);
                    const token = typeof response === 'string' ? response : (response?.message || response?.['access-token'] || response?.token);
                    if (token) {
                        handleVerifyOtpToken(token);
                    }
                },
                failure: (error) => {
                    console.error("ForgotPassword MSG91 failure callback:", error);
                    const errMsg = typeof error === 'string' ? error : (error?.message || "OTP process failed.");
                    toast.error(errMsg);
                    setLoading(false);
                }
            };

            if (!document.getElementById('msg91-otp-script')) {
                const script = document.createElement('script');
                script.id = 'msg91-otp-script';
                script.src = 'https://verify.msg91.com/otp-provider.js';
                script.async = true;
                script.onload = () => {
                    setScriptLoaded(true);
                };
                script.onerror = () => {
                    toast.error("Failed to load OTP verification service. Please try again.");
                };
                document.body.appendChild(script);
            } else {
                setScriptLoaded(true);
            }
        }
    }, [resetMethod]);

    // Email Reset Submit
    const handleEmailSubmit = async e => {
        e.preventDefault();
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }
        setLoading(true);
        setErrors({});
        try {
            await api.post('/api/auth/otp/send', { email });
            setSent(true);
            toast.success('Reset code sent to your email');
        } catch (err) {
            // Always show success to prevent user enumeration
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    const validatePhone = (num) => {
        const cleaned = num.trim().replace(/\D/g, '');
        if (!cleaned) return 'Phone number is required';
        if (cleaned.length < 10) return 'Phone number must be 10 digits';
        return '';
    };

    // Mobile Reset Step 1: Request verification (Checks if exists, then triggers MSG91)
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        const phoneError = validatePhone(phone);
        if (phoneError) {
            setErrors({ phone: phoneError });
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            // Backend checks database if mobile exists
            const res = await forgotPasswordMobileRequest(phone);
            if (!res?.success) {
                throw new Error(res?.message || 'Verification failed');
            }

            // Normalizing phone and calling MSG91
            let formattedPhone = phone.trim().replace(/\D/g, '');
            if (formattedPhone.length === 10) {
                formattedPhone = '91' + formattedPhone;
            }

            if (!window.sendOtp) {
                toast.error("OTP service is initializing. Please wait a moment.");
                setLoading(false);
                return;
            }

            window.sendOtp(
                formattedPhone,
                () => {
                    setLoading(false);
                    setOtpStep('INPUT_OTP');
                    setTimer(30);
                    toast.success("OTP sent successfully!");
                },
                (error) => {
                    console.error("Forgot pwd OTP send error:", error);
                    setLoading(false);
                    const errMsg = typeof error === 'string' ? error : (error?.message || "Failed to send OTP.");
                    setErrors({ phone: errMsg });
                    toast.error(errMsg);
                }
            );
        } catch (err) {
            setLoading(false);
            const msg = err?.message || 'No account found with this mobile number';
            setErrors({ phone: msg });
            toast.error(msg);
        }
    };

    // Resend Mobile OTP handler
    const handleResendOtp = () => {
        if (timer > 0) return;
        setLoading(true);

        const triggerSend = () => {
            let formattedPhone = phone.trim().replace(/\D/g, '');
            if (formattedPhone.length === 10) {
                formattedPhone = '91' + formattedPhone;
            }
            window.sendOtp(
                formattedPhone,
                () => {
                    setLoading(false);
                    setTimer(30);
                    toast.success("OTP resent successfully!");
                },
                (err) => {
                    setLoading(false);
                    const errMsg = typeof err === 'string' ? err : (err?.message || "Failed to resend OTP.");
                    toast.error(errMsg);
                }
            );
        };

        if (window.retryOtp) {
            window.retryOtp(
                null,
                () => {
                    setLoading(false);
                    setTimer(30);
                    toast.success("OTP resent successfully!");
                },
                (error) => {
                    console.warn("retryOtp failed, falling back to sendOtp:", error);
                    triggerSend();
                }
            );
        } else {
            triggerSend();
        }
    };

    // Mobile Reset Step 2: Verify OTP
    const handleVerifyOtp = (e) => {
        if (e) e.preventDefault();
        if (!otp || otp.length < 4) {
            setErrors({ otp: "Please enter a valid OTP" });
            return;
        }
        setErrors({});
        setLoading(true);

        if (!window.verifyOtp) {
            toast.error("OTP engine is not ready. Please try again.");
            setLoading(false);
            return;
        }

        window.verifyOtp(
            otp,
            (response) => {
                console.log("verifyOtp success response:", response);
                const token = typeof response === 'string' ? response : (response?.message || response?.['access-token'] || response?.token);
                if (token) {
                    handleVerifyOtpToken(token);
                }
            },
            (error) => {
                console.error("verifyOtp error:", error);
                setLoading(false);
                const errMsg = typeof error === 'string' ? error : (error?.message || "Incorrect OTP. Please try again.");
                setErrors({ otp: errMsg });
                toast.error(errMsg);
            }
        );
    };

    // Mobile Reset Step 2.5: Verify access token on backend
    const handleVerifyOtpToken = async (accessToken) => {
        setLoading(true);
        try {
            const res = await forgotPasswordMobileVerify(accessToken);
            if (res?.success) {
                setVerifiedToken(accessToken);
                setOtpStep('RESET_PASSWORD');
                toast.success("OTP verified successfully!");
            } else {
                throw new Error(res?.message || 'Verification failed');
            }
        } catch (err) {
            console.error("Backend forgot verification failed:", err);
            const msg = err?.message || 'Verification failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Mobile Reset Step 3: Password Update
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (!password || password.length < 6) {
            setErrors({ password: 'Password must be at least 6 characters' });
            return;
        }
        if (password !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            const res = await resetPasswordMobile(verifiedToken, password);
            if (res?.success) {
                toast.success("Password reset successful!");
                setOtpStep('SUCCESS');
            } else {
                throw new Error(res?.message || 'Reset failed');
            }
        } catch (err) {
            console.error("Password reset failed:", err);
            const msg = err?.message || 'Failed to reset password. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Rendering Success Screen
    if (resetMethod === 'mobile' && otpStep === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto">
                        <FiCheckCircle className="w-10 h-10 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald font-serif tracking-tight">Password Reset Successful</h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        Your password has been securely updated. You can now log into your BodhGanga account with your new password.
                    </p>
                    <Link to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Rendering Email Reset Success Screen
    if (resetMethod === 'email' && sent) {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto">
                        <FiCheckCircle className="w-10 h-10 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald font-serif tracking-tight">Check Your Email</h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        If <strong>{email}</strong> is registered, you'll receive a secure verification code shortly.
                    </p>
                    <Link to="/verify-otp" state={{ email }}
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                        Enter Verification Code
                    </Link>
                    <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald transition-colors">
                        <FiArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                
                {/* Back to Login & Title */}
                <div>
                    <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald mb-6 transition-colors">
                        <FiArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Forgot Password?</h1>
                    <p className="text-xs text-emerald-dark/60 font-semibold mt-1">
                        {resetMethod === 'email' 
                            ? "Enter your registered email and we'll dispatch a verification code."
                            : "Enter your registered mobile number to reset your password via secure OTP."}
                    </p>
                </div>

                {/* Tab Switcher */}
                {otpStep === 'INPUT_PHONE' && (
                    <div className="flex border-b border-emerald/10 mb-6">
                        <button
                            type="button"
                            onClick={() => { setResetMethod('email'); setErrors({}); }}
                            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${
                                resetMethod === 'email'
                                    ? 'border-gold text-emerald-dark'
                                    : 'border-transparent text-emerald-dark/40 hover:text-emerald-dark/70'
                            }`}
                        >
                            Email Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => { setResetMethod('mobile'); setErrors({}); }}
                            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${
                                resetMethod === 'mobile'
                                    ? 'border-gold text-emerald-dark'
                                    : 'border-transparent text-emerald-dark/40 hover:text-emerald-dark/70'
                            }`}
                        >
                            Mobile OTP Reset
                        </button>
                    </div>
                )}

                {/* Condition-based forms */}
                {resetMethod === 'email' ? (
                    /* Email Forgot Form */
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Email Address</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => { setEmail(e.target.value); if (errors.email) setErrors({}); }}
                                    placeholder="you@domain.com"
                                    className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                        errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                    }`}
                                    disabled={loading} 
                                />
                            </div>
                            {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.email}</p>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 disabled:pointer-events-none transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Dispatching...</>
                            ) : (
                                <><FiMail className="w-4 h-4" /> Send Reset Code</>
                            )}
                        </button>
                    </form>
                ) : (
                    /* Mobile OTP Password Reset Flow */
                    <div className="space-y-6">
                        {otpStep === 'INPUT_PHONE' && (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Registered Mobile Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald/60">+91</span>
                                        <input 
                                            type="tel" 
                                            value={phone} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                                                setPhone(val);
                                                if (errors.phone) setErrors({});
                                            }}
                                            placeholder="9876543210"
                                            disabled={loading || !scriptLoaded}
                                            className={`w-full py-3 pl-14 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                                errors.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                            }`} 
                                        />
                                        <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/40" />
                                    </div>
                                    {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.phone}</p>}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading || !scriptLoaded}
                                    className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                >
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Verifying...</>
                                    ) : (
                                        <><FiPhone className="w-4 h-4" /> Send OTP</>
                                    )}
                                </button>
                            </form>
                        )}

                        {otpStep === 'INPUT_OTP' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Enter OTP</label>
                                        <button 
                                            type="button" 
                                            onClick={() => { setOtpStep('INPUT_PHONE'); setOtp(''); setErrors({}); }}
                                            className="text-xs font-bold text-gold hover:text-gold-dark transition-colors"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                        <input 
                                            type="text" 
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            value={otp} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                                                setOtp(val);
                                                if (errors.otp) setErrors({});
                                            }}
                                            placeholder="••••••"
                                            disabled={loading}
                                            className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none text-center tracking-[0.5em] ${
                                                errors.otp ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                            }`} 
                                        />
                                    </div>
                                    {errors.otp && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.otp}</p>}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-emerald-dark/50 font-medium">Sent to +91 {phone}</span>
                                        {timer > 0 ? (
                                            <span className="text-[10px] text-emerald-dark/50 font-bold">Resend in {timer}s</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={loading}
                                                className="text-[10px] text-gold hover:text-gold-dark font-extrabold uppercase tracking-wider"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                >
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Verifying...</>
                                    ) : (
                                        <><FiLock className="w-4 h-4" /> Verify & Continue</>
                                    )}
                                </button>
                            </form>
                        )}

                        {otpStep === 'RESET_PASSWORD' && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">New Password</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                        <input 
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); if (errors.password) setErrors({}); }}
                                            placeholder="••••••••"
                                            className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                                errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                            }`}
                                            disabled={loading} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPw(!showPw)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                                        >
                                            {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.password}</p>}
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Confirm Password</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                        <input 
                                            type={showConfirmPw ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({}); }}
                                            placeholder="••••••••"
                                            className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                                errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                            }`}
                                            disabled={loading} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                                        >
                                            {showConfirmPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.confirmPassword}</p>}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                >
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Resetting...</>
                                    ) : (
                                        <><FiLock className="w-4 h-4" /> Reset Password</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
