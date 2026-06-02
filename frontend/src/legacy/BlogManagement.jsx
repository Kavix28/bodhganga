import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiSearch, FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BlogEditor from '../../components/admin/BlogEditor';

const BlogManagement = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/blog/admin/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            toast.error('Failed to load blog posts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = () => {
        setEditingPost(null);
        setShowEditor(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setShowEditor(true);
    };

    const handleDeletePost = async (postId, postTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/blog/admin/posts/${postId}`);
            toast.success('Blog post deleted successfully');
            fetchPosts();
        } catch (error) {
            console.error('Error deleting blog post:', error);
            toast.error('Failed to delete blog post');
        }
    };

    const handleToggleStatus = async (postId, currentStatus) => {
        try {
            const endpoint = currentStatus === 'PUBLISHED' ? 'unpublish' : 'publish';
            await api.put(`/blog/admin/posts/${postId}/${endpoint}`);
            
            const action = currentStatus === 'PUBLISHED' ? 'unpublished' : 'published';
            toast.success(`Blog post ${action} successfully`);
            fetchPosts();
        } catch (error) {
            console.error('Error toggling post status:', error);
            toast.error('Failed to update post status');
        }
    };

    const handleEditorClose = (shouldRefresh = false) => {
        setShowEditor(false);
        setEditingPost(null);
        if (shouldRefresh) {
            fetchPosts();
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            post.summary.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (showEditor) {
        return (
            <BlogEditor
                post={editingPost}
                onClose={handleEditorClose}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
                    <p className="text-muted">Create and manage blog posts</p>
                </div>
                <button
                    onClick={handleCreatePost}
                    className="btn-primary flex items-center gap-2"
                >
                    <FiPlus className="w-4 h-4" />
                    Create Post
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col sm:flex-row gap-[14px]">
                    <div className="flex-1">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="DRAFT">Draft</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="card">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-[14px] p-4 border border-gray-200 rounded-[2px] loading">
                                <div className="w-16 h-16 loading-skeleton rounded-[2px]"></div>
                                <div className="flex-1">
                                    <div className="h-5 loading-skeleton rounded mb-2"></div>
                                    <div className="h-4 loading-skeleton rounded w-3/4 mb-2"></div>
                                    <div className="h-3 loading-skeleton rounded w-1/2"></div>
                                </div>
                                <div className="w-24 h-8 loading-skeleton rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Post
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Author
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Read Time
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-[2px] flex items-center justify-center flex-shrink-0">
                                                    {post.featuredImage ? (
                                                        <img
                                                            src={post.featuredImage}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover rounded-[2px]"
                                                        />
                                                    ) : (
                                                        <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-sm text-muted line-clamp-2">
                                                        {post.summary}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <FiUser className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{post.author}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${
                                                post.status === 'PUBLISHED' 
                                                    ? 'badge-success' 
                                                    : 'badge-warning'
                                            }`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <FiCalendar className="w-4 h-4" />
                                                <span>{formatDate(post.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <FiClock className="w-4 h-4" />
                                                <span>{post.readTime} min</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(post.id, post.status)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                    title={post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                                >
                                                    {post.status === 'PUBLISHED' ? (
                                                        <FiEyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <FiEye className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEditPost(post)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="Edit"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id, post.title)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="empty-state-title">
                            {searchTerm || statusFilter !== 'ALL' ? 'No posts found' : 'No blog posts yet'}
                        </h3>
                        <p className="empty-state-description">
                            {searchTerm || statusFilter !== 'ALL' 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Create your first blog post to get started.'
                            }
                        </p>
                        {(!searchTerm && statusFilter === 'ALL') && (
                            <button
                                onClick={handleCreatePost}
                                className="btn-primary"
                            >
                                Create First Post
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogManagement;