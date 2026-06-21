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
    if (items.length === 0) {
        return { items: [], count: 0, subtotal: 0 };
    }
    try {
        const coursesRes = await api.get('/courses/list?size=50');
        const courses = coursesRes?.data?.courses || coursesRes?.courses || (Array.isArray(coursesRes?.data) ? coursesRes.data : []);
        
        let products = [];
        if (items.some(i => i.productType === 'PRODUCT')) {
            try {
                const productsRes = await api.get('/products');
                products = productsRes?.data?.products || productsRes?.products || (Array.isArray(productsRes?.data) ? productsRes.data : []);
            } catch (err) {
                console.warn('Failed to fetch guest products:', err);
            }
        }
        
        const enrichedItems = items.map(item => {
            if (item.productType === 'COURSE') {
                const c = courses.find(course => course.id === item.productId);
                if (c) {
                    return {
                        ...item,
                        title: c.courseTitle || c.title,
                        price: c.coursePrice ?? c.price ?? 0,
                        thumbnail: c.thumbnailUrl,
                        instructor: c.instructorName,
                        category: c.courseCategory,
                    };
                }
            } else {
                const p = products.find(prod => prod.id === item.productId);
                if (p) {
                    return {
                        ...item,
                        title: p.title,
                        price: p.price ?? 0,
                        thumbnail: p.previewUrl,
                        type: p.type,
                    };
                }
            }
            return item;
        });
        
        const subtotal = enrichedItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
        return { items: enrichedItems, count: enrichedItems.length, subtotal };
    } catch (e) {
        console.error('Failed to enrich guest cart:', e);
        return { items, count: items.length, subtotal: 0 };
    }
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
