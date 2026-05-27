import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiUser, FiEye, FiEyeOff, FiShield, FiPhone } from 'react-icons/fi';
import { authenticateAdmin, isAdminAuthenticated } from '../../utils/adminAuth';
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

    const [formData, setFormData] = useState({
        emailOrPhone: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        const cleaned = formData.emailOrPhone.trim().replace(/\D/g, '');

        if (!cleaned) {
            newErrors.emailOrPhone = 'Mobile number is required';
        } else if (cleaned.length < 10) {
            newErrors.emailOrPhone = 'Mobile number must be 10 digits';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission — calls backend JWT auth
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await authenticateAdmin(formData.emailOrPhone, formData.password);

            if (result.success) {
                toast.success('Welcome to Admin Dashboard!');
                const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
                navigate(redirectTo, { replace: true });
            } else {
                const msg = result.message || 'Invalid credentials';
                setErrors({ emailOrPhone: msg });
                toast.error(msg);
            }
        } catch (error) {
            console.error('Admin login error:', error);
            toast.error('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-[24px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                        <FiShield className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Admin Access</h2>
                    <p className="mt-2 text-gray-400">Secure login for administrators only</p>
                </div>

                {/* Security Warning */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-[2px] p-4">
                    <div className="flex items-center">
                        <FiShield className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-red-300 text-sm">
                            This is a restricted area. All access attempts are logged and monitored.
                        </p>
                    </div>
                </div>

                {/* Login Form */}
                <div className="bg-gray-800 rounded-[2px] shadow-xl p-8 border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Mobile Number Input */}
                        <div>
                            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-300 mb-2">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiPhone className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="emailOrPhone"
                                    name="emailOrPhone"
                                    type="tel"
                                    value={formData.emailOrPhone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                                        setFormData(prev => ({ ...prev, emailOrPhone: val }));
                                        if (errors.emailOrPhone) setErrors(prev => ({ ...prev, emailOrPhone: '' }));
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 ${
                                        errors.emailOrPhone ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                    placeholder="Enter admin mobile number"
                                    disabled={isLoading}
                                    autoComplete="tel"
                                />
                            </div>
                            {errors.emailOrPhone && (
                                <p className="mt-1 text-sm text-red-400">{errors.emailOrPhone}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400 ${
                                        errors.password ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                    placeholder="Enter admin password"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white py-3 px-4 rounded-[2px] font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <FiShield className="h-5 w-5" />
                                    <span>Secure Login</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-gray-500 text-sm">
                        Need access? Contact the system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;