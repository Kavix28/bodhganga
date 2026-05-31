import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiPlay, FiBookOpen, FiClock, FiUser, FiShoppingCart, FiCheck, FiArrowLeft, FiDownload } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import BuyButton from '../components/common/BuyButton';

const CourseDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                                <BuyButton
                                    courseId={course.id}
                                    onSuccess={() => setIsPurchased(true)}
                                    className="w-full text-lg py-3 mb-4"
                                >
                                    <FiShoppingCart className="w-5 h-5" />
                                    <span>Purchase Course</span>
                                </BuyButton>
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