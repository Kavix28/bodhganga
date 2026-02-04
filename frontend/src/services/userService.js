import api from './api';

/**
 * Get user profile
 * @returns {Promise}
 */
export const getProfile = async () => {
    return api.get('/users/profile');
};

/**
 * Update user profile
 * @param {object} data - Profile data to update (name, avatar, etc.)
 * @returns {Promise}
 */
export const updateProfile = async (data) => {
    return api.put('/users/profile', data);
};

/**
 * Upload profile avatar (future feature)
 * @param {File} file
 * @returns {Promise}
 */
export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post('/users/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
