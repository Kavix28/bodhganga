import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Check, X, Filter, Download, ExternalLink, RefreshCw, Plus } from 'lucide-react';
import api from '../../services/api';
import AdminPdfUploadModal from '../../components/admin/AdminPdfUploadModal';

/**
 * AdminPDFManager Component
 * Admin interface for importing and managing PDFs on BodhGanga S3 & MongoDB
 */
const AdminPDFManager = () => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');
    
    // Real PDF products state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products');
            // Support both response formats
            const allProducts = response?.data || response || [];
            // Filter to only display PDF items in this PDF manager
            const pdfItems = allProducts.filter(p => p.type === 'PDF');
            setProducts(pdfItems);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContent = fetchProducts;

    const handleDelete = async (pdfId) => {
        if (window.confirm('Are you sure you want to delete this PDF? This will remove it from the marketplace.')) {
            try {
                await api.delete(`/api/products/${pdfId}`);
                await fetchProducts();
            } catch (err) {
                console.error('Failed to delete PDF product:', err);
                alert('Failed to delete product: ' + (err.message || err));
            }
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getDownloadUrl = (storageKey) => {
        if (!storageKey) return '#';
        // Base API URL is relative or absolute. We append to redirect to signed URL
        const base = api.defaults.baseURL || '';
        return `${base}/api/pdf/${storageKey}?redirect=true`;
    };

    // Filter Products dynamically
    const filteredPDFs = products.filter(pdf => {
        // Map types
        const typeMatch = filterType === 'all' || 
            (pdf.category && pdf.category.toLowerCase() === filterType.toLowerCase()) ||
            (pdf.type && pdf.type.toLowerCase() === filterType.toLowerCase());
            
        // Map regions
        const regionMatch = filterRegion === 'all' || 
            (pdf.stateSlug && pdf.stateSlug.toLowerCase() === filterRegion.toLowerCase());
            
        return typeMatch && regionMatch;
    });

    const getContentTypeBadge = (type) => {
        const t = type ? type.toLowerCase() : '';
        if (t.includes('note')) {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (t.includes('question') || t.includes('bank')) {
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        } else if (t.includes('solution')) {
            return 'bg-green-100 text-green-700 border-green-200';
        } else if (t.includes('syllabus')) {
            return 'bg-purple-100 text-purple-700 border-purple-200';
        } else {
            return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-emerald-premium">
                        PDF Content Manager
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Import and manage PDF study materials for BodhGanga Academy
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={fetchProducts}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm"
                        title="Refresh List"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => {
                            setShowUploadModal(true);
                        }}
                        className="btn-premium btn-premium-primary text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-md"
                        style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 999, position: 'relative' }}
                    >
                        <Plus className="w-4 h-4" />
                        Upload PDF
                    </button>
                </div>
            </div>

            {/* Actions & Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <Filter className="w-4 h-4 text-emerald-glow" />
                            <span>Filter by:</span>
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="input-premium py-1.5 px-3 text-xs w-auto cursor-pointer focus:ring-1 focus:ring-emerald-glow"
                        >
                            <option value="all">All Types</option>
                            <option value="notes">Notes</option>
                            <option value="question bank">Question Banks</option>
                            <option value="solutions">Solutions</option>
                            <option value="syllabus">Syllabus</option>
                        </select>

                        <select
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value)}
                            className="input-premium py-1.5 px-3 text-xs w-auto cursor-pointer focus:ring-1 focus:ring-emerald-glow"
                        >
                            <option value="all">All Regions</option>
                            <option value="all">All India (General)</option>
                            <option value="maharashtra">Maharashtra</option>
                            <option value="uttar-pradesh">Uttar Pradesh</option>
                            <option value="bihar">Bihar</option>
                            <option value="rajasthan">Rajasthan</option>
                            <option value="madhya-pradesh">Madhya Pradesh</option>
                            <option value="delhi">Delhi (NCT)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* PDF List */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-10 h-10 text-emerald-premium animate-spin mx-auto mb-4" />
                        <p className="text-sm font-semibold text-slate-500">Loading PDFs from S3 & MongoDB...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100 text-left">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Document Title</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Region / Category</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Access / Price</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">File Size</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Source</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Import Date</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPDFs.map((pdf) => (
                                    <tr key={pdf.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-emerald-premium/5 border border-emerald-premium/10 rounded-lg text-emerald-premium mt-0.5">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5 max-w-sm overflow-hidden">
                                                    <p className="font-bold text-slate-800 truncate" title={pdf.title}>
                                                        {pdf.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate" title={pdf.fileName || pdf.storageKey}>
                                                        {pdf.fileName || pdf.storageKey}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700 capitalize">
                                                    {pdf.stateSlug === 'all' ? 'All India' : pdf.stateSlug ? pdf.stateSlug.replace('-', ' ') : 'N/A'}
                                                </span>
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getContentTypeBadge(pdf.category || pdf.type)}`}>
                                                        {pdf.category || 'PDF'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {pdf.price && pdf.price > 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                                    ₹{pdf.price}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                                    Free
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {formatBytes(pdf.fileSize)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {pdf.importedFromDrive ? (
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block">
                                                    Google Drive
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full inline-block">
                                                    Local Upload
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {pdf.createdAt ? new Date(pdf.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Open Presigned URL */}
                                                {pdf.previewUrl && (
                                                    <a
                                                        href={pdf.previewUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-emerald-premium hover:bg-emerald-premium/5 border border-transparent hover:border-emerald-premium/10 rounded-xl transition-all"
                                                        title="Open Preview"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                
                                                {/* Secure S3 Download */}
                                                {pdf.storageKey && (
                                                    <a
                                                        href={getDownloadUrl(pdf.storageKey)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl transition-all"
                                                        title="Download Secure PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                                
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(pdf.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                                                    title="Delete PDF"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredPDFs.length === 0 && (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700">No PDFs Found</h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            {filterType !== 'all' || filterRegion !== 'all'
                                ? 'No imported PDFs match your current filter settings. Try adjusting filters.'
                                : 'Import your first PDF document from Google Drive to get started.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Google Drive Import Modal */}
            {showUploadModal && (
                <AdminPdfUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        fetchContent();
                    }}
                />
            )}
        </div>
    );
};

export default AdminPDFManager;

