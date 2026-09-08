/**
 * Admin service — all API calls for admin dashboard data.
 * Uses the shared axios instance from api.js.
 */
import api from './api';

/**
 * Get full admin dashboard metrics from live database.
 * Returns: totalUsers, revenueLifetime, statesPublished, etc.
 */
export const getAdminMetrics = () =>
    api.get('/dashboard/admin-stats').then(r => r?.data || {});

/**
 * Get time-series revenue data for Recharts.
 * @param {string} period  'today' | '7d' | '30d' | '90d' | 'lifetime'
 */
export const getRevenueChart = (period = '30d') =>
    api.get(`/dashboard/revenue?period=${period}`).then(r => r?.data || {});

/**
 * Get content breakdown (PDFs, videos, courses).
 */
export const getContentStats = () =>
    api.get('/dashboard/content').then(r => r?.data || {});

/**
 * Get S3 storage analytics (graceful fallback if no permission).
 */
export const getStorageStats = () =>
    api.get('/dashboard/storage').then(r => r?.data || { available: false });

/**
 * Get admin order list with optional filters.
 * @param {number} page
 * @param {number} size
 * @param {string} status  'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED'
 * @param {string} search  search string
 */
export const getAdminOrders = (page = 0, size = 25, status = 'ALL', search = '') => {
    const params = new URLSearchParams({ page, size });
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);
    return api.get(`/admin/orders?${params.toString()}`).then(r => r?.data || { orders: [], total: 0 });
};

/**
 * Refund an order by orderId (Razorpay refund).
 * @param {string} orderId  Razorpay order ID (e.g. order_xxx)
 */
export const refundOrder = (orderId) =>
    api.post(`/admin/orders/${orderId}/refund`).then(r => r?.data || {});

/**
 * ── ADMIN STATE RESOURCES API METHODS ──────────────────────────────────────
 */

/**
 * Get all available states from canonical master data enriched with product counts.
 */
export const getAvailableStates = () =>
    api.get('/states/available');

/**
 * Get canonical districts for a given state enriched with product counts.
 */
export const getDistricts = (stateSlug) =>
    api.get(`/states/${stateSlug}/districts`);

/**
 * Get all active (non-archived) products for a state & district for admin management.
 */
export const getDistrictResources = (stateSlug, districtSlug) =>
    api.get(`/admin/resources/state/${stateSlug}/district/${districtSlug}`);

/**
 * Upload a state resource PDF (admin multipart upload).
 */
export const uploadAdminResource = (formData) =>
    api.post('/admin/resources/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

/**
 * Update publication status of a resource (publish = true / false).
 */
export const updateAdminResourceStatus = (id, publish) =>
    api.patch(`/admin/resources/${id}/status`, { publish });

/**
 * Soft-delete / archive a resource.
 */
export const archiveAdminResource = (id) =>
    api.delete(`/admin/resources/${id}`);
