import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const ResetPassword = () => {
    return (
        <div className="min-h-screen bg-ivory-light flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                <h2 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Reset Password</h2>
                <p className="text-xs text-emerald-dark/60 leading-relaxed font-semibold">
                    To reset your password safely, please initiate the request using email or mobile number OTP.
                </p>
                <Link to="/forgot-password"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                    Forgot Password Portal
                </Link>
                <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-dark/60 hover:text-emerald transition-colors">
                    <FiArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
            </div>
        </div>
    );
};

export default ResetPassword;
