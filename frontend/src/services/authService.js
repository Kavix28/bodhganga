import api from './api';



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
 * Verify MSG91 Access Token
 * @param {string} accessToken
 * @param {string} phoneNumber
 * @returns {Promise}
 */
export const verifyMsg91 = async (accessToken, phoneNumber) => {
    return api.post('/auth/msg91/verify', { accessToken, phoneNumber });
};

/**
 * Request password reset verification code via Mobile Number
 * @param {string} phoneNo
 * @returns {Promise}
 */
export const forgotPasswordMobileRequest = async (phoneNo) => {
    return api.post('/auth/forgot-password/mobile/request', { phoneNo });
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
 * Reset password using verified MSG91 token and new password
 * @param {string} accessToken
 * @param {string} password
 * @returns {Promise}
 */
export const resetPasswordMobile = async (accessToken, password) => {
    return api.post('/auth/reset-password/mobile', { accessToken, password });
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
