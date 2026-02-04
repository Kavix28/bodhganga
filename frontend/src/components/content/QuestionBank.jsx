import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Filter, Target } from 'lucide-react';

/**
 * QuestionBank Component
 * Displays practice questions with MCQ format
 * Frontend-only - expects backend to provide questions data
 */
const QuestionBank = ({ stateId, stateName }) => {
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [showAnswers, setShowAnswers] = useState({});

    // Mock data structure - Replace with actual API call
    const questions = [
        {
            id: 1,
            topic: 'Indian Constitution',
            difficulty: 'medium',
            question: 'Which Article of the Indian Constitution deals with the Right to Education?',
            options: [
                'Article 19',
                'Article 21A',
                'Article 25',
                'Article 32'
            ],
            correctAnswer: 1,
            explanation: 'Article 21A was inserted by the 86th Constitutional Amendment Act, 2002. It provides free and compulsory education to all children aged 6-14 years as a Fundamental Right.',
            previousYear: true,
            examType: 'UPSC 2020'
        },
        {
            id: 2,
            topic: 'Indian History',
            difficulty: 'easy',
            question: 'Who was the first President of India?',
            options: [
                'Jawaharlal Nehru',
                'Dr. Rajendra Prasad',
                'Dr. S. Radhakrishnan',
                'Dr. B.R. Ambedkar'
            ],
            correctAnswer: 1,
            explanation: 'Dr. Rajendra Prasad served as the first President of India from 1950 to 1962. He was elected by the Constituent Assembly.',
            previousYear: true,
            examType: 'State PSC 2019'
        },
        {
            id: 3,
            topic: 'Geography',
            difficulty: 'hard',
            question: 'Which of the following rivers does NOT originate in India?',
            options: [
                'Yamuna',
                'Brahmaputra',
                'Godavari',
                'Krishna'
            ],
            correctAnswer: 1,
            explanation: 'The Brahmaputra originates from the Angsi Glacier in Tibet (China), not in India. Yamuna, Godavari, and Krishna all originate within India.',
            previousYear: false,
            examType: null
        },
        {
            id: 4,
            topic: 'Indian Polity',
            difficulty: 'medium',
            question: 'The concept of "Judicial Review" in the Indian Constitution is borrowed from which country?',
            options: [
                'United Kingdom',
                'United States',
                'France',
                'Germany'
            ],
            correctAnswer: 1,
            explanation: 'The concept of Judicial Review is borrowed from the United States Constitution. It allows the judiciary to review and invalidate laws that are inconsistent with the constitution.',
            previousYear: true,
            examType: 'SSC CGL 2021'
        }
    ];

    const topics = ['all', ...new Set(questions.map(q => q.topic))];

    const filteredQuestions = selectedTopic === 'all'
        ? questions
        : questions.filter(q => q.topic === selectedTopic);

    const toggleAnswer = (questionId) => {
        setShowAnswers(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-700 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                        Question Bank
                    </h2>
                    <p className="text-gray-600">
                        Practice questions for {stateName} government exams
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="w-5 h-5 text-[var(--saffron)]" />
                    <span>{filteredQuestions.length} Questions</span>
                </div>
            </div>

            {/* Topic Filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Filter by Topic:</span>
                {topics.map((topic) => (
                    <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`topic-tag ${selectedTopic === topic ? 'active' : ''}`}
                    >
                        {topic === 'all' ? 'All Topics' : topic}
                    </button>
                ))}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {filteredQuestions.map((q, index) => (
                    <div key={q.id} className="question-card">
                        {/* Question Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                                <span className="question-number">{index + 1}</span>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="topic-tag active">
                                            {q.topic}
                                        </span>
                                        <span className={`badge ${getDifficultyColor(q.difficulty)}`}>
                                            {q.difficulty}
                                        </span>
                                        {q.previousYear && (
                                            <span className="exam-badge">
                                                {q.examType}
                                            </span>
                                        )}
                                    </div>
                                    <p className="question-text">
                                        {q.question}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="question-options">
                            {q.options.map((option, optionIndex) => (
                                <div
                                    key={optionIndex}
                                    className={`question-option ${showAnswers[q.id] && optionIndex === q.correctAnswer
                                            ? 'correct'
                                            : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 font-semibold text-sm">
                                            {String.fromCharCode(65 + optionIndex)}
                                        </span>
                                        <span className="flex-1">{option}</span>
                                        {showAnswers[q.id] && optionIndex === q.correctAnswer && (
                                            <CheckCircle className="w-5 h-5 text-[var(--green)]" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Show Answer Button */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => toggleAnswer(q.id)}
                                className={`btn ${showAnswers[q.id] ? 'btn-green' : 'btn-saffron'} flex-1`}
                            >
                                {showAnswers[q.id] ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Hide Explanation
                                    </>
                                ) : (
                                    <>
                                        <HelpCircle className="w-5 h-5 mr-2" />
                                        Show Answer & Explanation
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Explanation (shown when answer is revealed) */}
                        {showAnswers[q.id] && (
                            <div className="solution-viewer mt-4">
                                <div className="solution-header">
                                    <div className="solution-badge">
                                        ✓ Correct Answer
                                    </div>
                                    <span className="text-lg font-bold">
                                        Option {String.fromCharCode(65 + q.correctAnswer)}: {q.options[q.correctAnswer]}
                                    </span>
                                </div>
                                <div className="solution-content">
                                    <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>
                                        Explanation:
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {q.explanation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredQuestions.length === 0 && (
                <div className="empty-state">
                    <HelpCircle className="empty-state-icon" />
                    <h3 className="empty-state-title">No Questions Available</h3>
                    <p className="empty-state-description">
                        Questions for this topic are being prepared. Try selecting a different topic.
                    </p>
                    <button
                        onClick={() => setSelectedTopic('all')}
                        className="btn-saffron"
                    >
                        View All Questions
                    </button>
                </div>
            )}

            {/* Statistics Footer */}
            {filteredQuestions.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-xl border-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="stats-value">{filteredQuestions.length}</div>
                            <div className="stats-label">Total Questions</div>
                        </div>
                        <div>
                            <div className="stats-value">
                                {filteredQuestions.filter(q => q.previousYear).length}
                            </div>
                            <div className="stats-label">Previous Year Questions</div>
                        </div>
                        <div>
                            <div className="stats-value">{topics.length - 1}</div>
                            <div className="stats-label">Topics Covered</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
