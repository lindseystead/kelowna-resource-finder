/**
 * @fileoverview Resource and category data fetching hooks
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * React Query hooks for fetching categories and resources from the API.
 */

import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { apiUrl } from "@/lib/api";

// ============================================
// Categories Hooks
// ============================================

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.categories.list.path));
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: [api.categories.get.path, slug],
    queryFn: async () => {
      const path = buildUrl(api.categories.get.path, { slug });
      const res = await fetch(apiUrl(path));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      return api.categories.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// ============================================
// Resources Hooks
// ============================================

export function useResources(filters?: { categoryId?: number; search?: string }) {
  const queryKey = [api.resources.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build URL with query params
      const baseUrl = apiUrl(api.resources.list.path);
      const url = new URL(baseUrl, window.location.origin);
      if (filters?.categoryId) url.searchParams.append("categoryId", String(filters.categoryId));
      if (filters?.search) url.searchParams.append("search", filters.search);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch resources");
      return api.resources.list.responses[200].parse(await res.json());
    },
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: [api.resources.get.path, id],
    queryFn: async () => {
      const path = buildUrl(api.resources.get.path, { id });
      const res = await fetch(apiUrl(path));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch resource");
      return api.resources.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}
