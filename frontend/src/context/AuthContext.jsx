import { createContext, useState, useEffect } from 'react';
import { getAuthToken, getUserData, setAuthToken, setUserData, clearAuthData } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'welcome' });

    const openAuthModal = (mode = 'welcome') => setAuthModalState({ isOpen: true, mode });
    const closeAuthModal = () => setAuthModalState({ isOpen: false, mode: 'welcome' });

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initAuth = () => {
            const savedToken = getAuthToken();
            const savedUser = getUserData();

            if (savedToken && savedUser) {
                // Self-heal: if token looks malformed (has extra quotes), clear and re-login
                if (savedToken.startsWith('"') || savedToken.endsWith('"')) {
                    clearAuthData();
                    setIsLoading(false);
                    return;
                }
                setToken(savedToken);
                setUser(savedUser);
                setIsAuthenticated(true);
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Login function - Store token and user data
    const login = (tokenData, userData) => {
        setToken(tokenData);
        setUser(userData);
        setIsAuthenticated(true);

        setAuthToken(tokenData);
        setUserData(userData);
    };

    // Logout function - Clear all auth data
    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        clearAuthData();
    };

    // Update user data
    const updateUser = (userData) => {
        setUser(userData);
        setUserData(userData);
    };

    const value = {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
        authModalState,
        openAuthModal,
        closeAuthModal,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

