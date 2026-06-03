// API Base URL from environment variables
const envApiUrl = import.meta.env.VITE_API_BASE_URL;

// FAIL-FAST: Detect missing or invalid API URL configuration
if (!envApiUrl) {
    console.error(
        '❌ CRITICAL: VITE_API_BASE_URL is not defined in .env file!\n' +
        'Create a .env file in the frontend directory with:\n' +
        'VITE_API_BASE_URL=http://localhost:9090/api\n' +
        'Then restart Vite (npm run dev)'
    );
    console.warn('⚠️ Using fallback URL: https://bodhganga.in/api');
}

const isDev = import.meta.env.DEV;
const devUrlFallback = isDev ? 'http://localhost:9090/api' : 'https://bodhganga.in/api';
export const API_BASE_URL = envApiUrl || devUrlFallback;


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

// Error Codes for precise classification
export const ERROR_CODES = {
    BACKEND_UNAVAILABLE: 'BACKEND_UNAVAILABLE',    // Backend not running on expected port
    CORS_ERROR: 'CORS_ERROR',                      // CORS policy blocking request
    TIMEOUT: 'TIMEOUT',                            // Request exceeded timeout limit
    UNAUTHORIZED: 'UNAUTHORIZED',                  // 401 - Auth token invalid/expired
    FORBIDDEN: 'FORBIDDEN',                        // 403 - Permission denied
    NOT_FOUND: 'NOT_FOUND',                        // 404 - Endpoint not found
    SERVER_ERROR: 'SERVER_ERROR',                  // 500 - Internal server error
    NETWORK_ERROR: 'NETWORK_ERROR',                // Actual internet disconnection
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',                // Unclassified error
};

