import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, HelpCircle, CheckCircle, MapPin, ArrowLeft } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb';
import NotesViewer from '../components/content/NotesViewer';
import QuestionBank from '../components/content/QuestionBank';
import SolutionsViewer from '../components/content/SolutionsViewer';
import { indianStates, getStateById } from '../data/states';
import { unionTerritories, getUTById } from '../data/unionTerritories';

/**
 * StateDetail Page
 * Shows detailed information and content for a specific state or UT
 */
const StateDetail = () => {
    const { stateId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('notes');
    const [region, setRegion] = useState(null);
    const [isState, setIsState] = useState(true);

    useEffect(() => {
        // Try to find in states first
        let found = getStateById(stateId);
        if (found) {
            setRegion(found);
            setIsState(true);
        } else {
            // Try union territories
            found = getUTById(stateId);
            if (found) {
                setRegion(found);
                setIsState(false);
            } else {
                // Not found, redirect
                navigate('/states');
            }
        }
    }, [stateId, navigate]);

    if (!region) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>Loading...</h2>
                </div>
            </div>
        );
    }

    const breadcrumbItems = [
        {
            label: isState ? 'States' : 'Union Territories',
            path: isState ? '/states' : '/union-territories'
        },
        {
            label: region.name,
            path: isState ? `/states/${region.id}` : `/union-territories/${region.id}`
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 page-enter">
            {/* Tricolor Top Accent */}
            <div className="tricolor-accent h-1"></div>

            <div className="container-custom py-12">
                {/* Breadcrumb */}
                <Breadcrumb items={breadcrumbItems} />

                {/* Back Button */}
                <button
                    onClick={() => navigate(isState ? '/states' : '/union-territories')}
                    className="flex items-center gap-2 text-[var(--navy)] hover:text-[var(--saffron)] transition-colors mb-8 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to {isState ? 'States' : 'Union Territories'}
                </button>

                {/* State Header */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 md:p-12 mb-8 tricolor-accent">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-[var(--saffron)] to-[var(--saffron-dark)] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <MapPin className="w-10 h-10 text-white" />
                        </div>

                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
                                {region.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Code:</span>
                                    <span className="font-mono font-bold text-[var(--saffron)]">{region.code}</span>
                                </div>
                                <div className="w-px h-5 bg-gray-300"></div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Capital:</span>
                                    <span>{region.capital}</span>
                                </div>
                            </div>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {region.description}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t-2 border-gray-200">
                        <div className="stats-card navy">
                            <div className="flex items-center gap-4">
                                <BookOpen className="w-10 h-10 text-[var(--navy)]" />
                                <div>
                                    <div className="stats-value">{region.notesCount}</div>
                                    <div className="stats-label">Notes Available</div>
                                </div>
                            </div>
                        </div>
                        <div className="stats-card saffron">
                            <div className="flex items-center gap-4">
                                <HelpCircle className="w-10 h-10 text-[var(--saffron)]" />
                                <div>
                                    <div className="stats-value">{region.questionsCount}</div>
                                    <div className="stats-label">Practice Questions</div>
                                </div>
                            </div>
                        </div>
                        <div className="stats-card green">
                            <div className="flex items-center gap-4">
                                <CheckCircle className="w-10 h-10 text-[var(--green)]" />
                                <div>
                                    <div className="stats-value">{region.solutionsCount}</div>
                                    <div className="stats-label">Solutions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exams */}
                    {region.exams && region.exams.length > 0 && (
                        <div className="mt-8 pt-8 border-t-2 border-gray-200">
                            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--navy)' }}>
                                Exam Types Covered
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {region.exams.map((exam, index) => (
                                    <span key={index} className="exam-badge">
                                        {exam}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="tab-list">
                    <button
                        className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        <BookOpen className="w-5 h-5 inline mr-2" />
                        Notes
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        <HelpCircle className="w-5 h-5 inline mr-2" />
                        Question Bank
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'solutions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('solutions')}
                    >
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        Solutions
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8 md:p-12 min-h-[400px]">
                    {activeTab === 'notes' && (
                        <NotesViewer stateId={region.id} stateName={region.name} />
                    )}

                    {activeTab === 'questions' && (
                        <QuestionBank stateId={region.id} stateName={region.name} />
                    )}

                    {activeTab === 'solutions' && (
                        <SolutionsViewer stateId={region.id} stateName={region.name} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StateDetail;
