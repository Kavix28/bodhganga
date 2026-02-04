import { useState, useEffect } from 'react';
import { FiSave, FiEye, FiX, FiImage, FiUser, FiFileText, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BlogEditor = ({ post, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        author: '',
        featuredImage: '',
        status: 'DRAFT'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [readTime, setReadTime] = useState(0);

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title || '',
                summary: post.summary || '',
                content: post.content || '',
                author: post.author || '',
                featuredImage: post.featuredImage || '',
                status: post.status || 'DRAFT'
            });
        }
    }, [post]);

    useEffect(() => {
        const words = formData.content.split(/\s+/).filter(word => word.length > 0).length;
        setWordCount(words);
        setReadTime(Math.max(1, Math.ceil(words / 200))); // 200 words per minute
    }, [formData.content]);

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 255) {
            newErrors.title = 'Title must not exceed 255 characters';
        }

        if (!formData.summary.trim()) {
            newErrors.summary = 'Summary is required';
        } else if (formData.summary.length > 500) {
            newErrors.summary = 'Summary must not exceed 500 characters';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        }

        if (!formData.author.trim()) {
            newErrors.author = 'Author is required';
        } else if (formData.author.length > 100) {
            newErrors.author = 'Author name must not exceed 100 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (status = formData.status) => {
        if (!validateForm()) {
            toast.error('Please fix the errors before saving');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                status
            };

            let response;
            if (post?.id) {
                response = await api.put(`/blog/admin/posts/${post.id}`, payload);
            } else {
                response = await api.post('/blog/admin/posts', payload);
            }

            const action = post?.id ? 'updated' : 'created';
            toast.success(`Blog post ${action} successfully`);
            onClose(true); // Close and refresh parent
        } catch (error) {
            console.error('Error saving blog post:', error);
            toast.error('Failed to save blog post');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = () => {
        handleSave('PUBLISHED');
    };

    const handleSaveDraft = () => {
        handleSave('DRAFT');
    };

    const renderPreview = () => {
        const content = formData.content
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

        return (
            <div className="prose prose-lg max-w-none">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                <p className="text-xl text-gray-600 mb-6">{formData.summary}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
                    <span>By {formData.author}</span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                </div>
                <div className="text-lg leading-relaxed">
                    {content}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container-custom py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onClose(false)}
                                className="text-gray-600 hover:text-gray-900 p-2"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {post?.id ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h1>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="btn-outline btn-sm flex items-center gap-2"
                            >
                                <FiEye className="w-4 h-4" />
                                {showPreview ? 'Edit' : 'Preview'}
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={isLoading}
                                className="btn-secondary btn-sm flex items-center gap-2"
                            >
                                <FiSave className="w-4 h-4" />
                                Save Draft
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={isLoading}
                                className="btn-primary btn-sm flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <FiSave className="w-4 h-4" />
                                )}
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                {showPreview ? (
                    /* Preview Mode */
                    <div className="max-w-4xl mx-auto">
                        <div className="card-spacious">
                            {renderPreview()}
                        </div>
                    </div>
                ) : (
                    /* Edit Mode */
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Basic Information */}
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`input ${errors.title ? 'input-error' : ''}`}
                                        placeholder="Enter blog post title..."
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        {formData.title.length}/255 characters
                                    </p>
                                </div>

                                {/* Summary */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Summary *
                                    </label>
                                    <textarea
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`input ${errors.summary ? 'input-error' : ''}`}
                                        placeholder="Brief summary of the blog post..."
                                    />
                                    {errors.summary && (
                                        <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        {formData.summary.length}/500 characters
                                    </p>
                                </div>

                                {/* Author and Featured Image */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Author *
                                        </label>
                                        <div className="relative">
                                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="author"
                                                value={formData.author}
                                                onChange={handleChange}
                                                className={`input pl-10 ${errors.author ? 'input-error' : ''}`}
                                                placeholder="Author name"
                                            />
                                        </div>
                                        {errors.author && (
                                            <p className="mt-1 text-sm text-red-600">{errors.author}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Featured Image URL
                                        </label>
                                        <div className="relative">
                                            <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="url"
                                                name="featuredImage"
                                                value={formData.featuredImage}
                                                onChange={handleChange}
                                                className="input pl-10"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Content</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <FiFileText className="w-4 h-4" />
                                        <span>{wordCount} words</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiClock className="w-4 h-4" />
                                        <span>{readTime} min read</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={20}
                                    className={`input font-mono text-sm ${errors.content ? 'input-error' : ''}`}
                                    placeholder="Write your blog post content here... 

You can use markdown-like formatting:
# Main Heading
## Sub Heading
### Section Heading

**Bold text**
- List item
- Another item

Regular paragraphs..."
                                />
                                {errors.content && (
                                    <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">
                                    Supports basic markdown formatting: # headers, **bold**, - lists
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogEditor;