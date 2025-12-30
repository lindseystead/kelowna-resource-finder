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
import { categories, resources, updateRequests, type Category, type Resource, type InsertCategory, type InsertResource, type UpdateRequest, type InsertUpdateRequest } from "@shared/schema";
import { eq, ilike, or, and, desc, type SQL } from "drizzle-orm";

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

    // Build up conditions based on what filters are provided
    // Drizzle handles parameterization automatically so we're safe from SQL injection
    if (options?.categoryId) {
      conditions.push(eq(resources.categoryId, options.categoryId));
    }

    if (options?.search) {
      // Case-insensitive search across name and description
      const searchLower = `%${options.search.toLowerCase()}%`;
      const searchCondition = or(
        ilike(resources.name, searchLower),
        ilike(resources.description, searchLower)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (options?.name) {
      conditions.push(ilike(resources.name, `%${options.name}%`));
    }

    // Build the query - handle 0, 1, or multiple conditions
    let results: Resource[];
    if (conditions.length === 0) {
      results = await db.select().from(resources);
    } else if (conditions.length === 1) {
      results = await db.select().from(resources).where(conditions[0]);
    } else {
      results = await db.select().from(resources).where(and(...conditions));
    }

    // Post-process search results to filter out inappropriate matches
    if (options?.search) {
      const searchLower = options.search.toLowerCase().trim();
      const searchWords = searchLower.split(/\s+/);
      
      // Keywords that indicate crisis/mental health related searches
      const crisisKeywords = [
        'suicide', 'crisis', 'mental health', 'depression', 'anxiety', 
        'self-harm', 'emergency', 'hotline', 'helpline', '988', 'crisis line',
        'mental wellness', 'psychological', 'therapy', 'counseling', 'counselling',
        'trauma', 'ptsd', 'bipolar', 'schizophrenia', 'psychiatric'
      ];
      
      // Check if search is crisis-related
      const isCrisisSearch = crisisKeywords.some(keyword => 
        searchLower.includes(keyword) || keyword.includes(searchLower)
      );
      
      // Keywords that indicate crisis resources (to exclude from non-crisis searches)
      const crisisResourceIndicators = [
        'suicide', 'crisis', '988', 'hotline', 'helpline', 'lifeline',
        'crisis intervention', 'crisis support', 'suicide prevention',
        'crisis line', 'talk suicide', '1-800-suicide'
      ];
      
      // Filter and rank results
      results = results
        .filter(resource => {
          // If search is NOT crisis-related, exclude crisis resources
          if (!isCrisisSearch) {
            const nameLower = (resource.name || '').toLowerCase();
            const descLower = (resource.description || '').toLowerCase();
            const isCrisisResource = crisisResourceIndicators.some(indicator =>
              nameLower.includes(indicator) || descLower.includes(indicator)
            );
            
            // Exclude crisis resources from non-crisis searches
            if (isCrisisResource) {
              return false;
            }
          }
          
          // Ensure the resource actually matches the search
          const nameLower = (resource.name || '').toLowerCase();
          const descLower = (resource.description || '').toLowerCase();
          
          // Must match at least one search word in name or description
          return searchWords.some(word => 
            nameLower.includes(word) || descLower.includes(word)
          );
        })
        .sort((a, b) => {
          // Prioritize name matches over description matches
          const aNameLower = (a.name || '').toLowerCase();
          const bNameLower = (b.name || '').toLowerCase();
          const aDescLower = (a.description || '').toLowerCase();
          const bDescLower = (b.description || '').toLowerCase();
          
          const aNameMatch = searchWords.some(word => aNameLower.includes(word));
          const bNameMatch = searchWords.some(word => bNameLower.includes(word));
          
          // Name matches first
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          
          // Then prioritize exact name matches
          if (aNameLower.includes(searchLower) && !bNameLower.includes(searchLower)) return -1;
          if (!aNameLower.includes(searchLower) && bNameLower.includes(searchLower)) return 1;
          
          // Then prioritize description matches
          const aDescMatch = searchWords.some(word => aDescLower.includes(word));
          const bDescMatch = searchWords.some(word => bDescLower.includes(word));
          
          if (aDescMatch && !bDescMatch) return -1;
          if (!aDescMatch && bDescMatch) return 1;
          
          // Finally, alphabetical
          return aNameLower.localeCompare(bNameLower);
        });
    }
    
    return results;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
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
