import api from './api';

/**
 * Register a new user
 * @param {string} emailOrPhone
 * @param {string} password
 * @returns {Promise}
 */
export const register = async (emailOrPhone, password) => {
    return api.post('/auth/register', { emailOrPhone, password });
};

/**
 * Verify OTP
 * @param {string} emailOrPhone
 * @param {string} otp
 * @returns {Promise}
 */
export const verifyOTP = async (emailOrPhone, otp) => {
    return api.post('/auth/verify-otp', { emailOrPhone, otp });
};

/**
 * Resend OTP
 * @param {string} emailOrPhone
 * @returns {Promise}
 */
export const resendOTP = async (emailOrPhone) => {
    return api.post('/auth/resend-otp', { emailOrPhone });
};

/**
 * Login user
 * @param {string} emailOrPhone
 * @param {string} password
 * @returns {Promise}
 */
export const login = async (emailOrPhone, password) => {
    return api.post('/auth/login', { emailOrPhone, password });
};

/**
 * Logout user (frontend-only, clears local storage)
 * Note: If backend provides logout endpoint, uncomment the API call
 */
export const logout = async () => {
    // Optional: Call backend logout endpoint if it exists
    // return api.post('/auth/logout');
    return Promise.resolve();
};
