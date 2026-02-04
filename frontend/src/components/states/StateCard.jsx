import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, HelpCircle, CheckCircle, MapPin } from 'lucide-react';

/**
 * StateCard Component
 * Displays a state or union territory card with tricolor accent
 * @param {Object} state - State/UT data object
 * @param {string} type - 'state' or 'union-territory'
 */
const StateCard = ({ state, type = 'state' }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        const path = type === 'state'
            ? `/states/${state.id}`
            : `/union-territories/${state.id}`;
        navigate(path);
    };

    return (
        <div
            className="state-card group"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`View ${state.name} preparation materials`}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            {/* State Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="state-card-title group-hover:text-[var(--navy)] transition-colors">
                        {state.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{state.code}</span>
                        <span className="text-gray-400">•</span>
                        <span className="line-clamp-1">{state.capital}</span>
                    </div>
                </div>
            </div>

            {/* Content Statistics */}
            <div className="state-card-stats">
                <div className="flex items-center gap-2 state-stat-badge">
                    <BookOpen className="w-4 h-4 text-[var(--navy)]" />
                    <span>{state.notesCount} Notes</span>
                </div>
                <div className="flex items-center gap-2 state-stat-badge">
                    <HelpCircle className="w-4 h-4 text-[var(--saffron)]" />
                    <span>{state.questionsCount} Questions</span>
                </div>
                <div className="flex items-center gap-2 state-stat-badge">
                    <CheckCircle className="w-4 h-4 text-[var(--green)]" />
                    <span>{state.solutionsCount} Solutions</span>
                </div>
            </div>

            {/* Exam Types */}
            {state.exams && state.exams.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {state.exams.slice(0, 3).map((exam, index) => (
                            <span
                                key={index}
                                className="exam-badge"
                            >
                                {exam}
                            </span>
                        ))}
                        {state.exams.length > 3 && (
                            <span className="state-stat-badge">
                                +{state.exams.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Description (Hidden on mobile, shown on hover for desktop) */}
            <p className="text-sm text-gray-600 mt-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block">
                {state.description}
            </p>

            {/* Hover Effect - View Details */}
            <div className="mt-4 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-sm font-semibold text-[var(--navy)] flex items-center gap-2">
                    View Preparation Materials
                    <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </div>
    );
};

export default StateCard;
