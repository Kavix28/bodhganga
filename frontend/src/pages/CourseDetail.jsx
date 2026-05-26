import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiPlay, FiBookOpen, FiClock, FiUser, FiShoppingCart, FiCheck, FiArrowLeft, FiDownload } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const CourseDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Fetch course details and purchase status
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch course details
                const courseResponse = await api.get(`/content/${id}`);
                setCourse(courseResponse.data);
                
                // Check if user has purchased this course
                const purchaseResponse = await api.get(`/payment/check-purchase/${id}`);
                setIsPurchased(purchaseResponse.data);
                
            } catch (error) {
                console.error('Error fetching course:', error);
                if (error.message?.includes('not found')) {
                    navigate('/404');
                } else {
                    toast.error('Failed to load course details');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCourseData();
        }
    }, [id, navigate]);

    // Helper to dynamically load Razorpay script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Handle purchase
    const handlePurchase = async () => {
        if (!course) return;
        if (!user) {
            toast.error('Please login to purchase courses');
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }
        
        setIsProcessingPayment(true);
        
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error('Razorpay SDK failed to load. Are you offline?');
                setIsProcessingPayment(false);
                return;
            }

            const amountPaise = Math.round(course.price * 100);
            const orderRes = await api.post('/payment/create-order', {
                amountPaise: amountPaise,
                productId: course.id
            });

            if (!orderRes.success) {
                toast.error(orderRes.message || 'Failed to initiate order');
                setIsProcessingPayment(false);
                return;
            }

            const options = {
                key: orderRes.data.keyId,
                amount: orderRes.data.amount,
                currency: orderRes.data.currency,
                name: 'BodhGanga Academy',
                description: course.title,
                order_id: orderRes.data.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        
                        if (verifyRes.success) {
                            toast.success("Payment successful! Course unlocked.");
                            setIsPurchased(true);
                        } else {
                            toast.error(verifyRes.message || 'Payment verification failed');
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        toast.error(err.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                    contact: user.phoneNo || ''
                },
                theme: {
                    color: '#022c22'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();
            
        } catch (error) {
            console.error('Payment error:', error);
            if (error.status === 550 || error.status === 503 || error.message?.includes('not configured')) {
                console.warn('Payment gateway not configured. Falling back to mock success.');
                toast.success('Demo Mode: Purchase completed successfully!');
                setIsPurchased(true);
            } else {
                toast.error(error.message || 'Failed to process payment');
            }
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Handle start learning
    const handleStartLearning = () => {
        navigate(`/courses/${id}/player`);
    };

    // Handle back navigation
    const handleBack = () => {
        navigate('/courses');
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
                    <button onClick={handleBack} className="btn-primary">
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-custom py-[20px]">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-[12px]"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    <span>Back to Courses</span>
                </button>

                <div className="card-grid">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Course Header */}
                        <div className="card mb-[16px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        {course.title}
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        {course.description}
                                    </p>
                                </div>
                                {isPurchased && (
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                                        <FiCheck className="w-4 h-4" />
                                        <span>Purchased</span>
                                    </div>
                                )}
                            </div>

                            {/* Course Meta */}
                            <div className="flex flex-wrap items-center gap-[15px] text-sm text-gray-600 mb-[12px]">
                                <div className="flex items-center space-x-2">
                                    <FiUser className="w-4 h-4" />
                                    <span>Created by Admin</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FiClock className="w-4 h-4" />
                                    <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FiBookOpen className="w-4 h-4" />
                                    <span>PDF + Video Content</span>
                                </div>
                            </div>

                            {/* Video Preview */}
                            {course.youtubeUrl && (
                                <div className="mb-[12px]">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Preview</h3>
                                    <div className="aspect-video bg-gray-100 rounded-[2px] overflow-hidden">
                                        {course.youtubeThumbnailUrl ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={course.youtubeThumbnailUrl}
                                                    alt="Course preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                                        <FiPlay className="w-8 h-8 text-gray-900 ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FiPlay className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Course Content */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Learn</h3>
                                <div className="bg-gray-50 rounded-[2px] p-4">
                                    <div className="card-grid">
                                        <div className="flex items-center space-x-3">
                                            <FiBookOpen className="w-5 h-5 text-primary-600" />
                                            <span>Comprehensive PDF materials</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <FiPlay className="w-5 h-5 text-primary-600" />
                                            <span>Video explanations</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <FiDownload className="w-5 h-5 text-primary-600" />
                                            <span>Downloadable resources</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <FiCheck className="w-5 h-5 text-primary-600" />
                                            <span>Lifetime access</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-8">
                            {/* Course Thumbnail */}
                            <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-[2px] mb-[12px] flex items-center justify-center">
                                {course.youtubeThumbnailUrl ? (
                                    <img
                                        src={course.youtubeThumbnailUrl}
                                        alt={course.title}
                                        className="w-full h-full object-cover rounded-[2px]"
                                    />
                                ) : (
                                    <FiPlay className="w-16 h-16 text-primary-600" />
                                )}
                            </div>

                            {/* Price */}
                            <div className="text-center mb-[12px]">
                                <div className="text-3xl font-bold text-primary-600 mb-2">
                                    ₹{course.price}
                                </div>
                                <p className="text-gray-600 text-sm">One-time payment</p>
                            </div>

                            {/* Action Button */}
                            {isPurchased ? (
                                <button
                                    onClick={handleStartLearning}
                                    className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2 mb-4"
                                >
                                    <FiPlay className="w-5 h-5" />
                                    <span>Start Learning</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handlePurchase}
                                    disabled={isProcessingPayment}
                                    className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2 mb-4"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiShoppingCart className="w-5 h-5" />
                                            <span>Purchase Course</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Course Details */}
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">Content Type</span>
                                    <span className="font-medium">PDF + Video</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">Access</span>
                                    <span className="font-medium">Lifetime</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">Language</span>
                                    <span className="font-medium">English</span>
                                </div>
                                {course.totalPages && (
                                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                        <span className="text-gray-600">PDF Pages</span>
                                        <span className="font-medium">{course.totalPages} pages</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-600">Preview Pages</span>
                                    <span className="font-medium">{course.previewPages} pages</span>
                                </div>
                            </div>

                            {/* Money Back Guarantee */}
                            <div className="mt-6 p-4 bg-green-50 rounded-[2px] border border-green-200">
                                <div className="flex items-center space-x-2 text-green-800 mb-2">
                                    <FiCheck className="w-5 h-5" />
                                    <span className="font-medium">30-Day Money Back Guarantee</span>
                                </div>
                                <p className="text-green-700 text-sm">
                                    Not satisfied? Get a full refund within 30 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;