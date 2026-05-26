import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { OTP_CONFIG } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const email = location.state?.email;
    const signupData = location.state?.signupData;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(OTP_CONFIG.EXPIRY_MINUTES * 60);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState('');
    const [verified, setVerified] = useState(false);
    const inputRefs = useRef([]);

    // Redirect if no email in state
    useEffect(() => {
        if (!email) navigate('/register');
    }, [email, navigate]);

    // OTP expiry countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft]);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
        if (next.every(d => d) && next.join('').length === 6) submitOtp(next.join(''));
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
            submitOtp(pasted);
        }
    };

    const submitOtp = async (otpValue) => {
        if (otpValue.length !== 6) { setError('Enter all 6 digits'); return; }
        if (timeLeft <= 0) { setError('OTP expired. Request a new one.'); return; }

        setIsLoading(true);
        setError('');
        try {
            if (signupData) {
                const res = await api.post('/api/auth/register/verify', { 
                    email, 
                    otp: otpValue,
                    signupData
                });
                if (res.success && res.data?.token) {
                    setVerified(true);
                    toast.success('Registration successful!');
                    login(res.data.token, res.data.user);
                    setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
                } else {
                    setError(res.message || 'Verification failed');
                    setOtp(['', '', '', '', '', '']);
                    inputRefs.current[0]?.focus();
                }
            } else {
                const res = await api.post('/api/auth/otp/verify', { email, otp: otpValue });
                if (res.success) {
                    setVerified(true);
                    toast.success('Email verified successfully!');
                    setTimeout(() => navigate('/login', { state: { verified: true } }), 2000);
                } else {
                    setError(res.message || 'Verification failed');
                    setOtp(['', '', '', '', '', '']);
                    inputRefs.current[0]?.focus();
                }
            }
        } catch (err) {
            setError(err.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setIsResending(true);
        setError('');
        try {
            const res = await api.post('/api/auth/otp/send', { email });
            if (res.success) {
                toast.success('New OTP sent to your email');
                setTimeLeft(OTP_CONFIG.EXPIRY_MINUTES * 60);
                setResendCooldown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                toast.error(res.message || 'Failed to resend OTP');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    if (verified) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center">
                <div className="text-center space-y-6 card-premium bg-white p-12 max-w-sm mx-auto shadow-2xl border border-emerald/10">
                    <div className="w-20 h-20 bg-emerald/10 rounded-full flex items-center justify-center mx-auto">
                        <FiCheckCircle className="w-10 h-10 text-emerald" />
                    </div>
                    <h2 className="text-3xl font-bold text-emerald font-serif">Verified!</h2>
                    <p className="text-xs text-emerald-dark/60 font-semibold">Redirecting you to login portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center py-16 px-4">
            <div className="max-w-md w-full space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald/5 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">📧</span>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Verify Your Email</h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        A secure 6-digit confirmation code has been dispatched to{' '}
                        <span className="font-bold text-emerald block mt-1">{email}</span>
                    </p>
                    <Link to="/register" className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-dark transition-colors mt-2">
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        Modify email address
                    </Link>
                </div>

                <div className="space-y-6">
                    {/* OTP Inputs */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark text-center">
                            Enter 6-Digit OTP
                        </label>
                        <div className="flex justify-between gap-2 max-w-sm mx-auto">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => (inputRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    onPaste={handlePaste}
                                    disabled={isLoading || timeLeft <= 0}
                                    className={`w-12 h-14 text-center text-2xl font-bold border rounded-xl focus:outline-none transition-all duration-300
                                        ${error 
                                            ? 'border-red-400 bg-red-50/20 text-red-500 focus:ring-4 focus:ring-red-500/10' 
                                            : 'border-emerald/10 bg-white focus:border-emerald focus:ring-4 focus:ring-emerald/10 text-emerald-dark'
                                        }
                                        ${timeLeft <= 0 ? 'bg-gray-100/50 cursor-not-allowed opacity-60' : ''}
                                        ${digit ? 'border-emerald bg-emerald/5' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center">
                        {timeLeft > 0 ? (
                            <p className={`text-xs font-bold uppercase tracking-wider ${timeLeft < 60 ? 'text-red-500' : 'text-emerald/60'}`}>
                                Code expires in{' '}
                                <span className="font-extrabold text-sm ml-1">{formatTime(timeLeft)}</span>
                            </p>
                        ) : (
                            <p className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-50 py-2 rounded-xl">
                                OTP has expired. Request a new one.
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-center text-xs font-bold uppercase tracking-wider text-red-500 bg-red-50/50 border border-red-500/15 py-3 px-4 rounded-xl">
                            {error}
                        </p>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={() => submitOtp(otp.join(''))}
                        disabled={!otp.every(d => d) || isLoading || timeLeft <= 0}
                        className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
                                Verifying...
                            </span>
                        ) : 'Verify Code'}
                    </button>

                    {/* Resend */}
                    <div className="text-center pt-4 border-t border-emerald/5">
                        <p className="text-xs text-emerald-dark/60 font-semibold mb-2">Didn't receive the email verification code?</p>
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isResending}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald hover:text-emerald-light disabled:text-emerald/40 disabled:cursor-not-allowed transition-colors"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : isResending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
