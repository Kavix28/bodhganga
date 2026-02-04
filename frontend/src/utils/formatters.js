/**
 * Format duration in minutes to human-readable format
 * @param {number} minutes
 * @returns {string} e.g., "2h 30m" or "45m"
 */
export const formatDuration = (minutes) => {
    if (!minutes) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${mins}m`;
    }
};

/**
 * Format date to readable string
 * @param {string | Date} date
 * @returns {string} e.g., "Jan 15, 2026"
 */
export const formatDate = (date) => {
    if (!date) return '';

    const dateObj = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format date to relative time
 * @param {string | Date} date
 * @returns {string} e.g., "2 days ago"
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';

    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return formatDate(date);
};

/**
 * Format time in seconds to MM:SS
 * @param {number} seconds
 * @returns {string} e.g., "03:45"
 */
export const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format progress percentage
 * @param {number} completed
 * @param {number} total
 * @returns {number} percentage (0-100)
 */
export const formatProgress = (completed, total) => {
    if (!total || total === 0) return 0;
    return Math.round((completed / total) * 100);
};

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 * @param {string} text
 * @returns {string}
 */
export const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Format file size
 * @param {number} bytes
 * @returns {string} e.g., "2.5 MB"
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
