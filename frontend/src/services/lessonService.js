import api from './api';

/**
 * Mark lesson as completed
 * @param {string} courseId
 * @param {string} lessonId
 * @returns {Promise}
 */
export const markLessonComplete = async (courseId, lessonId) => {
    return api.post('/progress/complete', { courseId, lessonId });
};

/**
 * Update last accessed lesson
 * @param {string} courseId
 * @param {string} lessonId
 * @returns {Promise}
 */
export const updateLastAccessed = async (courseId, lessonId) => {
    const timestamp = new Date().toISOString();
    return api.put('/progress/last-accessed', { courseId, lessonId, timestamp });
};

/**
 * Get course progress
 * @param {string} courseId
 * @returns {Promise}
 */
export const getCourseProgress = async (courseId) => {
    return api.get(`/progress/${courseId}`);
};

/**
 * Get overall progress summary
 * @returns {Promise}
 */
export const getProgressSummary = async () => {
    return api.get('/progress/summary');
};

/**
 * Update video playback position (future feature)
 * @param {string} lessonId
 * @param {number} position - Position in seconds
 * @returns {Promise}
 */
export const updatePlaybackPosition = async (lessonId, position) => {
    return api.put('/progress/playback-position', { lessonId, position });
};
