import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { verifyResetToken, resetPassword as resetPasswordService } from '../services/authService';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // States: 'VERIFYING' | 'VALID' | 'INVALID' | 'SUCCESS'
    const [status, setStatus] = useState('VERIFYING');
    const [tokenError, setTokenError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Verify token validity on mount
    useEffect(() => {
        let isMounted = true;

        if (!token) {
            setStatus('INVALID');
            setTokenError('No reset token found. Please check your reset link or request a new one.');
            return;
        }

        const checkToken = async () => {
            try {
                const res = await verifyResetToken(token);
                if (isMounted) {
                    if (res?.success) {
                        setStatus('VALID');
                    } else {
                        setStatus('INVALID');
                        setTokenError(res?.message || 'This password reset link is invalid or has expired.');
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setStatus('INVALID');
                    const msg = err?.response?.data?.message || err?.message || 'This password reset link is invalid or has expired.';
                    setTokenError(msg);
                }
            }
        };

        checkToken();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};

        if (!newPassword || newPassword.length < 6) {
            errs.newPassword = 'Password must be at least 6 characters long';
        }
        if (newPassword !== confirmPassword) {
            errs.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const res = await resetPasswordService(token, newPassword);
            if (res?.success) {
                setStatus('SUCCESS');
                toast.success('Your password has been reset successfully!');
            } else {
                throw new Error(res?.message || 'Failed to reset password');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to reset password. Please try again.';
            toast.error(msg);
            setErrors({ submit: msg });
        } finally {
            setLoading(false);
        }
    };

    // State 1: Verifying token
    if (status === 'VERIFYING') {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    <div className="w-12 h-12 border-3 border-emerald border-t-transparent rounded-full animate-spin mx-auto" />
                    <h2 className="text-xl font-bold text-emerald-dark font-serif">Verifying Security Token</h2>
                    <p className="text-xs text-emerald-dark/60 font-semibold">
                        Please wait while we validate your secure password reset token...
                    </p>
                </div>
            </div>
        );
    }

    // State 2: Invalid or expired token
    if (status === 'INVALID') {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <FiAlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-dark font-serif">Link Expired or Invalid</h2>
                    <p className="text-xs text-emerald-dark/70 leading-relaxed font-semibold">
                        {tokenError || 'This password reset link is invalid, expired, or has already been used.'}
                    </p>
                    <div className="pt-2 space-y-3">
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Request New Reset Link
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // State 3: Password Reset Successful
    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    <div className="w-16 h-16 bg-emerald/10 text-emerald rounded-full flex items-center justify-center mx-auto">
                        <FiCheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald font-serif">Password Reset Successfully</h2>
                    <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                        Your password has been securely updated. You can now log into your BodhGanga account with your new credentials.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        Sign In Now
                    </Link>
                </div>
            </div>
        );
    }

    // State 4: Form to set new password
    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                <div>
                    <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald mb-6 transition-colors">
                        <FiArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Create New Password</h1>
                    <p className="text-xs text-emerald-dark/60 font-semibold mt-1">
                        Your reset token has been verified. Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">New Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                            <input
                                type={showNewPw ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => {
                                    setNewPassword(e.target.value);
                                    if (errors.newPassword) setErrors(p => ({ ...p, newPassword: '' }));
                                }}
                                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                disabled={loading}
                                className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                    errors.newPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                            >
                                {showNewPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.newPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.newPassword}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Confirm New Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                            <input
                                type={showConfirmPw ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' }));
                                }}
                                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                disabled={loading}
                                className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                    errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                }`}
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

                    {errors.submit && (
                        <p className="text-xs text-red-500 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200">{errors.submit}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Updating Password...</>
                        ) : (
                            <><FiLock className="w-4 h-4" /> Set New Password</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
