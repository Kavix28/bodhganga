import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Search, Edit, Trash2, Eye, X, Save, Globe, Lock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Blog Form Modal ───────────────────────────────────────────────
const BlogModal = ({ post, onClose, onSaved }) => {
    const isEdit = !!post?.id;
    const [form, setForm] = useState({
        title: post?.title || '',
        slug: post?.slug || '',
        content: post?.content || '',
        category: post?.category || '',
        featuredImage: post?.featuredImage || '',
        status: post?.status || 'DRAFT',
        tags: post?.tags?.join(', ') || '',
    });
    const [saving, setSaving] = useState(false);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const autoSlug = title => title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const handleTitleChange = e => {
        const title = e.target.value;
        setForm(p => ({ ...p, title, slug: p.slug || autoSlug(title) }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            };
            if (isEdit) {
                await api.put(`/blog/posts/${post.id}`, payload);
                toast.success('Post updated');
            } else {
                await api.post('/blog/posts', payload);
                toast.success('Post created');
            }
            onSaved();
        } catch (err) {
            toast.error(err?.message || 'Failed to save post');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 font-serif">
                        {isEdit ? 'Edit Post' : 'New Blog Post'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Title *</label>
                            <input name="title" value={form.title} onChange={handleTitleChange}
                                placeholder="Post title..." className="input" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Slug</label>
                            <input name="slug" value={form.slug} onChange={handleChange}
                                placeholder="auto-generated-from-title" className="input text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                            <input name="category" value={form.category} onChange={handleChange}
                                placeholder="e.g. History, Polity" className="input" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Featured Image URL</label>
                            <input name="featuredImage" value={form.featuredImage} onChange={handleChange}
                                placeholder="https://..." className="input" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Content *</label>
                            <textarea name="content" value={form.content} onChange={handleChange}
                                placeholder="Write your blog post content here..."
                                rows={10} className="input resize-y" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tags (comma-separated)</label>
                            <input name="tags" value={form.tags} onChange={handleChange}
                                placeholder="UPSC, History, India" className="input" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                            <select name="status" value={form.status} onChange={handleChange} className="input">
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="btn-gold flex items-center gap-2 disabled:opacity-60">
                            {saving
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Save className="w-4 h-4" />}
                            {isEdit ? 'Update Post' : 'Publish Post'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────
const AdminBlogs = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [modalPost, setModalPost] = useState(null); // null = closed, {} = new, post = edit
    const [page, setPage] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-blog-posts', page],
        queryFn: () => api.get(`/blog/posts?page=${page}&size=10`).then(r => r?.data || r),
        staleTime: 30 * 1000,
    });

    const posts = data?.data || [];
    const totalPages = data?.pagination?.totalPages || 1;

    const deleteMutation = useMutation({
        mutationFn: id => api.delete(`/blog/posts/${id}`),
        onSuccess: () => {
            toast.success('Post deleted');
            queryClient.invalidateQueries(['admin-blog-posts']);
        },
        onError: () => toast.error('Failed to delete post'),
    });

    const handleDelete = (post) => {
        if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
            deleteMutation.mutate(post.id);
        }
    };

    const handleSaved = () => {
        setModalPost(null);
        queryClient.invalidateQueries(['admin-blog-posts']);
    };

    const filtered = posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Blog Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage blog posts</p>
                </div>
                <button onClick={() => setModalPost({})} className="btn-gold flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Post
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search posts..." value={search}
                    onChange={e => setSearch(e.target.value)} className="input pl-10 py-2.5 text-sm" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400">Loading posts...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-600 mb-2 font-serif">No Posts Yet</h3>
                        <p className="text-slate-400 mb-6 text-sm">Create your first blog post to engage your audience.</p>
                        <button onClick={() => setModalPost({})} className="btn-emerald flex items-center gap-2 mx-auto">
                            <Plus className="w-4 h-4" /> Create First Post
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Title</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-slate-600 hidden md:table-cell">Category</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-slate-600 hidden lg:table-cell">Date</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-slate-600">Status</th>
                                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(post => (
                                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                {post.featuredImage ? (
                                                    <img src={post.featuredImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate max-w-xs">{post.title}</p>
                                                    <p className="text-xs text-slate-400 font-mono truncate">{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell">
                                            {post.category || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                                            {formatDate(post.publishedAt || post.createdAt)}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                                post.status === 'PUBLISHED'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {post.status === 'PUBLISHED'
                                                    ? <><Globe className="w-3 h-3" /> Published</>
                                                    : <><Lock className="w-3 h-3" /> Draft</>}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`/blog/${post.slug || post.id}`} target="_blank" rel="noreferrer"
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => setModalPost(post)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(post)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => setPage(i)}
                                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                                            i === page ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {modalPost !== null && (
                <BlogModal
                    post={modalPost?.id ? modalPost : null}
                    onClose={() => setModalPost(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default AdminBlogs;
