/**
 * Cart service — manages cart state in both API (logged-in) and localStorage (guest).
 */
import api from './api';
import { getAuthToken } from '../utils/storage';

const GUEST_CART_KEY = 'bodhganga_guest_cart';

// ── Guest localStorage helpers ─────────────────────────────────────────────

export const getGuestCart = () => {
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    } catch {
        return [];
    }
};

const setGuestCart = (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

// ── API helpers ────────────────────────────────────────────────────────────

const isLoggedIn = () => !!getAuthToken() || !!sessionStorage.getItem('admin_jwt');

/**
 * Get current cart (API if logged in, localStorage if guest).
 */
export const getCart = async () => {
    if (isLoggedIn()) {
        return api.get('/cart').then(r => r?.data || { items: [], count: 0, subtotal: 0 });
    }
    // Build guest cart with basic structure
    const items = getGuestCart();
    return { items, count: items.length, subtotal: 0 };
};

/**
 * Get cart item count (badge for navbar).
 */
export const getCartCount = async () => {
    if (isLoggedIn()) {
        return api.get('/cart/count').then(r => r?.data ?? 0).catch(() => 0);
    }
    return getGuestCart().length;
};

/**
 * Add item to cart.
 * @param {string} productId
 * @param {string} productType  'COURSE' | 'PRODUCT'
 */
export const addToCart = async (productId, productType = 'COURSE') => {
    if (isLoggedIn()) {
        return api.post('/cart/add', { productId, productType }).then(r => r?.data);
    }
    // Guest mode
    const cart = getGuestCart();
    if (!cart.find(i => i.productId === productId)) {
        cart.push({ productId, productType, addedAt: new Date().toISOString() });
        setGuestCart(cart);
    }
    return { cartCount: cart.length };
};

/**
 * Remove item from cart.
 * @param {string} productId
 */
export const removeFromCart = async (productId) => {
    if (isLoggedIn()) {
        return api.delete(`/cart/remove/${productId}`).then(r => r?.data);
    }
    const cart = getGuestCart().filter(i => i.productId !== productId);
    setGuestCart(cart);
    return { cartCount: cart.length };
};

/**
 * Clear entire cart.
 */
export const clearCart = async () => {
    if (isLoggedIn()) {
        return api.delete('/cart/clear').then(r => r?.data);
    }
    setGuestCart([]);
    return { cartCount: 0 };
};

/**
 * Merge guest localStorage cart into user's DB cart after login.
 */
export const mergeGuestCart = async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;
    try {
        await api.post('/cart/merge', { items: guestItems });
        setGuestCart([]); // Clear guest cart after merge
    } catch (e) {
        console.warn('Cart merge failed:', e);
    }
};
