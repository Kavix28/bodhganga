import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiPlay, FiBookOpen, FiArrowLeft, FiDownload, FiExternalLink, FiLock } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('video');

    // Fetch course details and purchase status
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch course details
                const courseResponse = await api.get(`/content/${courseId}`);
                setCourse(courseResponse.data);
                
                // Check if user has purchased this course
                const purchaseResponse = await api.get(`/payment/check-purchase/${courseId}`);
                setIsPurchased(purchaseResponse.data);
                
            } catch (error) {
                console.error('Error fetching course:', error);
                if (error.message?.includes('not found')) {
                    navigate('/404');
                } else {
                    toast.error('Failed to load course');
                    navigate('/courses');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (courseId) {
            fetchCourseData();
        }
    }, [courseId, navigate]);

    // Handle back navigation
    const handleBack = () => {
        navigate(`/courses/${courseId}`);
    };

    // Handle PDF download/view
    const handlePdfAccess = () => {
        if (!course) return;
        
        if (isPurchased) {
            // Open PDF in new tab for full access
            window.open(`/api/content/${courseId}/pdf`, '_blank');
        } else {
            // Show preview only
            window.open(`/api/content/${courseId}/pdf`, '_blank');
        }
    };

    // Handle YouTube video
    const handleVideoAccess = () => {
        if (course?.youtubeUrl) {
            window.open(course.youtubeUrl, '_blank');
        }
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
                    <button onClick={() => navigate('/courses')} className="btn-primary">
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    if (!isPurchased) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiLock className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Purchased</h2>
                    <p className="text-gray-600 mb-6">
                        You need to purchase this course to access the full content.
                    </p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => navigate(`/courses/${courseId}`)}
                            className="w-full btn-primary"
                        >
                            Purchase Course
                        </button>
                        <button 
                            onClick={() => navigate('/courses')}
                            className="w-full btn-secondary"
                        >
                            Browse Other Courses
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-custom py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back to Course Details</span>
                    </button>
                    
                    <h1 className="text-2xl font-bold text-gray-900 text-center flex-1 mx-4">
                        {course.title}
                    </h1>
                    
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>

                {/* Content Tabs */}
                <div className="card mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('video')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                                activeTab === 'video'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <FiPlay className="w-4 h-4" />
                                <span>Video Content</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('pdf')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                                activeTab === 'pdf'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <FiBookOpen className="w-4 h-4" />
                                <span>PDF Materials</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'video' && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Content</h3>
                                
                                {course.youtubeUrl ? (
                                    <div>
                                        {/* Video Thumbnail */}
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                                            {course.youtubeThumbnailUrl ? (
                                                <div className="relative w-full h-full cursor-pointer" onClick={handleVideoAccess}>
                                                    <img
                                                        src={course.youtubeThumbnailUrl}
                                                        alt="Video thumbnail"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-colors">
                                                        <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                                            <FiPlay className="w-10 h-10 text-gray-900 ml-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handleVideoAccess}>
                                                    <FiPlay className="w-20 h-20 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Video Actions */}
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={handleVideoAccess}
                                                className="btn-primary flex items-center space-x-2"
                                            >
                                                <FiExternalLink className="w-4 h-4" />
                                                <span>Watch on YouTube</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FiPlay className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No video content available for this course.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pdf' && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Materials</h3>
                                
                                {course.pdfFileName ? (
                                    <div>
                                        {/* PDF Info */}
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-1">
                                                        {course.pdfFileName}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {course.totalPages} pages • Full access granted
                                                    </p>
                                                </div>
                                                <FiBookOpen className="w-8 h-8 text-primary-600" />
                                            </div>
                                        </div>
                                        
                                        {/* PDF Actions */}
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={handlePdfAccess}
                                                className="btn-primary flex items-center space-x-2"
                                            >
                                                <FiBookOpen className="w-4 h-4" />
                                                <span>View PDF</span>
                                            </button>
                                            <button
                                                onClick={handlePdfAccess}
                                                className="btn-secondary flex items-center space-x-2"
                                            >
                                                <FiDownload className="w-4 h-4" />
                                                <span>Download</span>
                                            </button>
                                        </div>
                                        
                                        {/* PDF Preview Note */}
                                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-green-800 text-sm">
                                                <strong>Full Access:</strong> You have purchased this course and can view all {course.totalPages} pages of the PDF.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No PDF materials available for this course.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-8">
                            <h4 className="font-semibold text-gray-900 mb-4">Course Progress</h4>
                            
                            {/* Progress Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <FiBookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-green-800">Course Purchased</span>
                                    </div>
                                </div>
                                
                                {course.youtubeUrl && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <FiPlay className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">Video Content</span>
                                        </div>
                                    </div>
                                )}
                                
                                {course.pdfFileName && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <FiBookOpen className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="text-sm text-gray-700">PDF Materials</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Course Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Course Details</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Price Paid:</span>
                                        <span className="font-medium">₹{course.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Access:</span>
                                        <span className="font-medium">Lifetime</span>
                                    </div>
                                    {course.totalPages && (
                                        <div className="flex justify-between">
                                            <span>PDF Pages:</span>
                                            <span className="font-medium">{course.totalPages}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Support */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-medium text-blue-900 mb-2">Need Help?</h5>
                                <p className="text-blue-800 text-sm mb-3">
                                    Having trouble accessing the content?
                                </p>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;