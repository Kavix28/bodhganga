import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiUser, FiArrowLeft, FiShare2, FiBookmark } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [recentPosts, setRecentPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPost();
        fetchRecentPosts();
    }, [slug]);

    const fetchPost = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get(`/blog/posts/${slug}`);
            setPost(response.data);
        } catch (error) {
            console.error('Error fetching blog post:', error);
            setError('Blog post not found');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecentPosts = async () => {
        try {
            const response = await api.get('/blog/posts/recent?limit=3');
            setRecentPosts(response.data.filter(p => p.slug !== slug));
        } catch (error) {
            console.error('Error fetching recent posts:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.summary,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                toast.error('Failed to copy link');
            }
        }
    };

    const renderContent = (content) => {
        // Simple markdown-like rendering
        return content
            .split('\n')
            .map((line, index) => {
                // Headers
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.substring(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-semibold text-gray-900 mt-6 mb-3">{line.substring(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-semibold text-gray-900 mt-5 mb-2">{line.substring(4)}</h3>;
                }
                
                // Bold text
                if (line.includes('**')) {
                    const parts = line.split('**');
                    return (
                        <p key={index} className="text-gray-700 leading-relaxed mb-4">
                            {parts.map((part, i) => 
                                i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                            )}
                        </p>
                    );
                }
                
                // Lists
                if (line.startsWith('- ')) {
                    return <li key={index} className="text-gray-700 leading-relaxed mb-1 ml-4">{line.substring(2)}</li>;
                }
                
                // Empty lines
                if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                }
                
                // Regular paragraphs
                return <p key={index} className="text-gray-700 leading-relaxed mb-4">{line}</p>;
            });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container-custom py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="loading">
                            <div className="h-8 loading-skeleton rounded mb-4"></div>
                            <div className="h-6 loading-skeleton rounded w-3/4 mb-8"></div>
                            <div className="h-64 loading-skeleton rounded mb-8"></div>
                            <div className="space-y-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="h-4 loading-skeleton rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Blog Post Not Found</h2>
                    <p className="text-muted mb-8">The article you're looking for doesn't exist or has been moved.</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-outline"
                        >
                            Go Back
                        </button>
                        <Link to="/blog" className="btn-primary">
                            Browse Articles
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="container-custom py-4">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>
                </div>
            </div>

            <article className="py-12">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        {/* Article Header */}
                        <header className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                {post.title}
                            </h1>
                            
                            <p className="text-xl text-muted mb-6 leading-relaxed">
                                {post.summary}
                            </p>
                            
                            {/* Article Meta */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-subtle mb-6">
                                <div className="flex items-center gap-2">
                                    <FiUser className="w-4 h-4" />
                                    <span className="font-medium">{post.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiClock className="w-4 h-4" />
                                    <span>{post.readTime} min read</span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleShare}
                                    className="btn-outline btn-sm flex items-center gap-2"
                                >
                                    <FiShare2 className="w-4 h-4" />
                                    Share
                                </button>
                                <button className="btn-ghost btn-sm flex items-center gap-2">
                                    <FiBookmark className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        </header>

                        {/* Featured Image */}
                        {post.featuredImage && (
                            <div className="mb-8">
                                <img
                                    src={post.featuredImage}
                                    alt={post.title}
                                    className="w-full h-64 md:h-96 object-cover rounded-xl"
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        <div className="prose prose-lg max-w-none">
                            <div className="text-lg leading-relaxed">
                                {renderContent(post.content)}
                            </div>
                        </div>

                        {/* Article Footer */}
                        <footer className="mt-12 pt-8 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-subtle">Share this article:</span>
                                    <button
                                        onClick={handleShare}
                                        className="text-gray-600 hover:text-primary-600 transition-colors"
                                    >
                                        <FiShare2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-subtle">
                                    Last updated: {formatDate(post.updatedAt)}
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </article>

            {/* Related Articles */}
            {recentPosts.length > 0 && (
                <section className="py-16 bg-gray-50">
                    <div className="container-custom">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recentPosts.map((relatedPost) => (
                                    <Link
                                        key={relatedPost.id}
                                        to={`/blog/${relatedPost.slug}`}
                                        className="card-hover"
                                    >
                                        <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-3 flex items-center justify-center">
                                            {relatedPost.featuredImage ? (
                                                <img
                                                    src={relatedPost.featuredImage}
                                                    alt={relatedPost.title}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-primary-600">
                                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {relatedPost.title}
                                        </h3>
                                        <p className="text-sm text-muted line-clamp-2 mb-2">
                                            {relatedPost.summary}
                                        </p>
                                        <div className="text-xs text-subtle">
                                            {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default BlogPost;