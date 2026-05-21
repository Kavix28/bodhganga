import React from 'react';

/**
 * CardGrid — Strict semantic CSS wrapper binding.
 */
const CardGrid = ({ children }) => {
    return (
        <div className="card-grid">
            {children}
        </div>
    );
};

export default CardGrid;
