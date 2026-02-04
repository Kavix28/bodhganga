import api from './api';

/**
 * Get all courses
 * @param {object} params - Optional query parameters (future: category, search, sort)
 * @returns {Promise}
 */
export const getAllCourses = async (params = {}) => {
    return api.get('/courses', { params });
};

/**
 * Get course by ID
 * @param {string} courseId
 * @returns {Promise}
 */
export const getCourseById = async (courseId) => {
    return api.get(`/courses/${courseId}`);
};

/**
 * Enroll in a course
 * @param {string} courseId
 * @returns {Promise}
 */
export const enrollCourse = async (courseId) => {
    return api.post('/enrollments', { courseId });
};

/**
 * Get user's enrolled courses
 * @returns {Promise}
 */
export const getEnrolledCourses = async () => {
    return api.get('/enrollments/my-courses');
};

/**
 * Unenroll from a course (future feature)
 * @param {string} courseId
 * @returns {Promise}
 */
export const unenrollCourse = async (courseId) => {
    return api.delete(`/enrollments/${courseId}`);
};
