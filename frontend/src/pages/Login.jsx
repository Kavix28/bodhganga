import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import SpaceBackground from '../components/common/SpaceBackground';
import { useSpaceTheme } from '../context/SpaceThemeContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { spaceTheme } = useSpaceTheme();

    const [formData, setFormData] = useState({
        emailOrPhone: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.emailOrPhone.trim()) {
            newErrors.emailOrPhone = 'Email or phone is required';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await login(formData.emailOrPhone, formData.password);
            toast.success('Welcome back!');

            const redirectTo = location.state?.from?.pathname || '/dashboard';
            navigate(redirectTo, { replace: true });
        } catch (error) {
            console.error('Login error:', error);
            setErrors({
                emailOrPhone: 'Invalid credentials',
                password: 'Invalid credentials'
            });
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Space Background */}
            <SpaceBackground theme={spaceTheme} />

            {/* Content */}
            <div className="relative z-10 max-w-md w-full space-y-8 fade-in">
                {/* Header */}
                <div className="text-center slide-down">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
                        <FiLock className="w-4 h-4 text-cyan-300" />
                        <span className="text-sm font-semibold text-white">Secure Login</span>
                    </div>
                    <h2 className="text-5xl font-black text-white mb-4 drop-shadow-lg">
                        Welcome Back!
                    </h2>
                    <p className="text-xl text-white/90 drop-shadow">
                        Continue your learning journey
                    </p>
                </div>

                {/* Login Form - Enhanced Glassmorphism */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 scale-in hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="emailOrPhone" className="block text-sm font-bold text-white mb-2 drop-shadow">
                                Email or Phone
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-cyan-300" />
                                </div>
                                <input
                                    id="emailOrPhone"
                                    name="emailOrPhone"
                                    type="text"
                                    value={formData.emailOrPhone}
                                    onChange={handleChange}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/90 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 font-semibold text-slate-900 ${errors.emailOrPhone ? 'border-red-400 ring-2 ring-red-400' : 'border-white/30 focus:scale-[1.01]'
                                        }`}
                                    placeholder="Enter your email or phone"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.emailOrPhone && (
                                <p className="mt-2 text-sm text-red-300 font-semibold flex items-center gap-2 drop-shadow">
                                    <FiMail className="w-4 h-4" />
                                    {errors.emailOrPhone}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-sm font-bold text-white drop-shadow">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-cyan-300 hover:text-cyan-100 transition-colors drop-shadow"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-cyan-300" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-12 pr-12 py-4 bg-white/90 backdrop-blur-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 font-semibold text-slate-900 ${errors.password ? 'border-red-400 ring-2 ring-red-400' : 'border-white/30 focus:scale-[1.01]'
                                        }`}
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                                    disabled={isLoading}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-cyan-300 group-hover:text-cyan-100 transition-all duration-200 group-hover:scale-125" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-cyan-300 group-hover:text-cyan-100 transition-all duration-200 group-hover:scale-125" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-300 font-semibold flex items-center gap-2 drop-shadow">
                                    <FiLock className="w-4 h-4" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button - Glowing */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg py-4 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    <span>Logging In...</span>
                                </>
                            ) : (
                                <>
                                    <FiLock className="w-5 h-5" />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Link */}
                <div className="text-center">
                    <p className="text-white font-semibold drop-shadow-lg">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="font-black text-cyan-300 hover:text-cyan-100 transition-colors hover:underline"
                        >
                            Sign Up Free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
