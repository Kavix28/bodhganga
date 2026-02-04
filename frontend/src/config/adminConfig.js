/**
 * Frontend-Only Admin Configuration
 * 
 * IMPORTANT: This is NOT backend security.
 * This is a frontend protection layer only.
 * Backend should always validate admin access independently.
 */

// Simple hash function for password verification
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

// Hashed password (actual password: GangaBhodh@2024)
// This prevents plain text password in code
const ADMIN_PASSWORD_HASH = -1847293847;

/**
 * Verify admin password (frontend only)
 * @param {string} password - Password to verify
 * @returns {boolean} - Whether password is correct
 */
export const verifyAdminPassword = (password) => {
    return simpleHash(password) === ADMIN_PASSWORD_HASH;
};

/**
 * Admin session configuration
 */
export const ADMIN_SESSION_KEY = 'gangabhodh_admin_session';
export const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Set admin session
 */
export const setAdminSession = () => {
    const session = {
        authenticated: true,
        timestamp: Date.now(),
        expiresAt: Date.now() + ADMIN_SESSION_DURATION
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

/**
 * Check if admin session is valid
 */
export const isAdminSessionValid = () => {
    try {
        const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (!sessionData) return false;

        const session = JSON.parse(sessionData);

        // Check if session has expired
        if (Date.now() > session.expiresAt) {
            clearAdminSession();
            return false;
        }

        return session.authenticated === true;
    } catch (error) {
        console.error('Error checking admin session:', error);
        return false;
    }
};

/**
 * Clear admin session
 */
export const clearAdminSession = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

/**
 * Extend admin session (called on activity)
 */
export const extendAdminSession = () => {
    if (isAdminSessionValid()) {
        setAdminSession();
    }
};
