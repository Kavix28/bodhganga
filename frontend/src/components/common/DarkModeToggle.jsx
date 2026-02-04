import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

/**
 * DarkModeToggle Component
 * Toggle button for switching between light and dark modes
 * Shows in the navbar
 */
const DarkModeToggle = () => {
    const { darkMode, toggleDarkMode } = useDarkMode();

    return (
        <button
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
            aria-label="Toggle Dark Mode"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {darkMode ? (
                <>
                    <Sun className="w-5 h-5" />
                    <span className="hidden md:inline">Light</span>
                </>
            ) : (
                <>
                    <Moon className="w-5 h-5" />
                    <span className="hidden md:inline">Dark</span>
                </>
            )}
        </button>
    );
};

export default DarkModeToggle;
