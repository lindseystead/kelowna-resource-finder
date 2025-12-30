/**
 * @fileoverview Tests for API routes
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { storage } from '../storage';

describe('API Routes', () => {
  describe('GET /api/resources', () => {
    it('should return resources from storage', async () => {
      const resources = await storage.getResources();
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
    });

    it('should return resources with required fields', async () => {
      const resources = await storage.getResources();
      if (resources.length > 0) {
        const resource = resources[0];
        expect(resource).toHaveProperty('id');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('categoryId');
      }
    });
  });

  describe('GET /api/categories', () => {
    it('should return categories from storage', async () => {
      const categories = await storage.getCategories();
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return categories with required fields', async () => {
      const categories = await storage.getCategories();
      if (categories.length > 0) {
        const category = categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });
  });

  describe('POST /api/update-requests', () => {
    it('should create update request with valid data', async () => {
      const request = await storage.createUpdateRequest({
        resourceName: 'Test Resource',
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        requestType: 'new',
        details: 'Test details for new resource',
        submitterType: 'citizen',
      });

      expect(request).toBeDefined();
      expect(request.id).toBeGreaterThan(0);
      expect(request.status).toBe('pending');
      expect(request.resourceName).toBe('Test Resource');
    });

    it('should handle missing optional fields', async () => {
      const request = await storage.createUpdateRequest({
        resourceName: 'Test Resource 2',
        contactName: 'Test User 2',
        contactEmail: 'test2@example.com',
        requestType: 'update',
        details: 'Test details',
        submitterType: 'citizen',
      });

      expect(request).toBeDefined();
      // Database returns null for optional fields, not undefined
      expect(request.contactPhone).toBeNull();
    });
  });
});

