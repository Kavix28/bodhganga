import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb Component
 * Navigation trail for BodhGanga Academy
 * @param {Array} items - Array of breadcrumb items { label, path }
 */
const Breadcrumb = ({ items = [] }) => {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="breadcrumb">
            {/* Home Link */}
            <Link
                to="/"
                className="breadcrumb-link flex items-center gap-1 hover:text-[var(--navy)]"
                aria-label="Go to home"
            >
                <Home className="w-4 h-4" />
                <span>Home</span>
            </Link>

            {/* Breadcrumb Items */}
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={index}>
                        <ChevronRight className="breadcrumb-separator w-4 h-4" />

                        {isLast ? (
                            <span className="breadcrumb-current" aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                to={item.path}
                                className="breadcrumb-link hover:text-[var(--navy)]"
                            >
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
