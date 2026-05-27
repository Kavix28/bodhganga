import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { forgotPasswordMobileRequest, forgotPasswordMobileVerify, resetPasswordMobile } from '../services/authService';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    // Tabs & Steps
    const [resetMethod, setResetMethod] = useState('mobile'); // only mobile reset exists
    const [otpStep, setOtpStep] = useState('INPUT_PHONE'); // 'INPUT_PHONE', 'RESET_PASSWORD', 'SUCCESS'

    // Form Inputs
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI/UX States
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    // MSG91 states
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [verifiedToken, setVerifiedToken] = useState('');

    // Dynamically load MSG91 Widget script on mount for mobile reset
    useEffect(() => {
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
    }, []);
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

            if (!window.initSendOTP) {
                toast.error("OTP service is initializing. Please wait a moment.");
                setLoading(false);
                return;
            }

            // Configure MSG91 widget configuration dynamically
            window.configuration = {
                widgetId: "3657a734e31333338323730",
                tokenAuth: true,
                identifier: formattedPhone,
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

            // Open the MSG91 widget popup
            window.initSendOTP(window.configuration);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            const msg = err?.message || 'No account found with this mobile number';
            setErrors({ phone: msg });
            toast.error(msg);
        }
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
                        Enter your registered mobile number to reset your password via secure OTP.
                    </p>
                </div>

                {/* Mobile OTP Password Reset Flow */}
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
            </div>
        </div>
    );
};

export default ForgotPassword;
