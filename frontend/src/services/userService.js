import api from './api';

/**
 * Get user profile
 * @returns {Promise}
 */
export const getProfile = async () => {
    return api.get('/profile');
};

/**
 * Get profile settings
 * @returns {Promise}
 */
export const getProfileSettings = async () => {
    return api.get('/profile/settings');
};

/**
 * Update user profile
 * @param {object} data - Profile data to update (name, city, state, country, qualification, profilePicture)
 * @returns {Promise}
 */
export const updateProfile = async (data) => {
    return api.put('/profile/settings/update', data);
};

/**
 * Get dashboard data
 * @returns {Promise}
 */
export const getDashboard = async () => {
    return api.get('/dashboard');
};

/**
 * Get dashboard stats
 * @returns {Promise}
 */
export const getDashboardStats = async () => {
    return api.get('/dashboard/stats');
};
