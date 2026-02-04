import React, { useState } from 'react';
import { CheckCircle, BookOpen, Lightbulb, Target } from 'lucide-react';

/**
 * SolutionsViewer Component
 * Displays detailed solutions for practice questions
 * Frontend-only - expects backend to provide solutions data
 */
const SolutionsViewer = ({ stateId, stateName }) => {
    const [selectedTopic, setSelectedTopic] = useState('all');

    // Mock data structure - Replace with actual API call
    const solutions = [
        {
            id: 1,
            questionNumber: 1,
            topic: 'Indian Constitution',
            question: 'Which Article of the Indian Constitution deals with the Right to Education?',
            correctAnswer: 'Article 21A',
            steps: [
                {
                    title: 'Understanding the Question',
                    content: 'The question asks about the specific Article that provides the Right to Education as a Fundamental Right in the Indian Constitution.'
                },
                {
                    title: 'Key Information',
                    content: 'The Right to Education was added to the Constitution through the 86th Constitutional Amendment Act in 2002. This made education a Fundamental Right for children aged 6-14 years.'
                },
                {
                    title: 'Correct Answer: Article 21A',
                    content: 'Article 21A states: "The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine."'
                },
                {
                    title: 'Additional Context',
                    content: 'This right was further elaborated through the Right of Children to Free and Compulsory Education Act, 2009 (RTE Act), which came into effect on April 1, 2010.'
                }
            ],
            relatedConcepts: ['Fundamental Rights', '86th Amendment', 'RTE Act 2009', 'Article 21'],
            examTips: 'Remember: Article 21A (added in 2002) is different from Article 21 (Right to Life). Many exam questions try to confuse these two.',
            difficulty: 'medium'
        },
        {
            id: 2,
            questionNumber: 2,
            topic: 'Indian History',
            question: 'Who was the first President of India?',
            correctAnswer: 'Dr. Rajendra Prasad',
            steps: [
                {
                    title: 'Background',
                    content: 'When India became a Republic on January 26, 1950, it needed its first President as the Head of State.'
                },
                {
                    title: 'The Answer',
                    content: 'Dr. Rajendra Prasad was elected as the first President of India by the Constituent Assembly on January 24, 1950, and took office on January 26, 1950.'
                },
                {
                    title: 'His Tenure',
                    content: 'Dr. Rajendra Prasad served two full terms as President (1950-1962), making him the only President to date to serve for two full terms (12years in total).'
                },
                {
                    title: 'Why This Matters',
                    content: 'As President of the Constituent Assembly and later as India\'s first President, Dr. Rajendra Prasad played a crucial role in shaping Indian democracy.'
                }
            ],
            relatedConcepts: ['Constituent Assembly', 'Republic Day', 'Presidential Elections', 'First President'],
            examTips: 'Don\'t confuse the First President (Dr. Rajendra Prasad) with the First Prime Minister (Jawaharlal Nehru). Both started their terms on the same day but held different offices.',
            difficulty: 'easy'
        },
        {
            id: 3,
            questionNumber: 3,
            topic: 'Geography',
            question: 'Which of the following rivers does NOT originate in India?',
            correctAnswer: 'Brahmaputra',
            steps: [
                {
                    title: 'Analyzing Each Option',
                    content: 'Let\'s examine where each river mentioned in the question originates.'
                },
                {
                    title: 'Yamuna River',
                    content: 'The Yamuna originates from the Yamunotri Glacier in the Uttarkashi district of Uttarakhand, India. This is within Indian territory.'
                },
                {
                    title: 'Brahmaputra River (Correct Answer)',
                    content: 'The Brahmaputra originates from the Angsi Glacier in the Chemayungdung range of the Himalayas in Tibet (China). It enters India through Arunachal Pradesh. Therefore, it does NOT originate in India.'
                },
                {
                    title: 'Godavari and Krishna Rivers',
                    content: 'Both the Godavari (originates in Maharashtra) and Krishna (originates in Maharashtra) rivers originate within India. Godavari is called the "Dakshin Ganga" or Ganges of the South.'
                }
            ],
            relatedConcepts: ['Trans-Himalayan Rivers', 'Brahmaputra Basin', 'Peninsular Rivers', 'River Origins'],
            examTips: 'Trans-Himalayan rivers (Indus, Sutlej, Brahmaputra) all originate outside India, typically in Tibet. This is a frequent exam topic.',
            difficulty: 'hard'
        }
    ];

    const topics = ['all', ...new Set(solutions.map(s => s.topic))];

    const filteredSolutions = selectedTopic === 'all'
        ? solutions
        : solutions.filter(s => s.topic === selectedTopic);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'hard': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
                        Detailed Solutions
                    </h2>
                    <p className="text-gray-600">
                        Step-by-step explanations for {stateName} exam questions
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 text-[var(--green)]" />
                    <span>{filteredSolutions.length} Solutions Available</span>
                </div>
            </div>

            {/* Topic Filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <Target className="w-5 h-5 text-gray-600" />
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

            {/* Solutions List */}
            <div className="space-y-8">
                {filteredSolutions.map((solution) => (
                    <div key={solution.id} className="solution-viewer">
                        {/* Solution Header */}
                        <div className="solution-header">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="solution-badge">
                                    Question #{solution.questionNumber}
                                </div>
                                <span className="topic-tag active">
                                    {solution.topic}
                                </span>
                                <span className={`badge ${getDifficultyColor(solution.difficulty)} border-2`}>
                                    {solution.difficulty}
                                </span>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="p-6 bg-gray-50 border-l-4 border-[var(--navy)] mb-6">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Question:</p>
                            <p className="text-lg font-medium text-gray-900">{solution.question}</p>
                            <div className="mt-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-[var(--green)]" />
                                <span className="font-bold text-[var(--green)]">Correct Answer:</span>
                                <span className="font-semibold">{solution.correctAnswer}</span>
                            </div>
                        </div>

                        {/* Step-by-Step Solution */}
                        <div className="solution-content">
                            <h4 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--navy)' }}>
                                <BookOpen className="w-6 h-6" />
                                Step-by-Step Solution
                            </h4>

                            <div className="space-y-6">
                                {solution.steps.map((step, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] text-white rounded-full font-bold shadow-md">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
                                                {step.title}
                                            </h5>
                                            <p className="text-gray-700 leading-relaxed">
                                                {step.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Related Concepts */}
                        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <h5 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Related Concepts to Study
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {solution.relatedConcepts.map((concept, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm font-medium"
                                    >
                                        {concept}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Exam Tips */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
                            <h5 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                Exam Tip
                            </h5>
                            <p className="text-gray-800 italic">
                                {solution.examTips}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredSolutions.length === 0 && (
                <div className="empty-state">
                    <CheckCircle className="empty-state-icon" />
                    <h3 className="empty-state-title">No Solutions Available</h3>
                    <p className="empty-state-description">
                        Solutions for this topic are being prepared. Try selecting a different topic.
                    </p>
                    <button
                        onClick={() => setSelectedTopic('all')}
                        className="btn-saffron"
                    >
                        View All Solutions
                    </button>
                </div>
            )}
        </div>
    );
};

export default SolutionsViewer;
