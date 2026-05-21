import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { login as loginService } from '../services/authService';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({ emailOrPhone: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.emailOrPhone.trim()) e.emailOrPhone = 'Email or phone number is required';
        if (!form.password) e.password = 'Password is required';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await loginService(form.emailOrPhone, form.password);
            if (res?.success && res.data?.token) {
                login(res.data.token, res.data.user);
                toast.success(`Welcome back, ${res.data.user?.name?.split(' ')[0] || 'Scholar'}!`);
                navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
            } else {
                throw new Error(res?.message || 'Login failed');
            }
        } catch (err) {
            const msg = err?.message || 'Invalid credentials';
            setErrors({ emailOrPhone: msg });
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory-light flex items-stretch">
            {/* Left Decorator Panel - Premium Hero Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-emerald-dark to-emerald-950 relative overflow-hidden flex-col items-center justify-center p-16">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative text-center space-y-8 max-w-sm z-10">
                    <Logo variant="primary" size="lg" showGlow={true} />
                    <p className="text-white/60 text-base leading-relaxed font-medium">
                        "Where Knowledge Takes Root"
                    </p>
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                        {[['36', 'Regions'], ['48K+', 'Students'], ['10K+', 'MCQs']].map(([v, l]) => (
                            <div key={l} className="space-y-1">
                                <div className="text-xl font-bold text-white font-serif">{v}</div>
                                <div className="text-[9px] text-gold font-bold uppercase tracking-widest">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Beautiful Glass Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-white/40 backdrop-blur-md">
                <div className="w-full max-w-md space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3.5 mb-6 lg:hidden">
                            <Logo variant="navbar" size="sm" theme="light" showGlow={true} />
                        </div>
                        <h1 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Welcome back, Scholar</h1>
                        <p className="text-xs text-emerald-dark/60 font-semibold mt-1">Sign in to resume your curriculum.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email/Phone */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Email or Phone</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                <input 
                                    name="emailOrPhone" 
                                    type="text" 
                                    value={form.emailOrPhone} 
                                    onChange={handleChange}
                                    placeholder="you@example.com or 9876543210"
                                    disabled={loading}
                                    className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                        errors.emailOrPhone ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                    }`} 
                                />
                            </div>
                            {errors.emailOrPhone && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.emailOrPhone}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-emerald-dark">Password</label>
                                <Link to="/forgot-password" className="text-xs font-bold text-gold hover:text-gold-dark transition-colors">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                <input 
                                    name="password" 
                                    type={showPw ? 'text' : 'password'} 
                                    value={form.password} 
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                        errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                    }`} 
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

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-emerald-dark border-t-transparent rounded-full animate-spin" /> Signing in...</>
                            ) : (
                                <><FiLock className="w-4 h-4" /> Sign In</>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-emerald/5" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-emerald-dark/40 bg-white px-3">New to BodhGanga?</div>
                    </div>

                    {/* Register CTA */}
                    <Link 
                        to="/register"
                        className="w-full py-3.5 border border-emerald/10 text-emerald font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-50/50 hover:border-emerald transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        Create Free Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
