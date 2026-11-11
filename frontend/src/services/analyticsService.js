import api from './api';

/**
 * Record one unique browser session visit without blocking navigation.
 */
export const trackVisitOnce = () => {
    try {
        if (typeof window === 'undefined' || !window.sessionStorage) return;
        if (sessionStorage.getItem('bg_visited')) return;
        api.post('/analytics/visit').catch(() => {});
        sessionStorage.setItem('bg_visited', 'true');
    } catch {
        // Telemetry errors must never disrupt user flows
    }
};

/**
 * Fire-and-forget view tracking across notes, PDFs, maps, podcasts, and MCQs.
 * @param {string|number|null|undefined} resourceId
 */
export const trackResourceView = (resourceId) => {
    try {
        const hasId = resourceId !== null && resourceId !== undefined && String(resourceId).trim() !== '';
        const config = hasId ? { params: { resourceId: String(resourceId).trim() } } : undefined;
        api.post('/analytics/resource-view', null, config).catch(() => {});
    } catch {
        // Telemetry errors must never disrupt user flows
    }
};

/**
 * Fetch real-time atomic analytics counters for Admin Dashboard.
 */
export const getAnalyticsStats = () =>
    api.get('/analytics/admin/stats').then(r => r?.data || {});

