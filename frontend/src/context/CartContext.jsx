import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCartCount, addToCart as svcAdd, removeFromCart as svcRemove, clearCart as svcClear, mergeGuestCart } from '../services/cartService';
import { getAuthToken } from '../utils/storage';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refreshCount = useCallback(async () => {
        try {
            const count = await getCartCount();
            setCartCount(Number(count) || 0);
        } catch {
            setCartCount(0);
        }
    }, []);

    // Load count on mount and when auth state changes
    useEffect(() => {
        refreshCount();
    }, [refreshCount]);

    // Merge guest cart when user logs in
    useEffect(() => {
        const token = getAuthToken() || sessionStorage.getItem('admin_jwt');
        if (token) {
            mergeGuestCart().then(() => refreshCount());
        }
    }, []); // Only on mount

    const addToCart = useCallback(async (itemOrId, productType = 'COURSE', productName = '') => {
        setLoading(true);
        try {
            const result = await svcAdd(itemOrId, productType);
            setCartCount(Number(result?.cartCount) || 0);
            await refreshCount(); // Ensure accurate count
            
            const name = typeof itemOrId === 'object' ? itemOrId.name : productName;
            toast.success(`${name || 'Item'} added to cart!`);
            return true;
        } catch (err) {
            if (err?.message?.includes('already own')) {
                toast.error('You already own this item.');
            } else if (err?.message?.includes('already in cart')) {
                toast('Already in your cart', { icon: '🛒' });
            } else {
                toast.error('Failed to add to cart.');
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [refreshCount]);

    const removeFromCart = useCallback(async (productId) => {
        setLoading(true);
        try {
            await svcRemove(productId);
            await refreshCount();
            toast.success('Item removed from cart');
        } catch {
            toast.error('Failed to remove item');
        } finally {
            setLoading(false);
        }
    }, [refreshCount]);

    const clearCart = useCallback(async () => {
        setLoading(true);
        try {
            await svcClear();
            setCartCount(0);
        } catch {
            toast.error('Failed to clear cart');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, addToCart, removeFromCart, clearCart, loading, refreshCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
};
