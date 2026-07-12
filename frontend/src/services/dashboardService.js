import api from './api';

/**
 * Get dashboard stats
 * @param {string} [token] - Optional JWT token
 * @returns {Promise}
 */
export const getDashboardStats = async (token) => {
    const config = {};
    if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
    }
    return api.get('/dashboard/stats', config);
};

/**
 * Get enrolled courses with progress
 * @param {string} [token] - Optional JWT token
 * @returns {Promise}
 */
export const getMyCourses = async (token) => {
    const config = {};
    if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
    }
    return api.get('/courses/my-courses', config);
};

/**
 * Get student profile
 * @param {string} [token] - Optional JWT token
 * @returns {Promise}
 */
export const getStudentProfile = async (token) => {
    const config = {};
    if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
    }
    return api.get('/profile', config);
};
