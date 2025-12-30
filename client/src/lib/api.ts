/**
 * @fileoverview API configuration for frontend
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Centralized API base URL configuration.
 * In production, this points to the Railway backend.
 * In development, uses relative URLs to the local server.
 */

/**
 * Get the API base URL.
 * 
 * - Development: Uses relative URLs (same origin)
 * - Production: Uses VITE_API_URL environment variable (Railway backend)
 * - Fallback: Relative URLs if env var not set
 */
export function getApiBaseUrl(): string {
  // In development or if no env var, use relative URLs
  if (import.meta.env.DEV || !import.meta.env.VITE_API_URL) {
    return "";
  }
  
  // In production with env var, use Railway backend URL
  return import.meta.env.VITE_API_URL.replace(/\/$/, ""); // Remove trailing slash
}

/**
 * Build a full API URL from a path
 * @param path - API path (e.g., "/api/resources")
 * @returns Full URL (e.g., "https://api.railway.app/api/resources" or "/api/resources")
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

