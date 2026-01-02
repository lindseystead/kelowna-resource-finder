/**
 * @fileoverview Database storage layer for resources and categories
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides data access methods for categories, resources, and update requests.
 * Implements the storage interface for database operations.
 * 
 * Query Safety: All queries use Drizzle ORM which automatically parameterizes
 * user input, preventing SQL injection. No raw SQL queries with user-provided data.
 */

import { db } from "./db";
import { categories, resources, resourceCategories, updateRequests, type Category, type Resource, type InsertCategory, type InsertResource, type UpdateRequest, type InsertUpdateRequest, type InsertResourceCategory } from "@shared/schema";
import { eq, ilike, or, and, desc, inArray, type SQL } from "drizzle-orm";
import { logger } from "./utils/logger";
import { env } from "./config";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Resources
  getResources(options?: { categoryId?: number; search?: string; name?: string }): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, updates: Partial<InsertResource>): Promise<Resource | undefined>;

  // Update Requests
  getUpdateRequests(): Promise<UpdateRequest[]>;
  createUpdateRequest(request: InsertUpdateRequest): Promise<UpdateRequest>;
  updateUpdateRequestStatus(id: number, status: string, adminNotes?: string): Promise<UpdateRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Simple category queries
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async getResources(options?: { categoryId?: number; search?: string; name?: string }): Promise<Resource[]> {
    const conditions: SQL[] = [];

    // Category filtering uses junction table for many-to-many
    if (options?.categoryId) {
      const resourceIdsInCategory = await db
        .select({ resourceId: resourceCategories.resourceId })
        .from(resourceCategories)
        .where(eq(resourceCategories.categoryId, options.categoryId));
      
      const ids = resourceIdsInCategory.map(r => r.resourceId);
      
      // Fallback for legacy categoryId during migration
      const legacyResources = await db
        .select({ id: resources.id })
        .from(resources)
        .where(eq(resources.categoryId, options.categoryId));
      
      const legacyIds = legacyResources.map(r => r.id);
      const allIds = Array.from(new Set([...ids, ...legacyIds])); // Combine and deduplicate
      
      if (allIds.length > 0) {
        conditions.push(inArray(resources.id, allIds));
      } else {
        return [];
      }
    }

    if (options?.name) {
      conditions.push(ilike(resources.name, `%${options.name}%`));
    }

    // For search, we'll get all resources and then score/rank them intelligently
    let results: Resource[];
    if (conditions.length === 0) {
      results = await db.select().from(resources);
    } else if (conditions.length === 1) {
      results = await db.select().from(resources).where(conditions[0]);
    } else {
      results = await db.select().from(resources).where(and(...conditions));
    }

    // Google-like intelligent search with relevance scoring
    if (options?.search) {
      // Normalize and clean search query
      const rawQuery = options.search.trim();
      if (!rawQuery || rawQuery.length === 0) {
        return results; // Return all if empty query
      }

      // Remove special characters but keep spaces and basic punctuation
      const cleanedQuery = rawQuery.replace(/[^\w\s-]/g, ' ').trim();
      if (cleanedQuery.length === 0) {
        return []; // No valid search terms
      }

      const searchLower = cleanedQuery.toLowerCase();
      const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
      
      // If no valid words after cleaning, return empty
      if (searchWords.length === 0) {
        return [];
      }

      // Dev-only logging to diagnose search issues
      if (env.NODE_ENV === "development") {
        logger.debug("Search query processed", {
          rawQuery,
          cleanedQuery,
          searchLower,
          searchWords,
          totalResources: results.length,
        });
      }

      // Get the crisis category ID to exclude crisis resources from non-crisis searches
      const crisisCategory = await db.select().from(categories).where(eq(categories.slug, 'crisis')).limit(1);
      const crisisCategoryId = crisisCategory.length > 0 ? crisisCategory[0].id : null;
      
      // Get all resource IDs that belong to crisis category (via junction table)
      let crisisResourceIds: number[] = [];
      if (crisisCategoryId !== null) {
        const crisisResources = await db
          .select({ resourceId: resourceCategories.resourceId })
          .from(resourceCategories)
          .where(eq(resourceCategories.categoryId, crisisCategoryId));
        crisisResourceIds = crisisResources.map(r => r.resourceId);
        
        // Also include legacy categoryId resources for backward compatibility
        const legacyCrisisResources = await db
          .select({ id: resources.id })
          .from(resources)
          .where(eq(resources.categoryId, crisisCategoryId));
        const legacyIds = legacyCrisisResources.map(r => r.id);
        crisisResourceIds = Array.from(new Set([...crisisResourceIds, ...legacyIds]));
      }
      
      // Keywords that indicate crisis/mental health related searches
      const crisisSearchKeywords = [
        'suicide', 'crisis', 'mental health crisis', 'depression help', 'anxiety crisis',
        'self-harm', 'suicidal', 'crisis hotline', 'crisis helpline', '988',
        'crisis line', 'suicide prevention', 'mental health emergency',
        'psychological crisis', 'trauma crisis', 'ptsd crisis', 'mental health'
      ];
      
      // Check if search is explicitly crisis-related
      const isCrisisSearch = crisisSearchKeywords.some(keyword => 
        searchLower.includes(keyword)
      );
      
      // Keywords that indicate the search is about shelters/housing (NOT crisis)
      const shelterHousingKeywords = [
        'shelter', 'housing', 'accommodation', 'place to stay', 'emergency housing',
        'temporary housing', 'homeless', 'homelessness', 'pet', 'dog', 'cat',
        'animal', 'domestic violence shelter', 'women\'s shelter', 'men\'s shelter',
        'family shelter', 'youth shelter', 'transitional housing', 'emergency shelter'
      ];
      
      // Check if search is about shelters/housing
      const isShelterSearch = shelterHousingKeywords.some(keyword => 
        searchLower.includes(keyword)
      );

      // Calculate relevance score for each resource (Google-like algorithm)
      const scoredResults = results.map(resource => {
        const nameLower = (resource.name || '').toLowerCase();
        const descLower = (resource.description || '').toLowerCase();
        const addressLower = (resource.address || '').toLowerCase();
        const fullText = `${nameLower} ${descLower} ${addressLower}`;
        
        let score = 0;

        // Exclude crisis resources from non-crisis searches
        // Check both junction table and legacy categoryId for backward compatibility
        const isCrisisResource = crisisResourceIds.includes(resource.id) || 
                                  (crisisCategoryId !== null && resource.categoryId === crisisCategoryId);
        
        if (!isCrisisSearch && isCrisisResource) {
          // If it's a shelter search, definitely exclude crisis
          if (isShelterSearch) {
            return { resource, score: -1000 }; // Heavily penalize
          }
          // For general searches, exclude crisis
          return { resource, score: -1000 };
        }

        // Exact phrase match in name (highest priority)
        if (nameLower.includes(searchLower)) {
          score += 1000;
        }

        // Exact phrase match in description
        if (descLower.includes(searchLower)) {
          score += 500;
        }

        // Count how many search words match in name
        const nameWordMatches = searchWords.filter(word => nameLower.includes(word)).length;
        score += nameWordMatches * 200; // Each word match in name = 200 points

        // Count how many search words match in description
        const descWordMatches = searchWords.filter(word => descLower.includes(word)).length;
        score += descWordMatches * 100; // Each word match in description = 100 points

        // Bonus for matching all words (AND logic)
        if (nameWordMatches === searchWords.length) {
          score += 300; // All words in name
        }
        if (descWordMatches === searchWords.length) {
          score += 150; // All words in description
        }

        // Bonus for word appearing at start of name
        searchWords.forEach(word => {
          if (nameLower.startsWith(word)) {
            score += 150;
          }
        });

        // Partial word matches (fuzzy matching for typos)
        searchWords.forEach(word => {
          if (word.length >= 3) {
            // Check if any word in name/description starts with search word (prefix match)
            const nameWords = nameLower.split(/\s+/);
            const descWords = descLower.split(/\s+/);
            if (nameWords.some(nw => nw.startsWith(word))) {
              score += 50;
            }
            if (descWords.some(dw => dw.startsWith(word))) {
              score += 25;
            }
          }
        });

        // Only penalize if no words match at all
        // Note: nameWordMatches and descWordMatches already check for word inclusion,
        // so if they're both 0, there's truly no match
        if (nameWordMatches === 0 && descWordMatches === 0) {
          score = -1000; // Heavily penalize no matches (will be filtered out)
        }

        // Bonus for verified resources
        if (resource.verified) {
          score += 10;
        }

        return { resource, score };
      })
      .filter(item => {
        // Only filter out crisis resources (score -1000) and results with no matches
        // Keep all other results, even with low scores, to ensure partial matches show up
        // Changed from `item.score > 0` to `item.score > -500` to be less aggressive
        return item.score > -500;
      })
      .sort((a, b) => {
        // Sort by score (highest first)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If scores are equal, sort alphabetically by name
        return a.resource.name.localeCompare(b.resource.name);
      })
      .map(item => item.resource);

      // Dev-only logging to diagnose search results
      if (env.NODE_ENV === "development") {
        logger.debug("Search results", {
          query: searchLower,
          totalResults: results.length,
          scoredResults: scoredResults.length,
          sampleResults: scoredResults.slice(0, 3).map(r => ({ id: r.id, name: r.name })),
        });
      }

      return scoredResults;
    }
    
    return results;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(insertResource: InsertResource, categoryIds?: number[]): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    
    // If categoryIds provided, create junction table entries for many-to-many relationship
    if (categoryIds && categoryIds.length > 0) {
      const junctionEntries = categoryIds.map(catId => ({
        resourceId: resource.id,
        categoryId: catId,
      }));
      // Insert with conflict handling - composite primary key prevents duplicates
      try {
        await db.insert(resourceCategories).values(junctionEntries);
      } catch (error: unknown) {
        // Ignore duplicate key errors (composite primary key violation)
        // PostgreSQL error code 23505 = unique_violation
        const pgError = error as { code?: string };
        if (!pgError.code || pgError.code !== '23505') {
          throw error;
        }
      }
    } else if (insertResource.categoryId) {
      // Fallback: If no categoryIds but categoryId exists, create junction entry for backward compatibility
      try {
        await db.insert(resourceCategories).values({
          resourceId: resource.id,
          categoryId: insertResource.categoryId,
        });
      } catch (error: unknown) {
        // Ignore duplicate key errors (PostgreSQL error code 23505 = unique_violation)
        const pgError = error as { code?: string };
        if (!pgError.code || pgError.code !== '23505') {
          throw error;
        }
      }
    }
    
    return resource;
  }
  
  /**
   * Get all category IDs for a resource (via junction table)
   */
  async getResourceCategoryIds(resourceId: number): Promise<number[]> {
    const entries = await db
      .select({ categoryId: resourceCategories.categoryId })
      .from(resourceCategories)
      .where(eq(resourceCategories.resourceId, resourceId));
    return entries.map(e => e.categoryId);
  }
  
  /**
   * Set categories for a resource (replaces existing categories)
   */
  async setResourceCategories(resourceId: number, categoryIds: number[]): Promise<void> {
    // Delete existing categories
    await db.delete(resourceCategories).where(eq(resourceCategories.resourceId, resourceId));
    
    // Insert new categories
    if (categoryIds.length > 0) {
      const entries = categoryIds.map(catId => ({
        resourceId,
        categoryId: catId,
      }));
      try {
        await db.insert(resourceCategories).values(entries);
      } catch (error: unknown) {
        // Ignore duplicate key errors (shouldn't happen after delete, but safe to handle)
        // PostgreSQL error code 23505 = unique_violation
        const pgError = error as { code?: string };
        if (!pgError.code || pgError.code !== '23505') {
          throw error;
        }
      }
    }
  }

  async updateResource(id: number, updates: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updated] = await db
      .update(resources)
      .set(updates)
      .where(eq(resources.id, id))
      .returning();
    return updated;
  }

  // Update Requests
  async getUpdateRequests(): Promise<UpdateRequest[]> {
    return await db.select().from(updateRequests).orderBy(desc(updateRequests.createdAt));
  }

  async createUpdateRequest(request: InsertUpdateRequest): Promise<UpdateRequest> {
    const [updateRequest] = await db.insert(updateRequests).values(request).returning();
    return updateRequest;
  }

  async updateUpdateRequestStatus(id: number, status: string, adminNotes?: string): Promise<UpdateRequest | undefined> {
    const [updated] = await db
      .update(updateRequests)
      .set({ status, adminNotes, reviewedAt: new Date() })
      .where(eq(updateRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
