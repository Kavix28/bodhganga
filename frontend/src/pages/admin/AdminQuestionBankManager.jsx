import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Eye, Edit3, Trash2, Send, Filter, CheckSquare, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getAvailableStates, getDistricts } from '../../services/adminService';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

const AdminQuestionBankManager = () => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'review', 'published'
    
    // States and Districts list
    const [availableStates, setAvailableStates] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Form selection
    const [stateSlug, setStateSlug] = useState('maharashtra');
    const [districtSlug, setDistrictSlug] = useState('akola');
    const [testType, setTestType] = useState('easy');

    // Files & Validation
    const [questionPdf, setQuestionPdf] = useState(null);
    const [answerPdf, setAnswerPdf] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgressMsg, setUploadProgressMsg] = useState('');
    const [uploadMessage, setUploadMessage] = useState(null);

    // Questions List
    const [questions, setQuestions] = useState([]);
    const [loadingQs, setLoadingQs] = useState(false);
    const [statusFilter, setStatusFilter] = useState('DRAFT');

    // Edit Modal
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Load available states on mount
    useEffect(() => {
        fetchStates();
    }, []);

    // Load districts whenever stateSlug changes
    useEffect(() => {
        if (stateSlug) {
            fetchDistrictsForState(stateSlug);
        }
    }, [stateSlug]);

    useEffect(() => {
        if (activeTab !== 'upload') {
            fetchAdminQuestions();
        }
    }, [activeTab, stateSlug, districtSlug, statusFilter]);

    const fetchStates = async () => {
        setLoadingStates(true);
        try {
            const list = await getAvailableStates();
            if (Array.isArray(list) && list.length > 0) {
                setAvailableStates(list);
            }
        } catch (err) {
            console.warn('Could not fetch state catalog, using text input fallback:', err);
        } finally {
            setLoadingStates(false);
        }
    };

    const fetchDistrictsForState = async (slug) => {
        setLoadingDistricts(true);
        try {
            const list = await getDistricts(slug);
            if (Array.isArray(list) && list.length > 0) {
                setAvailableDistricts(list);
            } else {
                setAvailableDistricts([]);
            }
        } catch (err) {
            console.warn('Could not fetch district list, using text input fallback:', err);
            setAvailableDistricts([]);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const validatePdfFile = (file, fieldName) => {
        if (!file) return null;

        const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
        const isPdfMime = file.type === 'application/pdf' || file.type.includes('pdf');

        if (!isPdfExt && !isPdfMime) {
            return `${fieldName} must be a valid PDF file (.pdf). Selected: ${file.name}`;
        }

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `${fieldName} exceeds maximum allowed file size of 50MB (selected ${sizeMB}MB).`;
        }

        return null;
    };

    const handleQuestionPdfChange = (e) => {
        const file = e.target.files[0] || null;
        setUploadMessage(null);
        if (file) {
            const err = validatePdfFile(file, 'Question Bank PDF');
            if (err) {
                setFileError(err);
                setQuestionPdf(null);
                e.target.value = '';
                return;
            }
        }
        setFileError(null);
        setQuestionPdf(file);
    };

    const handleAnswerPdfChange = (e) => {
        const file = e.target.files[0] || null;
        setUploadMessage(null);
        if (file) {
            const err = validatePdfFile(file, 'Answer / Solution PDF');
            if (err) {
                setFileError(err);
                setAnswerPdf(null);
                e.target.value = '';
                return;
            }
        }
        setFileError(null);
        setAnswerPdf(file);
    };

    const fetchAdminQuestions = async () => {
        setLoadingQs(true);
        try {
            const res = await api.get('/admin/quiz/questions', {
                params: {
                    stateSlug,
                    districtSlug,
                    status: activeTab === 'published' ? 'PUBLISHED' : statusFilter
                }
            });
            const dataList = res?.data || res;
            if (Array.isArray(dataList)) {
                setQuestions(dataList);
            } else if (res && res.success && Array.isArray(res.data)) {
                setQuestions(res.data);
            } else {
                setQuestions([]);
            }
        } catch (err) {
            console.error('Failed to fetch admin questions:', err);
            setQuestions([]);
        } finally {
            setLoadingQs(false);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        
        // Re-validate
        if (!stateSlug || !districtSlug) {
            setUploadMessage({ type: 'error', text: 'Please specify both State and District.' });
            return;
        }

        if (!questionPdf || !answerPdf) {
            setUploadMessage({ type: 'error', text: 'Please select both Question Bank PDF and Solution PDF.' });
            return;
        }

        const qErr = validatePdfFile(questionPdf, 'Question Bank PDF');
        if (qErr) {
            setUploadMessage({ type: 'error', text: qErr });
            return;
        }

        const aErr = validatePdfFile(answerPdf, 'Answer / Solution PDF');
        if (aErr) {
            setUploadMessage({ type: 'error', text: aErr });
            return;
        }

        setUploading(true);
        setUploadMessage(null);
        setUploadProgressMsg('Uploading PDF files and starting backend OCR pipeline...');

        const formData = new FormData();
        formData.append('questionPdf', questionPdf);
        formData.append('answerPdf', answerPdf);
        formData.append('stateSlug', stateSlug.trim().toLowerCase());
        formData.append('districtSlug', districtSlug.trim().toLowerCase());
        formData.append('testType', testType);

        try {
            const res = await api.post('/admin/quiz/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 180000, // 3 minutes timeout for OCR ingestion pipeline
            });

            const resData = res?.data || res;
            const success = res?.success ?? resData?.success;
            const message = res?.message || resData?.message || 'Ingestion Completed Successfully.';
            const metrics = res?.data || resData;

            if (success) {
                setUploadMessage({
                    type: 'success',
                    text: message,
                    metrics: {
                        totalParsed: metrics?.totalParsed ?? metrics?.parsedQuestionsCount ?? 0,
                        draftCount: metrics?.draftCount ?? 0,
                        reviewRequiredCount: metrics?.reviewRequiredCount ?? 0,
                        publishedCount: metrics?.publishedCount ?? 0,
                        message: message
                    }
                });
                setQuestionPdf(null);
                setAnswerPdf(null);
            } else {
                setUploadMessage({
                    type: 'error',
                    text: message || 'Ingestion failed. Please check backend logs.'
                });
            }
        } catch (err) {
            console.error('Ingestion error:', err);
            const errorMsg = err?.message || err?.response?.data?.message || 'Server upload/OCR error during ingestion.';
            setUploadMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
            setUploadProgressMsg('');
        }
    };

    const handlePublishSingle = async (id) => {
        try {
            await api.post(`/admin/quiz/questions/${id}/publish`);
            fetchAdminQuestions();
        } catch (err) {
            alert('Failed to publish question.');
        }
    };

    const handleBulkPublish = async () => {
        if (!window.confirm(`Bulk publish all draft questions for ${districtSlug.toUpperCase()} (${stateSlug.toUpperCase()})?`)) return;
        try {
            const res = await api.post(`/admin/quiz/bulk-publish`, null, {
                params: { stateSlug, districtSlug }
            });
            alert(res?.message || res?.data?.message || 'Bulk publish completed.');
            fetchAdminQuestions();
        } catch (err) {
            alert('Failed bulk publish.');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;
        setUpdating(true);
        try {
            await api.put(`/admin/quiz/questions/${editingQuestion.id}`, editingQuestion);
            setEditingQuestion(null);
            fetchAdminQuestions();
        } catch (err) {
            alert('Failed to save question edits.');
        } finally {
            setUpdating(false);
        }
    };

    const isFormValid = Boolean(
        stateSlug &&
        districtSlug &&
        questionPdf &&
        answerPdf &&
        !fileError &&
        !uploading
    );

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-6 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link to="/admin/state-resources" className="text-xs text-slate-400 hover:text-gold flex items-center gap-1 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to State Resources
                            </Link>
                            <span className="text-slate-600">|</span>
                            <span className="text-xs font-black text-gold uppercase tracking-widest">Admin Control Panel</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                            Question Bank <span className="text-gradient-gold">OCR Ingestion Manager</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Ingest Question Bank and Answer key PDFs via OCR into structured draft questions for automated quiz deployment.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-900 border border-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Upload PDFs & OCR
                        </button>
                        <button
                            onClick={() => { setActiveTab('review'); setStatusFilter('DRAFT'); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'review' ? 'bg-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Drafts & Review
                        </button>
                        <button
                            onClick={() => setActiveTab('published')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'published' ? 'bg-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Published Questions
                        </button>
                    </div>
                </div>

                {/* TAB 1: UPLOAD FORM */}
                {activeTab === 'upload' && (
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Upload className="w-5 h-5 text-gold" /> Question Bank OCR Ingestion Pipeline
                            </h2>
                            <p className="text-xs text-slate-400">
                                Select State and District, then select Question Bank PDF & Solution PDF to run the automated OCR ingestion process.
                            </p>
                        </div>

                        {fileError && (
                            <div className="p-4 rounded-2xl border border-red-500/40 bg-red-950/60 text-red-300 text-xs font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                                <span>{fileError}</span>
                            </div>
                        )}

                        {uploadMessage && (
                            <div className={`p-5 rounded-2xl border text-xs ${uploadMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'}`}>
                                <div className="font-bold flex items-center gap-2 text-sm mb-1">
                                    {uploadMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                                    {uploadMessage.text}
                                </div>
                                {uploadMessage.metrics && (
                                    <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Parsed</span>
                                            <span className="text-base font-black text-white">{uploadMessage.metrics.totalParsed}</span>
                                        </div>
                                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Draft Count</span>
                                            <span className="text-base font-black text-amber-400">{uploadMessage.metrics.draftCount}</span>
                                        </div>
                                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Review Required</span>
                                            <span className="text-base font-black text-red-400">{uploadMessage.metrics.reviewRequiredCount}</span>
                                        </div>
                                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Published</span>
                                            <span className="text-base font-black text-emerald-400">{uploadMessage.metrics.publishedCount}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">
                                        State <span className="text-red-400">*</span>
                                    </label>
                                    {availableStates.length > 0 ? (
                                        <select
                                            value={stateSlug}
                                            onChange={(e) => setStateSlug(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                                            required
                                        >
                                            {availableStates.map(st => (
                                                <option key={st.stateSlug} value={st.stateSlug}>
                                                    {st.name || st.stateSlug} ({st.stateSlug})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={stateSlug}
                                            onChange={(e) => setStateSlug(e.target.value.toLowerCase())}
                                            placeholder="e.g. maharashtra"
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">
                                        District <span className="text-red-400">*</span>
                                    </label>
                                    {availableDistricts.length > 0 ? (
                                        <select
                                            value={districtSlug}
                                            onChange={(e) => setDistrictSlug(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                                            required
                                        >
                                            {availableDistricts.map(dt => (
                                                <option key={dt.districtSlug} value={dt.districtSlug}>
                                                    {dt.district || dt.name || dt.districtSlug} ({dt.districtSlug})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={districtSlug}
                                            onChange={(e) => setDistrictSlug(e.target.value.toLowerCase())}
                                            placeholder="e.g. akola"
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Question Classification Mode</label>
                                    <div className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-bold flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Automatic Header-Based Classification (Foundation & Statement-Based)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dual PDF Upload Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-colors ${questionPdf ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-slate-950/50 hover:border-gold/40'}`}>
                                    <FileText className={`w-8 h-8 mx-auto ${questionPdf ? 'text-emerald-400' : 'text-gold'}`} />
                                    <span className="block text-xs font-bold text-slate-300">
                                        1. Question Bank PDF <span className="text-red-400">*</span>
                                    </span>
                                    <p className="text-[11px] text-slate-400">PDF document containing question text and options</p>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleQuestionPdfChange}
                                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                    {questionPdf && (
                                        <div className="text-[11px] font-mono text-emerald-400 pt-2 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>{questionPdf.name} ({formatFileSize(questionPdf.size)})</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-colors ${answerPdf ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-slate-950/50 hover:border-gold/40'}`}>
                                    <FileText className={`w-8 h-8 mx-auto ${answerPdf ? 'text-emerald-400' : 'text-emerald-400'}`} />
                                    <span className="block text-xs font-bold text-slate-300">
                                        2. Answer & Solution PDF <span className="text-red-400">*</span>
                                    </span>
                                    <p className="text-[11px] text-slate-400">PDF document containing answer keys and explanations</p>
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleAnswerPdfChange}
                                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                    {answerPdf && (
                                        <div className="text-[11px] font-mono text-emerald-400 pt-2 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>{answerPdf.name} ({formatFileSize(answerPdf.size)})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {uploading && (
                                <div className="p-4 rounded-2xl bg-slate-950 border border-gold/30 space-y-2 text-center">
                                    <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
                                    <p className="text-xs font-bold text-gold">{uploadProgressMsg}</p>
                                    <p className="text-[10px] text-slate-400">Executing Tesseract OCR, Devanagari text normalization, question parsing, answer matching, and validation...</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing OCR Pipeline...</span>
                                    </>
                                ) : (
                                    <span>Start OCR & Ingestion</span>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 2 & 3: QUESTIONS LISTING */}
                {activeTab !== 'upload' && (
                    <div className="space-y-6">
                        {/* Filters & Bulk Action */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 border border-white/10 p-4 rounded-2xl">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Filter className="w-4 h-4 text-gold" />
                                <input
                                    type="text"
                                    placeholder="State Slug"
                                    value={stateSlug}
                                    onChange={(e) => setStateSlug(e.target.value)}
                                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="District Slug"
                                    value={districtSlug}
                                    onChange={(e) => setDistrictSlug(e.target.value)}
                                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                />
                                {activeTab === 'review' && (
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                    >
                                        <option value="DRAFT">Drafts</option>
                                        <option value="REVIEW_REQUIRED">Review Required</option>
                                    </select>
                                )}
                            </div>

                            {activeTab === 'review' && (
                                <button
                                    onClick={handleBulkPublish}
                                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase flex items-center gap-2"
                                >
                                    <CheckSquare className="w-4 h-4" /> Bulk Publish District
                                </button>
                            )}
                        </div>

                        {/* Questions Table / List */}
                        {loadingQs ? (
                            <div className="py-20 text-center">
                                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
                                <span className="text-xs text-slate-400 font-bold">Fetching admin questions...</span>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center text-slate-400 text-xs">
                                No questions found matching current criteria.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q) => (
                                    <div key={q.id} className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gold">Q{q.questionNumber}</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 uppercase">{q.topic}</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">{q.level}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : q.status === 'REVIEW_REQUIRED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>{q.status}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingQuestion(q)}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                                                    title="Edit Question"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                {q.status !== 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handlePublishSingle(q.id)}
                                                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <Send className="w-3 h-3" /> Publish
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                                            {q.question}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options && q.options.map((opt, idx) => (
                                                <div key={idx} className={`p-2 rounded-xl text-xs border ${idx === q.correctAnswer ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-white/5 border-white/5 text-slate-400'}`}>
                                                    {String.fromCharCode(65 + idx)}. {opt}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-white/5">
                                            <span className="font-bold text-gold">Explanation: </span>{q.explanation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* EDIT QUESTION MODAL */}
                {editingQuestion && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-white">Edit Question Q{editingQuestion.questionNumber}</h3>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Question Text</label>
                                <textarea
                                    rows={3}
                                    value={editingQuestion.question}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400">Options & Correct Answer</label>
                                {editingQuestion.options && editingQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="correctOpt"
                                            checked={editingQuestion.correctAnswer === idx}
                                            onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx })}
                                        />
                                        <span className="text-xs font-bold text-gold w-4">{String.fromCharCode(65 + idx)}</span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const updated = [...editingQuestion.options];
                                                updated[idx] = e.target.value;
                                                setEditingQuestion({ ...editingQuestion, options: updated });
                                            }}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Explanation</label>
                                <textarea
                                    rows={3}
                                    value={editingQuestion.explanation}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setEditingQuestion(null)}
                                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={updating}
                                    className="px-5 py-2 rounded-xl bg-gold text-slate-950 font-bold text-xs uppercase flex items-center gap-2"
                                >
                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminQuestionBankManager;

