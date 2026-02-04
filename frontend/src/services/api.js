import axios from 'axios';
import { API_BASE_URL, ERROR_MESSAGES } from '../utils/constants';
import { getAuthToken, clearAuthData } from '../utils/storage';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds
});

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
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
                    ...data,
                });
            }

            // Return error data from server
            return Promise.reject({
                message: data?.message || ERROR_MESSAGES.SERVER_ERROR,
                ...data,
            });
        } else if (error.request) {
            // Request made but no response received (network error)
            return Promise.reject({
                message: ERROR_MESSAGES.NETWORK_ERROR,
                networkError: true,
            });
        } else {
            // Something else happened
            return Promise.reject({
                message: ERROR_MESSAGES.GENERIC_ERROR,
                error: error.message,
            });
        }
    }
);

export default api;
