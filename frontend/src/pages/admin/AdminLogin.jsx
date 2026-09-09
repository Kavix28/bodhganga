import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShield, FiPhone, FiKey, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { requestAdminOtp, verifyAdminOtp, isAdminAuthenticated } from '../../utils/adminAuth';
import toast from 'react-hot-toast';

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already authenticated as admin
    useEffect(() => {
        if (isAdminAuthenticated()) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    // OTP Auth States
    const [phoneNo, setPhoneNo] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Load MSG91 script dynamically for optional widget overlay
    useEffect(() => {
        if (!document.getElementById('msg91-otp-script')) {
            const script = document.createElement('script');
            script.id = 'msg91-otp-script';
            script.src = 'https://verify.msg91.com/otp-provider.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    // Cooldown countdown timer
    useEffect(() => {
        let interval = null;
        if (cooldown > 0) {
            interval = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cooldown]);

    const validatePhone = (num) => {
        const cleaned = num.trim().replace(/\D/g, '');
        if (!cleaned) return 'Admin mobile number is required';
        if (cleaned.length < 10) return 'Mobile number must be 10 digits';
        return '';
    };

    // Step 1: Request Admin OTP
    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();

        const phoneErr = validatePhone(phoneNo);
        if (phoneErr) {
            setErrorMsg(phoneErr);
            toast.error(phoneErr);
            return;
        }

        setErrorMsg('');
        setIsLoading(true);

        const cleanedPhone = phoneNo.trim().replace(/\D/g, '');

        try {
            const res = await requestAdminOtp(cleanedPhone);
            if (res.success) {
                setOtpSent(true);
                setCooldown(30);
                toast.success('Admin identity verified! Please check your OTP.');

                // Trigger MSG91 widget if present
                if (window.initSendOTP) {
                    const MSG91_AUTH_TOKEN = import.meta.env.VITE_MSG91_AUTH_TOKEN || "520206TlW19nvH5k6a15f8a5P1";
                    const config = {
                        widgetId: import.meta.env.VITE_MSG91_WIDGET_ID || "36657a734e31333338323730",
                        tokenAuth: MSG91_AUTH_TOKEN,
                        identifier: `91${cleanedPhone}`,
                        success: (response) => {
                            const token = typeof response === 'string' ? response : (response?.message || response?.['access-token'] || response?.token);
                            if (token) {
                                executeVerify(cleanedPhone, token);
                            }
                        },
                        failure: (error) => {
                            console.error("MSG91 Widget error:", error);
                        }
                    };
                    window.configuration = config;
                    try {
                        window.initSendOTP(window.configuration);
                    } catch (err) {
                        console.error("MSG91 popup init failed:", err);
                    }
                }
            } else {
                const msg = res.message || 'Unauthorized mobile number or invalid access.';
                setErrorMsg(msg);
                toast.error(msg);
            }
        } catch (err) {
            console.error('Request admin OTP error:', err);
            const msg = err?.message || 'Network error requesting OTP. Please try again.';
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify Admin OTP token
    const executeVerify = async (targetPhone, token) => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await verifyAdminOtp(targetPhone, token);
            if (res.success) {
                toast.success('Welcome to Admin Dashboard!');
                const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
                navigate(redirectTo, { replace: true });
            } else {
                const msg = res.message || 'Invalid or expired OTP token.';
                setErrorMsg(msg);
                toast.error(msg);
            }
        } catch (err) {
            console.error('Verify admin OTP error:', err);
            const msg = err?.message || 'Verification failed. Please try again.';
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySubmit = (e) => {
        e.preventDefault();
        if (!otpCode.trim()) {
            setErrorMsg('Please enter the OTP or verification code.');
            toast.error('Please enter the OTP code.');
            return;
        }
        const cleanedPhone = phoneNo.trim().replace(/\D/g, '');
        executeVerify(cleanedPhone, otpCode.trim());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-[24px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-600/30">
                        <FiShield className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Admin Access</h2>
                    <p className="mt-2 text-gray-400 text-sm">Secure OTP-Only Authentication</p>
                </div>

                {/* Security Notice */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-[2px] p-4">
                    <div className="flex items-center">
                        <FiShield className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                        <p className="text-red-300 text-xs leading-relaxed">
                            Restricted Area. Server-authorized access via OTP only. All access attempts are logged and monitored.
                        </p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-gray-800 rounded-[2px] shadow-xl p-8 border border-gray-700">
                    {!otpSent ? (
                        /* Step 1: Mobile Input Form */
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div>
                                <label htmlFor="phoneNo" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                                    Admin Mobile Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiPhone className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="phoneNo"
                                        name="phoneNo"
                                        type="tel"
                                        value={phoneNo}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                                            setPhoneNo(val);
                                            if (errorMsg) setErrorMsg('');
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 font-semibold ${
                                            errorMsg ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                        placeholder="Enter registered admin mobile"
                                        disabled={isLoading}
                                        autoComplete="tel"
                                    />
                                </div>
                                {errorMsg && (
                                    <p className="mt-2 text-xs text-red-400 font-semibold">{errorMsg}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-600 text-white py-3.5 px-4 rounded-[2px] font-bold text-xs uppercase tracking-widest hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Requesting OTP...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPhone className="h-4 w-4" />
                                        <span>Send OTP</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: OTP Verification Form */
                        <form onSubmit={handleVerifySubmit} className="space-y-6">
                            <div className="bg-gray-700/50 border border-gray-600 rounded-[2px] p-3 text-center space-y-1">
                                <p className="text-xs text-gray-300">
                                    OTP dispatched to <span className="font-bold text-white">+91 {phoneNo}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setErrorMsg('');
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold mt-1"
                                    disabled={isLoading}
                                >
                                    <FiArrowLeft className="w-3 h-3" /> Change mobile number
                                </button>
                            </div>

                            <div>
                                <label htmlFor="otpCode" className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                                    Enter OTP Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiKey className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="otpCode"
                                        name="otpCode"
                                        type="text"
                                        value={otpCode}
                                        onChange={(e) => {
                                            setOtpCode(e.target.value);
                                            if (errorMsg) setErrorMsg('');
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 font-mono tracking-widest text-center text-lg ${
                                            errorMsg ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                        placeholder="• • • • • •"
                                        disabled={isLoading}
                                        maxLength={32}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                {errorMsg && (
                                    <p className="mt-2 text-xs text-red-400 font-semibold">{errorMsg}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-600 text-white py-3.5 px-4 rounded-[2px] font-bold text-xs uppercase tracking-widest hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiShield className="h-4 w-4" />
                                        <span>Verify OTP & Access</span>
                                    </>
                                )}
                            </button>

                            <div className="pt-2 text-center">
                                {cooldown > 0 ? (
                                    <p className="text-xs text-gray-400 font-medium">
                                        Resend OTP available in <span className="text-white font-bold">{cooldown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                                    >
                                        <FiRefreshCw className="w-3.5 h-3.5" />
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-gray-500 text-xs">
                        Need admin access assistance? Contact BodhGanga support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;