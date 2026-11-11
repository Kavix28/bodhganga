import api from './api';
import { normalizePhoneNumber } from '../utils/constants';

/**
 * Login user
 * @param {string} emailOrPhone
 * @param {string} password
 * @returns {Promise}
 */
export const login = async (emailOrPhone, password) => {
    const sanitized = String(emailOrPhone || '').trim();
    const normalized = sanitized.includes('@')
        ? sanitized.toLowerCase()
        : normalizePhoneNumber(sanitized);
    return api.post('/auth/login', { emailOrPhone: normalized, password });
};

/**
 * Request password reset via Email (dispatches reset link with time-limited token)
 * @param {string} email
 * @returns {Promise}
 */
export const forgotPassword = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return api.post('/auth/forgot-password', { email: normalizedEmail });
};

/**
 * Validate password reset token
 * @param {string} token
 * @returns {Promise}
 */
export const verifyResetToken = async (token) => {
    return api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
};

/**
 * Reset password using email reset token
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise}
 */
export const resetPassword = async (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword });
};

/**
 * Verify MSG91 Access Token
 * @param {string} accessToken
 * @param {string} phoneNumber
 * @param {object|null} signupData
 * @returns {Promise}
 */
export const verifyMsg91 = async (accessToken, phoneNumber, signupData = null) => {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const body = { accessToken, phoneNumber: cleanPhone };
    if (signupData) {
        body.signupData = {
            name: String(signupData.fullName || signupData.name || '').trim(),
            email: String(signupData.email || '').trim().toLowerCase(),
            phoneNo: normalizePhoneNumber(signupData.phoneNumber || signupData.phoneNo || cleanPhone),
            password: signupData.password,
            city: String(signupData.city || '').trim(),
            state: String(signupData.state || '').trim(),
            country: String(signupData.country || 'India').trim() || 'India',
        };
    }
    return api.post('/auth/msg91/verify', body);
};

/**
 * Request password reset verification code via Mobile Number
 * @param {string} phoneNo
 * @returns {Promise}
 */
export const forgotPasswordMobileRequest = async (phoneNo) => {
    return api.post('/auth/forgot-password/mobile/request', { phoneNo: normalizePhoneNumber(phoneNo) });
};

/**
 * Verify MSG91 OTP token for Forgot Password flow
 * @param {string} accessToken
 * @returns {Promise}
 */
export const forgotPasswordMobileVerify = async (accessToken) => {
    return api.post('/auth/forgot-password/mobile/verify', { accessToken });
};

/**
 * Reset password using verified single-use resetToken (or MSG91 token) and new password
 * @param {string} resetOrAccessToken
 * @param {string} password
 * @returns {Promise}
 */
export const resetPasswordMobile = async (resetOrAccessToken, password) => {
    return api.post('/auth/reset-password/mobile', {
        resetToken: resetOrAccessToken,
        accessToken: resetOrAccessToken,
        password,
    });
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
