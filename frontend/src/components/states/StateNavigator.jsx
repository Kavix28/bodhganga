import React, { useState, useMemo } from 'react';
import StateCard from './StateCard';
import { Search } from 'lucide-react';

/**
 * StateNavigator Component
 * Grid view of all states/UTs with search and filter
 * @param {Array} items - Array of states or union territories
 * @param {string} type - 'state' or 'union-territory'
 * @param {string} title - Section title
 */
const StateNavigator = ({ items, type = 'state', title }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'states', 'uts'

    // Filter and search logic
    const filteredItems = useMemo(() => {
        let results = items;

        // Apply search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            results = results.filter(item =>
                item.name.toLowerCase().includes(search) ||
                item.code.toLowerCase().includes(search) ||
                item.capital.toLowerCase().includes(search) ||
                (item.exams && item.exams.some(exam => exam.toLowerCase().includes(search)))
            );
        }

        return results;
    }, [items, searchTerm]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className="w-full">
            {/* Title */}
            {title && (
                <div className="mb-8">
                    <h2 className="text-4xl font-bold text-[var(--navy)] mb-2 national-accent">
                        {title}
                    </h2>
                    <p className="text-lg text-gray-600">
                        Select a {type === 'state' ? 'state' : 'union territory'} to access comprehensive exam preparation materials
                    </p>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-8">
                <div className="search-bar max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="search-icon w-5 h-5" />
                        <input
                            type="text"
                            placeholder={`Search ${type === 'state' ? 'states' : 'union territories'} by name, code, or exam...`}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                            aria-label="Search states and union territories"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Clear search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    {filteredItems.length === items.length ? (
                        <>Showing all <strong className="text-[var(--navy)]">{items.length}</strong> {type === 'state' ? 'states' : 'union territories'}</>
                    ) : (
                        <>Found <strong className="text-[var(--navy)]">{filteredItems.length}</strong> of {items.length} {type === 'state' ? 'states' : 'union territories'}</>
                    )}
                </p>

                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="text-sm font-medium text-[var(--saffron)] hover:text-[var(--saffron-dark)] transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Grid of Cards */}
            {filteredItems.length > 0 ? (
                <div className="card-grid">
                    {filteredItems.map((item) => (
                        <StateCard
                            key={item.id}
                            state={item}
                            type={type}
                        />
                    ))}
                </div>
            ) : (
                // Empty State
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Search className="w-full h-full" />
                    </div>
                    <h3 className="empty-state-title">No results found</h3>
                    <p className="empty-state-description">
                        Try adjusting your search terms or clearing the filters
                    </p>
                    <button
                        onClick={clearSearch}
                        className="btn-saffron"
                    >
                        Clear Search
                    </button>
                </div>
            )}

            {/* Total Stats Footer */}
            {filteredItems.length > 0 && (
                <div className="mt-12 p-6 bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-xl border-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="stats-value">
                                {filteredItems.reduce((sum, item) => sum + item.notesCount, 0).toLocaleString()}
                            </div>
                            <div className="stats-label">Total Notes Available</div>
                        </div>
                        <div>
                            <div className="stats-value">
                                {filteredItems.reduce((sum, item) => sum + item.questionsCount, 0).toLocaleString()}
                            </div>
                            <div className="stats-label">Practice Questions</div>
                        </div>
                        <div>
                            <div className="stats-value">
                                {filteredItems.reduce((sum, item) => sum + item.solutionsCount, 0).toLocaleString()}
                            </div>
                            <div className="stats-label">Detailed Solutions</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StateNavigator;
