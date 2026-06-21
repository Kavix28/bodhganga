import { useState, useCallback } from 'react';

/**
 * Simple localStorage-backed favorites for a given namespace.
 */
export const useFavorites = (namespace = 'items') => {
    const key = `favorites_${namespace}`;

    const load = () => {
        try { return new Set(JSON.parse(localStorage.getItem(key)) || []); }
        catch { return new Set(); }
    };

    const [favorites, setFavorites] = useState(load);

    const toggleFavorite = useCallback((id) => {
        setFavorites(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            localStorage.setItem(key, JSON.stringify([...next]));
            return next;
        });
    }, [key]);

    const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

    return { isFavorite, toggleFavorite, favorites };
};
