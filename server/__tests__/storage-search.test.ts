/**
 * @fileoverview Tests for search functionality with edge cases
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { storage } from '../storage';

describe('Search Functionality - Edge Cases', () => {
  describe('Empty and invalid queries', () => {
    it('should return all resources for empty string', async () => {
      const results = await storage.getResources({ search: '' });
      const allResources = await storage.getResources();
      expect(results.length).toBe(allResources.length);
    });

    it('should return all resources for whitespace-only query', async () => {
      const results = await storage.getResources({ search: '   ' });
      const allResources = await storage.getResources();
      expect(results.length).toBe(allResources.length);
    });

    it('should return empty array for only special characters', async () => {
      const results = await storage.getResources({ search: '!@#$%^&*()' });
      expect(results).toEqual([]);
    });

    it('should handle very long queries (200+ chars)', async () => {
      const longQuery = 'a'.repeat(300);
      const results = await storage.getResources({ search: longQuery });
      // Should not crash, may return empty or filtered results
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Common search terms (Critical Fix)', () => {
    it('should return results for "food" search', async () => {
      const results = await storage.getResources({ search: 'food' });
      // Should return food-related resources (food banks, food support, etc.)
      expect(results.length).toBeGreaterThan(0);
      // Verify results contain food-related terms
      const hasFoodRelated = results.some(r => 
        r.name.toLowerCase().includes('food') || 
        r.description?.toLowerCase().includes('food')
      );
      expect(hasFoodRelated).toBe(true);
    });

    it('should return results for "food bank" search', async () => {
      const results = await storage.getResources({ search: 'food bank' });
      // Should return food bank resources
      expect(results.length).toBeGreaterThan(0);
      // Verify results contain food bank terms
      const hasFoodBank = results.some(r => 
        r.name.toLowerCase().includes('food') || 
        r.description?.toLowerCase().includes('food')
      );
      expect(hasFoodBank).toBe(true);
    });

    it('should return results for "shelter" search', async () => {
      const results = await storage.getResources({ search: 'shelter' });
      // Should return shelter resources
      expect(results.length).toBeGreaterThan(0);
      // Verify results contain shelter terms
      const hasShelter = results.some(r => 
        r.name.toLowerCase().includes('shelter') || 
        r.description?.toLowerCase().includes('shelter')
      );
      expect(hasShelter).toBe(true);
    });

    it('should support partial matches (e.g., "food" matches "food bank")', async () => {
      const results = await storage.getResources({ search: 'food' });
      // Should include resources with "food bank" in the name
      const hasFoodBank = results.some(r => 
        r.name.toLowerCase().includes('food bank')
      );
      expect(hasFoodBank).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const lowerResults = await storage.getResources({ search: 'food' });
      const upperResults = await storage.getResources({ search: 'FOOD' });
      const mixedResults = await storage.getResources({ search: 'FoOd' });
      
      // All should return the same results (or at least same count)
      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });
  });

  describe('Crisis resource filtering', () => {
    it('should exclude crisis resources from shelter searches', async () => {
      const results = await storage.getResources({ search: 'shelter for man and his dog' });
      
      // Get crisis category
      const crisisCategory = await storage.getCategoryBySlug('crisis');
      
      if (crisisCategory) {
        // No crisis resources should appear
        const hasCrisisResources = results.some(r => r.categoryId === crisisCategory.id);
        expect(hasCrisisResources).toBe(false);
      }
      
      // Should have shelter-related results
      expect(results.length).toBeGreaterThan(0);
    });

    it('should include crisis resources for crisis searches', async () => {
      const results = await storage.getResources({ search: 'suicide help' });
      
      const crisisCategory = await storage.getCategoryBySlug('crisis');
      
      if (crisisCategory && results.length > 0) {
        // Should have at least some crisis resources
        const hasCrisisResources = results.some(r => r.categoryId === crisisCategory.id);
        expect(hasCrisisResources).toBe(true);
      }
    });

    it('should exclude crisis resources from general searches', async () => {
      const results = await storage.getResources({ search: 'food bank' });
      
      const crisisCategory = await storage.getCategoryBySlug('crisis');
      
      if (crisisCategory) {
        const hasCrisisResources = results.some(r => r.categoryId === crisisCategory.id);
        expect(hasCrisisResources).toBe(false);
      }
    });
  });

  describe('Relevance scoring', () => {
    it('should prioritize exact name matches', async () => {
      const results = await storage.getResources({ search: 'Central Okanagan Food Bank' });
      
      if (results.length > 0) {
        // First result should be exact match or highly relevant
        const firstResult = results[0];
        expect(firstResult.name.toLowerCase()).toContain('food');
      }
    });

    it('should rank name matches higher than description matches', async () => {
      const results = await storage.getResources({ search: 'food' });
      
      if (results.length > 1) {
        // Check that resources with "food" in name come before those only in description
        const nameMatches = results.filter(r => 
          r.name.toLowerCase().includes('food')
        );
        const descOnlyMatches = results.filter(r => 
          !r.name.toLowerCase().includes('food') && 
          r.description.toLowerCase().includes('food')
        );
        
        // Name matches should appear first
        if (nameMatches.length > 0 && descOnlyMatches.length > 0) {
          const firstNameMatchIndex = results.findIndex(r => nameMatches.includes(r));
          const firstDescMatchIndex = results.findIndex(r => descOnlyMatches.includes(r));
          expect(firstNameMatchIndex).toBeLessThan(firstDescMatchIndex);
        }
      }
    });

    it('should handle multi-word queries correctly', async () => {
      const results = await storage.getResources({ search: 'emergency shelter' });
      
      // Should return relevant results
      expect(Array.isArray(results)).toBe(true);
      
      // Results should match at least one word
      if (results.length > 0) {
        const firstResult = results[0];
        const nameLower = firstResult.name.toLowerCase();
        const descLower = firstResult.description.toLowerCase();
        const matches = 
          nameLower.includes('emergency') || nameLower.includes('shelter') ||
          descLower.includes('emergency') || descLower.includes('shelter');
        expect(matches).toBe(true);
      }
    });
  });

  describe('Special characters and edge cases', () => {
    it('should handle queries with hyphens', async () => {
      const results = await storage.getResources({ search: 'food-bank' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle queries with numbers', async () => {
      const results = await storage.getResources({ search: '988' });
      // Should return crisis resources for crisis hotline number
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle mixed case queries', async () => {
      const results1 = await storage.getResources({ search: 'FOOD BANK' });
      const results2 = await storage.getResources({ search: 'food bank' });
      const results3 = await storage.getResources({ search: 'Food Bank' });
      
      // All should return similar results (case-insensitive)
      expect(Array.isArray(results1)).toBe(true);
      expect(Array.isArray(results2)).toBe(true);
      expect(Array.isArray(results3)).toBe(true);
    });

    it('should handle queries with excessive whitespace', async () => {
      const results = await storage.getResources({ search: 'food     bank' });
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('No matches scenarios', () => {
    it('should return empty array for non-existent terms', async () => {
      const results = await storage.getResources({ search: 'xyzabc123nonexistent' });
      expect(results).toEqual([]);
    });

    it('should handle single character queries', async () => {
      const results = await storage.getResources({ search: 'a' });
      // May return many results or be filtered, but should not crash
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

