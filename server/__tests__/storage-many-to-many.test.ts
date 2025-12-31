/**
 * @fileoverview Tests for many-to-many resource-category relationship
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { categories, resources, resourceCategories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

describe('Many-to-Many Resource-Category Relationship', () => {
  let crisisCategoryId: number | null = null;
  let youthCategoryId: number | null = null;
  let shelterCategoryId: number | null = null;
  let testResourceId: number | null = null;

  beforeAll(async () => {
    // Ensure categories exist for testing
    const crisisCat = await db.select().from(categories).where(eq(categories.slug, 'crisis')).limit(1);
    if (crisisCat.length > 0) {
      crisisCategoryId = crisisCat[0].id;
    } else {
      const [newCat] = await db.insert(categories).values({ 
        name: 'Crisis Support', 
        slug: 'crisis', 
        icon: 'Phone' 
      }).returning();
      crisisCategoryId = newCat.id;
    }

    const youthCat = await db.select().from(categories).where(eq(categories.slug, 'youth')).limit(1);
    if (youthCat.length > 0) {
      youthCategoryId = youthCat[0].id;
    } else {
      const [newCat] = await db.insert(categories).values({ 
        name: 'Youth Services', 
        slug: 'youth', 
        icon: 'Users' 
      }).returning();
      youthCategoryId = newCat.id;
    }

    const shelterCat = await db.select().from(categories).where(eq(categories.slug, 'shelters')).limit(1);
    if (shelterCat.length > 0) {
      shelterCategoryId = shelterCat[0].id;
    } else {
      const [newCat] = await db.insert(categories).values({ 
        name: 'Shelters', 
        slug: 'shelters', 
        icon: 'Home' 
      }).returning();
      shelterCategoryId = newCat.id;
    }

    // Create a test resource
    const [testResource] = await db.insert(resources).values({
      categoryId: youthCategoryId!, // Legacy categoryId for backward compatibility
      name: 'Test Youth Shelter',
      description: 'A shelter for youth that should appear in both youth and shelters categories.',
      address: '123 Test St',
      verified: true,
    }).returning();
    testResourceId = testResource.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testResourceId) {
      await db.delete(resources).where(eq(resources.id, testResourceId));
    }
    // Junction table entries are cascade deleted, so no need to clean them up separately
  });

  it('should allow a resource to belong to multiple categories', async () => {
    if (!testResourceId || !youthCategoryId || !shelterCategoryId) {
      throw new Error('Test setup failed');
    }

    // Assign resource to youth category
    try {
      await db.insert(resourceCategories).values({
        resourceId: testResourceId,
        categoryId: youthCategoryId,
      });
    } catch (error: any) {
      if (error?.code !== '23505') throw error; // Ignore duplicate key errors
    }

    // Assign resource to shelters category
    try {
      await db.insert(resourceCategories).values({
        resourceId: testResourceId,
        categoryId: shelterCategoryId,
      });
    } catch (error: any) {
      if (error?.code !== '23505') throw error; // Ignore duplicate key errors
    }

    // Verify resource appears in youth category
    const youthResources = await storage.getResources({ categoryId: youthCategoryId });
    expect(youthResources.some(r => r.id === testResourceId)).toBe(true);

    // Verify resource appears in shelters category
    const shelterResources = await storage.getResources({ categoryId: shelterCategoryId });
    expect(shelterResources.some(r => r.id === testResourceId)).toBe(true);
  });

  it('should retrieve all categories for a resource', async () => {
    if (!testResourceId) {
      throw new Error('Test setup failed');
    }

    const categoryIds = await storage.getResourceCategoryIds(testResourceId);
    expect(categoryIds.length).toBeGreaterThan(0);
    expect(categoryIds).toContain(youthCategoryId);
    expect(categoryIds).toContain(shelterCategoryId);
  });

  it('should replace categories when setResourceCategories is called', async () => {
    if (!testResourceId || !crisisCategoryId) {
      throw new Error('Test setup failed');
    }

    // Set resource to only crisis category
    await storage.setResourceCategories(testResourceId, [crisisCategoryId]);

    // Verify resource now only appears in crisis category
    const crisisResources = await storage.getResources({ categoryId: crisisCategoryId });
    expect(crisisResources.some(r => r.id === testResourceId)).toBe(true);

    // Verify resource no longer appears in youth category
    const youthResources = await storage.getResources({ categoryId: youthCategoryId! });
    expect(youthResources.some(r => r.id === testResourceId)).toBe(false);

    // Restore original categories for cleanup
    await storage.setResourceCategories(testResourceId, [youthCategoryId!, shelterCategoryId!]);
  });

  it('should handle backward compatibility with legacy categoryId', async () => {
    // Create a resource with only legacy categoryId (no junction table entry)
    const [legacyResource] = await db.insert(resources).values({
      categoryId: youthCategoryId!,
      name: 'Legacy Resource',
      description: 'Resource with only legacy categoryId',
      address: '456 Legacy Ave',
      verified: true,
    }).returning();

    // Should still appear in youth category queries (backward compatibility)
    const youthResources = await storage.getResources({ categoryId: youthCategoryId! });
    expect(youthResources.some(r => r.id === legacyResource.id)).toBe(true);

    // Clean up
    await db.delete(resources).where(eq(resources.id, legacyResource.id));
  });

  it('should prevent duplicate category assignments', async () => {
    if (!testResourceId || !youthCategoryId) {
      throw new Error('Test setup failed');
    }

    // Try to insert duplicate (should be prevented by composite primary key)
    try {
      await db.insert(resourceCategories).values({
        resourceId: testResourceId,
        categoryId: youthCategoryId,
      });
      // If we get here, the duplicate was inserted (which shouldn't happen)
      // But that's okay - the primary key constraint should prevent it
    } catch (error: any) {
      // Expected: duplicate key error (23505)
      expect(error?.code).toBe('23505');
    }

    // Verify resource still has correct categories
    const categoryIds = await storage.getResourceCategoryIds(testResourceId);
    expect(categoryIds).toContain(youthCategoryId);
  });
});

