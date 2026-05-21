import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiCalendar, FiUser } from 'react-icons/fi';
import { FileText, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import EmptyState from '../components/ui/EmptyState';

const Blog = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [currentPage, setCurrentPage] = useState(0);
    const debouncedSearch = useDebounce(searchQuery, 500);

    const { data, isLoading } = useQuery({
        queryKey: ['blogPosts', currentPage, debouncedSearch],
        queryFn: async () => {
            const endpoint = debouncedSearch.trim()
                ? `/blog/posts/search?query=${encodeURIComponent(debouncedSearch)}&page=${currentPage}&size=9`
                : `/blog/posts?page=${currentPage}&size=9`;
            try {
                const res = await api.get(endpoint);
                const inner = res?.data || res || {};
                return { posts: inner.data || inner.content || [], totalPages: inner.totalPages || 1 };
            } catch {
                return { posts: [], totalPages: 1 };
            }
        },
        staleTime: 2 * 60 * 1000,
    });

    const posts = data?.posts || [];
    const totalPages = data?.totalPages || 1;

    const formatDate = d => new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-ivory">
            {/* Header */}
            <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-14">
                <div className="container-custom text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
                        <FileText className="w-4 h-4 text-gold-300" />
                        <span className="text-sm font-semibold text-gold-200">Knowledge Blog</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 font-serif">BodhGanga Academy Blog</h1>
                    <p className="text-emerald-100 max-w-xl mx-auto">
                        Insights, exam strategies, and knowledge for every aspirant.
                    </p>
                </div>
            </section>

            <div className="container-custom py-10">
                {/* Search */}
                <div className="max-w-md mx-auto mb-10">
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                            className="input pl-12"
                        />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-slate-200" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState
                        title="No Articles Yet"
                        message="Blog posts will appear here once published."
                        icon={FileText}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug || post.id}`}
                                className="heritage-card group block"
                            >
                                {post.featuredImage && (
                                    <div className="w-full h-44 rounded-lg overflow-hidden mb-4 bg-emerald-100">
                                        <img
                                            src={post.featuredImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <div className="text-xs font-bold text-gold-600 uppercase tracking-wide mb-2">
                                    {post.category || 'General'}
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2 font-serif line-clamp-2 leading-snug">
                                    {post.title}
                                </h3>
                                {post.excerpt && (
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{post.excerpt}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                                    <span className="flex items-center gap-1">
                                        <FiUser className="w-3 h-3" />
                                        {post.author || 'BodhGanga'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FiCalendar className="w-3 h-3" />
                                        {formatDate(post.publishedAt || post.createdAt)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-10">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                                    i === currentPage
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;
