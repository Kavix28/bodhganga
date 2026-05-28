import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── DEBUG BUILD — remove after diagnosis ─────────────────────────────────────
const DBG = (...args) => console.log('%c[DBG]', 'color:#f59e0b;font-weight:bold', ...args);

// ── Network monkey-patch — logs every fetch/XHR ──────────────────────────────
(function installNetworkSpy() {
    if (window.__networkSpyInstalled) return;
    window.__networkSpyInstalled = true;

    // Patch fetch
    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : input?.url;
        DBG('FETCH →', url, init);
        try {
            const res = await origFetch.apply(this, arguments);
            const clone = res.clone();
            clone.text().then((body) =>
                DBG('FETCH ←', url, res.status, body.slice(0, 400))
            );
            return res;
        } catch (e) {
            DBG('FETCH ERROR', url, e);
            throw e;
        }
    };

    // Patch XHR
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__dbgUrl = url;
        this.__dbgMethod = method;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('load', function () {
            DBG('XHR ←', this.__dbgMethod, this.__dbgUrl, this.status,
                String(this.responseText).slice(0, 400));
        });
        this.addEventListener('error', function () {
            DBG('XHR ERROR', this.__dbgMethod, this.__dbgUrl);
        });
        DBG('XHR →', this.__dbgMethod, this.__dbgUrl);
        return origSend.apply(this, arguments);
    };
})();

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

        DBG('PAGE MOUNT — phoneFromState:', phoneFromState,
            '| signupData in localStorage:', !!storedSignupData);

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

    // ── Force MSG91 widget visible above all app layers ───────────────────────
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            msg91-otp-provider,
            msg91-otp-provider *,
            iframe[src*="msg91"],
            iframe[src*="phone91"] {
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 2147483647 !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }

            body {
                overflow: auto !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // ── Global postMessage spy — catches ALL messages ─────────────────────────
    useEffect(() => {
        const spy = (event) => {
            DBG('POSTMESSAGE RECEIVED:', {
                origin: event.origin,
                data: event.data,
            });
            if (event.data?.type === 'MSG91_OTP_SUCCESS') {
                DBG('MSG91_OTP_SUCCESS matched → calling handleOtpSuccess');
                handleOtpSuccess(event.data.data);
            }
        };
        window.addEventListener('message', spy);
        DBG('postMessage listener registered on main window');
        return () => window.removeEventListener('message', spy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── OTP success → verify token with backend ──────────────────────────────────
    const handleOtpSuccess = (data) => {
        DBG('handleOtpSuccess called with:', data);
        const token =
            typeof data === 'string'
                ? data
                : data?.token || data?.['access-token'] || data?.message;
        DBG('extracted token:', token);
        if (token) {
            handleVerifyToken(token);
        } else {
            console.error('[DBG] MSG91 success but no recognisable token in payload:', data);
            toast.error('Verification response unexpected. Please try again.');
        }
    };

    // ── Button handler — wait for MSG91 custom element, then initSendOTP ────────
    const handleOpenPopup = async () => {
        DBG('OTP CLICKED');
        DBG('window.initSendOTP =', typeof window.initSendOTP);
        DBG('msg91-send-otp-center registered:',
            !!customElements.get('msg91-send-otp-center'));
        DBG('msg91 provider elements:',
            document.querySelectorAll('msg91-otp-provider'));
        DBG('iframes:', document.querySelectorAll('iframe'));

        const mobile = `91${phone.trim().replace(/\D/g, '')}`;
        DBG('mobile:', mobile);
        localStorage.setItem('otp_mobile', mobile);

        const waitForMSG91 = setInterval(() => {
            const sdkReady      = typeof window.initSendOTP === 'function';
            const elementReady  = !!customElements.get('msg91-send-otp-center');
            DBG('readiness poll — sdk:', sdkReady, '| customElement:', elementReady);

            if (sdkReady && elementReady) {
                clearInterval(waitForMSG91);
                DBG('✅ Both ready — calling initSendOTP');

                window.initSendOTP({
                    widgetId:      import.meta.env.VITE_MSG91_WIDGET_ID,
                    tokenAuth:     import.meta.env.VITE_MSG91_AUTH_TOKEN,
                    identifier:    mobile,
                    exposeMethods: true,

                    success: (data) => {
                        console.log('[MSG91 SUCCESS]', data);
                        DBG('handleOtpSuccess ← success payload:', data);
                        handleOtpSuccess(data);
                    },

                    failure: (err) => {
                        console.error('[MSG91 FAILURE]', err);
                        DBG('failure payload:', err);
                        toast.error(err?.message || 'OTP verification failed. Please try again.');
                    },
                });
            }
        }, 200);

        // Safety timeout — give up after 10 s
        setTimeout(() => {
            clearInterval(waitForMSG91);
            DBG('⏱ MSG91 readiness timeout after 10 s');
        }, 10000);
    };

    // ── Verify MSG91 token with backend ──────────────────────────────────────────
    const handleVerifyToken = async (accessToken) => {
        DBG('handleVerifyToken called — accessToken:', accessToken,
            '| phone:', phone);
        setIsLoading(true);
        try {
            DBG('POST /api/auth/msg91/verify ...');
            const res = await api.post('/api/auth/msg91/verify', {
                accessToken,
                phoneNumber: phone,
                signupData,
            });
            DBG('backend response:', res);

            if (res?.success && res.data?.token) {
                DBG('✅ Backend verified — navigating to /dashboard');
                localStorage.removeItem('signupData');
                toast.success('Mobile number verified & registered successfully!');
                login(res.data.token, res.data.user);
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error(res?.message || 'Authentication failed');
            }
        } catch (err) {
            DBG('❌ backend verify error:', err);
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
