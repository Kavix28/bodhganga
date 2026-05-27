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
    const [scriptLoaded, setScriptLoaded] = useState(!!window.initSendOTP);
    const [phone, setPhone] = useState('');
    const [signupData, setSignupData] = useState(null);

    // Load data from state or localStorage
    useEffect(() => {
        const storedSignupData = localStorage.getItem('signupData');
        const phoneFromState = location.state?.phone || (storedSignupData ? (JSON.parse(storedSignupData).phoneNo || JSON.parse(storedSignupData).phoneNumber) : '');

        if (!phoneFromState) {
            toast.error("Invalid session. Redirecting to registration.");
            navigate('/register');
            return;
        }

        setPhone(phoneFromState);
        if (storedSignupData) {
            setSignupData(JSON.parse(storedSignupData));
        }
    }, [location.state, navigate]);

    // Load MSG91 SDK only once
    useEffect(() => {
        console.log("VerifyMobileOtp mounted. initSendOTP:", typeof window.initSendOTP);

        if (window.initSendOTP) {
            setScriptLoaded(true);
            return;
        }

        let script = document.getElementById('msg91-otp-script');
        if (!script) {
            script = document.createElement('script');
            script.id = 'msg91-otp-script';
            script.src = 'https://verify.msg91.com/otp-provider.js';
            script.async = true;
            script.onerror = () => {
                toast.error("Failed to load OTP verification service. Please try again.");
            };
            document.body.appendChild(script);
        }

        const interval = setInterval(() => {
            if (window.initSendOTP) {
                console.log("MSG91 SDK ready");
                setScriptLoaded(true);
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);



    const handleOtpSuccess = (data) => {
        const token = typeof data === 'string' ? data : (data?.message || data?.['access-token'] || data?.token);
        if (token) {
            handleVerifyToken(token);
        }
    };

    const handleOpenPopup = () => {
        console.log("OPEN VERIFICATION POPUP clicked");

        if (!window.initSendOTP) {
            console.error("MSG91 SDK not loaded");
            toast.error("Verification service not ready. Please wait.");
            return;
        }

        let mobileNumber = phone.trim().replace(/\D/g, '');
        if (mobileNumber.length === 10) {
            mobileNumber = '91' + mobileNumber;
        }

        const configuration = {
            widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
            tokenAuth: import.meta.env.VITE_MSG91_AUTH_TOKEN,
            identifier: mobileNumber,
            exposeMethods: true,

            success: (data) => {
                console.log("MSG91 OTP verified:", data);
                if (data?.token) {
                    handleOtpSuccess(data);
                } else if (data) {
                    // handle alternate token shapes
                    handleOtpSuccess(data);
                }
            },

            failure: (error) => {
                console.error("MSG91 failure:", error);
                toast.error("OTP verification failed. Please try again.");
            },
        };

        window.initSendOTP(configuration);
        console.log("initSendOTP called");

        setTimeout(() => {
            console.log("widget check:", document.querySelector("msg91-otp-provider"));
        }, 1000);
    };

    // Verify token with backend to login / signup
    const handleVerifyToken = async (accessToken) => {
        setIsLoading(true);
        try {
            const res = await api.post('/api/auth/msg91/verify', {
                accessToken,
                phoneNumber: phone,
                signupData: signupData
            });

            if (res?.success && res.data?.token) {
                // Clear temporary signup data
                localStorage.removeItem('signupData');
                
                toast.success("Mobile number verified & registered successfully!");
                login(res.data.token, res.data.user);
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error(res?.message || 'Authentication failed');
            }
        } catch (err) {
            console.error("Backend token verification error:", err);
            const msg = err?.message || 'Verification failed. Please try again.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Format phone for display (+91 XXXXX XXXXX)
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
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald/5 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <FiShield className="w-8 h-8 text-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Verify Mobile OTP</h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        A verification code is being sent to your mobile number
                        <span className="font-bold text-emerald block mt-1">{formatPhoneDisplay(phone)}</span>
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
                    {/* Action Card */}
                    <div className="bg-emerald-50/30 border border-emerald/10 rounded-xl p-5 text-center space-y-3">
                        <p className="text-xs font-medium text-emerald-dark/80">
                            Click the button below to open the secure MSG91 verification popup.
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenPopup}
                            disabled={isLoading || !scriptLoaded}
                            className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-lg shadow hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isLoading ? "Processing..." : "Open Verification Popup"}
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
