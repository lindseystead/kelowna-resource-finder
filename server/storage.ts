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
    if (conditions.length === 0) {
      return await db.select().from(resources);
    } else if (conditions.length === 1) {
      return await db.select().from(resources).where(conditions[0]);
    } else {
      return await db.select().from(resources).where(and(...conditions));
    }
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
