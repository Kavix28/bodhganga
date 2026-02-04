import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiCalendar, FiClock, FiUser, FiArrowRight } from 'react-icons/fi';
import api from '../services/api';

const Blog = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        fetchPosts();
    }, [currentPage, searchQuery]);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            let response;
            
            if (searchQuery.trim()) {
                response = await api.get(`/blog/posts/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=9`);
                setSearchParams({ search: searchQuery });
            } else {
                response = await api.get(`/blog/posts?page=${currentPage}&size=9`);
                setSearchParams({});
            }
            
            setPosts(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            setPosts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(0);
        fetchPosts();
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-20">
                <div className="container-custom">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Learning Insights & Resources
                        </h1>
                        <p className="text-xl text-blue-100 mb-8">
                            Discover expert insights, learning strategies, and industry trends to accelerate your educational journey.
                        </p>
                        
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search articles..."
                                    className="w-full px-6 py-4 pr-14 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                                >
                                    <FiSearch className="w-6 h-6" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Blog Posts */}
            <section className="py-20">
                <div className="container-custom">
                    {/* Search Results Header */}
                    {searchQuery && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Search Results for "{searchQuery}"
                            </h2>
                            <p className="text-muted">
                                {pagination.totalElements || 0} articles found
                            </p>
                        </div>
                    )}

                    {isLoading ? (
                        /* Loading Skeleton */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(9)].map((_, index) => (
                                <div key={index} className="card loading">
                                    <div className="w-full h-48 loading-skeleton rounded-lg mb-4"></div>
                                    <div className="h-6 loading-skeleton rounded mb-2"></div>
                                    <div className="h-4 loading-skeleton rounded mb-4"></div>
                                    <div className="h-4 loading-skeleton rounded w-3/4 mb-4"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-4 loading-skeleton rounded w-20"></div>
                                        <div className="h-4 loading-skeleton rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post, index) => (
                                    <article key={post.id} className="card-hover slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                        {/* Featured Image Placeholder */}
                                        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 flex items-center justify-center">
                                            {post.featuredImage ? (
                                                <img
                                                    src={post.featuredImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-primary-600">
                                                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Content */}
                                        <div className="mb-4">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-muted text-sm line-clamp-3 mb-4">
                                                {post.summary}
                                            </p>
                                            
                                            {/* Post Meta */}
                                            <div className="flex items-center gap-4 text-sm text-subtle mb-4">
                                                <div className="flex items-center gap-1">
                                                    <FiUser className="w-4 h-4" />
                                                    <span>{post.author}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FiCalendar className="w-4 h-4" />
                                                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FiClock className="w-4 h-4" />
                                                    <span>{post.readTime} min read</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Read More Link */}
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                        >
                                            Read More
                                            <FiArrowRight className="w-4 h-4" />
                                        </Link>
                                    </article>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-12">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!pagination.hasPrevious}
                                        className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                        {[...Array(pagination.totalPages)].map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(index)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                                    index === currentPage
                                                        ? 'bg-primary-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!pagination.hasNext}
                                        className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div className="empty-state">
                            <FiSearch className="empty-state-icon" />
                            <h3 className="empty-state-title">
                                {searchQuery ? 'No articles found' : 'No blog posts available'}
                            </h3>
                            <p className="empty-state-description">
                                {searchQuery 
                                    ? 'Try adjusting your search terms or browse all articles.'
                                    : 'Check back soon for new articles and insights.'
                                }
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(0);
                                    }}
                                    className="btn-primary"
                                >
                                    View All Articles
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Blog;