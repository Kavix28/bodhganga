import { useState } from 'react';
import { FiLock, FiShield, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { verifyAdminPassword, setAdminSession } from '../../config/adminConfig';

const AdminPasswordGate = ({ onAuthenticated }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);

        // Simulate authentication delay for better UX
        setTimeout(() => {
            if (verifyAdminPassword(password)) {
                setAdminSession();
                onAuthenticated();
            } else {
                setError('Invalid admin password. Access denied.');
                setPassword('');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 fade-in">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center slide-down">
                    <div className="mx-auto w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-red-500/50">
                        <FiShield className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2">
                        Admin Access
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Restricted Area - Authentication Required
                    </p>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 scale-in">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-yellow-500 font-semibold text-sm mb-1">
                                Security Notice
                            </h3>
                            <p className="text-yellow-200/70 text-xs leading-relaxed">
                                This area is restricted to authorized administrators only.
                                All access attempts are logged and monitored.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Password Form */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8 scale-in" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Password Input */}
                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-2">
                                Admin Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="admin-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter admin password"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                                    disabled={isLoading}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-all duration-200 group-hover:scale-110" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-all duration-200 group-hover:scale-110" />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm slide-down">
                                    <FiAlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <FiShield className="w-5 h-5" />
                                    <span>Secure Login</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-slate-500 text-xs text-center">
                            If you've forgotten your password, contact the system administrator.
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center text-slate-500 text-sm">
                    <p>Protected by BodhGanga Security</p>
                    <p className="text-xs mt-1 text-slate-600">Session valid for 24 hours</p>
                </div>
            </div>
        </div>
    );
};

export default AdminPasswordGate;
