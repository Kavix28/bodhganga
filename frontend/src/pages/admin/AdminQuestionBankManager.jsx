import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Eye, Edit3, Trash2, Send, Filter, CheckSquare, Loader2 } from 'lucide-react';
import api from '../../services/api';

const AdminQuestionBankManager = () => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'review', 'published'
    const [stateSlug, setStateSlug] = useState('maharashtra');
    const [districtSlug, setDistrictSlug] = useState('akola');
    const [testType, setTestType] = useState('easy');

    // Files
    const [questionPdf, setQuestionPdf] = useState(null);
    const [answerPdf, setAnswerPdf] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState(null);

    // Questions List
    const [questions, setQuestions] = useState([]);
    const [loadingQs, setLoadingQs] = useState(false);
    const [statusFilter, setStatusFilter] = useState('DRAFT');

    // Edit Modal
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (activeTab !== 'upload') {
            fetchAdminQuestions();
        }
    }, [activeTab, stateSlug, districtSlug, statusFilter]);

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
            if (res.data && res.data.success) {
                setQuestions(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch admin questions:', err);
        } finally {
            setLoadingQs(false);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!questionPdf || !answerPdf) {
            setUploadMessage({ type: 'error', text: 'Please select both Question Bank PDF and Solution PDF.' });
            return;
        }

        setUploading(true);
        setUploadMessage(null);

        const formData = new FormData();
        formData.append('questionPdf', questionPdf);
        formData.append('answerPdf', answerPdf);
        formData.append('stateSlug', stateSlug);
        formData.append('districtSlug', districtSlug);
        formData.append('testType', testType);

        try {
            const res = await api.post('/admin/quiz/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data && res.data.success) {
                setUploadMessage({
                    type: 'success',
                    text: `Ingestion Complete! Parsed ${res.data.data.totalParsed} questions (${res.data.data.draftCount} Draft, ${res.data.data.reviewRequiredCount} Review Required).`
                });
                setQuestionPdf(null);
                setAnswerPdf(null);
            } else {
                setUploadMessage({ type: 'error', text: res.data?.message || 'Ingestion failed.' });
            }
        } catch (err) {
            setUploadMessage({ type: 'error', text: err.response?.data?.message || 'Server upload error.' });
        } finally {
            setUploading(false);
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
        if (!window.confirm(`Bulk publish all questions for ${districtSlug.toUpperCase()}?`)) return;
        try {
            const res = await api.post(`/admin/quiz/bulk-publish`, null, {
                params: { stateSlug, districtSlug }
            });
            alert(res.data?.message || 'Bulk publish completed.');
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

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                        <span className="text-xs font-black text-gold uppercase tracking-widest">Admin Control Panel</span>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                            Question Bank <span className="text-gradient-gold">OCR Ingestion Manager</span>
                        </h1>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-900 border border-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-gold text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Upload PDFs
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
                                <Upload className="w-5 h-5 text-gold" /> Upload Question Bank & Solution PDFs
                            </h2>
                            <p className="text-xs text-slate-400">
                                Select State and District to parse dual PDF documents into structured MongoDB draft questions.
                            </p>
                        </div>

                        {uploadMessage && (
                            <div className={`p-4 rounded-2xl border text-xs font-bold ${uploadMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'}`}>
                                {uploadMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleUploadSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">State Slug</label>
                                    <input
                                        type="text"
                                        value={stateSlug}
                                        onChange={(e) => setStateSlug(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">District Slug</label>
                                    <input
                                        type="text"
                                        value={districtSlug}
                                        onChange={(e) => setDistrictSlug(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Default Test Type</label>
                                    <select
                                        value={testType}
                                        onChange={(e) => setTestType(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                    >
                                        <option value="easy">Easy (Foundation)</option>
                                        <option value="advanced">Advanced (UPSC-Level)</option>
                                        <option value="master">Master Test</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50">
                                    <FileText className="w-8 h-8 text-gold mx-auto" />
                                    <span className="block text-xs font-bold text-slate-300">1. Question Bank PDF</span>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setQuestionPdf(e.target.files[0])}
                                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                </div>

                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50">
                                    <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
                                    <span className="block text-xs font-bold text-slate-300">2. Answer & Solution PDF</span>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setAnswerPdf(e.target.files[0])}
                                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Ingestion & Parsing'}
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
