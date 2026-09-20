/**
 * Admin Authentication — JWT-backed OTP-Only
 *
 * Uses backend POST /api/admin/auth/otp/request and POST /api/admin/auth/otp/verify endpoints.
 * The backend validates admin mobile, MSG91 token AND ensures role === "ADMIN" & active status.
 * The returned JWT is stored in both localStorage and sessionStorage
 * so it persists across browser sessions while remaining available.
 */

import api from '../services/api';

const ADMIN_TOKEN_KEY = 'admin_jwt';
const ADMIN_USER_KEY = 'admin_user';

/**
 * Request Admin OTP via backend API
 * @param {string} phoneNo
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const requestAdminOtp = async (phoneNo) => {
    try {
        const response = await api.post('/admin/auth/otp/request', { phoneNo });
        if (response.success) {
            return { success: true, message: response.message || 'OTP sent successfully' };
        }
        return { success: false, message: response.message || 'Invalid or unauthorized mobile number' };
    } catch (error) {
        if (error.status === 403 || error.status === 401) {
            return { success: false, message: 'Unauthorized mobile number or access denied.' };
        }
        return { success: false, message: error.message || 'Server error. Please try again.' };
    }
};

/**
 * Verify Admin OTP via backend API (validates MSG91 token and ROLE_ADMIN server-side)
 * @param {string} phoneNo
 * @param {string} accessToken
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const verifyAdminOtp = async (phoneNo, accessToken) => {
    try {
        const response = await api.post('/admin/auth/otp/verify', { phoneNo, accessToken });
        if (response.success && response.data?.token) {
            setAdminSession(response.data.token, response.data.user);
            return { success: true };
        }
        return { success: false, message: response.message || 'Verification failed' };
    } catch (error) {
        if (error.status === 403 || error.message === 'ACCESS_DENIED') {
            return { success: false, message: 'Access denied. You do not have active admin privileges.' };
        }
        if (error.status === 401) {
            return { success: false, message: 'Invalid or expired OTP token.' };
        }
        return { success: false, message: error.message || 'Server error. Please try again.' };
    }
};

/**
 * Legacy password authenticateAdmin alias (disabled)
 */
export const authenticateAdmin = async () => {
    return { success: false, message: 'Password authentication is disabled. Please use OTP login.' };
};

/**
 * Save Admin session into localStorage and sessionStorage
 */
export const setAdminSession = (token, user) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (user) {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    }
};

/**
 * Check if admin JWT is present and not expired
 * @returns {boolean}
 */
export const isAdminAuthenticated = () => {
    try {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
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
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Get the admin user object
 * @returns {object|null}
 */
export const getAdminSession = () => {
    try {
        const user = localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

/**
 * Clear admin session (logout)
 */
export const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
};

// Alias for backward compatibility with AdminLayout
export const clearAdminSession = logoutAdmin;

export const extendAdminSession = () => {
    // JWT expiry is managed server-side — no-op
};
