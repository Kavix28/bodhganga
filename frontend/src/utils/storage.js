import { STORAGE_KEYS } from './constants';

/**
 * Get item from localStorage
 * @param {string} key
 * @returns {any}
 */
export const getItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return null;
    }
};

/**
 * Set item in localStorage
 * @param {string} key
 * @param {any} value
 */
export const setItem = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
    }
};

/**
 * Remove item from localStorage
 * @param {string} key
 */
export const removeItem = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
    }
};

/**
 * Clear all localStorage
 */
export const clearStorage = () => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};

/**
 * Get auth token from localStorage
 * @returns {string | null}
 */
export const getAuthToken = () => {
    try {
        let raw = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!raw) {
            const legacyToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (legacyToken) {
                const cleanedLegacy = typeof legacyToken === 'string' ? legacyToken.replace(/^"|"$/g, '').trim() : legacyToken;
                if (cleanedLegacy) {
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, cleanedLegacy);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    return cleanedLegacy;
                }
            }
            return null;
        }
        let token = raw;
        if (token.startsWith('"') && token.endsWith('"')) {
            try {
                token = JSON.parse(raw);
            } catch {
                token = raw.replace(/^"|"$/g, '');
            }
        }
        token = typeof token === 'string' ? token.replace(/^"|"$/g, '').trim() : token;
        return token || null;
    } catch {
        return null;
    }
};

/**
 * Set auth token in localStorage
 * @param {string} token
 */
export const setAuthToken = (token) => {
    try {
        if (!token) {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            return;
        }
        const cleaned = typeof token === 'string' ? token.replace(/^"|"$/g, '').trim() : token;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, cleaned);
    } catch (error) {
        console.error('Error saving auth token:', error);
    }
};

/**
 * Remove auth token from localStorage
 */
export const removeAuthToken = () => {
    removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get user data from localStorage
 * @returns {object | null}
 */
export const getUserData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return JSON.parse(parsed);
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Set user data in localStorage
 * @param {object} userData
 */
export const setUserData = (userData) => {
    setItem(STORAGE_KEYS.USER_DATA, userData);
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = () => {
    removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * Clear all auth data (token and user data)
 */
export const clearAuthData = () => {
    removeAuthToken();
    removeUserData();
    try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
    } catch (_) {}
};



