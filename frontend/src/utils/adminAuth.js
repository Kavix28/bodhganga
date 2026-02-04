// Frontend-only admin authentication
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'BodhGanga@2024'
};

const ADMIN_SESSION_KEY = 'admin_session';

/**
 * Authenticate admin with hardcoded credentials
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean}
 */
export const authenticateAdmin = (username, password) => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Store admin session
        const session = {
            isAuthenticated: true,
            username: username,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        return true;
    }
    return false;
};

/**
 * Check if admin is authenticated
 * @returns {boolean}
 */
export const isAdminAuthenticated = () => {
    try {
        const session = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!session) return false;

        const sessionData = JSON.parse(session);
        const now = new Date();
        const expiresAt = new Date(sessionData.expiresAt);

        // Check if session is expired
        if (now > expiresAt) {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            return false;
        }

        return sessionData.isAuthenticated === true;
    } catch (error) {
        console.error('Error checking admin authentication:', error);
        return false;
    }
};

/**
 * Get admin session data
 * @returns {object|null}
 */
export const getAdminSession = () => {
    try {
        const session = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!session) return null;

        const sessionData = JSON.parse(session);
        const now = new Date();
        const expiresAt = new Date(sessionData.expiresAt);

        if (now > expiresAt) {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            return null;
        }

        return sessionData;
    } catch (error) {
        console.error('Error getting admin session:', error);
        return null;
    }
};

/**
 * Logout admin
 */
export const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
};

/**
 * Extend admin session
 */
export const extendAdminSession = () => {
    const session = getAdminSession();
    if (session) {
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }
};