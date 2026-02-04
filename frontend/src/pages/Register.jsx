import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { validateEmail, validatePhone, validatePassword } from '../utils/validators';
import api from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    const [formData, setFormData] = useState({
        emailOrPhone: '',
        password: '',
        agreeToTerms: false,
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Real-time password strength validation
        if (name === 'password') {
            const strength = getPasswordStrength(value);
            setPasswordStrength(strength);
        }
    };

    // Get password strength
    const getPasswordStrength = (password) => {
        if (password.length === 0) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 8) return 'medium';

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

        if (score >= 3 && password.length >= 8) return 'strong';
        if (score >= 2) return 'medium';
        return 'weak';
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Email or Phone validation
        if (!formData.emailOrPhone.trim()) {
            newErrors.emailOrPhone = 'Email or phone number is required';
        } else {
            const isEmail = formData.emailOrPhone.includes('@');
            if (isEmail) {
                if (!validateEmail(formData.emailOrPhone)) {
                    newErrors.emailOrPhone = 'Please enter a valid email address';
                }
            } else {
                if (!validatePhone(formData.emailOrPhone)) {
                    newErrors.emailOrPhone = 'Please enter a valid phone number';
                }
            }
        }

        // Password validation
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
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
            const response = await api.post('/auth/register', {
                emailOrPhone: formData.emailOrPhone.trim(),
                password: formData.password,
            });

            toast.success('Registration successful! OTP sent to your email/phone.');

            // Navigate to OTP verification with email/phone in state
            navigate('/verify-otp', {
                state: {
                    emailOrPhone: formData.emailOrPhone.trim(),
                    message: response.message
                }
            });

        } catch (error) {
            console.error('Registration error:', error);

            if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
                setErrors({ emailOrPhone: 'This email/phone is already registered. Please login.' });
                toast.error('Account already exists. Please login instead.');
            } else {
                toast.error(error.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 fade-in">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center slide-down">
                    <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
                    <p className="mt-2 text-gray-600">Start your learning journey today</p>
                </div>

                {/* Registration Form */}
                <div className="card scale-in shadow-lg border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email/Phone Input */}
                        <div>
                            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                Email or Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {formData.emailOrPhone.includes('@') ? (
                                        <FiMail className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <FiUser className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <input
                                    id="emailOrPhone"
                                    name="emailOrPhone"
                                    type="text"
                                    value={formData.emailOrPhone}
                                    onChange={handleChange}
                                    className={`input pl-10 transition-all duration-200 ${errors.emailOrPhone ? 'input-error' : 'focus:scale-[1.01]'}`}
                                    placeholder="Enter your email or phone"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.emailOrPhone && (
                                <p className="mt-1 text-sm text-red-600">{errors.emailOrPhone}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input pl-10 pr-10 transition-all duration-200 ${errors.password ? 'input-error' : 'focus:scale-[1.01]'}`}
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                                    disabled={isLoading}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-all duration-200 group-hover:scale-110" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-all duration-200 group-hover:scale-110" />
                                    )}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                                                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                                                            passwordStrength === 'strong' ? 'bg-green-500 w-full' : 'w-0'
                                                    }`}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-600' :
                                                passwordStrength === 'medium' ? 'text-yellow-600' :
                                                    passwordStrength === 'strong' ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            {passwordStrength ? passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-center">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                disabled={isLoading}
                            />
                            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                                I agree to the{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-500">
                                    Terms & Conditions
                                </a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2 transform transition-all duration-200 active:scale-95 disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <span>Sign Up</span>
                            )}
                        </button>

                        {/* Social Login Placeholder */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled
                                className="w-full btn bg-gray-100 text-gray-400 cursor-not-allowed"
                            >
                                Google (Soon)
                            </button>
                            <button
                                type="button"
                                disabled
                                className="w-full btn bg-gray-100 text-gray-400 cursor-not-allowed"
                            >
                                Facebook (Soon)
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Link */}
                <div className="text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
