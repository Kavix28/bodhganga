import { API_BASE_URL } from '../utils/constants';

/**
 * Health Check Utility
 * Non-blocking backend availability checker
 * Runs on app startup to provide immediate feedback
 */

let backendHealthStatus = {
    isHealthy: false,
    lastChecked: null,
    errorMessage: null,
};

/**
 * Check if backend is reachable
 * @returns {Promise<{isHealthy: boolean, message: string, timestamp: Date}>}
 */
export const checkBackendHealth = async () => {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Short timeout for health check
            signal: AbortSignal.timeout(5000),
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
            const data = await response.text();
            backendHealthStatus = {
                isHealthy: true,
                lastChecked: new Date(),
                errorMessage: null,
                responseTime,
            };

            console.log(
                `✅ Backend Health Check: HEALTHY\n` +
                `   Response: ${data}\n` +
                `   Response Time: ${responseTime}ms\n` +
                `   Backend URL: ${API_BASE_URL}`
            );

            return {
                isHealthy: true,
                message: data,
                timestamp: new Date(),
                responseTime,
            };
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        let errorMessage = 'Backend unavailable';
        let errorCode = 'UNKNOWN';

        // Classify error
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            errorMessage = `Backend health check timeout (>${responseTime}ms)`;
            errorCode = 'TIMEOUT';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Backend not running or network error';
            errorCode = 'BACKEND_DOWN';
        } else {
            errorMessage = error.message;
            errorCode = 'ERROR';
        }

        backendHealthStatus = {
            isHealthy: false,
            lastChecked: new Date(),
            errorMessage,
            errorCode,
            responseTime,
        };

        console.error(
            `❌ Backend Health Check: FAILED\n` +
            `   Error: ${errorMessage}\n` +
            `   Code: ${errorCode}\n` +
            `   Response Time: ${responseTime}ms\n` +
            `   Backend URL: ${API_BASE_URL}\n` +
            `   \n` +
            `   ⚠️ Please ensure:\n` +
            `      1. Backend is running: ./mvnw spring-boot:run\n` +
            `      2. Backend port is not blocked\n` +
            `      3. MongoDB is running on port 27017`
        );

        return {
            isHealthy: false,
            message: errorMessage,
            code: errorCode,
            timestamp: new Date(),
            responseTime,
        };
    }
};

/**
 * Get current backend health status (cached)
 * @returns {object} Current health status
 */
export const getBackendHealthStatus = () => backendHealthStatus;

/**
 * Auto-run health check on module load (non-blocking)
 * This provides immediate feedback in console
 */
if (typeof window !== 'undefined') {
    // Run health check after a small delay to not block initial render
    setTimeout(() => {
        checkBackendHealth();
    }, 1000);
}

export default {
    checkBackendHealth,
    getBackendHealthStatus,
};
