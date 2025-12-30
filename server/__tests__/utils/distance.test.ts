/**
 * @fileoverview Tests for distance calculation utility
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { calculateDistance } from '../../../client/src/lib/distance';

describe('Distance Calculation', () => {
  // Kelowna coordinates: ~49.8880, -119.4960
  const kelownaLat = 49.8880;
  const kelownaLng = -119.4960;

  // West Kelowna coordinates: ~49.8300, -119.6000
  const westKelownaLat = 49.8300;
  const westKelownaLng = -119.6000;

  it('should calculate distance between Kelowna and West Kelowna', () => {
    const distance = calculateDistance(kelownaLat, kelownaLng, westKelownaLat, westKelownaLng);
    // Should be approximately 10-15 km
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(20);
  });

  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(kelownaLat, kelownaLng, kelownaLat, kelownaLng);
    expect(distance).toBeCloseTo(0, 1);
  });

  it('should handle negative longitude correctly', () => {
    const distance = calculateDistance(kelownaLat, kelownaLng, kelownaLat, kelownaLng - 0.1);
    expect(distance).toBeGreaterThan(0);
    expect(isNaN(distance)).toBe(false);
  });

  it('should return positive distance for any two different points', () => {
    const distance = calculateDistance(49.0, -120.0, 50.0, -119.0);
    expect(distance).toBeGreaterThan(0);
    expect(isNaN(distance)).toBe(false);
    expect(isFinite(distance)).toBe(true);
  });
});

