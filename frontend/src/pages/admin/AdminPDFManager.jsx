import React, { useState } from 'react';
import { Upload, FileText, Trash2, Edit, Check, X, Filter, Download } from 'lucide-react';

/**
 * AdminPDFManager Component
 * Frontend-only admin interface for PDF upload and management
 * Actual upload logic will be handled by backend
 */
const AdminPDFManager = () => {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [filterRegion, setFilterRegion] = useState('all');

    // Mock existing PDFs - Replace with actual API call
    const [existingPDFs, setExistingPDFs] = useState([
        {
            id: 1,
            fileName: 'Indian_Constitution_Notes.pdf',
            fileSize: '2.4 MB',
            uploadDate: '2024-01-10',
            region: 'Maharashtra',
            regionType: 'state',
            contentType: 'notes',
            status: 'active'
        },
        {
            id: 2,
            fileName: 'History_Question_Bank.pdf',
            fileSize: '3.1 MB',
            uploadDate: '2024-01-08',
            region: 'Uttar Pradesh',
            regionType: 'state',
            contentType: 'questions',
            status: 'active'
        },
        {
            id: 3,
            fileName: 'Geography_Solutions.pdf',
            fileSize: '1.8 MB',
            uploadDate: '2024-01-05',
            region: 'Delhi (NCT)',
            regionType: 'ut',
            contentType: 'solutions',
            status: 'active'
        }
    ]);

    const [newPDF, setNewPDF] = useState({
        file: null,
        region: '',
        regionType: 'state',
        contentType: 'notes'
    });

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setNewPDF({ ...newPDF, file });
        } else {
            alert('Please select a valid PDF file');
        }
    };

    const handleUpload = () => {
        if (!newPDF.file || !newPDF.region || !newPDF.regionType || !newPDF.contentType) {
            alert('Please fill all fields and select a file');
            return;
        }

        // Frontend-only - Backend will handle actual upload
        console.log('Uploading PDF:', {
            fileName: newPDF.file.name,
            fileSize: (newPDF.file.size / (1024 * 1024)).toFixed(2) + ' MB',
            region: newPDF.region,
            regionType: newPDF.regionType,
            contentType: newPDF.contentType
        });

        alert('PDF upload initiated! (Backend integration required)');
        setUploadModalOpen(false);
        setNewPDF({ file: null, region: '', regionType: 'state', contentType: 'notes' });
    };

    const handleDelete = (pdfId) => {
        if (window.confirm('Are you sure you want to delete this PDF?')) {
            // Frontend-only - Backend will handle actual deletion
            console.log('Deleting PDF ID:', pdfId);
            setExistingPDFs(existingPDFs.filter(pdf => pdf.id !== pdfId));
        }
    };

    const filteredPDFs = existingPDFs.filter(pdf => {
        const typeMatch = filterType === 'all' || pdf.contentType === filterType;
        const regionMatch = filterRegion === 'all' || pdf.region === filterRegion;
        return typeMatch && regionMatch;
    });

    const getContentTypeBadge = (type) => {
        switch (type) {
            case 'notes':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'questions':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'solutions':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                    PDF Content Manager
                </h1>
                <p className="text-gray-600">
                    Upload and manage study materials for BodhGanga Academy
                </p>
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">Filter:</span>
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
                        >
                            <option value="all">All Types</option>
                            <option value="notes">Notes Only</option>
                            <option value="questions">Questions Only</option>
                            <option value="solutions">Solutions Only</option>
                        </select>

                        <select
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value)}
                            className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
                        >
                            <option value="all">All Regions</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Delhi (NCT)">Delhi (NCT)</option>
                            {/* Add more regions as needed */}
                        </select>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="btn-saffron"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload New PDF
                    </button>
                </div>
            </div>

            {/* PDF List */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">File Name</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Region</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Size</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Upload Date</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPDFs.map((pdf) => (
                                <tr key={pdf.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-6 h-6 text-[var(--navy)]" />
                                            <span className="font-medium text-gray-900">{pdf.fileName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700">{pdf.region}</span>
                                        <span className="ml-2 text-xs text-gray-500">({pdf.regionType})</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`exam-badge ${getContentTypeBadge(pdf.contentType)}`}>
                                            {pdf.contentType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{pdf.fileSize}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(pdf.uploadDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="p-2 text-[var(--navy)] hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <button
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pdf.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPDFs.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No PDFs Found</h3>
                        <p className="text-gray-500">
                            {filterType !== 'all' || filterRegion !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Upload your first PDF to get started'}
                        </p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[var(--saffron)] to-[var(--saffron-dark)] text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Upload New PDF</h2>
                                <button
                                    onClick={() => setUploadModalOpen(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-6">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Select PDF File *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[var(--saffron)] transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label htmlFor="pdf-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 font-medium">
                                            {newPDF.file ? newPDF.file.name : 'Click to select PDF file'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Maximum file size: 50 MB
                                        </p>
                                    </label>
                                </div>
                            </div>

                            {/* Region Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Region Type *
                                    </label>
                                    <select
                                        value={newPDF.regionType}
                                        onChange={(e) => setNewPDF({ ...newPDF, regionType: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-[var(--saffron)] focus:border-[var(--saffron)]"
                                    >
                                        <option value="state">State</option>
                                        <option value="ut">Union Territory</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Select Region *
                                    </label>
                                    <select
                                        value={newPDF.region}
                                        onChange={(e) => setNewPDF({ ...newPDF, region: e.target.value })}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-[var(--saffron)] focus:border-[var(--saffron)]"
                                    >
                                        <option value="">-- Select Region --</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                                        <option value="Delhi (NCT)">Delhi (NCT)</option>
                                        {/* Add all states and UTs */}
                                    </select>
                                </div>
                            </div>

                            {/* Content Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Content Type *
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setNewPDF({ ...newPDF, contentType: 'notes' })}
                                        className={`p-4 rounded-lg border-2 font-semibold transition-all ${newPDF.contentType === 'notes'
                                            ? 'border-[var(--navy)] bg-blue-50 text-[var(--navy)]'
                                            : 'border-gray-300 text-gray-700 hover:border-[var(--navy)]'
                                            }`}
                                    >
                                        Notes
                                    </button>
                                    <button
                                        onClick={() => setNewPDF({ ...newPDF, contentType: 'questions' })}
                                        className={`p-4 rounded-lg border-2 font-semibold transition-all ${newPDF.contentType === 'questions'
                                            ? 'border-[var(--saffron)] bg-orange-50 text-[var(--saffron)]'
                                            : 'border-gray-300 text-gray-700 hover:border-[var(--saffron)]'
                                            }`}
                                    >
                                        Questions
                                    </button>
                                    <button
                                        onClick={() => setNewPDF({ ...newPDF, contentType: 'solutions' })}
                                        className={`p-4 rounded-lg border-2 font-semibold transition-all ${newPDF.contentType === 'solutions'
                                            ? 'border-[var(--green)] bg-green-50 text-[var(--green)]'
                                            : 'border-gray-300 text-gray-700 hover:border-[var(--green)]'
                                            }`}
                                    >
                                        Solutions
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleUpload}
                                    className="btn-saffron flex-1"
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Upload PDF
                                </button>
                                <button
                                    onClick={() => setUploadModalOpen(false)}
                                    className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1"
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPDFManager;
