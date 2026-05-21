import { useCallback } from 'react';

/**
 * Lightweight analytics hook — logs events to console in dev,
 * ready to wire to Mixpanel/PostHog/GA4 in production.
 */
export const useAnalytics = (pageName = '') => {
    const trackEvent = useCallback((event, properties = {}) => {
        if (import.meta.env.DEV) {
            console.debug(`[Analytics] ${pageName} → ${event}`, properties);
        }
        // TODO: window.analytics?.track(event, { page: pageName, ...properties });
    }, [pageName]);

    return { trackEvent };
};
