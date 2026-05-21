import toast from 'react-hot-toast';

/**
 * Centralised error handler — shows toast and logs to console.
 * @param {any} error
 * @param {string} fallbackMessage
 */
export const handleError = (error, fallbackMessage = 'Something went wrong') => {
    const message = error?.message || fallbackMessage;

    // Don't toast network errors that are already handled by the API interceptor
    if (error?.networkError) return;

    console.error('[Error]', message, error);
    toast.error(message);
};
