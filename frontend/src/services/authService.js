import api from './api';

/**
 * Register a new user
 * @param {object} signupData - { name, email, phoneNo, password, city, state, country }
 * @returns {Promise}
 */
export const signup = async (signupData) => {
    return api.post('/auth/signup', signupData);
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
