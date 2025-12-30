/**
 * @fileoverview Frontend configuration utilities
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Fetches and caches public configuration from the API.
 * Provides type-safe access to configuration values like support email.
 */

import { queryClient } from "./queryClient";
import { apiUrl } from "./api";

interface AppConfig {
  supportEmail: string;
  baseUrl: string;
}

// Simple in-memory cache - config doesn't change often
let cachedConfig: AppConfig | null = null;

/**
 * Fetch config from API, cache it
 * Falls back to defaults if API is down
 */
export async function getAppConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(apiUrl("/api/config"));
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    const config = await response.json() as AppConfig;
    cachedConfig = config;
    return config;
  } catch (error) {
    // Graceful fallback - app still works if config endpoint is down
    return {
      supportEmail: "support@lifesavertech.ca",
      baseUrl: "https://helpkelowna.com",
    };
  }
}

/**
 * Gets the support email address.
 * Uses cached config if available, otherwise fetches from API.
 */
export async function getSupportEmail(): Promise<string> {
  const config = await getAppConfig();
  return config.supportEmail;
}

/**
 * Gets the base URL.
 * Uses cached config if available, otherwise fetches from API.
 */
export async function getBaseUrl(): Promise<string> {
  const config = await getAppConfig();
  return config.baseUrl;
}

/**
 * React hook for config - uses React Query for caching
 * Config doesn't change often, so 1 hour cache is fine
 */
export function useAppConfig() {
  return queryClient.fetchQuery({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/config"));
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      return response.json() as Promise<AppConfig>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

