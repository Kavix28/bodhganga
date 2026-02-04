import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { isValidOTP } from '../utils/validators';
import { OTP_CONFIG } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get email/phone from navigation state
    const emailOrPhone = location.state?.emailOrPhone;

    // Redirect if already authenticated or no email/phone provided
    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    if (!emailOrPhone) {
        navigate('/register');
        return null;
    }

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(OTP_CONFIG.EXPIRY_MINUTES * 60); // 10 minutes in seconds
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState('');

    // Refs for OTP inputs
    const inputRefs = useRef([]);

    // Timer effect for OTP expiry
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Timer effect for resend cooldown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Format time display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Clear error when user starts typing
        if (error) setError('');

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleVerifyOtp(newOtp.join(''));
        }
    };

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
        
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            
            // Auto-submit pasted OTP
            handleVerifyOtp(pastedData);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (otpValue = otp.join('')) => {
        if (!isValidOTP(otpValue)) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        if (timeLeft <= 0) {
            setError('OTP has expired. Please request a new one.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/verify-otp', {
                emailOrPhone,
                otp: otpValue,
            });

            toast.success('Account verified successfully!');
            
            // Show success state briefly before redirect
            setTimeout(() => {
                navigate('/login', {
                    state: {
                        message: 'Account verified! You can now login.',
                        emailOrPhone
                    }
                });
            }, 2000);

        } catch (error) {
            console.error('OTP verification error:', error);

            if (error.expired) {
                setError('OTP has expired. Please request a new one.');
                setTimeLeft(0);
            } else if (error.message?.includes('Invalid OTP')) {
                setError('Invalid OTP. Please try again.');
                // Clear OTP inputs and focus first input
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else if (error.message?.includes('Too many attempts')) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(error.message || 'Verification failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        setIsResending(true);
        setError('');

        try {
            const response = await api.post('/auth/resend-otp', {
                emailOrPhone,
            });

            toast.success('New OTP sent successfully!');
            
            // Reset timer and cooldown
            setTimeLeft(OTP_CONFIG.EXPIRY_MINUTES * 60);
            setResendCooldown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
            
            // Clear OTP inputs
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();

        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error(error.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    // Manual verify button click
    const handleSubmit = (e) => {
        e.preventDefault();
        handleVerifyOtp();
    };

    const isExpired = timeLeft <= 0;
    const isOtpComplete = otp.every(digit => digit !== '');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Verify Your Account</h2>
                    <p className="mt-2 text-gray-600">
                        We've sent a 6-digit OTP to{' '}
                        <span className="font-medium text-gray-900">{emailOrPhone}</span>
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center mt-2 text-sm text-primary-600 hover:text-primary-500"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-1" />
                        Change email/phone
                    </Link>
                </div>

                {/* OTP Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                                Enter 6-digit OTP
                            </label>
                            <div className="flex justify-center space-x-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className={`w-12 h-12 text-center text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                                            error ? 'border-red-500' : 'border-gray-300'
                                        } ${isExpired ? 'bg-gray-100' : 'bg-white'}`}
                                        disabled={isLoading || isExpired}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="text-center">
                            {isExpired ? (
                                <p className="text-red-600 font-medium">
                                    OTP has expired. Please request a new one.
                                </p>
                            ) : (
                                <p className={`font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                                    OTP expires in: {formatTime(timeLeft)}
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-center">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={!isOtpComplete || isLoading || isExpired}
                            className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>Verify OTP</span>
                            )}
                        </button>

                        {/* Resend OTP */}
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-2">
                                Didn't receive the OTP?
                            </p>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || isResending}
                                className={`inline-flex items-center space-x-2 text-sm font-medium ${
                                    resendCooldown > 0 || isResending
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-primary-600 hover:text-primary-500'
                                }`}
                            >
                                <FiRefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                                <span>
                                    {resendCooldown > 0
                                        ? `Resend in ${resendCooldown}s`
                                        : isResending
                                        ? 'Sending...'
                                        : 'Resend OTP'
                                    }
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-gray-600 text-sm">
                        Having trouble?{' '}
                        <a href="#" className="text-primary-600 hover:text-primary-500">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
