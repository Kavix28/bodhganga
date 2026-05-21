import { createContext, useContext, useState, useEffect } from 'react';

const SpaceThemeContext = createContext();

export const useSpaceTheme = () => {
    const context = useContext(SpaceThemeContext);
    if (!context) {
        throw new Error('useSpaceTheme must be used within SpaceThemeProvider');
    }
    return context;
};

export const SpaceThemeProvider = ({ children }) => {
    const [spaceTheme, setSpaceTheme] = useState(() => {
        // Load from localStorage or default to starfield
        const saved = localStorage.getItem('space_theme');
        return saved || 'starfield';
    });

    useEffect(() => {
        // Save to localStorage whenever theme changes
        localStorage.setItem('space_theme', spaceTheme);
    }, [spaceTheme]);

    const changeTheme = (theme) => {
        setSpaceTheme(theme);
    };

    const value = {
        spaceTheme,
        changeTheme,
        themes: [
            { id: 'starfield', name: 'Starfield', icon: '✨', description: 'Calm starry background' },
            { id: 'meteor', name: 'Meteor Shower', icon: '☄️', description: 'Moving meteor streaks' },
            { id: 'planets', name: 'Planets', icon: '🪐', description: 'Floating planets' },
            { id: 'nebula', name: 'Nebula', icon: '🌌', description: 'Cosmic glow clouds' }
        ]
    };

    return (
        <SpaceThemeContext.Provider value={value}>
            {children}
        </SpaceThemeContext.Provider>
    );
};
