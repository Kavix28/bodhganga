import React, { useState } from 'react';
import { FileText, Download, BookOpen, ChevronRight } from 'lucide-react';

/**
 * NotesViewer Component
 * Displays study notes with clean, academic typography
 * Frontend-only - expects backend to provide notes data
 */
const NotesViewer = ({ stateId, stateName }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Mock data structure - Replace with actual API call
    const notesTopics = [
        {
            id: 1,
            title: 'Indian Constitution',
            subtopics: ['Preamble', 'Fundamental Rights', 'Directive Principles', 'Amendments'],
            pdfUrl: '/pdfs/constitution.pdf',
            pageCount: 45,
            lastUpdated: '2024-01-10'
        },
        {
            id: 2,
            title: 'Indian History',
            subtopics: ['Ancient India', 'Medieval India', 'Modern India', 'Freedom Struggle'],
            pdfUrl: '/pdfs/history.pdf',
            pageCount: 67,
            lastUpdated: '2024-01-08'
        },
        {
            id: 3,
            title: 'Geography of India',
            subtopics: ['Physical Features', 'Climate', 'Resources', 'Economic Geography'],
            pdfUrl: '/pdfs/geography.pdf',
            pageCount: 52,
            lastUpdated: '2024-01-05'
        },
        {
            id: 4,
            title: 'Indian Polity',
            subtopics: ['Parliament', 'Executive', 'Judiciary', 'State Government'],
            pdfUrl: '/pdfs/polity.pdf',
            pageCount: 38,
            lastUpdated: '2024-01-12'
        }
    ];

    const handleDownload = (pdfUrl, title) => {
        // Frontend-only - actual download will be handled by backend
        console.log(`Downloading: ${title} from ${pdfUrl}`);
        // In production: window.open(pdfUrl, '_blank');
    };

    const handleView = (topic) => {
        setSelectedTopic(topic);
        // Frontend-only - actual PDF viewing will be handled by backend
        console.log(`Viewing: ${topic.title}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                        Study Notes
                    </h2>
                    <p className="text-gray-600">
                        Comprehensive study materials for {stateName} government exams
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-5 h-5" />
                    <span>{notesTopics.length} Topics Available</span>
                </div>
            </div>

            {/* Notes List */}
            <div className="grid gap-6">
                {notesTopics.map((topic) => (
                    <div
                        key={topic.id}
                        className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg hover:border-[var(--navy)] transition-all duration-200"
                    >
                        {/* Topic Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
                                            {topic.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>{topic.pageCount} pages</span>
                                            <span>•</span>
                                            <span>Updated: {new Date(topic.lastUpdated).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subtopics */}
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Topics Covered:</p>
                            <div className="flex flex-wrap gap-2">
                                {topic.subtopics.map((subtopic, index) => (
                                    <span
                                        key={index}
                                        className="topic-tag"
                                    >
                                        {subtopic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                            <button
                                onClick={() => handleView(topic)}
                                className="btn-navy flex-1"
                            >
                                <BookOpen className="w-5 h-5 mr-2" />
                                View Notes
                            </button>
                            <button
                                onClick={() => handleDownload(topic.pdfUrl, topic.title)}
                                className="btn bg-white text-[var(--navy)] border-2 border-[var(--navy)] hover:bg-gray-50 flex-1"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Topic Detail (Modal/Expanded View) */}
            {selectedTopic && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] text-white p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold">{selectedTopic.title}</h3>
                                <button
                                    onClick={() => setSelectedTopic(null)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                            <div className="notes-viewer">
                                <p className="text-lg text-gray-600 mb-6">
                                    PDF viewer will be integrated here. In production, this will display the actual PDF content using a PDF viewer library or iframe.
                                </p>

                                <div className="bg-gray-100 rounded-lg p-8 text-center">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">
                                        <strong>PDF Document:</strong> {selectedTopic.title}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {selectedTopic.pageCount} pages • Last updated: {selectedTopic.lastUpdated}
                                    </p>
                                    <button
                                        onClick={() => handleDownload(selectedTopic.pdfUrl, selectedTopic.title)}
                                        className="btn-saffron"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Download PDF
                                    </button>
                                </div>

                                {/* Subtopics Navigation */}
                                <div className="mt-8">
                                    <h4 className="text-xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
                                        Chapter Contents
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedTopic.subtopics.map((subtopic, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-[var(--navy)] hover:bg-gray-50 cursor-pointer transition-all"
                                            >
                                                <span className="flex items-center justify-center w-8 h-8 bg-[var(--saffron)] text-white rounded-full text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium text-gray-800">{subtopic}</span>
                                                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State (if no notes) */}
            {notesTopics.length === 0 && (
                <div className="empty-state">
                    <BookOpen className="empty-state-icon" />
                    <h3 className="empty-state-title">No Notes Available Yet</h3>
                    <p className="empty-state-description">
                        Study notes for {stateName} are being prepared. Check back soon!
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotesViewer;
