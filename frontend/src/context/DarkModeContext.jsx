import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * DarkModeContext
 * Provides dark mode state and toggle function throughout the app
 * Persists theme preference in localStorage
 */

const DarkModeContext = createContext();

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within DarkModeProvider');
    }
    return context;
};

export const DarkModeProvider = ({ children }) => {
    // Check localStorage for saved preference, default to light mode
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('bodhganga-theme');
        return saved === 'dark';
    });

    // Apply or remove dark class on body
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('bodhganga-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('bodhganga-theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const value = {
        darkMode,
        toggleDarkMode
    };

    return (
        <DarkModeContext.Provider value={value}>
            {children}
        </DarkModeContext.Provider>
    );
};

export default DarkModeContext;
