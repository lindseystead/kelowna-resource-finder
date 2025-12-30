/**
 * @fileoverview Favorites management hook
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * React hook for managing user favorites stored in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { getFavorites, toggleFavorite as toggleFav, isFavorite } from '@/lib/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const toggleFavorite = useCallback((resourceId: number) => {
    const result = toggleFav(resourceId);
    setFavorites(result.favorites);
    return result.isFavorite;
  }, []);

  const checkIsFavorite = useCallback((resourceId: number) => {
    return isFavorite(resourceId);
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite: checkIsFavorite,
  };
}
