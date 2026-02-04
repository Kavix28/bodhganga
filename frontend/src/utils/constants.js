// API Base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

// Local Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
};

// OTP Configuration
export const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    RESEND_COOLDOWN_SECONDS: 60,
};

// Routes
export const ROUTES = {
    HOME: '/',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    COURSES: '/courses',
    COURSE_DETAIL: '/courses/:id',
    COURSE_PLAYER: '/courses/:courseId/player',
    PROFILE: '/profile',
    NOT_FOUND: '/404',
    ERROR: '/error',
};

// Video Player Configuration
export const VIDEO_CONFIG = {
    AUTO_COMPLETE_THRESHOLD: 0.9, // 90% watched = auto-complete
    SAVE_PROGRESS_INTERVAL: 10000, // Save progress every 10 seconds
};

// Pagination (future)
export const PAGINATION = {
    COURSES_PER_PAGE: 12,
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    GENERIC_ERROR: 'An error occurred. Please try again.',
};
