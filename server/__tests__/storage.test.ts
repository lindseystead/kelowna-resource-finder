/**
 * @fileoverview Tests for database storage layer
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { storage } from '../storage';

describe('Storage Layer', () => {
  describe('Categories', () => {
    it('should retrieve all categories', async () => {
      const categories = await storage.getCategories();
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('slug');
    });

    it('should retrieve category by slug', async () => {
      const category = await storage.getCategoryBySlug('food-banks');
      expect(category).toBeDefined();
      expect(category?.slug).toBe('food-banks');
    });

    it('should return undefined for non-existent slug', async () => {
      const category = await storage.getCategoryBySlug('non-existent-category');
      expect(category).toBeUndefined();
    });
  });

  describe('Resources', () => {
    it('should retrieve all resources', async () => {
      const resources = await storage.getResources();
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty('id');
      expect(resources[0]).toHaveProperty('name');
      expect(resources[0]).toHaveProperty('categoryId');
    });

    it('should filter resources by category', async () => {
      const categories = await storage.getCategories();
      const foodBankCategory = categories.find(c => c.slug === 'food-banks');
      
      if (foodBankCategory) {
        const resources = await storage.getResources({ categoryId: foodBankCategory.id });
        expect(resources).toBeInstanceOf(Array);
        resources.forEach(resource => {
          expect(resource.categoryId).toBe(foodBankCategory.id);
        });
      }
    });

    it('should search resources by text', async () => {
      const resources = await storage.getResources({ search: 'food' });
      expect(resources).toBeInstanceOf(Array);
      resources.forEach(resource => {
        const searchLower = 'food'.toLowerCase();
        const matches = 
          resource.name.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower);
        expect(matches).toBe(true);
      });
    });

    it('should retrieve resource by ID', async () => {
      const allResources = await storage.getResources();
      if (allResources.length > 0) {
        const resource = await storage.getResource(allResources[0].id);
        expect(resource).toBeDefined();
        expect(resource?.id).toBe(allResources[0].id);
      }
    });

    it('should return undefined for non-existent resource ID', async () => {
      const resource = await storage.getResource(999999);
      expect(resource).toBeUndefined();
    });
  });

  describe('Update Requests', () => {
    it('should retrieve all update requests', async () => {
      const requests = await storage.getUpdateRequests();
      expect(requests).toBeInstanceOf(Array);
    });

    it('should create update request', async () => {
      const request = await storage.createUpdateRequest({
        resourceName: 'Test Resource',
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        requestType: 'new',
        details: 'Test details',
        submitterType: 'citizen',
      });

      expect(request).toBeDefined();
      expect(request.id).toBeGreaterThan(0);
      expect(request.resourceName).toBe('Test Resource');
      expect(request.status).toBe('pending');
    });
  });
});

