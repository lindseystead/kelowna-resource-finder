/**
 * @fileoverview Favorites management utilities
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Manages user favorites stored in browser localStorage.
 */

const FAVORITES_KEY = 'kelowna-resource-favorites';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getFavorites(): number[] {
  if (!isBrowser()) return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(resourceId: number): number[] {
  if (!isBrowser()) return [];
  const favorites = getFavorites();
  if (!favorites.includes(resourceId)) {
    favorites.push(resourceId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
  return favorites;
}

export function removeFavorite(resourceId: number): number[] {
  if (!isBrowser()) return [];
  const favorites = getFavorites().filter(id => id !== resourceId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

export function isFavorite(resourceId: number): boolean {
  return getFavorites().includes(resourceId);
}

export function toggleFavorite(resourceId: number): { isFavorite: boolean; favorites: number[] } {
  if (isFavorite(resourceId)) {
    return { isFavorite: false, favorites: removeFavorite(resourceId) };
  } else {
    return { isFavorite: true, favorites: addFavorite(resourceId) };
  }
}
