import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { verifyMsg91 } from '../services/authService';
import { MSG91_CONFIG, normalizePhoneNumber, extractMsg91AccessToken } from '../utils/constants';
import toast from 'react-hot-toast';

const VerifyMobileOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [signupData, setSignupData] = useState(null);

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

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://verify.msg91.com/otp-provider.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            try { document.body.removeChild(script); } catch {}
        };
    }, []);

    const handleOtpSuccess = (data) => {
        const accessToken = extractMsg91AccessToken(data);
        if (!accessToken) {
            toast.error("OTP verification did not return a valid token. Please try again.");
            return;
        }
        handleVerifyAndRegister(accessToken);
    };

    const handleOpenPopup = () => {
        try {
            if (!window.initSendOTP) {
                toast.error("OTP service is initializing. Please wait a moment.");
                return;
            }

            const cleanPhone = normalizePhoneNumber(phone);
            const mobile = `91${cleanPhone}`;

            const config = {
                widgetId: MSG91_CONFIG.WIDGET_ID,
                tokenAuth: MSG91_CONFIG.AUTH_TOKEN,
                identifier: mobile,
                success: (data) => {
                    handleOtpSuccess(data);
                },
                failure: (error) => {
                    console.error("MSG91 FAILURE:", error);
                    const errMsg = typeof error === 'string' ? error : (error?.message || "OTP process failed.");
                    toast.error(errMsg);
                }
            };

            window.configuration = config;
            window.initSendOTP(window.configuration);

        } catch (err) {
            console.error("OTP INIT ERROR:", err);
            toast.error("Failed to open OTP verification. Please refresh and try again.");
        }
    };

    const handleVerifyAndRegister = async (accessToken) => {
        if (!signupData) {
            toast.error("Session expired. Please register again.");
            navigate('/register');
            return;
        }

        setIsLoading(true);
        try {
            const cleanPhone = normalizePhoneNumber(signupData.phoneNumber || signupData.phoneNo || phone);
            const res = await verifyMsg91(accessToken, cleanPhone, signupData);

            const authToken = res?.data?.token || res?.token;
            const authUser = res?.data?.user || res?.user;

            if (res?.success && authToken) {
                localStorage.removeItem('signupData');
                toast.success('Account created successfully! Welcome to Bodhganga!');
                login(authToken, authUser);
                setTimeout(() => navigate("/dashboard", { replace: true }), 150);
            } else {
                throw new Error(res?.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            const msg = err?.message || 'Something went wrong. Please try again.';
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                toast.error('This number is already registered. Please login instead.');
                navigate('/login');
            } else {
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneDisplay = (num) => {
        if (!num) return '';
        const cleaned = num.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
        }
        return `+${cleaned}`;
    };

    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center py-16 px-4">
            <div className="max-w-md w-full space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">

                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald/5 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <FiShield className="w-8 h-8 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">
                        Verify Mobile Number
                    </h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        A verification code will be sent to
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

                <div className="space-y-6">
                    <div className="bg-emerald-50/30 border border-emerald/10 rounded-xl p-5 text-center space-y-3">
                        <p className="text-xs font-medium text-emerald-dark/80">
                            Click below to verify your number via OTP. Your account will be created automatically once verified.
                        </p>
                        <button
                            type="button"
                            id="open-otp-popup"
                            onClick={handleOpenPopup}
                            disabled={isLoading}
                            className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-lg shadow hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" />
                                    Creating Account...
                                </span>
                            ) : (
                                'Verify & Create Account'
                            )}
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

