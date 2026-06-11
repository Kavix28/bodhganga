import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, BookOpen, ExternalLink, FileText, Check } from 'lucide-react';
import api from '../../services/api';

/**
 * AdminPdfUploadModal
 * Reusable modal for importing PDFs from Google Drive directly to S3 and MongoDB
 */
const AdminPdfUploadModal = ({ isOpen = true, onClose, onSuccess, onUploadSuccess }) => {
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    
    // Form fields state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [googleDriveUrl, setGoogleDriveUrl] = useState('');
    const [category, setCategory] = useState('');
    const [courseId, setCourseId] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState('');
    
    // Import process states
    const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [progressStep, setProgressStep] = useState(''); // 'downloading' | 'uploading' | 'saving'
    const [errorMessage, setErrorMessage] = useState('');
    const [successData, setSuccessData] = useState(null);

    // Categories list
    const categories = [
        'Notes',
        'Question Bank',
        'Solutions',
        'Syllabus',
        'Other'
    ];

    // Fetch courses for dropdown
    useEffect(() => {
        if (isOpen) {
            fetchCourses();
            // Reset form fields
            setTitle('');
            setDescription('');
            setGoogleDriveUrl('');
            setCategory('');
            setCourseId('');
            setIsPaid(false);
            setPrice('');
            setImportStatus('idle');
            setProgressStep('');
            setErrorMessage('');
            setSuccessData(null);
        }
    }, [isOpen]);

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const response = await api.get('/courses/list?size=100');
            const fetchedCourses = response?.data?.courses || response?.courses || [];
            setCourses(fetchedCourses);
        } catch (err) {
            console.error('Failed to load courses:', err);
        } finally {
            setCoursesLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleImport = async (e) => {
        e.preventDefault();
        
        // Validations
        if (!title.trim()) {
            setErrorMessage('PDF Title is required.');
            setImportStatus('error');
            return;
        }
        if (!googleDriveUrl.trim()) {
            setErrorMessage('Google Drive URL is required.');
            setImportStatus('error');
            return;
        }
        if (!googleDriveUrl.includes('drive.google.com')) {
            setErrorMessage('Invalid Google Drive link. Must be a drive.google.com link.');
            setImportStatus('error');
            return;
        }
        if (!category) {
            setErrorMessage('Please select a Category.');
            setImportStatus('error');
            return;
        }
        if (isPaid && (!price || parseFloat(price) <= 0)) {
            setErrorMessage('Please enter a valid price for paid access.');
            setImportStatus('error');
            return;
        }

        setImportStatus('loading');
        setErrorMessage('');
        
        // Granular simulated progress steps during the backend import API call
        setProgressStep('downloading');
        
        const uploadTimeout = setTimeout(() => {
            setProgressStep('uploading');
        }, 2200);

        const saveTimeout = setTimeout(() => {
            setProgressStep('saving');
        }, 4500);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                googleDriveUrl: googleDriveUrl.trim(),
                courseId: courseId || null,
                category,
                isPaid,
                price: isPaid ? parseFloat(price) : 0.0
            };

            const response = await api.post('/admin/import-pdf-from-drive', payload);
            
            clearTimeout(uploadTimeout);
            clearTimeout(saveTimeout);
            
            if (response && (response.success || response.productId)) {
                setSuccessData({
                    productId: response.productId,
                    s3Key: response.s3Key,
                    fileName: response.fileName,
                    fileSize: response.fileSize,
                    url: response.url || `/api/pdf/${response.s3Key}`
                });
                setImportStatus('success');
                if (onSuccess) {
                    onSuccess();
                }
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            } else {
                throw new Error(response?.message || 'Import failed unexpectedly');
            }
        } catch (err) {
            clearTimeout(uploadTimeout);
            clearTimeout(saveTimeout);
            console.error('Import PDF error:', err);
            
            // Map backend error messages to readable states
            let friendlyError = err.message || 'Failed to import PDF. Please try again.';
            if (friendlyError.includes('Invalid Google Drive URL') || friendlyError.includes('extract')) {
                friendlyError = 'Invalid Google Drive link format. Ensure the URL is like: https://drive.google.com/file/d/{id}/view';
            } else if (friendlyError.includes('not a valid PDF') || friendlyError.includes('Content-Type')) {
                friendlyError = 'Downloaded file is not a valid PDF. Make sure your link points directly to a PDF file.';
            } else if (friendlyError.includes('Verify file sharing permissions') || friendlyError.includes('download')) {
                friendlyError = 'Failed to download from Google Drive. Ensure the file sharing is set to "Anyone with the link can view".';
            } else if (friendlyError.includes('S3') || friendlyError.includes('s3') || friendlyError.includes('bucket')) {
                friendlyError = 'S3 Storage is currently unavailable. Please check your AWS credentials or connection.';
            } else if (friendlyError.includes('exceeds')) {
                friendlyError = 'The PDF file exceeds the maximum size limit of 20MB.';
            }
            
            setErrorMessage(friendlyError);
            setImportStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-premium/15 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-premium to-emerald-glow text-white p-6 relative">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-gold-premium" />
                                Import PDF from Google Drive
                            </h2>
                            <p className="text-xs text-gold-glow/90 font-medium">
                                Securely upload study materials to BodhGanga Cloud S3
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={importStatus === 'loading'}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Content / Scroll Container */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    
                    {/* Status: Loading Process */}
                    {importStatus === 'loading' && (
                        <div className="py-10 text-center space-y-6 animate-pulse">
                            <Loader2 className="w-12 h-12 text-emerald-premium animate-spin mx-auto" />
                            <div className="space-y-3 max-w-xs mx-auto">
                                <h3 className="font-bold text-slate-800 text-base">Importing Document...</h3>
                                
                                <div className="space-y-2 mt-4 text-left text-xs font-semibold text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                            progressStep === 'downloading' ? 'bg-emerald-glow text-white animate-spin border' :
                                            (progressStep === 'uploading' || progressStep === 'saving') ? 'bg-emerald-premium text-white' : 'border border-slate-300'
                                        }`}>
                                            {(progressStep === 'uploading' || progressStep === 'saving') ? '✓' : ''}
                                        </div>
                                        <span className={progressStep === 'downloading' ? 'text-emerald-premium font-bold' : ''}>
                                            Downloading from Google Drive...
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                            progressStep === 'uploading' ? 'bg-emerald-glow text-white animate-spin border' :
                                            progressStep === 'saving' ? 'bg-emerald-premium text-white' : 'border border-slate-300'
                                        }`}>
                                            {progressStep === 'saving' ? '✓' : ''}
                                        </div>
                                        <span className={progressStep === 'uploading' ? 'text-emerald-premium font-bold' : ''}>
                                            Uploading to Amazon S3...
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                            progressStep === 'saving' ? 'bg-emerald-glow text-white animate-spin border' : 'border border-slate-300'
                                        }`}>
                                        </div>
                                        <span className={progressStep === 'saving' ? 'text-emerald-premium font-bold' : ''}>
                                            Saving PDF metadata...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status: Success View */}
                    {importStatus === 'success' && successData && (
                        <div className="py-6 text-center space-y-5 animate-fadeIn">
                            <div className="w-16 h-16 bg-emerald-premium/10 rounded-full flex items-center justify-center mx-auto border border-emerald-premium/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald-premium" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-bold text-lg text-emerald-premium font-serif">PDF Imported Successfully</h3>
                                <p className="text-xs text-slate-500">Document is safely preserved on AWS S3 & MongoDB</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-sm space-y-2">
                                <div className="flex items-start gap-2.5">
                                    <FileText className="w-5 h-5 text-emerald-premium shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 overflow-hidden">
                                        <p className="font-bold text-slate-800 truncate" title={successData.fileName}>
                                            {successData.fileName}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-500">
                                            Size: {formatBytes(successData.fileSize)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <a
                                    href={successData.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-premium btn-premium-primary text-center w-full justify-center text-xs py-2.5"
                                >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Preview Uploaded PDF
                                </a>
                                <button
                                    onClick={onClose}
                                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form View (Idle or Error) */}
                    {importStatus !== 'loading' && importStatus !== 'success' && (
                        <form onSubmit={handleImport} className="space-y-4">
                            
                            {/* Error Alert */}
                            {importStatus === 'error' && errorMessage && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-slideDown font-semibold">
                                    <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    PDF Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Indian Constitution Core Notes"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input-premium py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-glow"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Brief overview of the PDF topics..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-premium py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-glow"
                                />
                            </div>

                            {/* Drive URL */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Google Drive Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://drive.google.com/file/d/.../view"
                                    value={googleDriveUrl}
                                    onChange={(e) => setGoogleDriveUrl(e.target.value)}
                                    className="input-premium py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-glow"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    💡 Make sure the file sharing setting is: <b>"Anyone with link can view"</b>.
                                </p>
                            </div>

                            {/* Grid: Category & Course */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Category Dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Category / Type *
                                    </label>
                                    <select
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="input-premium py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-glow cursor-pointer"
                                    >
                                        <option value="">-- Select --</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Course Dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Associate with Course
                                    </label>
                                    <select
                                        value={courseId}
                                        onChange={(e) => setCourseId(e.target.value)}
                                        disabled={coursesLoading}
                                        className="input-premium py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-glow cursor-pointer"
                                    >
                                        <option value="">-- Optional (None) --</option>
                                        {courses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.courseTitle || c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Access Type & Price */}
                            <div className="border-t border-slate-100 pt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Access Type
                                    </span>
                                    
                                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsPaid(false)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                !isPaid 
                                                    ? 'bg-emerald-premium text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            Free
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsPaid(true)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                isPaid 
                                                    ? 'bg-emerald-premium text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            Paid
                                        </button>
                                    </div>
                                </div>

                                {isPaid && (
                                    <div className="animate-slideDown">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Price (INR) *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                                                ₹
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                required={isPaid}
                                                placeholder="99"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="input-premium py-2 pl-7 pr-3 text-sm focus:ring-1 focus:ring-emerald-glow"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-premium btn-premium-primary text-xs py-2.5"
                                >
                                    Import PDF
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPdfUploadModal;

