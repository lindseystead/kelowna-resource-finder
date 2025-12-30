/**
 * @fileoverview Utility functions for grouping resources by service type
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Groups resources into service categories for better organization in demographic categories.
 */

import type { Resource } from "@shared/schema";
import { isOpenNow } from "@/lib/hours";

export interface ResourceGroup {
  title: string;
  resources: Resource[];
}

// Service type keywords for categorization
const SERVICE_KEYWORDS: Record<string, string[]> = {
  "Employment & Training": [
    "employment", "job", "work", "career", "training", "resume", "workbc",
    "assistive technology", "workplace", "employment services", "job search"
  ],
  "Health & Mental Health": [
    "health", "mental health", "counseling", "therapy", "clinic", "medical",
    "wellness", "rehabilitation", "rehab", "cmha", "interior health"
  ],
  "Housing & Shelter": [
    "housing", "shelter", "home", "residence", "accommodation", "bchousing",
    "accessible housing", "transitional housing"
  ],
  "Legal & Advocacy": [
    "legal", "lawyer", "advocacy", "rights", "legal aid", "discrimination",
    "disability alliance"
  ],
  "Education & Learning": [
    "education", "school", "college", "university", "learning", "student",
    "academic", "okanagan college", "disability access"
  ],
  "Recreation & Community": [
    "recreation", "sports", "fitness", "activities", "community", "programs",
    "adaptive", "pathways", "abilities society"
  ],
  "Transportation": [
    "transportation", "transit", "handydart", "taxi", "bus", "accessible transit",
    "mobility", "driver"
  ],
  "Financial & Benefits": [
    "financial", "benefits", "income", "assistance", "pwd", "disability benefits",
    "service canada", "ministry of social development", "tax credit"
  ],
  "Daily Living Support": [
    "daily living", "home care", "cleaning", "laundry", "food preparation",
    "hands in service", "spectrum rehabilitation", "personal care"
  ],
  "City & Government Services": [
    "city of", "municipal", "government", "accessibility", "inclusion",
    "west kelowna", "kelowna", "district"
  ],
  "Crisis & Emergency": [
    "crisis", "emergency", "911", "hotline", "helpline", "suicide", "safety"
  ],
  "Youth Services": [
    "youth", "teen", "young people", "foundry", "bridge youth", "bgc",
    "kids help phone"
  ],
  "Senior Services": [
    "senior", "elder", "elderly", "older adult", "aging", "seniors outreach"
  ]
};

/**
 * Determines the service type category for a resource based on name and description
 */
function getServiceType(resource: Resource): string {
  const searchText = `${resource.name} ${resource.description || ""}`.toLowerCase();
  
  // Check each service type category
  for (const [category, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return category;
    }
  }
  
  return "Other Services";
}

/**
 * Groups resources by service type for demographic categories
 * Preserves the sort order of resources within each group (open first, then distance, then alphabetical)
 */
export function groupResourcesByServiceType(resources: Resource[]): ResourceGroup[] {
  const groups = new Map<string, Resource[]>();
  
  // Group resources (order is preserved since resources are already sorted)
  for (const resource of resources) {
    const serviceType = getServiceType(resource);
    if (!groups.has(serviceType)) {
      groups.set(serviceType, []);
    }
    groups.get(serviceType)!.push(resource);
  }
  
  // Convert to array and prioritize groups with open resources
  const result: ResourceGroup[] = Array.from(groups.entries())
    .map(([title, resources]) => {
      // Check if this group has any open resources
      const hasOpenResource = resources.some(r => {
        const status = isOpenNow(r.hours);
        return status?.isOpen ?? false;
      });
      return { title, resources, hasOpenResource };
    })
    .sort((a, b) => {
      // Priority 1: Groups with open resources first
      if (a.hasOpenResource && !b.hasOpenResource) return -1;
      if (!a.hasOpenResource && b.hasOpenResource) return 1;
      // Priority 2: Alphabetical by title
      return a.title.localeCompare(b.title);
    })
    .map(({ title, resources }) => ({ title, resources }));
  
  // Move "Other Services" to the end if it exists
  const otherIndex = result.findIndex(g => g.title === "Other Services");
  if (otherIndex !== -1) {
    const other = result.splice(otherIndex, 1)[0];
    result.push(other);
  }
  
  return result;
}

/**
 * Determines if a category should use service type grouping
 */
export function shouldGroupByServiceType(categorySlug: string, resourceCount: number): boolean {
  // Only group for demographic categories with many resources
  const demographicCategories = ["youth", "seniors", "disability", "addiction", "family"];
  return demographicCategories.includes(categorySlug) && resourceCount >= 10;
}

