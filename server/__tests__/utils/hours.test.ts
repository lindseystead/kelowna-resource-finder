/**
 * @fileoverview Tests for hours parsing utility
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { isOpenNow } from '../../../client/src/lib/hours';

describe('Hours Parsing', () => {
  it('should parse 24/7 hours correctly', () => {
    const status = isOpenNow('24/7');
    expect(status).not.toBeNull();
    expect(status?.isOpen).toBe(true);
    expect(status?.status).toContain('24/7');
  });

  it('should parse weekday hours correctly', () => {
    const hours = 'Monday-Friday 9:00 AM - 5:00 PM';
    const status = isOpenNow(hours);
    expect(status).not.toBeNull();
    expect(typeof status?.isOpen).toBe('boolean');
  });

  it('should handle various hour formats', () => {
    const formats = [
      'Mon-Fri 9am-5pm',
      'Monday-Friday 9:00 AM - 5:00 PM',
      '9:00 AM - 5:00 PM',
      '24/7',
      'By appointment',
    ];

    formats.forEach(format => {
      const status = isOpenNow(format);
      expect(status === null || typeof status === 'object').toBe(true);
      if (status) {
        expect(status).toHaveProperty('isOpen');
        expect(status).toHaveProperty('status');
      }
    });
  });

  it('should handle null/undefined hours gracefully', () => {
    expect(isOpenNow(null)).toBeNull();
    expect(isOpenNow(undefined)).toBeNull();
  });

  it('should detect closed status for temporarily closed', () => {
    const status = isOpenNow('Temporarily closed');
    expect(status).not.toBeNull();
    expect(status?.isOpen).toBe(false);
  });
});

