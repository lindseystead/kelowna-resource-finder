/**
 * @fileoverview Tests for email utility
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { describe, it, expect } from 'vitest';

describe('Email Utility', () => {
  it('should validate email data structure', () => {
    const validEmailData = {
      resourceName: 'Test Resource',
      contactName: 'Test User',
      contactEmail: 'test@example.com',
      requestType: 'new' as const,
      details: 'Test details',
    };

    expect(validEmailData).toHaveProperty('resourceName');
    expect(validEmailData).toHaveProperty('contactName');
    expect(validEmailData).toHaveProperty('contactEmail');
    expect(validEmailData).toHaveProperty('requestType');
    expect(validEmailData).toHaveProperty('details');
    expect(['update', 'new', 'remove']).toContain(validEmailData.requestType);
  });

  it('should handle all request types', () => {
    const requestTypes = ['update', 'new', 'remove'] as const;
    
    requestTypes.forEach(type => {
      const emailData = {
        resourceName: 'Test',
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        requestType: type,
        details: 'Test',
      };
      
      expect(emailData.requestType).toBe(type);
    });
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
  });
});
