/**
 * Admin Authentication — JWT-backed
 *
 * Uses the backend POST /api/auth/admin/login endpoint.
 * The backend validates credentials AND ensures role === "ADMIN".
 * The returned JWT is stored in sessionStorage (not localStorage)
 * so it's cleared automatically when the browser tab closes.
 */

import api from '../services/api';

const ADMIN_TOKEN_KEY = 'admin_jwt';
const ADMIN_USER_KEY = 'admin_user';

/**
 * Authenticate admin via backend API (validates ROLE_ADMIN server-side)
 * @param {string} emailOrPhone
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const authenticateAdmin = async (emailOrPhone, password) => {
    try {
        const response = await api.post('/api/auth/admin/login', { emailOrPhone, password });
        // Response from ApiResponseDTO: { success, message, data: { token, user } }
        if (response.success && response.data?.token) {
            sessionStorage.setItem(ADMIN_TOKEN_KEY, response.data.token);
            sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data.user));
            return { success: true };
        }
        return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
        if (error.status === 403 || error.message === 'ACCESS_DENIED') {
            return { success: false, message: 'Access denied. You do not have admin privileges.' };
        }
        if (error.status === 401) {
            return { success: false, message: 'Invalid username or password.' };
        }
        return { success: false, message: error.message || 'Server error. Please try again.' };
    }
};

/**
 * Check if admin JWT is present and not expired
 * @returns {boolean}
 */
export const isAdminAuthenticated = () => {
    try {
        const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) return false;

        // Decode JWT payload (base64) to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < now) {
            clearAdminSession();
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

/**
 * Get the admin JWT token for API calls
 * @returns {string|null}
 */
export const getAdminToken = () => {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Get the admin user object
 * @returns {object|null}
 */
export const getAdminSession = () => {
    try {
        const user = sessionStorage.getItem(ADMIN_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

/**
 * Clear admin session (logout)
 */
export const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
};

// Alias for backward compatibility with AdminLayout
export const clearAdminSession = logoutAdmin;

// Alias for backward compatibility with AdminLayout
export const extendAdminSession = () => {
    // JWT expiry is managed server-side — nothing to extend on client
    // This is a no-op kept for backward compat
};