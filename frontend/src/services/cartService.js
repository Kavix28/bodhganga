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
        let bundles = [];
        try {
            bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
        } catch (e) {}
        const backendCart = await api.get('/cart').then(r => r?.data || { items: [], count: 0, subtotal: 0 }).catch(() => ({ items: [], count: 0, subtotal: 0 }));
        const allItems = [...(backendCart.items || []), ...bundles.map(b => ({ ...b, title: b.name || b.district }))];        const subtotal = allItems.reduce((sum, i) => sum + (i.price || 0), 0);
        return { items: allItems, count: allItems.length, subtotal };
    }
    // Build guest cart with basic structure
    const items = getGuestCart();
    let bundles = [];
    try {
        bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    } catch (e) {}

    if (items.length === 0 && bundles.length === 0) {
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
        
        const allItems = [...enrichedItems, ...bundles];
        const subtotal = allItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
        return { items: allItems, count: allItems.length, subtotal };
    } catch (e) {
        console.error('Failed to enrich guest cart:', e);
        const allItems = [...items, ...bundles];
        return { items: allItems, count: allItems.length, subtotal: bundles.reduce((sum, item) => sum + (item.price || 0), 0) };
    }
};

/**
 * Get cart item count (badge for navbar).
 */
export const getCartCount = async () => {
    if (isLoggedIn()) {
        return api.get('/cart/count').then(r => r?.data ?? 0).catch(() => 0);
    }
    let bundles = [];
    try {
        bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    } catch (e) {}
    return getGuestCart().length + bundles.length;
};

/**
 * Add item to cart.
 * @param {string} productId
 * @param {string} productType  'COURSE' | 'PRODUCT'
 */
export const addToCart = async (productIdOrItem, productType = 'COURSE') => {
    let itemObj = null;
    let productId = null;
    let type = productType;

    if (typeof productIdOrItem === 'object' && productIdOrItem !== null) {
        itemObj = productIdOrItem;
        productId = itemObj.productId;
        type = itemObj.type || productType;
    } else {
        productId = productIdOrItem;
    }

    if (isLoggedIn() && type !== 'BUNDLE') {
        const payload = itemObj ? itemObj : { productId, productType: type };
        return api.post('/cart/add', payload).then(r => r?.data);
    }
    
    // Guest mode
    if (type === 'BUNDLE') {
        let bundles = [];
        try {
            bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
        } catch(e) {}
        if (!bundles.find(i => i.productId === productId)) {
            bundles.push({ ...itemObj, addedAt: new Date().toISOString() });
            localStorage.setItem('bundleCart', JSON.stringify(bundles));
        }
        const cart = getGuestCart();
        return { cartCount: cart.length + bundles.length };
    }

    const cart = getGuestCart();
    if (!cart.find(i => i.productId === productId)) {
        cart.push({ productId, productType: type, addedAt: new Date().toISOString() });
        setGuestCart(cart);
    }
    let bundles = [];
    try {
        bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    } catch(e) {}
    return { cartCount: cart.length + bundles.length };
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
    
    let bundles = [];
    try {
        bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    } catch(e) {}
    const newBundles = bundles.filter(i => i.productId !== productId);
    if (newBundles.length !== bundles.length) {
        localStorage.setItem('bundleCart', JSON.stringify(newBundles));
    }
    
    return { cartCount: cart.length + newBundles.length };
};

/**
 * Clear entire cart.
 */
export const clearCart = async () => {
    if (isLoggedIn()) {
        return api.delete('/cart/clear').then(r => r?.data);
    }
    setGuestCart([]);
    localStorage.removeItem('bundleCart');
    return { cartCount: 0 };
};

/**
 * Merge guest localStorage cart into user's DB cart after login.
 */
export const mergeGuestCart = async () => {
    const guestItems = getGuestCart();
    let bundles = [];
    try {
        bundles = JSON.parse(localStorage.getItem('bundleCart') || '[]');
    } catch(e) {}

    const allItems = [...guestItems, ...bundles];
    if (allItems.length === 0) return;
    try {
        await api.post('/cart/merge', { items: allItems });
        setGuestCart([]); // Clear guest cart after merge
        localStorage.removeItem('bundleCart');
    } catch (e) {
        console.warn('Cart merge failed:', e);
    }
};
