import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiMapPin } from 'react-icons/fi';
import { signup } from '../services/authService';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';

const Register = () => {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNo: '',
        password: '',
        confirmPassword: '',
        city: '',
        state: '',
        country: 'India',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.phoneNo.trim()) {
            newErrors.phoneNo = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phoneNo.replace(/\D/g, ''))) {
            newErrors.phoneNo = 'Phone number must be 10 digits';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.country.trim()) {
            newErrors.country = 'Country is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const { confirmPassword, ...signupData } = formData;

            const response = await signup(signupData);

            if (response.success) {
                try {
                    await import('../services/api').then(m =>
                        m.default.post('/auth/otp/send', { email: formData.email })
                    );
                } catch {
                    // OTP send failure is non-blocking — user can resend on verify page
                }

                toast.success('Account created! Please verify your email.');

                // Auto-login after registration
                if (response.data?.token && response.data?.user) {
                    login(response.data.token, response.data.user);
                }

                // Navigate to OTP verification
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                toast.error(response.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory-light flex items-stretch">
            {/* Left Side Branding - Matches Login Page */}
            <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-b from-emerald-dark to-emerald-950 relative overflow-hidden flex-col items-center justify-center p-16">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative text-center space-y-8 max-w-sm z-10">
                    <Logo variant="primary" size="lg" showGlow={true} />
                    <p className="text-white/60 text-sm leading-relaxed font-medium">
                        Join our premier learning network. Map state exams and heritage courses perfectly with expert study tools.
                    </p>
                </div>
            </div>

            {/* Right Side Complex Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white/40 backdrop-blur-md">
                <div className="w-full max-w-2xl space-y-8 card-premium bg-white p-8 sm:p-10 shadow-2xl border border-emerald/5">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3.5 mb-6 lg:hidden">
                            <Logo variant="navbar" size="sm" theme="light" showGlow={true} />
                        </div>
                        <h1 className="text-2xl font-bold text-emerald-dark font-serif tracking-tight">Create Free Account</h1>
                        <p className="text-xs text-emerald-dark/60 font-semibold mt-1">Begin your elite academic journey with us today.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Grid Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Full Name *</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Arjun Sharma"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Email Address *</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="arjun@domain.com"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Grid Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Phone Number *</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="phoneNo"
                                        type="tel"
                                        value={formData.phoneNo}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.phoneNo ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                </div>
                                {errors.phoneNo && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.phoneNo}</p>}
                            </div>

                            {/* City */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">City *</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Jaipur"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.city ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                </div>
                                {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.city}</p>}
                            </div>
                        </div>

                        {/* Grid Row 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* State */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">State *</label>
                                <input
                                    name="state"
                                    type="text"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="Rajasthan"
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                        errors.state ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                    }`}
                                />
                                {errors.state && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.state}</p>}
                            </div>

                            {/* Country */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Country *</label>
                                <input
                                    name="country"
                                    type="text"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="India"
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                        errors.country ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                    }`}
                                />
                                {errors.country && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.country}</p>}
                            </div>
                        </div>

                        {/* Grid Row 4 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Password *</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-dark">Confirm Password *</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        className={`w-full py-3 pl-11 pr-11 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none ${
                                            errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald/60 hover:text-emerald transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-gold/10 hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-dark border-t-transparent" /> Creating Account...</>
                            ) : (
                                <span>Sign Up</span>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2 space-y-2">
                        <p className="text-xs text-emerald-dark/60 font-semibold">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-gold hover:text-gold-dark transition-colors ml-1">
                                Login with Password
                            </Link>
                            <span className="mx-2 text-emerald-dark/30">|</span>
                            <Link to="/login?method=otp" className="font-bold text-gold hover:text-gold-dark transition-colors">
                                Login with OTP
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
