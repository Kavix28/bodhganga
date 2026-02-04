import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiSearch, FiFilter, FiBookOpen, FiPlay, FiShoppingCart, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const Courses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [myPurchases, setMyPurchases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [sortBy, setSortBy] = useState('newest');
    const [filterBy, setFilterBy] = useState('all');

    // Fetch courses and purchases
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch all content
                const contentResponse = await api.get('/content/list');
                setCourses(contentResponse.data || []);
                
                // Fetch user's purchases
                const purchasesResponse = await api.get('/payment/my-purchases');
                setMyPurchases(purchasesResponse.data || []);
                
            } catch (error) {
                console.error('Error fetching courses:', error);
                toast.error('Failed to load courses');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter and sort courses
    useEffect(() => {
        let filtered = [...courses];
        const purchasedIds = myPurchases.map(p => p.contentId);

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        if (filterBy === 'purchased') {
            filtered = filtered.filter(course => purchasedIds.includes(course.id));
        } else if (filterBy === 'available') {
            filtered = filtered.filter(course => !purchasedIds.includes(course.id));
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                break;
        }

        setFilteredCourses(filtered);
    }, [courses, myPurchases, searchQuery, sortBy, filterBy]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchParams({ q: searchQuery });
        } else {
            setSearchParams({});
        }
    };

    // Handle course click
    const handleCourseClick = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    // Check if course is purchased
    const isPurchased = (courseId) => {
        return myPurchases.some(purchase => purchase.contentId === courseId);
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container-custom py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Course Catalog
                    </h1>
                    <p className="text-gray-600">
                        Discover and learn from our comprehensive course collection
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="card mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-10 pr-4"
                                    placeholder="Search courses..."
                                />
                            </div>
                        </form>

                        {/* Sort */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input min-w-[140px]"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>

                            {/* Filter */}
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="input min-w-[120px]"
                            >
                                <option value="all">All Courses</option>
                                <option value="available">Available</option>
                                <option value="purchased">Purchased</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                        {searchQuery && ` for "${searchQuery}"`}
                    </p>
                </div>

                {/* Course Grid */}
                {filteredCourses.length === 0 ? (
                    /* Empty State */
                    <div className="card text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiBookOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No courses found' : 'No courses available'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery 
                                ? 'Try adjusting your search terms or filters'
                                : 'Check back later for new courses'
                            }
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchParams({});
                                }}
                                className="btn-secondary"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => {
                            const purchased = isPurchased(course.id);
                            
                            return (
                                <div
                                    key={course.id}
                                    className="card-hover cursor-pointer relative"
                                    onClick={() => handleCourseClick(course.id)}
                                >
                                    {/* Purchased Badge */}
                                    {purchased && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                                <FiCheck className="w-3 h-3" />
                                                <span>Purchased</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Course Thumbnail */}
                                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center">
                                        {course.youtubeThumbnailUrl ? (
                                            <img
                                                src={course.youtubeThumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <FiPlay className="w-16 h-16 text-primary-600" />
                                        )}
                                    </div>

                                    {/* Course Info */}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                                            {course.description}
                                        </p>
                                        
                                        {/* Course Meta */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center space-x-1">
                                                <FiBookOpen className="w-4 h-4" />
                                                <span>PDF + Video</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-lg font-bold text-primary-600">
                                                    ₹{course.price}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCourseClick(course.id);
                                        }}
                                        className={`w-full flex items-center justify-center space-x-2 ${
                                            purchased 
                                                ? 'btn-primary' 
                                                : 'btn-secondary'
                                        }`}
                                    >
                                        {purchased ? (
                                            <>
                                                <FiPlay className="w-4 h-4" />
                                                <span>Start Learning</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiShoppingCart className="w-4 h-4" />
                                                <span>View Details</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;