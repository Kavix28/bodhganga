import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Uses the OTP send endpoint — same flow
            await api.post('/auth/otp/send', { email });
            setSent(true);
            toast.success('Reset code sent to your email');
        } catch (err) {
            // Always show success to prevent user enumeration
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
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
                <div>
                    <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald mb-6 transition-colors">
                        <FiArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight animate-fade-in">Forgot Password?</h1>
                    <p className="text-xs text-emerald-dark/60 font-semibold mt-1">Enter your registered email and we'll dispatch a verification code.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Email Address</label>
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                placeholder="you@domain.com"
                                className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                    error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                }`}
                                disabled={loading} 
                            />
                        </div>
                        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{error}</p>}
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
            </div>
        </div>
    );
};

export default ForgotPassword;
