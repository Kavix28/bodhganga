import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyMobileOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [signupData, setSignupData] = useState(null);

    // ── Load phone + signup data from navigation state or localStorage ──────────
    useEffect(() => {
        const storedSignupData = localStorage.getItem('signupData');
        const phoneFromState =
            location.state?.phone ||
            (storedSignupData
                ? JSON.parse(storedSignupData).phoneNo ||
                  JSON.parse(storedSignupData).phoneNumber
                : '');

        if (!phoneFromState) {
            toast.error('Invalid session. Redirecting to registration.');
            navigate('/register');
            return;
        }

        setPhone(phoneFromState);
        if (storedSignupData) {
            setSignupData(JSON.parse(storedSignupData));
        }
    }, [location.state, navigate]);

    // ── Load SDK once on mount ──────────────────────────────────────────────────
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://verify.msg91.com/otp-provider.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // ── OTP success → verify token with backend ──────────────────────────────────
    const handleOtpSuccess = (data) => {
        const token =
            typeof data === 'string'
                ? data
                : data?.token || data?.['access-token'] || data?.message;
        if (token) {
            handleVerifyToken(token);
        } else {
            console.error('MSG91 success but no recognisable token in payload:', data);
            toast.error('Verification response unexpected. Please try again.');
        }
    };

    // ── Button handler ──────────────────────────────────────────────────────────
    const handleOpenPopup = () => {
        if (!window.initSendOTP) {
            console.error("MSG91 SDK not loaded");
            return;
        }

        window.initSendOTP({
            widgetId: "36657a734e31333338323730",
            tokenAuth: "520206TzveVH8e6a17f07cP1",
            identifier: `91${phone.trim().replace(/\D/g, "")}`,
            exposeMethods: true,
            containerId: "msg91-widget-container",
            success: (data) => {
                console.log("MSG91 SUCCESS", data);
                handleOtpSuccess(data);
            },
            failure: (err) => {
                console.error("MSG91 FAILURE", err);
            }
        });
    };

    // ── Verify MSG91 token with backend ──────────────────────────────────────────
    const handleVerifyToken = async (accessToken) => {
        setIsLoading(true);
        try {
            const res = await api.post('/api/auth/msg91/verify', {
                accessToken,
                phoneNumber: phone,
                signupData,
            });

            if (res?.success && res.data?.token) {
                localStorage.removeItem('signupData');
                toast.success('Mobile number verified & registered successfully!');
                login(res.data.token, res.data.user);
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error(res?.message || 'Authentication failed');
            }
        } catch (err) {
            console.error('Backend token verification error:', err);
            toast.error(err?.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Display helper ───────────────────────────────────────────────────────────
    const formatPhoneDisplay = (num) => {
        if (!num) return '';
        const cleaned = num.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
        }
        return `+${cleaned}`;
    };

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center py-16 px-4">
            <div className="max-w-md w-full space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald/5 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <FiShield className="w-8 h-8 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">
                        Verify Mobile OTP
                    </h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        A verification code will be sent to your mobile number
                        <span className="font-bold text-emerald block mt-1">
                            {formatPhoneDisplay(phone)}
                        </span>
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-dark transition-colors mt-2"
                        disabled={isLoading}
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        Modify phone number or details
                    </button>
                </div>

                {/* Action */}
                <div className="space-y-6">
                    <div className="bg-emerald-50/30 border border-emerald/10 rounded-xl p-5 text-center space-y-3">
                        <p className="text-xs font-medium text-emerald-dark/80">
                            Click the button below — a secure MSG91 popup will open to verify your number.
                        </p>
                        <div id="msg91-widget-container"></div>
                        <msg91-otp-provider></msg91-otp-provider>
                        <button
                            type="button"
                            id="open-otp-popup"
                            onClick={handleOpenPopup}
                            disabled={isLoading}
                            className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-lg shadow hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isLoading ? 'Processing…' : 'Open Verification Popup'}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-[10px] text-emerald-dark/40 font-semibold uppercase tracking-widest">
                            Secure Verification via MSG91
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VerifyMobileOtp;
