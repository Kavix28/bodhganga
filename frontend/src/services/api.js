import axios from 'axios';
import { API_BASE_URL, ERROR_MESSAGES, ERROR_CODES } from '../utils/constants';
import { getAuthToken, clearAuthData } from '../utils/storage';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds
});

// Log the API base URL for debugging
console.log('🌐 API Base URL:', API_BASE_URL);

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
    (config) => {
        // Fallback: Check standard auth token first, then admin token
        const token = getAuthToken() || sessionStorage.getItem('admin_jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => {
        // Return only the data from successful responses
        return response.data;
    },
    (error) => {
        // Handle different error cases
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            // Handle 401 Unauthorized - Token expired or invalid
            if (status === 401) {
                clearAuthData();
                window.location.href = '/login';
                return Promise.reject({
                    message: ERROR_MESSAGES.SESSION_EXPIRED,
                    code: ERROR_CODES.UNAUTHORIZED,
                    status: 401,
                    ...data,
                });
            }

            // Handle 403 Forbidden - Access denied
            if (status === 403) {
                return Promise.reject({
                    message: 'Access denied. You do not have permission to access this resource.',
                    code: ERROR_CODES.FORBIDDEN,
                    status: 403,
                    ...data,
                });
            }

            // Return error data from server
            return Promise.reject({
                message: data?.message || ERROR_MESSAGES.SERVER_ERROR,
                status,
                ...data,
            });
        } else if (error.request) {
            // Request made but no response received
            
            // Check if it's a timeout error
            if (error.code === 'ECONNABORTED') {
                return Promise.reject({
                    message: 'Request timeout. The server took too long to respond.',
                    code: ERROR_CODES.TIMEOUT,
                    networkError: true,
                });
            }

            // Check if it's a network/connection error (backend down, wrong port, CORS)
            if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
                return Promise.reject({
                    message: 'Unable to connect to server. Please ensure the backend is running on http://localhost:9090',
                    code: ERROR_CODES.BACKEND_UNAVAILABLE,
                    networkError: true,
                });
            }

            // CORS error detection (blocked by browser)
            if (error.message.includes('CORS') || !error.status) {
                return Promise.reject({
                    message: 'Connection blocked. This may be a CORS configuration issue.',
                    code: ERROR_CODES.CORS_ERROR,
                    networkError: true,
                });
            }

            // Generic network error fallback
            return Promise.reject({
                message: ERROR_MESSAGES.NETWORK_ERROR,
                code: ERROR_CODES.NETWORK_ERROR,
                networkError: true,
            });
        } else {
            // Something else happened (request setup error)
            return Promise.reject({
                message: ERROR_MESSAGES.GENERIC_ERROR,
                error: error.message,
                code: ERROR_CODES.UNKNOWN_ERROR,
            });
        }
    }
);

export default api;
