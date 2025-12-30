/**
 * @fileoverview Resource verification script
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Efficient Resource Verification Script
 * 
 * This script identifies and prioritizes critical resources that need verification
 * for production deployment. Focuses on resources most likely to be searched first.
 */

import { readFileSync, writeFileSync } from 'fs';

interface Resource {
  name: string;
  address?: string;
  phone?: string;
  hours?: string;
  category?: string;
  priority: number;
  needsVerification: boolean;
}

// Priority categories (most searched first)
const PRIORITY_CATEGORIES = [
  'food-banks',
  'shelters', 
  'crisis',
  'health',
  'medical-clinics',
  'financial-aid',
  'employment',
  'legal'
];

// Keywords that indicate resources should have public hours
const SHOULD_HAVE_HOURS = [
  'food bank', 'thrift', 'store', 'library', 'hospital', 'clinic',
  'office', 'centre', 'center', 'service canada', 'workbc', 'transit',
  'mission', 'shelter', 'emergency', 'crisis', 'health', 'medical'
];

// Keywords that indicate "Call for hours" is appropriate
const APPOINTMENT_ONLY = [
  'counselling', 'counseling', 'therapy', 'support group', 'meeting',
  'appointment', 'referral', 'helpline', 'hotline', 'phone service'
];

function analyzeResources(): void {
  const content = readFileSync('server/routes.ts', 'utf-8');
  
  // Extract resources using regex
  const resourcePattern = /categoryId:\s*catMap\.get\(["']([^"']+)["']\)!,\s*name:\s*"([^"]+)",[\s\S]*?hours:\s*"([^"]+)"/g;
  const resources: Resource[] = [];
  let match;
  
  while ((match = resourcePattern.exec(content)) !== null) {
    const category = match[1];
    const name = match[2];
    const hours = match[3];
    
    const shouldHaveHours = SHOULD_HAVE_HOURS.some(kw => 
      name.toLowerCase().includes(kw)
    );
    const isAppointmentOnly = APPOINTMENT_ONLY.some(kw => 
      name.toLowerCase().includes(kw) || hours.toLowerCase().includes(kw)
    );
    
    const needsVerification = shouldHaveHours && 
      (hours.toLowerCase().includes('call') || !hours || hours.trim() === '');
    
    const priority = PRIORITY_CATEGORIES.indexOf(category);
    
    resources.push({
      name,
      hours,
      category,
      priority: priority >= 0 ? priority : 999,
      needsVerification
    });
  }
  
  // Sort by priority
  resources.sort((a, b) => {
    if (a.needsVerification !== b.needsVerification) {
      return a.needsVerification ? -1 : 1;
    }
    return a.priority - b.priority;
  });
  
  // Generate report
  const critical = resources.filter(r => r.needsVerification && r.priority < 5);
  const report = {
    total: resources.length,
    critical: critical.length,
    topPriority: critical.slice(0, 30).map(r => ({
      name: r.name,
      category: r.category,
      currentHours: r.hours,
      needsVerification: true
    }))
  };
  
  writeFileSync('critical_resources_report.json', JSON.stringify(report, null, 2));
  console.log(`✓ Found ${critical.length} critical resources needing verification`);
  console.log(`✓ Top 30 prioritized resources saved to critical_resources_report.json`);
}

analyzeResources();

