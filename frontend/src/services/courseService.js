import api from './api';

/**
 * Get all courses
 * @returns {Promise}
 */
export const getAllCourses = async () => {
    return api.get('/courses/list');
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
 * Get courses by category
 * @param {string} category
 * @returns {Promise}
 */
export const getCoursesByCategory = async (category) => {
    return api.get(`/courses/category/${category}`);
};

/**
 * Enroll in a course
 * @param {string} courseId
 * @returns {Promise}
 */
export const enrollCourse = async (courseId) => {
    return api.post(`/courses/enroll/${courseId}`);
};

/**
 * Get user's enrolled courses
 * @returns {Promise}
 */
export const getEnrolledCourses = async () => {
    return api.get('/courses/my-courses');
};

/**
 * Unenroll from a course (future feature)
 * @param {string} courseId
 * @returns {Promise}
 */
export const unenrollCourse = async (courseId) => {
    return api.delete(`/enrollments/${courseId}`);
};
