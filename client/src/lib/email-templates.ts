/**
 * @fileoverview Email template utilities
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides utilities for generating email templates with proper base URL.
 */

import { getBaseUrl } from "./config";

/**
 * Generates a mailto link for contacting a resource
 */
export async function generateResourceEmailLink(
  resourceName: string,
  resourceEmail: string
): Promise<string> {
  const baseUrl = await getBaseUrl();
  const subject = encodeURIComponent(`Inquiry about ${resourceName} - Kelowna Aid`);
  const body = encodeURIComponent(
    `Hello ${resourceName},\n\n` +
    `I found your organization on Kelowna Aid (${baseUrl}) and I would like to learn more about your services.\n\n` +
    `[Please share any specific questions or information you need here]\n\n` +
    `Thank you for the important work you do in our community.\n\n` +
    `Best regards,\n` +
    `[Your name]\n` +
    `[Your phone number - optional]`
  );
  
  return `mailto:${resourceEmail}?subject=${subject}&body=${body}`;
}

/**
 * Synchronous version that uses a default base URL
 * Use this for components that can't use async/await
 */
export function generateResourceEmailLinkSync(
  resourceName: string,
  resourceEmail: string,
  baseUrl?: string
): string {
  // Use provided baseUrl, or try to get from config, or fallback to env/default
  const finalBaseUrl = baseUrl || 
    (typeof window !== "undefined" && window.location.origin) ||
    import.meta.env.VITE_BASE_URL ||
    "https://helpkelowna.com";
  const subject = encodeURIComponent(`Inquiry about ${resourceName} - Kelowna Aid`);
  const body = encodeURIComponent(
    `Hello ${resourceName},\n\n` +
    `I found your organization on Kelowna Aid (${baseUrl}) and I would like to learn more about your services.\n\n` +
    `[Please share any specific questions or information you need here]\n\n` +
    `Thank you for the important work you do in our community.\n\n` +
    `Best regards,\n` +
    `[Your name]\n` +
    `[Your phone number - optional]`
  );
  
  return `mailto:${resourceEmail}?subject=${subject}&body=${body}`;
}

