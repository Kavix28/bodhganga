/**
 * Order service — user order history and purchase check.
 */
import api from './api';

/**
 * Get authenticated user's order/purchase history.
 */
export const getMyOrders = () =>
    api.get('/orders').then(r => r?.data || []);

/**
 * Check if the current user has purchased a given product.
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
export const checkPurchase = (productId) =>
    api.get(`/payment/check-purchase/${productId}`).then(r => r?.data ?? false);
