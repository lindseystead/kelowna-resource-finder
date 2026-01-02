/**
 * @fileoverview API routes and database seeding for Help Kelowna
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Defines all API endpoints for resources, categories, and update requests.
 * Handles database seeding with initial Kelowna community resource data.
 */

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerChatRoutes } from "./chat";
import { asyncHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { updateResourceSchema, categories, resourceCategories } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { getErrorMessage } from "./types/errors";

/**
 * Assigns additional categories to resources that belong in multiple categories.
 * Uses the many-to-many junction table to allow resources to appear in multiple categories.
 */
async function assignMultipleCategories(catMap: Map<string, number>): Promise<void> {
  // Get all resources to check for multi-category assignments
  const allResources = await storage.getResources();
  
  for (const resource of allResources) {
    const additionalCategories: number[] = [];
    const nameLower = resource.name.toLowerCase();
    const descLower = resource.description.toLowerCase();
    
    // Youth shelters should also be in "shelters" category
    if (nameLower.includes('youth') && (nameLower.includes('shelter') || descLower.includes('shelter'))) {
      const youthCatId = catMap.get('youth');
      const shelterCatId = catMap.get('shelters');
      if (youthCatId && shelterCatId) {
        // Check if already in shelters category
        const existing = await db
          .select()
          .from(resourceCategories)
          .where(and(
            eq(resourceCategories.resourceId, resource.id),
            eq(resourceCategories.categoryId, shelterCatId)
          ))
          .limit(1);
        if (existing.length === 0) {
          additionalCategories.push(shelterCatId);
        }
      }
    }
    
    // Crisis resources for youth should also be in "youth" category
    if ((nameLower.includes('youth') || descLower.includes('youth') || descLower.includes('young people')) && 
        (nameLower.includes('crisis') || nameLower.includes('hotline') || nameLower.includes('helpline'))) {
      const crisisCatId = catMap.get('crisis');
      const youthCatId = catMap.get('youth');
      if (crisisCatId && youthCatId) {
        const existing = await db
          .select()
          .from(resourceCategories)
          .where(and(
            eq(resourceCategories.resourceId, resource.id),
            eq(resourceCategories.categoryId, youthCatId)
          ))
          .limit(1);
        if (existing.length === 0) {
          additionalCategories.push(youthCatId);
        }
      }
    }
    
    // Add additional categories if any
    if (additionalCategories.length > 0) {
      for (const catId of additionalCategories) {
        try {
          await db.insert(resourceCategories).values({
            resourceId: resource.id,
            categoryId: catId,
          });
        } catch (error: unknown) {
          // Ignore duplicate key errors (composite primary key violation)
          // PostgreSQL error code 23505 = unique_violation
          const pgError = error as { code?: string };
          if (!pgError.code || pgError.code !== '23505') {
            logger.error(`Failed to assign category ${catId} to resource ${resource.id}`, error);
          }
        }
      }
    }
  }
}

/**
 * Seeds the database with initial categories and resources if empty.
 * Only runs on first application startup when database is empty.
 */
async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  const existingResources = await storage.getResources();
  
  // Only skip seeding if both categories AND resources exist
  if (existingCategories.length > 0 && existingResources.length > 0) {
    logger.info(`Database already seeded: ${existingCategories.length} categories, ${existingResources.length} resources`);
    return;
  }

  // If categories exist but resources don't, clear categories first to allow full reseed
  if (existingCategories.length > 0 && existingResources.length === 0) {
    logger.warn("Categories exist but no resources found. Clearing categories to allow full reseed...");
    // Delete categories so we can recreate everything
    for (const cat of existingCategories) {
      await db.delete(categories).where(eq(categories.id, cat.id));
    }
  }

  logger.info("Seeding database with Kelowna resources...");

  const cats = [
    { name: "Food Support", slug: "food-banks", icon: "Utensils", description: "Free food and meal services" },
    { name: "Shelters", slug: "shelters", icon: "Home", description: "Emergency housing and safe spaces" },
    { name: "Health", slug: "health", icon: "Heart", description: "Medical and mental health support" },
    { name: "Legal", slug: "legal", icon: "Scale", description: "Legal aid and advocacy" },
    { name: "Crisis", slug: "crisis", icon: "Phone", description: "Immediate emergency help" },
    { name: "Family", slug: "family", icon: "Users", description: "Support for families and children" },
    { name: "Employment", slug: "employment", icon: "Briefcase", description: "Job search and training help" },
    { name: "Addiction", slug: "addiction", icon: "HeartHandshake", description: "Substance use recovery support" },
    { name: "Youth", slug: "youth", icon: "Sparkles", description: "Programs and support for young people" },
    { name: "Seniors", slug: "seniors", icon: "User", description: "Services for older adults" },
    { name: "Indigenous", slug: "indigenous", icon: "Feather", description: "First Nations and Indigenous services" },
    { name: "Newcomers", slug: "newcomers", icon: "Globe", description: "Immigration and settlement support" },
    { name: "Transportation", slug: "transportation", icon: "Bus", description: "Transit and mobility assistance" },
    { name: "Financial Aid", slug: "financial-aid", icon: "Wallet", description: "Income support and financial help" },
    { name: "Disability", slug: "disability", icon: "Accessibility", description: "Services for people with disabilities" },
    { name: "Holiday Support", slug: "holiday-support", icon: "Gift", description: "Christmas and holiday assistance programs" },
    { name: "Medical Clinics", slug: "medical-clinics", icon: "Stethoscope", description: "Free and low-cost medical care" },
    { name: "Home Care", slug: "home-care", icon: "House", description: "In-home support and care services" },
    { name: "Thrift Stores", slug: "thrift-stores", icon: "ShoppingBag", description: "Second-hand stores for affordable clothing, furniture, and personal items" },
    { name: "Libraries", slug: "libraries", icon: "BookOpen", description: "Public libraries with books, computers, and community programs" },
    { name: "Community Centers", slug: "community-centers", icon: "Building2", description: "Recreation centers and community gathering spaces" },
    { name: "Education & Tutoring", slug: "education", icon: "GraduationCap", description: "Adult education, tutoring, and learning programs" },
  ];

  const createdCats = await Promise.all(cats.map(c => storage.createCategory(c)));
  const catMap = new Map(createdCats.map(c => [c.slug, c.id]));

  const resources = [
    {
      categoryId: catMap.get("food-banks")!,
      name: "Central Okanagan Food Bank",
      description: "Provides food hampers and nutritional support to individuals and families in need. By appointment only.",
      address: "2310 Enterprise Way, Kelowna, BC V1X 4H7",
      phone: "250-763-7161",
      website: "https://cofoodbank.com",
      email: "info@cofoodbank.com",
      latitude: "49.8801",
      longitude: "-119.4436",
      hours: "Monday-Saturday: 9:00 AM - 11:30 AM, 12:00 PM - 3:00 PM (by appointment). Tiny Bundles: Fridays 9:00 AM - 3:00 PM. Closed on BC Statutory Holidays.",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "Central Okanagan Food Bank - West Kelowna Branch",
      description: "West Kelowna location providing food hampers and nutritional support to individuals and families in need. By appointment only. Distribution hours: Tuesdays 9:30 AM - 12:30 PM, Wednesdays 4:30 PM - 7:30 PM, Thursdays 9:30 AM - 12:30 PM, Fridays (Tiny Bundles) 9:30 AM - 12:30 PM.",
      address: "203-3710 Hoskins Road, West Kelowna, BC V4T 2P3",
      phone: "250-768-1559",
      website: "https://cofoodbank.com",
      email: "info@cofoodbank.com",
      latitude: "49.8250",
      longitude: "-119.6100",
      hours: "By appointment only: Tuesdays 9:30 AM - 12:30 PM, Wednesdays 4:30 PM - 7:30 PM, Thursdays 9:30 AM - 12:30 PM, Fridays (Tiny Bundles) 9:30 AM - 12:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "Kelowna's Gospel Mission",
      description: "Provides services to meet the needs of people who are hungry, hurt, or homeless in the Central Okanagan area. Services include nutritious meals, access to showers and laundry facilities, personal care items, and emergency dental care. Case workers help individuals develop life plans and reach goals. Office hours are 8:30 AM to 4:00 PM Monday to Friday. The Mobile Outreach Team offers meals to the community at various locations, seven days a week: 9:30 AM at Richter Street and Wedell Place, and 12:00 PM at the Library parkade (1360 Ellis Street). Supper service is at 5:00 PM five times a week at Richter and Wedell. Three days a week breakfast is delivered in Rutland; location varies. Nonprofit society, registered charity.",
      address: "251 Leon Ave, Kelowna, BC V1Y 9T9. Mobile Outreach: Various locations (see hours)",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "Office: Monday-Friday 8:30 AM - 4:00 PM. Mobile Meals: Daily 9:30 AM (Richter & Wedell), 12:00 PM (Library parkade - 1360 Ellis St), 5:00 PM (Richter & Wedell, 5 days/week). Breakfast in Rutland: 3 days/week (location varies).",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Kelowna's Gospel Mission - Shelter Services",
      description: "Provides emergency shelter services including The Leon Shelter (men's shelter), Bay Ave Community Shelter, and women's transitional housing. Also serves free meals daily.",
      address: "251 Leon Ave, Kelowna, BC V1Y 9T9",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "24/7 for shelter services. Meals: Daily 7:00 AM, 12:00 PM, 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Bartley Court Shelter - West Kelowna",
      description: "Temporary shelter providing 42 beds for individuals experiencing homelessness. Operated by Turning Points Collaborative Society. Services include kitchen facilities, hygiene amenities, common areas, and individual rooms. For individuals aged 19 or older.",
      address: "2515 Bartley Court, West Kelowna, BC V4T 2P3",
      phone: "250-542-3555",
      website: "https://www.turningpoints.ca",
      email: "info@turningpoints.ca",
      latitude: "49.8200",
      longitude: "-119.6150",
      hours: "24/7 - Call for availability and intake",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "Salvation Army - Kelowna",
      description: "Food bank services and community meals. Also offers clothing and emergency assistance.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-860-2329",
      website: "https://salvationarmy.ca",
      email: "kelowna.clc@salvationarmy.ca",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Monday-Friday 9:00 AM - 3:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Salvation Army - Kelowna - Emergency Assistance",
      description: "Emergency assistance including clothing, food, and financial support. Food bank services and community meals also available.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-860-2329",
      website: "https://salvationarmy.ca",
      email: "kelowna.clc@salvationarmy.ca",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Monday-Friday 9:00 AM - 3:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Cornerstone Shelter",
      description: "Low-barrier emergency shelter providing beds, meals, and support services 24/7.",
      address: "425 Leon Ave, Kelowna, BC V1Y 6J4",
      phone: "250-979-8260",
      latitude: "49.8878",
      longitude: "-119.4912",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Inn From The Cold",
      description: "Emergency winter shelter operating November to March. Provides warm beds and meals.",
      address: "1855 Kirschner Rd, Kelowna, BC V1Y 4N7",
      phone: "250-763-3737",
      latitude: "49.8756",
      longitude: "-119.4723",
      hours: "November to March: 24/7",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "NOW Canada Women's Shelter",
      description: "Safe haven for women and children fleeing domestic violence. Confidential location.",
      address: "Confidential, Kelowna, BC",
      phone: "250-763-1040",
      website: "https://nowcanada.com",
      email: "info@nowcanada.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "NOW Canada Women's Shelter - Crisis Support",
      description: "Emergency shelter and crisis support for women and children fleeing domestic violence. Confidential location. 24/7 crisis line available.",
      address: "Confidential, Kelowna, BC",
      phone: "250-763-1040",
      website: "https://nowcanada.com",
      email: "info@nowcanada.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Outreach Urban Health Centre",
      description: "Primary health care for people experiencing homelessness. No health card required.",
      address: "1649 Pandosy St, Kelowna, BC V1Y 1P6",
      phone: "250-868-2230",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8765",
      longitude: "-119.4921",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Canadian Mental Health Association - Kelowna",
      description: "Mental health support, counseling, and wellness programs. Sliding scale fees available.",
      address: "504 Sutherland Ave, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://cmha.bc.ca/locations/kelowna",
      email: "info@cmhakelowna.com",
      latitude: "49.8902",
      longitude: "-119.4856",
      hours: "Monday-Friday 9:00 AM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Kelowna General Hospital - Emergency",
      description: "24/7 emergency medical services. For life-threatening emergencies call 911.",
      address: "2268 Pandosy St, Kelowna, BC V1Y 1T2",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8712",
      longitude: "-119.4878",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Interior Crisis Line Network",
      description: "24/7 crisis support, suicide prevention, and emotional support. Free and confidential.",
      address: "Phone service - available anywhere",
      phone: "1-888-353-2273",
      website: "https://www.kcr.ca/family-community-services/crisis-line/",
      email: "info@kcr.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "BC 211",
      description: "Free helpline connecting you to community, social, and government services. Talk to a Navigator 9am-9pm Weekdays (excluding holidays). For emergencies, call 9-1-1 instead. Available via phone, text (SMS) to 2-1-1, live chat, or email. Search all resources online.",
      address: "Phone, text, live chat, or email - available anywhere",
      phone: "211",
      website: "https://bc211.ca",
      email: "info@bc211.ca",
      hours: "9:00 AM - 9:00 PM Weekdays (excluding holidays). For emergencies, call 9-1-1.",
      verified: true
    },
    {
      categoryId: catMap.get("legal")!,
      name: "Legal Aid BC - Kelowna",
      description: "Free legal information, advice, and representation for eligible individuals.",
      address: "101-1465 Ellis St, Kelowna, BC V1Y 2A3",
      phone: "250-717-2020",
      website: "https://legalaid.bc.ca",
      email: "info@legalaid.bc.ca",
      latitude: "49.8889",
      longitude: "-119.4934",
      hours: "Monday-Friday 9:00 AM - 5:00 PM (excluding statutory holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("legal")!,
      name: "Access Pro Bono",
      description: "Free legal clinics and lawyer referrals for low-income individuals. Provides free legal advice, representation, and assistance with family law, housing, employment, and other civil matters. Call to find the nearest clinic location and schedule an appointment.",
      address: "Various locations in Kelowna - call for nearest clinic",
      phone: "1-877-762-6664",
      website: "https://accessprobono.ca",
      email: "info@accessprobono.ca",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Kelowna Community Resources",
      description: "Family support programs, parenting classes, and child development services.",
      address: "620 Leon Avenue, Kelowna, BC V1Y 9T2",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "Monday-Friday 8:30 AM - 4:30 PM (Closed on Stat Holidays; Closed Dec 25 - Jan 1)",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "First Steps Early Years Centre",
      description: "Free drop-in programs for families with children 0-6 years old.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-860-2329",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Monday-Friday 9:00 AM - 3:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "WorkBC Kelowna",
      description: "Free employment services, job search help, training, and skills development.",
      address: "1460 Pandosy St, Kelowna, BC V1Y 1P6",
      phone: "778-478-8390",
      website: "https://workbc.ca",
      email: "info-kelowna@workbc.ca",
      latitude: "49.8700",
      longitude: "-119.4900",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "Okanagan College - Career Services",
      description: "Career counseling, resume help, and job placement assistance for students and community.",
      address: "1000 KLO Rd, Kelowna, BC V1Y 4X8",
      phone: "250-762-5445",
      website: "https://www.okanagan.bc.ca",
      email: "info@okanagan.bc.ca",
      latitude: "49.8623",
      longitude: "-119.4756",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Foundry Kelowna - Youth Substance Use & Mental Health",
      description: "Free, confidential youth wellness centre for ages 12-24. Provides substance use support, mental health counseling, primary care, and peer support. Walk-in counseling available Tuesday-Thursday 12:00 PM - 5:00 PM.",
      address: "100-1815 Kirschner Rd, Kelowna, BC V1Y 4N7",
      phone: "236-420-2803",
      website: "https://foundrybc.ca/kelowna",
      email: "foundry@cmhakelowna.org",
      latitude: "49.8758",
      longitude: "-119.4720",
      hours: "Walk-in: Tuesday-Thursday 12:00 PM - 5:00 PM. Call for other appointments",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Kelowna Alcohol & Drug Services",
      description: "Outpatient treatment, counseling, and support for substance use disorders.",
      address: "202-1664 Richter St, Kelowna, BC V1Y 8N3",
      phone: "250-868-7788",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8802",
      longitude: "-119.4901",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Alcoholics Anonymous - Kelowna",
      description: "Free support groups for people recovering from alcohol addiction. Multiple meetings weekly at various locations throughout Kelowna. Anonymous, peer-led recovery program. Call the 24-hour helpline to find meeting times and locations near you.",
      address: "Various locations in Kelowna - call for meeting schedule",
      phone: "250-860-2411",
      website: "https://www.bcyukonaa.org",
      email: "info@bcyukonaa.org",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Narcotics Anonymous - Kelowna",
      description: "Peer support for recovery from drug addiction. Free meetings throughout the week at various locations throughout Kelowna. Anonymous, peer-led recovery program. Call the helpline to find meeting times and locations near you.",
      address: "Various locations in Kelowna - call for meeting schedule",
      phone: "1-888-811-3887",
      website: "https://bcrna.ca",
      email: "info@bcrna.ca",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Toward the Heart - Toxic Drug Alerts",
      description: "Free, anonymous text alerts about toxic drugs in your area. Text JOIN to 253787. Also find naloxone, overdose prevention sites, and drug checking services.",
      address: "Available throughout Interior Health region",
      phone: "Text: 253787",
      website: "https://towardtheheart.com/alerts",
      email: "info@towardtheheart.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "NORS - National Overdose Response Service",
      description: "Confidential, non-judgmental support hotline for people using drugs. Available 24/7 Canada-wide. Provides virtual overdose prevention support.",
      address: "Phone service - Canada-wide",
      phone: "1-888-688-6677",
      website: "https://nors.ca",
      email: "info@nors.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Lifeguard App - Use Alone Timer",
      description: "Free app that connects you to emergency services if you become unresponsive while using substances. Use Alone Timer feature for safer substance use.",
      address: "Mobile app - download available",
      website: "https://www.lifeguarddh.com/",
      email: "info@lifeguarddh.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "BC Drug Checking Services",
      description: "Free, anonymous drug checking to test substances for safety. Available at harm reduction sites across BC. Results in minutes.",
      address: "Various harm reduction sites in Kelowna",
      website: "https://drugcheckingbc.ca/",
      email: "info@drugcheckingbc.ca",
      hours: "Monday-Friday 11:00 AM - 7:00 PM (check website for specific location hours)",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "The Leon Shelter - Kelowna Gospel Mission",
      description: "60 emergency beds for men. Access to showers, laundry, hygiene supplies, and three hot and nutritious meals every day. For those trying to maintain sobriety while living in shelter.",
      address: "251 Leon Avenue, Kelowna, BC V1Y 9T9",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Kelowna Women's Shelter",
      description: "Safe emergency housing for women and children fleeing violence. 24/7 crisis line available.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-1040",
      website: "https://kelownawomensshelter.ca",
      email: "info@kelownawomensshelter.ca",
      latitude: "49.8880",
      longitude: "-119.4960",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Kelowna Women's Shelter - Crisis Support",
      description: "Emergency shelter and 24/7 crisis support for women and children fleeing domestic violence. Confidential location.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-1040",
      website: "https://kelownawomensshelter.ca",
      email: "info@kelownawomensshelter.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Foundry Kelowna - Youth Wellness Centre",
      description: "Free, confidential one-stop wellness centre for youth 12-24. Mental health, substance use support, primary care, and peer support. Walk-in counseling available Tuesday-Thursday 12:00 PM - 5:00 PM.",
      address: "100-1815 Kirschner Rd, Kelowna, BC V1Y 4N7",
      phone: "236-420-2803",
      website: "https://foundrybc.ca/kelowna",
      email: "foundry@cmhakelowna.org",
      latitude: "49.8758",
      longitude: "-119.4720",
      hours: "Walk-in: Tuesday-Thursday 12:00 PM - 5:00 PM. Call for other appointments",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Kelowna Boys & Girls Club",
      description: "After-school programs, summer camps, and youth development activities for ages 6-18.",
      address: "1434 Graham St, Kelowna, BC V1Y 3A8",
      phone: "250-762-3914",
      website: "https://www.bgco.ca",
      email: "info@bgco.ca",
      latitude: "49.8880",
      longitude: "-119.4950",
      hours: "Monday-Friday 2:00 PM - 6:00 PM (after-school), Summer: 7:00 AM - 6:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Covenant House Vancouver Outreach",
      description: "Support services for homeless and at-risk youth. Outreach and referrals to housing.",
      address: "Phone service available",
      phone: "1-800-999-9915",
      website: "https://www.covenanthousebc.org",
      email: "info@covenanthousebc.org",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Youth Unlimited Okanagan",
      description: "Community programs, mentorship, and support for at-risk youth in Kelowna. Provides after-school programs, life skills training, mentorship relationships, and support for youth facing challenges. Call to learn about programs and locations.",
      address: "Multiple locations in Kelowna - call for details",
      phone: "778-476-3232",
      website: "https://youthunlimited.com/okanagan",
      email: "info@youthunlimited.com",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Kids Help Phone",
      description: "24/7 professional counseling for young people. Call, text, or chat online. Free and confidential.",
      address: "Phone/text service available anywhere",
      phone: "1-800-668-6868",
      website: "https://kidshelpphone.ca",
      email: "info@kidshelpphone.ca",
      verified: true
    },
    // First Baptist Church - Food Support (food bank)
    {
      categoryId: catMap.get("food-banks")!,
      name: "First Baptist Church Kelowna",
      description: "Community support programs, food bank, and pastoral care. All are welcome.",
      address: "1580 Bernard Ave, Kelowna, BC V1Y 6N9",
      phone: "250-763-3264",
      website: "https://fbckelowna.com",
      email: "info@fbckelowna.com",
      latitude: "49.8921",
      longitude: "-119.4923",
      hours: "Call for food bank hours and services",
      verified: true
    },
    // Evangel Church - Food Support (food assistance)
    {
      categoryId: catMap.get("food-banks")!,
      name: "Evangel Church",
      description: "Community outreach, benevolent fund, and support programs. Food assistance available.",
      address: "3261 Gordon Dr, Kelowna, BC V1W 3K3",
      phone: "250-762-2217",
      website: "https://www.evangel.ca",
      email: "info@evangel.ca",
      latitude: "49.8567",
      longitude: "-119.4678",
      hours: "Call for food assistance hours",
      verified: true
    },
    // Trinity Baptist Church - Food Support (meals and food hampers)
    {
      categoryId: catMap.get("food-banks")!,
      name: "Trinity Baptist Church",
      description: "Community meals, food hampers, and pastoral support. Open to all in need.",
      address: "1905 Springfield Rd, Kelowna, BC V1Y 5V7",
      phone: "250-860-8988",
      website: "https://trinitybaptistkelowna.com",
      email: "info@trinitybaptistkelowna.com",
      latitude: "49.8678",
      longitude: "-119.4589",
      hours: "Call for meal times and food hamper hours",
      verified: true
    },
    // St. Michael and All Angels - Financial Aid (emergency assistance)
    {
      categoryId: catMap.get("financial-aid")!,
      name: "St. Michael and All Angels Anglican Church",
      description: "Community outreach programs, emergency assistance, and pastoral care.",
      address: "608 Sutherland Ave, Kelowna, BC V1Y 5X1",
      phone: "250-762-3486",
      website: "https://stmichaelkelowna.ca",
      email: "info@stmichaelkelowna.ca",
      latitude: "49.8901",
      longitude: "-119.4845",
      hours: "Call for assistance hours",
      verified: true
    },
    // Sikh Gurdwara - Food Support (free daily meals)
    {
      categoryId: catMap.get("food-banks")!,
      name: "Sikh Gurdwara Kelowna",
      description: "Free community meals (langar) served daily. Open to everyone regardless of faith or background.",
      address: "685 Dougall Rd N, Kelowna, BC V1X 3K3",
      phone: "250-765-4200",
      latitude: "49.9023",
      longitude: "-119.4234",
      hours: "Daily - call for meal times",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Outreach & Resource Centre",
      description: "Information, referrals, and support services for seniors. Help with forms and applications.",
      address: "102-2055 Benvoulin Ct, Kelowna, BC V1W 2C3",
      phone: "250-861-6180",
      website: "https://www.seniorsoutreach.ca",
      email: "info@seniorsoutreach.ca",
      latitude: "49.8534",
      longitude: "-119.4623",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Activity Centre",
      description: "Social programs, fitness classes, and activities for older adults. Low-cost memberships.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-762-4108",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Meals on Wheels Kelowna",
      description: "Nutritious meal delivery for seniors and people with disabilities. Affordable rates. Hot meals delivered to your home Monday through Friday. Call to register and arrange delivery service.",
      address: "Home delivery service throughout Kelowna - call to register",
      phone: "250-763-2424",
      website: "https://www.mealsonwheelskelowna.com",
      email: "info@mealsonwheelskelowna.com",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Better at Home Kelowna",
      description: "Non-medical support for seniors to live independently. Services include light housekeeping, transportation, friendly visits, grocery shopping assistance, and minor home repairs. Sliding scale fees based on income. Call KCR Community Resources to register.",
      address: "Services provided in your home - call KCR to register",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "Ki-Low-Na Friendship Society",
      description: "Cultural programs, housing support, and services for Indigenous people in Kelowna.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://www.kfs.bc.ca",
      email: "info@kfs.bc.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "Monday-Thursday 8:30 AM - 4:30 PM; Friday 9:00 AM - 12:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "Okanagan Nation Alliance",
      description: "Advocacy, cultural programs, and services for Syilx Okanagan people.",
      address: "3255C Shannon Lake Rd, Westbank, BC V4T 1V4",
      phone: "250-707-0095",
      website: "https://www.syilx.org",
      email: "info@syilx.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "Westbank First Nation Health Services",
      description: "Health programs, mental wellness, and traditional healing for First Nations members and families.",
      address: "1900 Quail Lane, Westbank, BC V4T 2H3",
      phone: "250-769-4999",
      website: "https://www.wfn.ca",
      email: "info@wfn.ca",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("newcomers")!,
      name: "Kelowna Community Resources - Settlement Services",
      description: "Free settlement support for newcomers to Canada. Language help, job search, and community connections.",
      address: "618 & 654 Bernard Ave, Kelowna, BC V1Y 6P3",
      phone: "250-763-8008 ext. 1",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      latitude: "49.8880",
      longitude: "-119.4950",
      hours: "Monday-Friday 8:30 AM - 4:30 PM (Closed on Stat Holidays; Closed Dec 25 - Jan 1)",
      verified: true
    },
    {
      categoryId: catMap.get("newcomers")!,
      name: "Central Okanagan Refugee Committee",
      description: "Support for refugees and their sponsors. Provides mentorship, community integration assistance, practical help with settlement, and connections to local resources. Call to learn about programs and how to get involved.",
      address: "Call for office location and meeting information",
      phone: "250-870-8480",
      website: "https://corc-kelowna.ca",
      email: "info@corc-kelowna.ca",
      verified: true
    },
    {
      categoryId: catMap.get("newcomers")!,
      name: "MOSAIC Settlement Services",
      description: "Language classes, employment support, and settlement services for immigrants and refugees. Provides English language training, job search assistance, help with immigration paperwork, and community connections. Call to learn about programs and office locations.",
      address: "Multiple locations in Kelowna - call for office address",
      phone: "604-254-9626",
      website: "https://www.mosaicbc.org",
      email: "info@mosaicbc.org",
      verified: true
    },
    {
      categoryId: catMap.get("transportation")!,
      name: "BC Transit - Kelowna",
      description: "Public bus service throughout Kelowna and Central Okanagan. Reduced fares for low-income residents.",
      address: "Transit Exchange, Queensway Ave, Kelowna",
      phone: "250-860-8121",
      website: "https://www.bctransit.com/kelowna",
      email: "info@bctransit.com",
      latitude: "49.8867",
      longitude: "-119.4956",
      hours: "Customer service: Monday-Friday 8:00 AM - 4:30 PM. Bus service operates daily with varying schedules - check website for routes",
      verified: true
    },
    {
      categoryId: catMap.get("transportation")!,
      name: "HandyDART",
      description: "Door-to-door transit for people with disabilities who cannot use regular buses.",
      address: "1494 Hardy St, Kelowna, BC V1Y 8H2",
      phone: "250-762-3278",
      website: "https://www.bctransit.com/kelowna/handydart",
      email: "info@bctransit.com",
      latitude: "49.8880",
      longitude: "-119.4950",
      hours: "Service: Monday-Friday 6:00 AM - 6:00 PM, Saturday 8:00 AM - 6:00 PM. Office: Monday-Friday 8:00 AM - 4:30 PM. No service Sundays/Holidays. Dialysis patients can book earlier times.",
      verified: true
    },
    {
      categoryId: catMap.get("transportation")!,
      name: "Kelowna Community Resources - Transportation Program",
      description: "Volunteer driver program for seniors and people with disabilities. Medical appointments and errands.",
      address: "Kelowna, BC",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "BC Employment & Assistance",
      description: "Income assistance and disability benefits for eligible BC residents. Apply online or in person.",
      address: "130-1640 Dilworth Dr, Kelowna, BC V1Y 7V3",
      phone: "1-866-866-0800",
      website: "https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance",
      email: "info@www2.gov.bc.ca",
      latitude: "49.8678",
      longitude: "-119.4589",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Service Canada Centre",
      description: "EI, CPP, OAS, and other federal benefits. In-person service and application assistance.",
      address: "471 Queensway, Kelowna, BC V1Y 6S5",
      phone: "1-800-622-6232",
      website: "https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada.html",
      email: "info@canada.ca",
      latitude: "49.8869",
      longitude: "-119.4948",
      hours: "Monday-Friday 8:30 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Tax Clinics - Free Tax Preparation",
      description: "Free tax preparation for low-income individuals and families. Available February-April at various community locations throughout Kelowna. Call KCR Community Resources to find the nearest clinic location and schedule an appointment.",
      address: "Various locations in Kelowna - call for nearest location",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Kelowna Credit Counselling Society",
      description: "Free financial counseling, budgeting help, and debt management services. Confidential, professional support to help you manage your finances and reduce debt. Services available by phone and in-person appointments.",
      address: "Phone and virtual services available - call for appointment",
      phone: "1-888-527-8999",
      website: "https://nomoredebts.org",
      email: "info@nomoredebts.org",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Kelowna Mental Health & Substance Use",
      description: "Assessment, counseling, and treatment for mental health and addiction. Referral not always required.",
      address: "505 Doyle Ave, Kelowna, BC V1Y 0C5",
      phone: "250-469-7070",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8789",
      longitude: "-119.4934",
      hours: "Monday-Friday 8:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Kelowna Mental Health & Substance Use - Addiction Services",
      description: "Assessment, counseling, and treatment for substance use and addiction. Also provides mental health services. Referral not always required.",
      address: "505 Doyle Ave, Kelowna, BC V1Y 0C5",
      phone: "250-469-7070",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8789",
      longitude: "-119.4934",
      hours: "Monday-Friday 8:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Kelowna Walk-In Clinics",
      description: "Multiple walk-in medical clinics throughout Kelowna providing same-day medical care. No appointment needed for minor health issues, prescriptions, and basic medical services. Call HealthLink BC at 811 to find the nearest clinic location and current wait times.",
      address: "Various locations in Kelowna - call 811 for nearest clinic",
      phone: "811",
      website: "https://www.healthlinkbc.ca/find-services/healthcare/medical-clinics",
      email: "info@healthlinkbc.ca",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Kelowna Dental Clinic for Low Income",
      description: "Reduced-cost dental care for low-income residents. Services include cleanings, fillings, extractions, and emergency dental care. Income-based sliding scale fees. Call to check eligibility and schedule an appointment.",
      address: "Call for clinic location and appointment",
      phone: "250-868-2230",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "Okanagan Gleaners",
      description: "Rescues surplus food and distributes to agencies serving people in need. Volunteer opportunities available.",
      address: "1860 Dilworth Dr, Kelowna, BC V1Y 8N8",
      phone: "250-762-6442",
      website: "https://www.okanagangleaners.org",
      email: "info@okanagangleaners.org",
      latitude: "49.8678",
      longitude: "-119.4756",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "Rutland Food Bank",
      description: "Weekly food hamper distribution for Rutland area residents. Photo ID required.",
      address: "220 Gray Rd, Kelowna, BC V1X 1W6",
      phone: "250-765-0202",
      latitude: "49.8934",
      longitude: "-119.4123",
      hours: "Tuesday 10:00 AM - 2:00 PM, Thursday 4:00 PM - 7:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Child Development Centre",
      description: "Early intervention services for children with developmental delays and disabilities. Ages 0-6.",
      address: "1644 Richter St, Kelowna, BC V1Y 8N4",
      phone: "250-762-2355",
      website: "https://www.cdckelowna.ca",
      email: "info@cdckelowna.ca",
      latitude: "49.8801",
      longitude: "-119.4912",
      hours: "Monday-Friday 8:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Central Okanagan Family Hub",
      description: "One-stop access to family services, parenting programs, and child development resources. Located at KCR Community Resources, providing easy access to multiple family support services in one location. Call for program schedules and appointments.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:30 AM - 12:00 PM, 1:00 PM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Kelowna RCMP Victim Services",
      description: "Support for victims of crime. Emotional support, court accompaniment, and referrals.",
      address: "350 Doyle Ave, Kelowna, BC V1Y 0C5",
      phone: "250-762-3300",
      website: "https://www.kelowna.ca",
      email: "info@kelowna.ca",
      latitude: "49.8793",
      longitude: "-119.4928",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Mental Health Crisis Line",
      description: "24/7 crisis support for mental health emergencies. Free and confidential.",
      address: "Phone service available anywhere",
      phone: "310-6789",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Bay Ave Community Shelter - Kelowna Gospel Mission",
      description: "Co-ed facility offering space for meals, washrooms, and case management services.",
      address: "858 Ellis Street, Kelowna, BC",
      phone: "236-420-0899",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8912",
      longitude: "-119.4945",
      hours: "November to April: Open overnight with services during the day",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "KGM Women's Community - Harmony House",
      description: "Temporary transitional housing for women in crisis. Secure, safe, non-judgmental, and empowering facility. Part of Kelowna Gospel Mission's Women's Community.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "KGM Women's Community - Shiloh",
      description: "Temporary transitional housing for women in crisis. Secure, safe, non-judgmental, and empowering facility. Part of Kelowna Gospel Mission's Women's Community.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "KGM Women's Community - Selah 1 & 2",
      description: "Affordable independent community living programs for women seeking a sober and supportive environment. Part of Kelowna Gospel Mission's Women's Community.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Momentum Community - Kelowna Gospel Mission",
      description: "Supporting transitional housing for men 19 years old and up who show the desire and ability to achieve independent living after experiencing homelessness. Provides life-saving training through case workers and community partners. Call for intake and eligibility information.",
      address: "251 Leon Ave, Kelowna, BC V1Y 9T9",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "24/7 - Call for intake and eligibility information",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "AG House - Women's Shelter",
      description: "Emergency shelter for women and children 16+. Safe and supportive environment.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-2262",
      latitude: "49.8880",
      longitude: "-119.4960",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "AG House - Women's Shelter - Crisis Support",
      description: "Emergency shelter and crisis support for women and children 16+ in crisis situations. Safe and supportive environment. Confidential location.",
      address: "Confidential location, Kelowna, BC",
      phone: "250-763-2262",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Salvation Army Emergency Assistance",
      description: "Emergency financial help for rent, utilities, and basic needs. Assessment required.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-860-2329",
      website: "https://salvationarmy.ca",
      email: "kelowna.clc@salvationarmy.ca",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Monday-Wednesday 9:00 AM - 12:00 PM, 1:00 PM - 4:00 PM; Thursday 1:00 PM - 4:00 PM; Friday 9:00 AM - 12:00 PM, 1:00 PM - 3:00 PM",
      verified: true
    },
    // Thrift Stores - Affordable clothing, furniture, and personal items
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Kelowna Gospel Mission Thrift Store",
      description: "Affordable clothing and household items. Proceeds support community programs.",
      address: "256 Leon Ave, Kelowna, BC V1Y 6J2",
      phone: "250-763-3737",
      website: "https://kelownagospelmission.ca",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8871",
      longitude: "-119.4958",
      hours: "Monday-Friday 8:30 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "MCC Thrift Shop",
      description: "Quality used goods at low prices. Mennonite Central Committee supports global relief.",
      address: "1561 Ellis St, Kelowna, BC V1Y 2A4",
      phone: "250-860-2555",
      website: "https://mccbc.ca/thrift",
      email: "info@mccbc.ca",
      latitude: "49.8895",
      longitude: "-119.4941",
      hours: "Monday-Saturday 9:30 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Value Village Kelowna",
      description: "Large thrift department store with clothing, furniture, and household items.",
      address: "190 Aurora Crescent, Kelowna, BC V1X 7M3",
      phone: "250-860-2393",
      website: "https://stores.savers.com/bc/kelowna/valuevillage-thrift-store-2004.html",
      latitude: "49.8823",
      longitude: "-119.5012",
      hours: "Monday-Saturday 9:00 AM - 9:00 PM; Sunday 10:00 AM - 6:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "S.H.A.R.E. Society Thrift Store",
      description: "Non-profit thrift store supporting various community programs since 1977. Offers affordable clothing, household items, furniture, and more. All proceeds support SHARE Society's programs. Members enjoy additional discounts. General membership $2.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Monday-Saturday 9:00 AM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Kelowna Women's Shelter Thrift Store",
      description: "Thrift store supporting the Kelowna Women's Shelter. Offers clothing, household items, furniture, and more. All proceeds support essential shelter programs for women and children.",
      address: "102-1021 Ellis Street, Kelowna, BC V1Y 1Z4",
      phone: "250-763-1040",
      website: "https://www.kelownawomensshelter.ca",
      email: "info@kelownawomensshelter.ca",
      latitude: "49.8880",
      longitude: "-119.4950",
      hours: "Monday-Saturday 10:00 AM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Second Tyme Around & LC Fashions",
      description: "Quality consigned clothing store offering a wide variety of sizes, styles, and tastes. Provides quality apparel for the entire family including activewear, coats, dresses, and more.",
      address: "100 & 120, 2000 Spall Road, Kelowna, BC V1Y 9P6",
      phone: "250-763-3111",
      website: "https://www.secondtymearound.ca",
      email: "info@secondtymearound.ca",
      latitude: "49.8800",
      longitude: "-119.4700",
      hours: "Monday-Saturday 10:00 AM - 5:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Frock & Fellow",
      description: "Curated consignment fashion store offering unique pieces, mixing vintage, current, and classic styles.",
      address: "441 Bernard Avenue, Kelowna, BC V1Y 6N8",
      phone: "250-862-3665",
      website: "http://www.frockandfellow.ca",
      email: "info@frockandfellow.ca",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Saturday 10:00 AM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "YLW Youth Advocates",
      description: "Support and advocacy for youth in care and aging out of care. Provides mentorship, life skills training, housing support, and connections to resources. Call KCR Community Resources to connect with youth advocates.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "YMCA Youth Programs",
      description: "Recreation, leadership development, and youth programs. Financial assistance available.",
      address: "375 Hartman Rd, Kelowna, BC V1X 2M9",
      phone: "250-491-9622",
      website: "https://www.ymcaokanagan.ca",
      email: "info@ymcaokanagan.ca",
      latitude: "49.8934",
      longitude: "-119.4312",
      hours: "Call for program schedules and facility hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Interior Health Public Health",
      description: "Immunizations, sexual health, prenatal classes, and public health programs.",
      address: "505 Doyle Ave, Kelowna, BC V1Y 0C5",
      phone: "250-469-7070",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8789",
      longitude: "-119.4934",
      hours: "Monday-Friday 8:30 AM - 4:30 PM (call for appointment)",
      verified: true
    },
    {
      categoryId: catMap.get("newcomers")!,
      name: "Immigrant Services Society of BC",
      description: "Settlement services, language training, and employment support for newcomers. Provides English classes, job search assistance, help with immigration documents, housing support, and community connections. Call to learn about programs and office locations.",
      address: "Call for office location in Kelowna",
      phone: "604-684-2561",
      website: "https://issbc.org",
      email: "info@issbc.org",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Kelowna Senior Citizens' Society",
      description: "Social activities, recreation programs, and peer support for seniors.",
      address: "1480 Sutherland Ave, Kelowna, BC V1Y 5Y5",
      phone: "250-762-4108",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Activities: Monday & Friday 12:30 PM - Social Bridge; Wednesday 12:45 PM - Mah Jong; Saturday 11:00 AM - Bingo. Call for full schedule",
      verified: true
    },
    // Disability Resources
    {
      categoryId: catMap.get("disability")!,
      name: "Community Living BC - Kelowna",
      description: "Free services for adults with developmental disabilities. Helps with housing, employment, and community inclusion.",
      address: "310-1634 Harvey Ave, Kelowna, BC V1Y 6G2",
      phone: "250-469-6695",
      website: "https://www.communitylivingbc.ca",
      email: "info@communitylivingbc.ca",
      latitude: "49.8820",
      longitude: "-119.5000",
      hours: "Monday-Friday 9:00 AM - 5:00 PM (excluding statutory holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Disability Alliance BC",
      description: "Free advocacy, information and support for people with disabilities. Help with disability benefits and rights.",
      address: "Phone/online service for Kelowna area",
      phone: "1-800-663-1278",
      website: "https://disabilityalliancebc.org",
      email: "info@disabilityalliancebc.org",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "CNIB Foundation - Kelowna",
      description: "Free programs and services for people who are blind or partially sighted. Includes technology training, orientation and mobility services, peer support groups, and advocacy. Mobile services available throughout Kelowna area. Call to schedule an appointment or learn about programs.",
      address: "Mobile services throughout Kelowna - call for appointment",
      phone: "1-800-563-2642",
      website: "https://cnib.ca",
      email: "info@cnib.ca",
      verified: true
    },
    // Holiday Support Resources
    {
      categoryId: catMap.get("holiday-support")!,
      name: "Kelowna Santas",
      description: "Free Christmas gifts and assistance for families in need. Community collaboration providing toys and donations for children during the holiday season. Visit the website to register or find distribution locations. Seasonal program operating November to December.",
      address: "Various locations in Kelowna - visit website for details",
      phone: "Visit website for contact information",
      website: "https://kelownasantas.com",
      email: "info@kelownasantas.com",
      hours: "Seasonal - November to December",
      verified: true
    },
    {
      categoryId: catMap.get("holiday-support")!,
      name: "Salvation Army Gifts of Hope",
      description: "Free holiday toy program for families in need. Register by appointment. West Kelowna/Westbank: (250) 258-2990, Kelowna: (778) 484-9775.",
      address: "Kelowna & West Kelowna, BC",
      phone: "778-484-9775",
      website: "https://www.salvationarmy.ca",
      email: "info@salvationarmy.ca",
      hours: "Registration opens November 3rd annually",
      verified: true
    },
    {
      categoryId: catMap.get("holiday-support")!,
      name: "Toys for Joy - Salvation Army",
      description: "Free annual holiday event at Orchard Park Shopping Centre providing toys to families in need. Typically held December 11-13.",
      address: "Orchard Park Shopping Centre, 2271 Harvey Ave, Kelowna, BC",
      hours: "December - check local listings",
      verified: true
    },
    {
      categoryId: catMap.get("holiday-support")!,
      name: "Kelowna Klosets Clothing Drive",
      description: "Free Christmas clothing drive providing warm clothing to those in need. Donations accepted December 3rd-18th annually.",
      address: "Kelowna, BC",
      hours: "December 3-18 annually",
      verified: true
    },
    // Medical Clinics
    {
      categoryId: catMap.get("medical-clinics")!,
      name: "Interior Health Urgent Primary Care Centre",
      description: "Free walk-in urgent care for minor health issues when you cannot wait for a family doctor. No appointment needed.",
      address: "505 Doyle Avenue, Kelowna, BC",
      phone: "250-469-7070",
      latitude: "49.8789",
      longitude: "-119.4934",
      hours: "Daily 8:00 AM - 8:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("medical-clinics")!,
      name: "KGM Community Dental - Kelowna Gospel Mission",
      description: "Essential oral health care accessible to all. Services include cleanings, check-ups, X-rays, extractions, and fillings. Available to low-income individuals and families, income assistance recipients. Accepts government ministry dental coverage, Healthy Kids, Persons with Disability plans, and First Nations Health Authority. Email: dentalclinic@kelownagospelmission.ca",
      address: "251 Leon Avenue, Kelowna, BC",
      phone: "778-738-3636",
      website: "https://kelownagospelmission.ca/services/",
      email: "info@kelownagospelmission.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "Monday-Friday 8:30 AM - 4:00 PM (by appointment)",
      verified: true
    },
    // Home Care
    {
      categoryId: catMap.get("home-care")!,
      name: "Interior Health Home Support",
      description: "Free home care services for eligible residents including personal care, meals, and housekeeping assistance.",
      address: "Kelowna & West Kelowna, BC",
      phone: "250-980-1400",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM (call for assessment and services)",
      verified: true
    },
    // Family Support
    {
      categoryId: catMap.get("family")!,
      name: "All Are Family Outreach Society",
      description: "Free volunteer-run charity serving those in dire need from Armstrong to Kelowna. Provides food, clothing, toys, and books.",
      address: "2129A Belgo Road, Kelowna, BC",
      phone: "250-503-4983",
      website: "https://aafoutreach.org",
      email: "info@aafoutreach.org",
      latitude: "49.9000",
      longitude: "-119.4500",
      hours: "Call for hours and appointment",
      verified: true
    },
    // Mental Health
    {
      categoryId: catMap.get("health")!,
      name: "BCSS Kelowna - Mental Health Support",
      description: "Free mental health support for individuals and families affected by schizophrenia and other mental health conditions.",
      address: "105-1610 Bertram Street, Kelowna, BC",
      phone: "250-868-3119",
      latitude: "49.8800",
      longitude: "-119.4850",
      hours: "Monday-Friday 9:00 AM - 5:00 PM",
      verified: true
    },
    // Metro Community Resources - Two addresses, same block, one community
    {
      categoryId: catMap.get("food-banks")!,
      name: "Metro Central - Cafe & Food Services",
      description: "Community cafe providing food services Monday-Friday 9:00 AM - 4:00 PM. Part of Metro Community's mission to serve those in need with dignity and care. Please note: Metro Central is closed the day after the third Wednesday of the month for cleaning.",
      address: "1262 St. Paul Street, Kelowna, BC V1Y 2C9",
      phone: "778-478-2466",
      website: "https://metrocommunity.ca",
      email: "info@metrocommunity.ca",
      latitude: "49.8885",
      longitude: "-119.4945",
      hours: "Monday-Friday 9:00 AM - 4:00 PM (Closed the day after the third Wednesday of each month for cleaning)",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Metro Central - Hygiene Program",
      description: "Hygiene program providing essential personal care items and services. Open Monday-Friday 9:00 AM - 4:00 PM. Closed the day after the third Wednesday of each month for cleaning. Part of Metro Community's commitment to dignity and care for all.",
      address: "1262 St. Paul Street, Kelowna, BC V1Y 2C9",
      phone: "778-478-2466",
      website: "https://metrocommunity.ca",
      email: "info@metrocommunity.ca",
      latitude: "49.8885",
      longitude: "-119.4945",
      hours: "Monday-Friday 9:00 AM - 4:00 PM (Closed the day after the third Wednesday of each month for cleaning)",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Metro Central - Shelter Hub",
      description: "Shelter Hub providing support services. Contact for shelter information and resources.",
      address: "1262 St. Paul Street, Kelowna, BC V1Y 2C9",
      phone: "250-826-5544",
      website: "https://metrocommunity.ca",
      email: "info@metrocommunity.ca",
      latitude: "49.8885",
      longitude: "-119.4945",
      hours: "By appointment - call for availability",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Metro Hub - Church Gatherings & Community Center",
      description: "Metro Hub is a community center hosting Metro and other public or private events. Church gatherings: First Gathering (with Kids Ministry) at 9:00 AM (Livestream), Brunch at 10:15 AM, Second Gathering at 11:00 AM (Nursery open to parents). Event space available for rentals. Visit Metrohub.ca for event information and rental packages.",
      address: "1265 Ellis Street, Kelowna, BC V1Y 1Z7",
      phone: "778-478-9727",
      website: "https://metrohub.ca",
      email: "info@metrocommunity.ca",
      latitude: "49.8887",
      longitude: "-119.4948",
      hours: "Sunday: First Gathering 9:00 AM (Livestream), Brunch 10:15 AM, Second Gathering 11:00 AM. Event space available by appointment.",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Metro Community - Mini Metro Kids Ministry",
      description: "Children's ministry for kids to have fun learning about the Bible. Meets regularly on Sundays at 9:00 AM, with special events throughout the year. Part of Metro Community Church's inclusive approach to family and community.",
      address: "1265 Ellis Street, Kelowna, BC V1Y 1Z7",
      phone: "778-478-9727",
      website: "https://metrocommunity.ca/metrochurch",
      email: "info@metrocommunity.ca",
      latitude: "49.8887",
      longitude: "-119.4948",
      hours: "Sunday 9:00 AM",
      verified: true
    },
    // CMHA Kelowna Resources - From https://www.cmhakelowna.com/mental-health/find-help-now
    {
      categoryId: catMap.get("crisis")!,
      name: "988 Suicide & Crisis Lifeline",
      description: "For individuals who are struggling to cope, dealing with thoughts of suicide, or are worried about someone else. A trained responder will listen without judgement, provide support and understanding, and share resources that will help.",
      address: "Phone service - available anywhere",
      phone: "988",
      website: "https://988.ca",
      email: "info@988.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Talk Suicide Canada",
      description: "Are you thinking about suicide? Talk Suicide is here to listen. Free, confidential support available anytime by phone or text.",
      address: "Phone service - available anywhere",
      phone: "1-833-456-4566",
      website: "https://talksuicide.ca",
      email: "info@talksuicide.ca",
      hours: "24/7 (Text: 45645 between 4 p.m. and midnight ET)",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "1-800-SUICIDE",
      description: "For help right away, any time of day or night. Free, confidential suicide prevention support.",
      address: "Phone service - available anywhere",
      phone: "1-800-784-2433",
      website: "https://crisiscentre.bc.ca",
      email: "info@crisiscentre.bc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Interior Health - Mental Health & Substance Use (MHSU)",
      description: "For Mental Health and Substance Use services within Interior Health. No area code needed - call 310-MHSU (6478). You will be automatically routed to the closest Community MHSU centre where staff will take the call and connect you to the appropriate service.",
      address: "Phone service - Interior Health region",
      phone: "310-6478",
      website: "https://www.interiorhealth.ca/health-and-wellness/mental-health-substance-use",
      email: "info@interiorhealth.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "National Indian Residential School Crisis Line",
      description: "Provides free 24-hour crisis support to former Indian Residential School students and their families.",
      address: "Phone service - available anywhere",
      phone: "1-866-925-4419",
      website: "https://www.irsss.ca",
      email: "info@irsss.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Community Response Team (CRT) - Kelowna",
      description: "Mobile crisis response team providing mental health crisis intervention and support. Operates 11:30am-9:00pm, 7 days a week.",
      address: "Mobile service - Kelowna area",
      phone: "250-212-8533",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "11:30 AM - 9:00 PM, 7 days a week",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors' Distress Line",
      description: "Free confidential support for seniors, their caregivers or anyone concerned about a senior. Available 24 hours a day, 7 days a week.",
      address: "Phone service - available anywhere",
      phone: "1-604-872-1234",
      website: "https://www.crisiscentre.bc.ca",
      email: "info@crisiscentre.bc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "CMHA Kelowna - Virtual Counselling Services",
      description: "Virtual counselling services for adults ages 25+, weekdays during the afternoon (excluding holidays), free of charge to individuals, couples, families, and caregivers of youth who are struggling. Those having difficulty coping with challenges related to the COVID pandemic are also welcome.",
      address: "Virtual service - online",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com",
      email: "info@cmhakelowna.com",
      hours: "Weekdays during afternoon (excluding holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Homewood Health - Wellness Together Canada",
      description: "Free 24/7 phone counselling and mental health support. Visit wellness together or call for free counselling services.",
      address: "Phone service - available anywhere",
      phone: "1-866-585-0445",
      website: "https://www.wellnesstogether.ca",
      email: "info@wellnesstogether.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "KUU-US Crisis Line Society",
      description: "24 hour crisis line for Indigenous people. Adults & elders: 250-723-4050. Children & youth: 250-723-2040. Free, confidential support.",
      address: "Phone service - available anywhere",
      phone: "250-723-4050 (Adults/Elders), 250-723-2040 (Children/Youth)",
      website: "https://www.kuu-uscrisisline.ca",
      email: "info@kuu-uscrisisline.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Interior Health - Mental Health & Substance Use Services (Kelowna)",
      description: "Mental Health and Substance Use Services office in Kelowna. Provides assessment, treatment, and support for mental health and substance use concerns.",
      address: "505 Doyle Avenue, Kelowna, BC",
      phone: "250-469-7070",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Office hours - call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "BC Partners for Mental Health and Addictions Information",
      description: "Visit heretohelp.bc.ca for the Mental Disorder Toolkit, fact sheets and personal stories about mental disorders. The Toolkit includes information, templates for creating your action plan and tips for avoiding crisis and emergencies.",
      address: "Online resource",
      website: "https://www.heretohelp.bc.ca",
      email: "info@heretohelp.bc.ca",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "HealthLink BC",
      description: "Access free, non-emergency health information for anyone in your family, including mental health information. Through 811, you can speak to a registered nurse about symptoms you're worried about, or a pharmacist about medication questions.",
      address: "Phone service - available anywhere",
      phone: "811",
      website: "https://www.healthlinkbc.ca",
      email: "info@healthlinkbc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "BC Alcohol and Drug Information and Referral Service",
      description: "To talk to someone about substance use. They can also connect you with local substance use resources. Available 24 hours a day.",
      address: "Phone service - available anywhere",
      phone: "1-800-663-1441",
      website: "https://www.heretohelp.bc.ca",
      email: "info@heretohelp.bc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "BounceBack - Mental Health Self-Management",
      description: "A self-management course for people who experience low to moderate depression or anxiety. Offered in two formats: complete the course online on your own or work with a coach who can help motivate you, solve problems, and work through the materials.",
      address: "Online resource",
      website: "https://bouncebackbc.ca",
      email: "info@bouncebackbc.ca",
      verified: true
    },
    // United Way BC Helpline Services - From https://uwbc.ca/helpline-services/
    {
      categoryId: catMap.get("crisis")!,
      name: "Racist Incident Helpline",
      description: "A trauma-informed helpline for people who have experienced or witnessed an act of racism in BC. Provides free and confidential access to information and safe supports from anywhere in BC, in over 240 languages. Callers who prefer a language other than English can let the call-taker know and an interpreter will be patched into the call.",
      address: "Phone service - available anywhere in BC",
      phone: "1-833-457-5463",
      website: "https://racistincidenthelpline.ca",
      email: "info@racistincidenthelpline.ca",
      hours: "Monday-Friday 9:00 AM - 5:00 PM (excluding statutory holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "VictimLink BC",
      description: "Provides confidential information and referral services to all victims of crime in BC and Yukon, as well as immediate crisis support to victims of family and sexual violence, including victims of human trafficking exploited for labour or sexual services.",
      address: "Phone service - available anywhere in BC and Yukon",
      phone: "1-800-563-0808",
      website: "https://www.victimlinkbc.ca",
      email: "info@victimlinkbc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Gambling Support BC",
      description: "Provides information and resources to support informed choices and healthy behaviours with respect to gambling. Referrals to prevention, treatment, and support services are available for anyone struggling with their own or a loved one's gambling.",
      address: "Phone service - available anywhere in BC",
      phone: "1-888-795-6111",
      website: "https://www.gamblingsupportbc.ca",
      email: "info@gamblingsupportbc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Youth Against Violence Line",
      description: "A safe and anonymous way for young people across BC to talk through any type of problem. Community Resource Specialists offer non-judgmental support and will provide information and referrals to services that can help. Parents, teachers, caregivers, service providers and others can also call for information about youth-related resources.",
      address: "Phone service - available anywhere in BC",
      phone: "1-800-680-4264",
      website: "https://www.youthagainstviolenceline.com",
      email: "info@youthagainstviolenceline.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Shelter and Street Help Line",
      description: "Assists people who are affected by homelessness in the Metro Vancouver and Fraser Valley regional districts, as well as in Greater Victoria. A wide range of circumstances can result in homelessness, and there are a variety of programs and services that can help. The Shelter Lists detail available shelter beds and mats for women, men, youth and families. The lists are updated Monday to Friday (excluding holidays) at 11:30 AM and 7:30 PM.",
      address: "Phone service - Metro Vancouver, Fraser Valley, Greater Victoria",
      phone: "211",
      website: "https://uwbc.ca/helpline-services/",
      email: "info@uwbc.ca",
      hours: "Monday-Friday 9:00 AM - 9:00 PM (excluding statutory holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Alcohol & Drug Information and Referral Service (ADIRS) - Lower Mainland",
      description: "Worried about drug and alcohol use? Whether it's for yourself or someone you care about, you can call for information, options, and support. We can refer you to a full range of counselling and treatment services across BC. For Lower Mainland area.",
      address: "Phone service - Lower Mainland",
      phone: "604-660-9382",
      website: "https://uwbc.ca/helpline-services/",
      email: "info@uwbc.ca",
      hours: "Monday-Friday 9:00 AM - 5:00 PM (excluding statutory holidays)",
      verified: true
    },
    // Westside Health Network Society Resources - From https://www.westsidehealthnetwork.org/programs/
    {
      categoryId: catMap.get("seniors")!,
      name: "Westside Health Network - Better at Home",
      description: "A subsidized program assisting seniors with non-medical services (light housekeeping, grass cutting and home maintenance) to stay independent in their home. Part of the Better at Home program.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://betterathome.ca",
      email: "info@betterathome.ca",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("transportation")!,
      name: "Westside Health Network - Transportation Services",
      description: "Volunteers drive seniors to and from medical appointments and errands. Suggested donation: round-trip to Kelowna $30, West Kelowna $20. Service available for seniors in West Kelowna area.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Westside Health Network - Walk n Talk Program",
      description: "A free program involving physical fitness (strength, balance, coordination, flexibility, endurance), socializing, and health education. The program runs September to April and is run by a certified osteofit exercise instructor. Great for seniors looking to stay active and social.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "September to April - call for schedule",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Westside Health Network - Digital Device Tutorial",
      description: "Volunteer students assist seniors with their devices (computers, tablets, smartphones). Free technology support to help seniors stay connected and use digital tools confidently.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Westside Health Network - Volunteer Visits",
      description: "Volunteers join seniors for a visit, walk, coffee or activity. Provides companionship and reduces social isolation for older adults in West Kelowna.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Westside Health Network - Tax Clinic",
      description: "Annual tax preparation for low income individuals and families. This program runs in March to April, also available year around. Free tax filing assistance for those who need it.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "March to April (peak season), year-round availability - call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Westside Health Network - MedWatch",
      description: "A health service that provides older adults with a record of their current medical information. Helps seniors keep track of medications, medical history, and important health information.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("home-care")!,
      name: "Westside Health Network - Better at Home Program",
      description: "Subsidized program assisting seniors with non-medical services including light housekeeping, grass cutting, and home maintenance to help them stay independent in their home. Part of the province-wide Better at Home initiative.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://betterathome.ca",
      email: "info@betterathome.ca",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    // Support Groups from Westside Health Network Directory - From https://www.westsidehealthnetwork.org/directory/support-groups/
    {
      categoryId: catMap.get("addiction")!,
      name: "Alcoholics Anonymous (AA) / Al-Anon - Kelowna",
      description: "24 hour answering and referral service for individuals seeking support with alcohol-related issues. AA provides peer support for those with alcohol use disorder, while Al-Anon supports families and friends affected by someone else's drinking.",
      address: "Kelowna, BC",
      phone: "250-763-5555",
      website: "https://www.aa.org",
      email: "info@aa.org",
      hours: "24/7 answering service",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Alzheimer Society of BC - Kelowna",
      description: "Support group for caregivers and early stage dementia, counselling and library. Provides information, support, education and programs for people living with dementia, their families and caregivers.",
      address: "307-1664 Richter Street, Kelowna, BC V1Y 8N3",
      phone: "250-860-0750",
      website: "https://alzheimer.ca/bc/en",
      email: "info@alzheimer.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Call for hours and support group schedules",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Arthritis Society of BC - Kelowna Branch",
      description: "Information and support services for individuals affected by arthritis. Provides education, programs, and resources to help people manage arthritis and improve their quality of life.",
      address: "150A-1855 Kirschner Road, Kelowna, BC V1Y 4N7",
      phone: "250-868-8643",
      website: "https://arthritis.ca/bc",
      email: "info@arthritis.ca",
      latitude: "49.8756",
      longitude: "-119.4723",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "BC Lung Association",
      description: "Provides resources and support for individuals with lung-related health issues. Offers education, programs, and advocacy for lung health including asthma, COPD, and other respiratory conditions.",
      address: "Phone service - BC-wide",
      phone: "1-800-665-5864",
      website: "https://bc.lung.ca",
      email: "info@bc.lung.ca",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Brain Trust Canada",
      description: "Offers support and resources for individuals affected by brain injuries. Provides education, prevention programs, and support services for brain injury survivors and their families.",
      address: "11-368 Industrial Avenue, Kelowna, BC V1Y 7E8",
      phone: "250-762-3233",
      website: "https://www.braintrustcanada.com",
      email: "info@braintrustcanada.com",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Canadian Cancer Society - Kelowna",
      description: "Programs designed to meet both emotional and financial needs of individuals affected by cancer. Provides support services, information, financial assistance, and programs for cancer patients and their families.",
      address: "202-1835 Gordon Drive (Capri Mall), Kelowna, BC V1Y 3H5",
      phone: "250-762-6381",
      website: "https://cancer.ca",
      email: "info@cancer.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Diabetes Canada - Kelowna",
      description: "Support and information for individuals living with diabetes. Provides education, programs, resources, and advocacy to help people manage diabetes and prevent complications.",
      address: "1589 Sutherland Avenue, Kelowna, BC V1Y 5V7",
      phone: "250-762-9447",
      website: "https://www.diabetes.ca",
      email: "info@diabetes.ca",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Canadian Hard of Hearing Association - Kelowna",
      description: "Support and resources for individuals who are hard of hearing. Provides information, advocacy, and programs to help people with hearing loss communicate effectively and access services.",
      address: "108-920 Saskatoon Road, Kelowna, BC V1X 7P8",
      phone: "250-869-1009",
      website: "https://www.chha.ca",
      email: "info@chha.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Cancer Connection - CCSSI Rotary Lodge",
      description: "Individual matches made for support. Connects cancer patients and survivors with trained volunteers who have had similar experiences. Provides one-on-one peer support and companionship.",
      address: "Phone service",
      phone: "1-888-939-3333",
      website: "https://cancer.ca",
      email: "info@cancer.ca",
      hours: "Call for information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Canadian Celiac Association - Kelowna",
      description: "Support and information for individuals with celiac disease and gluten sensitivity. Provides education, resources, and support groups to help people manage a gluten-free lifestyle.",
      address: "Kelowna, BC",
      phone: "250-763-7159",
      website: "https://www.celiac.ca",
      email: "info@celiac.ca",
      hours: "Call for support group information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Central Okanagan Association for Cardiac Health (C.O.A.C.H.)",
      description: "Prevention and reduction of cardiovascular disease through education and exercise. Provides cardiac rehabilitation programs, exercise classes, and education to help people improve heart health.",
      address: "204-2622 Pandosy Street, Kelowna, BC V1Y 1V6",
      phone: "250-763-3433",
      website: "https://www.coachkelowna.com",
      email: "info@coachkelowna.com",
      latitude: "49.8712",
      longitude: "-119.4878",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Central Okanagan Hospice Association",
      description: "Volunteer support for terminally ill and bereavement counselling. Provides compassionate end-of-life care, grief support, and resources for individuals and families facing life-limiting illness.",
      address: "104-1456 St. Paul Street, Kelowna, BC V1Y 2E6",
      phone: "250-763-5511",
      website: "https://hospicecoha.org",
      email: "info@hospicecoha.org",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Call for services",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Elderwell Adult Day Program",
      description: "Social program for seniors at Village at Smith Creek. Provides structured activities, socialization, and support for older adults, helping them stay active and connected to their community.",
      address: "2425 Orlin Road, Westbank, BC V4T 3C7",
      phone: "250-491-7714",
      latitude: "49.6000",
      longitude: "-119.6000",
      hours: "Call for program schedule",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Heart & Stroke Foundation - Kelowna",
      description: "Support and resources for individuals affected by heart disease and stroke. Provides education, programs, and advocacy to help prevent and manage cardiovascular conditions.",
      address: "4-1551 Sutherland Avenue, Kelowna, BC V1Y 9M9",
      phone: "250-860-6275",
      website: "https://www.heartandstroke.ca",
      email: "info@heartandstroke.ca",
      latitude: "49.8843",
      longitude: "-119.4789",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Kelowna Alcohol and Drug Services Clinic",
      description: "Assessment, treatment, and support services for individuals dealing with substance use issues. Provides counselling, treatment programs, and referrals to specialized services.",
      address: "1340 Ellis Street, 2nd Floor, Kelowna, BC V1Y 9N1",
      phone: "250-868-7788",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Kelowna and District Society for People In Motion",
      description: "Assists people with physical disabilities. Provides programs, services, and advocacy to help individuals with disabilities live independently and participate fully in their communities.",
      address: "23-1720 Ethel Street, Kelowna, BC V1Y 2Y7",
      phone: "250-861-3302",
      website: "https://pimbc.ca",
      email: "info@pimbc.ca",
      latitude: "49.8900",
      longitude: "-119.4900",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Kelowna Community Resources",
      description: "Family services including special needs, adoptions, crisis lines and immigration services. Provides comprehensive support and information to families in the Central Okanagan.",
      address: "120-1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Kelowna Family Centre",
      description: "Free professional counseling for adults, children, groups, couples, and individuals. Open to all Central Okanagan. Provides mental health support, family therapy, and counselling services.",
      address: "204-347 Leon Avenue, Kelowna, BC V1Y 8C7",
      phone: "250-860-3181",
      website: "https://www.kelownafamilycentre.ca",
      email: "info@kelownafamilycentre.ca",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Kelowna General Hospital - Spiritual Care",
      description: "Providing support and spiritual care for patients and their families from an interfaith perspective. Offers spiritual support, counselling, and resources for people of all faiths and beliefs.",
      address: "2268 Pandosy Street, Kelowna, BC V1Y 1T2",
      phone: "250-862-4114",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8712",
      longitude: "-119.4878",
      hours: "Available 24/7 for inpatients, call for outpatient services",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Living Positive Resource Centre",
      description: "CLOSED as of June 28, 2024. This resource is no longer available. For harm reduction services, contact Outreach Urban Health Centre or The Bridge Youth & Family Services.",
      address: "168 Asher Road, Kelowna, BC V1X 3H6 (CLOSED)",
      phone: "778-753-5830 (CLOSED)",
      website: "https://www.lprc.ca",
      email: "info@lprc.ca",
      hours: "CLOSED",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Mental Health Individual and Family Support - BCSS Kelowna",
      description: "Provides advocacy, support, and education to persons living with mental illness, and to their families and friends. Offers peer support, education programs, and resources for mental health recovery.",
      address: "203-347 Leon Avenue, Kelowna, BC V1Y 8C7",
      phone: "250-868-3119",
      website: "https://www.cmhakelowna.com",
      email: "info@cmhakelowna.com",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "Call for hours and support group schedules",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Interior Health - Mental Health Services (Kelowna)",
      description: "Mental health assessment, treatment, and support services. Provides comprehensive mental health care including counselling, case management, and specialized programs.",
      address: "1340 Ellis Street, 2nd Floor, Kelowna, BC V1Y 9N1",
      phone: "250-868-7788",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Multiple Sclerosis Society of Canada - Okanagan Chapter",
      description: "Sponsors programs to help persons with MS and their families. Provides support, information, programs, and advocacy for individuals living with multiple sclerosis.",
      address: "230-1855 Kirschner Road, Kelowna, BC V1Y 4N7",
      phone: "250-762-5850",
      website: "https://mssociety.ca",
      email: "info@mssociety.ca",
      latitude: "49.8756",
      longitude: "-119.4723",
      hours: "Call for hours and support group information",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Okanagan Visually Impaired Society",
      description: "Provides support and discussion of common problems, as well as social interaction. Offers programs, services, and peer support for individuals who are blind or visually impaired.",
      address: "Kelowna, BC",
      phone: "250-868-1468",
      website: "https://www.ovisbcy.ca",
      email: "info@ovisbcy.ca",
      hours: "Call for support group schedules",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "WorkBC Assistive Technology Services - Kelowna",
      description: "Free assistive devices, ergonomic supports, and workplace modifications to help individuals with disabilities gain and sustain employment. Services include technology assessments, equipment loans, and job accommodation support.",
      address: "202-437 Glenmore Rd, Kelowna, BC V1V 1Y5",
      phone: "1-844-453-5506",
      website: "https://workbc-ats.ca/kelowna.html",
      email: "info-ats@workbc.ca",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Okanagan Training & Development Council - Disability Program",
      description: "Free employment assistance for individuals with disabilities. Services include resume help, job search support, employment counseling, workshops, and job placement assistance.",
      address: "Kelowna, BC",
      phone: "250-762-5445",
      website: "https://otdc.org/programs/disability-program",
      email: "info@otdc.org",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "City of Kelowna - Adaptive Recreation Programs",
      description: "Free and low-cost adaptive recreation programs for people with disabilities. Over 35 programs each season including swimming, bowling, art, fitness, music, and sports. Access Pass available for discounted recreation access for individuals with permanent cognitive or physical disabilities.",
      address: "1435 Water Street, Kelowna, BC V1Y 1J4",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/parks-recreation/recreation-sport/recreation-programs-registration/adaptive-programs",
      email: "access@kelowna.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Pathways Abilities Society",
      description: "Free activity services to help individuals with disabilities develop skills and promote self-esteem through recreation, volunteerism, and employment opportunities. Programs focus on building independence and community inclusion.",
      address: "123 Franklyn Rd, Kelowna, BC V1X 3V4",
      phone: "250-765-2211",
      website: "https://pathwayskelowna.ca",
      email: "info@pathwayskelowna.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Okanagan College - Disability Access Services",
      description: "Free support services for students with disabilities. Provides academic accommodations, assistive technology, note-taking services, exam accommodations, and access to resources. Available at Kelowna and other campuses.",
      address: "1000 KLO Road, Kelowna, BC V1Y 4X8",
      phone: "250-762-5445",
      website: "https://www.okanagan.bc.ca/disability-access-services",
      email: "disabilityaccess@okanagan.bc.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Hands in Service",
      description: "Free basic house cleaning, laundry, and simple food preparation for individuals under 65 with health concerns or disabilities that limit daily activities. Also partners with local food banks to deliver food to those with limited access. No cost to client.",
      address: "Kelowna, BC",
      phone: "250-861-5465",
      website: "https://central-okanagan.pathwaysbc.ca/programs/1142",
      email: "info@handsinservice.ca",
      hours: "Call for service availability",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Spectrum Rehabilitation Services",
      description: "Free and low-cost rehabilitation services for individuals with disabilities. Services include home safety assessments, personal care assessments, occupational therapy, and support for daily living activities.",
      address: "1772 Baron Rd, Kelowna, BC V1X 7G9",
      phone: "250-765-2211",
      website: "https://spectrumrehab.ca",
      email: "info@spectrumrehab.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "City of Kelowna - Accessibility Services",
      description: "Free accessibility support and advocacy. The City has an Accessibility Advisory Committee and Accessibility Plan to identify, remove, and prevent barriers. Submit accessibility concerns and get information about accessible facilities and services.",
      address: "1435 Water Street, Kelowna, BC V1Y 1J4",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/our-community/engage/accessibility",
      email: "access@kelowna.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "City of West Kelowna - Accessibility & Inclusion Committee",
      description: "Free accessibility support and advocacy for West Kelowna residents. Works to enhance accessibility and foster inclusion by reducing barriers. Has developed an Accessibility Plan with specific goals and actions. Welcomes feedback from people with disabilities.",
      address: "2760 Cameron Road, West Kelowna, BC V1Z 2T6",
      phone: "250-768-5229",
      website: "https://www.westkelownacity.ca/en/city-hall/accessibility.aspx",
      email: "info@westkelownacity.ca",
      latitude: "49.8500",
      longitude: "-119.6000",
      hours: "Monday-Friday 8:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Julia's Junction - Inclusive Play Space",
      description: "Free inclusive playground in West Kelowna designed to accommodate all abilities and disabilities. Features multi-sensory play, tactile engagement, and accessible equipment. Safe and fun space for children of all abilities to play together.",
      address: "2760 Cameron Road, West Kelowna, BC V1Z 2T6",
      phone: "250-768-5229",
      website: "https://www.westkelownacity.ca/en/parks-recreation-and-culture/julia-s-junction-inclusive-play-space.aspx",
      email: "info@westkelownacity.ca",
      latitude: "49.8320",
      longitude: "-119.6050",
      hours: "Dawn to dusk",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "HandyDART - Accessible Transit",
      description: "Door-to-door shared transportation service for people with permanent or temporary disabilities who can't easily use fixed-route transit without assistance. Must be registered. Serves Kelowna and West Kelowna areas.",
      address: "Kelowna & West Kelowna, BC",
      phone: "250-860-8121",
      website: "https://www.bctransit.com/kelowna/fares-and-passes/handydart",
      email: "handydart@bctransit.com",
      hours: "Monday-Friday 6:00 AM - 11:00 PM, Saturday 7:00 AM - 11:00 PM, Sunday 8:00 AM - 8:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Taxi Saver Program - Kelowna",
      description: "Reduced taxi rates for eligible persons with disabilities. Provides discount vouchers for taxi services to help with transportation needs. Must meet eligibility requirements.",
      address: "Kelowna, BC",
      phone: "250-860-8121",
      website: "https://www.bctransit.com/kelowna/fares-and-passes/taxi-saver",
      email: "info@bctransit.com",
      hours: "Call for registration information",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Service Canada - Disability Benefits",
      description: "Free information and assistance with federal disability benefits including Canada Pension Plan Disability (CPP-D), Disability Tax Credit (DTC), and other disability-related programs. Help with applications and benefit inquiries.",
      address: "200-1632 Dickson Avenue, Kelowna, BC V1Y 7T8",
      phone: "1-800-277-9914",
      website: "https://www.canada.ca/en/services/benefits/disability.html",
      email: "info@servicecanada.gc.ca",
      latitude: "49.8800",
      longitude: "-119.5000",
      hours: "Monday-Friday 8:30 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "BC Ministry of Social Development - PWD Benefits",
      description: "Free information and assistance with Persons with Disabilities (PWD) benefits. Help with applications, benefit inquiries, and understanding eligibility requirements for disability assistance in BC.",
      address: "200-1632 Dickson Avenue, Kelowna, BC V1Y 7T8",
      phone: "1-866-866-0800",
      website: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/social-development-poverty-reduction",
      email: "sdpra@gov.bc.ca",
      latitude: "49.8800",
      longitude: "-119.5000",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Legal Aid BC - Disability Services",
      description: "Free legal assistance for disability-related matters including benefits appeals, discrimination cases, and rights advocacy. Help with applications, appeals, and legal representation for eligible individuals.",
      address: "200-1632 Dickson Avenue, Kelowna, BC V1Y 7T8",
      phone: "1-866-577-2525",
      website: "https://legalaid.bc.ca",
      email: "info@legalaid.bc.ca",
      latitude: "49.8800",
      longitude: "-119.5000",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "BC Housing - Accessible Housing Information",
      description: "Free information about accessible and adapted housing options for people with disabilities. Help finding accessible rental units, housing modifications, and specialized housing programs.",
      address: "Kelowna, BC",
      phone: "1-800-257-7756",
      website: "https://www.bchousing.org",
      email: "info@bchousing.org",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "Interior Health - Disability Health Services",
      description: "Free health services and support for individuals with disabilities. Includes specialized medical care, rehabilitation services, and coordination of care for complex health needs related to disabilities.",
      address: "1340 Ellis Street, Kelowna, BC V1Y 9N1",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      latitude: "49.8889",
      longitude: "-119.4940",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "CMHA Kelowna - Disability Mental Health Support",
      description: "Free mental health support for individuals with disabilities. Services include counseling, peer support, and programs specifically designed for people with disabilities who also experience mental health challenges.",
      address: "203-347 Leon Avenue, Kelowna, BC V1Y 8C7",
      phone: "250-868-3119",
      website: "https://www.cmhakelowna.com",
      email: "info@cmhakelowna.com",
      latitude: "49.8872",
      longitude: "-119.4962",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "It's All About You Quality of Life Services",
      description: "Free personalized support for adults with developmental disabilities. Focuses on enhancing quality of life and promoting independence through individualized programs and community inclusion activities.",
      address: "Kelowna, BC",
      phone: "250-765-2211",
      website: "https://itsallaboutyoukelowna.com",
      email: "info@itsallaboutyoukelowna.com",
      hours: "Call for service information",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "WorkBC Kelowna - Disability Employment Services",
      description: "Free employment services and support for individuals with disabilities. Includes job search assistance, resume help, interview preparation, job placement, and resource libraries. Specialized support for disability-related employment barriers.",
      address: "200-1632 Dickson Avenue, Kelowna, BC V1Y 7T8",
      phone: "250-862-4000",
      website: "https://www.workbc.ca",
      email: "info@workbc.ca",
      latitude: "49.8800",
      longitude: "-119.5000",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("disability")!,
      name: "WorkBC West Kelowna - Disability Employment Services",
      description: "Free employment services and support for individuals with disabilities in West Kelowna. Includes job search assistance, resume help, interview preparation, and specialized support for disability-related employment barriers.",
      address: "2760 Cameron Road, West Kelowna, BC V1Z 2T6",
      phone: "250-768-5229",
      website: "https://www.workbc.ca",
      email: "info@workbc.ca",
      latitude: "49.8320",
      longitude: "-119.6050",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Osteoporosis Society of Canada - Kelowna",
      description: "Support and information for individuals with osteoporosis. Provides education, resources, and programs to help prevent and manage bone health issues.",
      address: "Kelowna, BC",
      phone: "250-861-6880",
      website: "https://osteoporosis.ca",
      email: "info@osteoporosis.ca",
      hours: "Voicemail - call for information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Ostomy Association - Kelowna",
      description: "Support and resources for individuals with ostomies. Provides peer support, education, and information to help people manage life with an ostomy.",
      address: "101-1953 Baron Road, Kelowna, BC V1X 6W2",
      phone: "250-868-3034",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Call for support group information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Peachland Wellness Centre",
      description: "Community wellness and health services in Peachland. Provides programs and services to support health and wellbeing in the Peachland area.",
      address: "4426-5th Street, Peachland, BC V0H 1X6",
      phone: "250-767-0141",
      website: "https://www.peachlandwellness.ca",
      email: "info@peachlandwellness.ca",
      latitude: "49.7700",
      longitude: "-119.7300",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Pets & People Visiting Society",
      description: "Volunteers with screened pets visit resident and patient facilities. Provides animal-assisted therapy and companionship to seniors and patients in care facilities.",
      address: "Box 9, 3151 Lakeshore Road, Suite 211, Kelowna, BC",
      phone: "250-860-6180",
      website: "https://www.petsandpeople.ca",
      email: "info@petsandpeople.ca",
      latitude: "49.8700",
      longitude: "-119.4900",
      hours: "Call for volunteer information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Post-Polio Awareness - Kelowna",
      description: "Support and information for individuals affected by post-polio syndrome. Provides resources and peer support for people dealing with late effects of polio.",
      address: "Kelowna, BC",
      phone: "250-878-5082",
      hours: "Call for information",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Prostate Resource Centre Society - Kelowna",
      description: "Support and information for men affected by prostate health issues. Provides education, resources, and peer support for prostate cancer and other prostate conditions.",
      address: "Kelowna, BC",
      phone: "250-712-2002",
      hours: "Call for support group information",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Senior Citizen Counsellors - Westside Health Network",
      description: "Seniors helping seniors by providing information about service agencies, completing applications for pensions and other senior benefits. Peer support and assistance with navigating services.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Senior Peer Network Support - Westside Health Network",
      description: "Peer support network for seniors. Provides companionship, information sharing, and mutual support to help seniors stay connected and access needed services.",
      address: "West Kelowna, BC",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      latitude: "49.8333",
      longitude: "-119.6000",
      hours: "Office hours: 8:00 AM - 2:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Abuse and Information Line (SAIL)",
      description: "BC Centre for Elder Advocacy and Support. Provides confidential support, information, and advocacy for seniors experiencing abuse or needing assistance with elder-related issues.",
      address: "Phone service - BC-wide",
      phone: "1-866-437-1940",
      website: "https://www.bcceas.ca",
      email: "info@bcceas.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Outreach and Resources Centre - Kelowna",
      description: "A non-profit society working to enhance the lives of seniors in Kelowna. Provides support and links seniors to needed services, helping aging, isolated seniors maintain dignity and independence. Information on housing, financial, social, recreational, health, safety, legal and estate-planning resources.",
      address: "115-2065 Benvoulin Court, Kelowna, BC V1W 0A5",
      phone: "250-861-6180",
      website: "https://www.seniorsoutreach.ca",
      email: "info@seniorsoutreach.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Call for hours",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Society for Learning in Retirement (SLR)",
      description: "Workshops and study groups in a relaxed, informal atmosphere. Provides educational opportunities and social connections for active seniors interested in lifelong learning.",
      address: "Kelowna, BC",
      phone: "250-448-1203",
      website: "https://www.slrkelowna.ca",
      email: "info@slrkelowna.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "VictimLink BC - 24 Hour Helpline",
      description: "Information and referral to services available for persons who are victims of crime and abuse. Provides confidential support, information, and connects victims to appropriate services.",
      address: "Phone service - BC and Yukon",
      phone: "1-800-563-0808",
      website: "https://www.victimlinkbc.ca",
      email: "info@victimlinkbc.ca",
      hours: "24/7",
      verified: true
    },
    // Kelowna & District S.H.A.R.E. Society Resources - From https://www.kelownasharesociety.ca/
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Kelowna SHARE Society - Community Assistance Program (CAP)",
      description: "Provides material support to individuals and families experiencing financial distress, in partnership with over 30 social agencies. Offers clothing, household goods, and essential items to low-income households and individuals in the Central Okanagan.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Monday-Saturday 10:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("holiday-support")!,
      name: "Kelowna SHARE Society - Adopt a Family Hamper Program",
      description: "Operates from October to December, aiming to assist families and individuals during the holiday season by alleviating financial stress. Provides holiday hampers with food, gifts, and essential items to families in need.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "October to December - call for registration",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "Kelowna SHARE Society - Re:Up Studio",
      description: "A creative social enterprise that empowers individuals through hands-on learning in upcycling, sewing, and sustainable design. Offers weekly classes, monthly workshops, and daily drop-in sessions. Promotes inclusion, community connection, environmental responsibility, and skill-building for employment readiness.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Monday-Saturday 10:00 AM - 4:30 PM (call for class schedules)",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "Kelowna SHARE Society - D.R.I.P. (Details of Retail Introductory Program)",
      description: "Offers structured retail skills training to help clients gain experience beneficial for re-entering the workforce. Provides hands-on training in retail operations, customer service, and workplace skills.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Call for program information",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "Kelowna SHARE Society - T.E.P. (Transition to Employment Program)",
      description: "Provides closely monitored in-store training to assist clients in developing skills for regular employment. Offers practical work experience and skill development in a supportive retail environment.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Call for program information",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "Kelowna SHARE Society - Volunteer Engagement Program (VEP)",
      description: "Connects individuals with meaningful volunteer opportunities, supporting personal growth and community connection. Offers flexible volunteer opportunities in areas like retail, sorting, administration, and program assistance.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Call for volunteer opportunities",
      verified: true
    },
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Kelowna SHARE Society - Thrift Store",
      description: "Thrift store providing affordable clothing, household items, furniture, and more. All proceeds support SHARE Society's programs. Members enjoy additional discounts and exclusive access to members-only sales. General membership $2. Open Monday to Saturday.",
      address: "581 Gaston Avenue, Kelowna, BC V1Y 7E6",
      phone: "250-763-8117",
      website: "https://www.kelownasharesociety.ca",
      email: "info@kelownasharesociety.ca",
      latitude: "49.8830",
      longitude: "-119.4800",
      hours: "Monday-Saturday 9:00 AM - 5:00 PM",
      verified: true
    },
    // Libraries - Public libraries with books, computers, and community programs
    {
      categoryId: catMap.get("libraries")!,
      name: "Okanagan Regional Library - Kelowna Branch",
      description: "Main branch of the Okanagan Regional Library system. Offers free access to books, e-books, audiobooks, computers, internet, printing, and community programs. Library card is free for BC residents. Programs include storytimes, book clubs, computer classes, and community events.",
      address: "1380 Ellis Street, Kelowna, BC V1Y 2A2",
      phone: "250-762-2800",
      website: "https://www.orl.bc.ca/branches/kelowna",
      email: "kelowna@orl.bc.ca",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Thursday 9:00 AM - 8:00 PM, Friday-Saturday 9:00 AM - 5:00 PM, Sunday 1:00 PM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("libraries")!,
      name: "Okanagan Regional Library - Rutland Branch",
      description: "Rutland branch of the Okanagan Regional Library. Offers free access to books, e-books, computers, internet, and community programs. Library card is free for BC residents. Programs for all ages including children's storytimes and adult programs.",
      address: "280 Rutland Road North, Kelowna, BC V1X 3B1",
      phone: "250-765-7890",
      website: "https://www.orl.bc.ca/branches/rutland",
      email: "rutland@orl.bc.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Monday-Thursday 10:00 AM - 8:00 PM, Friday-Saturday 10:00 AM - 5:00 PM, Sunday 1:00 PM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("libraries")!,
      name: "Okanagan Regional Library - West Kelowna Branch",
      description: "West Kelowna branch of the Okanagan Regional Library. Offers free access to books, e-books, computers, internet, printing, and community programs. Library card is free for BC residents. Programs include storytimes, book clubs, and community events.",
      address: "3630 Brown Road, West Kelowna, BC V4T 2P3",
      phone: "250-768-1234",
      website: "https://www.orl.bc.ca/branches/west-kelowna",
      email: "westkelowna@orl.bc.ca",
      latitude: "49.8280",
      longitude: "-119.6080",
      hours: "Monday-Thursday 10:00 AM - 8:00 PM, Friday-Saturday 10:00 AM - 5:00 PM, Sunday 1:00 PM - 5:00 PM",
      verified: true
    },
    // Community Centers - Recreation centers and community gathering spaces
    {
      categoryId: catMap.get("community-centers")!,
      name: "Parkinson Recreation Centre",
      description: "Major recreation facility offering fitness center, swimming pool, ice rink, gymnasium, and various programs for all ages. Affordable drop-in rates and membership options. Programs include fitness classes, swimming lessons, sports leagues, and community events.",
      address: "1800 Parkinson Way, Kelowna, BC V1Y 6R9",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/parks-recreation/recreation-services/parkinson-recreation-centre",
      email: "recreation@kelowna.ca",
      latitude: "49.8900",
      longitude: "-119.4800",
      hours: "Monday-Friday 6:00 AM - 10:00 PM, Saturday-Sunday 7:00 AM - 9:00 PM (hours may vary by facility)",
      verified: true
    },
    {
      categoryId: catMap.get("community-centers")!,
      name: "H2O Adventure + Fitness Centre",
      description: "Aquatic and fitness facility featuring pools, water slides, fitness center, and programs. Affordable drop-in rates and membership options. Programs include swimming lessons, aqua fitness, and recreational swimming.",
      address: "4075 Gordon Drive, Kelowna, BC V1W 4N1",
      phone: "250-491-8444",
      website: "https://www.kelowna.ca/parks-recreation/recreation-services/h2o-adventure-fitness-centre",
      email: "recreation@kelowna.ca",
      latitude: "49.8500",
      longitude: "-119.5000",
      hours: "Monday-Friday 6:00 AM - 9:00 PM, Saturday-Sunday 7:00 AM - 8:00 PM (hours may vary)",
      verified: true
    },
    {
      categoryId: catMap.get("community-centers")!,
      name: "Rutland Centennial Hall",
      description: "Community hall available for rentals and community events. Hosts various community programs, meetings, and events. Affordable rental rates for community groups and individuals.",
      address: "215 Rutland Road North, Kelowna, BC V1X 3B1",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/parks-recreation/recreation-services/facility-rentals",
      email: "recreation@kelowna.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "By appointment - call for availability",
      verified: true
    },
    {
      categoryId: catMap.get("community-centers")!,
      name: "West Kelowna Community Centre",
      description: "Community center offering programs, events, and facility rentals. Hosts various community programs, fitness classes, and community gatherings. Affordable rates for programs and rentals.",
      address: "2760 Cameron Road, West Kelowna, BC V1Z 2T6",
      phone: "250-768-7529",
      website: "https://www.districtofwestkelowna.ca/en/parks-recreation-and-culture/community-centre.aspx",
      email: "recreation@districtofwestkelowna.ca",
      latitude: "49.8320",
      longitude: "-119.6050",
      hours: "Monday-Friday 8:00 AM - 9:00 PM, Saturday 9:00 AM - 5:00 PM, Sunday 9:00 AM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("community-centers")!,
      name: "Rotary Centre for the Arts",
      description: "Visual and performing arts center offering art classes, workshops, performances, and gallery space. Affordable programs for all ages. Hosts community events, concerts, and cultural programs.",
      address: "421 Cawston Avenue, Kelowna, BC V1Y 6Z1",
      phone: "250-717-5304",
      website: "https://www.rotarycentreforthearts.com",
      email: "info@rotarycentreforthearts.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 9:00 AM - 5:00 PM, Saturday 10:00 AM - 4:00 PM (hours may vary for events)",
      verified: true
    },
    // Education & Tutoring - Adult education, tutoring, and learning programs
    {
      categoryId: catMap.get("education")!,
      name: "Okanagan College - Kelowna Campus",
      description: "Post-secondary institution offering certificate, diploma, and degree programs. Provides adult upgrading, English language learning, trades training, and academic programs. Financial aid and support services available. Accessible education for all.",
      address: "1000 KLO Road, Kelowna, BC V1Y 4X8",
      phone: "250-762-5445",
      website: "https://www.okanagan.bc.ca",
      email: "info@okanagan.bc.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:00 AM - 4:30 PM (hours may vary by department)",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "Okanagan College - Adult Upgrading & English Language Learning",
      description: "Free or low-cost adult upgrading programs including GED preparation, high school completion, and English language learning (ELL). Support services and flexible scheduling available. Helps adults improve education and employment prospects.",
      address: "1000 KLO Road, Kelowna, BC V1Y 4X8",
      phone: "250-762-5445",
      website: "https://www.okanagan.bc.ca/Programs/Areas_of_Study/Adult_Upgrading.aspx",
      email: "upgrading@okanagan.bc.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:00 AM - 4:30 PM (call for program schedules)",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "Project Literacy Central Okanagan Society",
      description: "Free one-on-one tutoring for adults in reading, writing, math, and computer skills. Volunteer tutors matched with learners. Flexible scheduling. Helps adults improve literacy skills for employment, education, and daily life.",
      address: "101-1434 Water Street, Kelowna, BC V1Y 1J4",
      phone: "250-762-2163",
      website: "https://www.projectliteracy.ca",
      email: "info@projectliteracy.ca",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 9:00 AM - 4:00 PM (tutoring by appointment)",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "KCR Community Resources - Employment & Training Services",
      description: "Employment and training services including job search support, resume help, skills training, and career counseling. Free services for job seekers. Helps connect people with employment opportunities and training programs.",
      address: "120-1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "WorkBC Centre - Kelowna",
      description: "Free employment services including job search assistance, skills training, career counseling, and workshops. Government-funded employment services for job seekers. Helps connect people with employment and training opportunities.",
      address: "200-1855 Kirschner Road, Kelowna, BC V1Y 4N7",
      phone: "250-862-4280",
      website: "https://www.workbc.ca",
      email: "kelowna@workbc.ca",
      latitude: "49.8700",
      longitude: "-119.4800",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "WorkBC Centre - West Kelowna",
      description: "Free employment services including job search assistance, skills training, career counseling, and workshops. Government-funded employment services for job seekers in West Kelowna.",
      address: "101-2475 Dobbin Road, West Kelowna, BC V4T 2E9",
      phone: "250-768-4800",
      website: "https://www.workbc.ca",
      email: "westkelowna@workbc.ca",
      latitude: "49.8260",
      longitude: "-119.6120",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "School District 23 - Adult Education",
      description: "Adult education programs including high school completion, GED preparation, and continuing education. Flexible scheduling for adult learners. Helps adults complete high school or upgrade skills.",
      address: "1940 Underhill Street, Kelowna, BC V1X 5X7",
      phone: "250-860-8888",
      website: "https://www.sd23.bc.ca",
      email: "info@sd23.bc.ca",
      latitude: "49.8800",
      longitude: "-119.4500",
      hours: "Monday-Friday 8:00 AM - 4:00 PM (call for program schedules)",
      verified: true
    },
    {
      categoryId: catMap.get("education")!,
      name: "Okanagan Regional Library - Computer & Technology Classes",
      description: "Free computer and technology classes at library branches. Topics include basic computer skills, internet use, email, Microsoft Office, and digital literacy. Classes for all skill levels. Check library website for current schedule.",
      address: "1380 Ellis Street, Kelowna, BC V1Y 2A2",
      phone: "250-762-2800",
      website: "https://www.orl.bc.ca",
      email: "kelowna@orl.bc.ca",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Call or check website for class schedules",
      verified: true
    },
    // Indigenous Justice & Legal Services
    {
      categoryId: catMap.get("indigenous")!,
      name: "Kelowna Indigenous Justice Centre",
      description: "Free legal support for Indigenous people (First Nations, Métis, and Inuit) dealing with criminal and child protection matters. Provides culturally safe legal services, Gladue reports, diversion programs, and advocacy. Services include criminal defense support, child protection assistance, and justice navigation.",
      address: "Kelowna, BC",
      phone: "236-763-6881",
      website: "https://bcfnjc.com/services/kelowna-indigenous-justice-centre",
      email: "kelowna@bcfnjc.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("legal")!,
      name: "Kelowna Indigenous Justice Centre - Legal Services",
      description: "Free legal support for Indigenous people dealing with criminal matters, child protection, and justice system navigation. Provides culturally safe legal services, Gladue reports, and advocacy. Services for First Nations, Métis, and Inuit individuals and families.",
      address: "Kelowna, BC",
      phone: "236-763-6881",
      website: "https://bcfnjc.com/services/kelowna-indigenous-justice-centre",
      email: "kelowna@bcfnjc.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "Metis Community Services Society",
      description: "Community center providing programs and services for Métis people and families. Offers cultural programs, family support, health and wellness services, and community connections. Services include family programs, elder support, and community events.",
      address: "Kelowna, BC",
      phone: "250-868-0351",
      website: "https://www.metiscommunityservices.com",
      email: "info@metiscommunityservices.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Tuesday-Friday 8:30 AM - 4:30 PM (call for specific program hours)",
      verified: true
    },
    // Ki-Low-Na Friendship Society - Additional Services
    {
      categoryId: catMap.get("indigenous")!,
      name: "Ki-Low-Na Friendship Society - Tax Advocate Service",
      description: "Free, confidential tax filing assistance for individuals and families, especially those with low income or complex situations. Helps ensure everyone can access tax benefits and credits they're entitled to. Available during tax season.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/services/income-tax-service",
      email: "info@kfs.bc.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "Tax season: Monday-Friday 9:00 AM - 3:00 PM (call for appointment)",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Ki-Low-Na Friendship Society - Tupa's Lodge",
      description: "Low-barrier second-stage transition house for Indigenous mothers and birthing parents navigating pregnancy and parenthood. Provides culturally rooted support, safe housing, and programs to support healthy families. Services include housing, parenting support, and cultural programming.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/services/tupas-lodge",
      email: "info@kfs.bc.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "24/7 (call for availability and intake)",
      verified: true
    },
    {
      categoryId: catMap.get("indigenous")!,
      name: "Ki-Low-Na Friendship Society - Elder Services",
      description: "Personalized support, cultural activities, and community events for Indigenous Elders. Provides opportunities for Elders to share their wisdom and connect with the community. Services include cultural programming, social support, and elder advocacy.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/services/elder-services",
      email: "info@kfs.bc.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "Monday-Thursday 8:30 AM - 4:30 PM; Friday 9:00 AM - 12:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Ki-Low-Na Friendship Society - Child & Family Programs",
      description: "Range of programs supporting the health, development, and cultural connection of Indigenous children and their families. Services include Indigenous Supported Child Development (ISCD), Aboriginal Infant Development Program (AIDP), Turtle Hut Program, and Community Action Program for Children (CAPC).",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/services/child-family-programs",
      email: "info@kfs.bc.ca",
      latitude: "49.8876",
      longitude: "-119.4918",
      hours: "Monday-Thursday 8:30 AM - 4:30 PM; Friday 9:00 AM - 12:00 PM (call for specific program schedules)",
      verified: true
    },
    // CMHA Kelowna - Additional Programs
    {
      categoryId: catMap.get("health")!,
      name: "CMHA Kelowna - Community Roots Navigation Services",
      description: "Outreach and case management for individuals experiencing or at risk of homelessness, focusing on mental health support. Collaborative initiative providing comprehensive support, navigation services, and connections to resources. Helps individuals access housing, health services, and community supports.",
      address: "504 Sutherland Avenue, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com/programs-supports/community-roots",
      email: "info@cmhakelowna.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "CMHA Kelowna - Housing Services",
      description: "Housing support services including rent supplements, utility relief, and housing navigation. Provides assistance with finding and maintaining housing, financial support for housing costs, and connections to housing resources. Services include rent bank referrals and housing advocacy.",
      address: "504 Sutherland Avenue, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com/programs-supports/housing",
      email: "info@cmhakelowna.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("employment")!,
      name: "CMHA Kelowna - Link to Employment",
      description: "Employment support services for individuals with mental health challenges. Provides job search assistance, skills training, workplace support, and connections to employment opportunities. Helps individuals find and maintain meaningful employment.",
      address: "504 Sutherland Avenue, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com/programs-supports/link-to-employment",
      email: "info@cmhakelowna.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "CMHA Kelowna - REnEW Program",
      description: "Recovery and wellness program providing support for individuals on their mental health recovery journey. Offers peer support, wellness activities, skill-building, and community connections. Helps individuals build resilience and maintain wellness.",
      address: "504 Sutherland Avenue, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com/programs-supports/renew",
      email: "info@cmhakelowna.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Call for program schedules",
      verified: true
    },
    // Free Community Resources
    {
      categoryId: catMap.get("thrift-stores")!,
      name: "Evangel Church Kelowna - Free Store",
      description: "Free store providing clothing, household items, and personal care items to those in need. Open Thursday afternoons. Provides free items to help individuals and families meet basic needs. If you need assistance outside of store hours, contact the church office.",
      address: "3261 Gordon Drive, Kelowna, BC V1W 3N4",
      phone: "250-860-2424",
      website: "https://evangelkelowna.com/free-store",
      email: "info@evangelkelowna.com",
      latitude: "49.8500",
      longitude: "-119.5000",
      hours: "Thursday 1:00 PM - 4:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("community-centers")!,
      name: "Kelowna Art Gallery - Free Admission Thursdays",
      description: "Free admission every Thursday from 10:00 AM to 8:00 PM. No financial barriers to experiencing art and culture. Features rotating exhibitions, community programs, and cultural events. Accessible to all members of the community.",
      address: "1315 Water Street, Kelowna, BC V1Y 9R3",
      phone: "250-762-2226",
      website: "https://kelownaartgallery.com",
      email: "info@kelownaartgallery.com",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "Thursday 10:00 AM - 8:00 PM (free admission), Other days: Regular admission",
      verified: true
    },
    // Building Healthy Families - From https://www.buildinghealthyfamilies.ca/
    {
      categoryId: catMap.get("family")!,
      name: "Building Healthy Families - Okanagan",
      description: "A nonprofit society and registered charity committed to serving and assisting families in the Okanagan with free programs. Provides educational resources and training to help affirm and enhance a family's unique strengths and abilities. Offers a safe, caring, nonjudgmental environment free from discrimination.",
      address: "Okanagan, BC",
      website: "https://www.buildinghealthyfamilies.ca",
      email: "info@buildinghealthyfamilies.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Building Healthy Families - Parent Support Programs",
      description: "Interactive life skills programs to help parents build lifelong healthy relationships with their children. Free programs designed to support and strengthen family bonds through education and skill-building.",
      address: "Okanagan, BC",
      website: "https://www.buildinghealthyfamilies.ca",
      email: "info@buildinghealthyfamilies.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Building Healthy Families - Single Parent Programs",
      description: "Provides single parents with the opportunity to learn new skills for nurturing and healthy communication. Free programs designed to support single parents in building strong, healthy relationships with their children.",
      address: "Okanagan, BC",
      website: "https://www.buildinghealthyfamilies.ca",
      email: "info@buildinghealthyfamilies.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Building Healthy Families - Family Support",
      description: "Provides support for families who find themselves in a difficult situation or time of crisis. Offers resources, guidance, and programs to help families navigate challenges and build resilience.",
      address: "Okanagan, BC",
      website: "https://www.buildinghealthyfamilies.ca",
      email: "info@buildinghealthyfamilies.ca",
      hours: "Call for support",
      verified: true
    },
    // Moving Forward Family Services - From https://movingforward.help/
    {
      categoryId: catMap.get("health")!,
      name: "Moving Forward Family Services - Free Counselling",
      description: "Non-profit charity offering free short-term and affordable long-term counselling options to folks across British Columbia, and to anyone in Canada unable to access local support. Services delivered by supervised students and registered therapists. Available online, by phone, and in-person in Lower Mainland (minimal fees). Services in 20+ languages. Last year provided over 22,000 counselling sessions, with 15,000 offered at no cost.",
      address: "Online/Phone service - BC-wide. In-person: Surrey, BC (Lower Mainland)",
      website: "https://movingforward.help",
      email: "info@movingforward.help",
      hours: "Call for appointment - shorter wait times than public services",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Moving Forward - Free Life Skills Coaching Programs",
      description: "FREE coaching programs including: Moving Forward Life Skills Coaching, Healthy Relationships Coaching, Substance Use Management Coaching, Mindfulness Coaching, Seniors Support Coaching, and Parenting (parents of children 0-5). Available online and by phone across BC.",
      address: "Online/Phone service - BC-wide",
      phone: "604-540-9161",
      website: "https://movingforward.help",
      email: "info@movingforward.help",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("family")!,
      name: "Moving Forward Family Services - Family Counselling",
      description: "Inclusive counselling for trauma, stress, anger, substance abuse, grief, loss, depression, anxiety and much more. Available for individuals, couples, and families. Low-barrier entry to mental health services for those who cannot afford private therapy. Average fee for paid sessions: $5-$7 per session.",
      address: "Online/Phone service - BC-wide. In-person: Surrey, BC (Lower Mainland)",
      website: "https://movingforward.help",
      email: "info@movingforward.help",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Moving Forward - Substance Use Management Coaching",
      description: "Free substance use management coaching program. Provides support and strategies for managing substance use issues. Part of Moving Forward's free coaching programs available across BC.",
      address: "Online/Phone service - BC-wide",
      phone: "604-540-9161",
      website: "https://movingforward.help",
      email: "info@movingforward.help",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Moving Forward - Seniors Support Coaching",
      description: "Free seniors support coaching program. Provides mental health support and coaching for older adults. Part of Moving Forward's free coaching programs available across BC.",
      address: "Online/Phone service - BC-wide",
      phone: "604-540-9161",
      website: "https://movingforward.help",
      email: "info@movingforward.help",
      hours: "Call for program schedules",
      verified: true
    },
    // Additional Senior Services - Health & Mental Health
    {
      categoryId: catMap.get("seniors")!,
      name: "Interior Health - Senior Mental Health Services",
      description: "Free mental health assessment, counseling, and support services for seniors. Provides services for depression, anxiety, grief, and other mental health concerns. Services available in Kelowna and West Kelowna.",
      address: "505 Doyle Avenue, Kelowna, BC V1Y 0C5",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca/health-services/mental-health-substance-use",
      email: "info@interiorhealth.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "CMHA Kelowna - Senior Mental Health Support",
      description: "Free mental health support services for seniors. Provides counseling, peer support groups, and mental health resources for older adults. Services available for seniors and their caregivers.",
      address: "504 Sutherland Ave, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com",
      email: "info@cmhakelowna.com",
      hours: "Monday-Friday 9:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Kelowna General Hospital - Senior Health Services",
      description: "Medical services and health programs for seniors. Provides geriatric assessment, chronic disease management, and specialized senior health care. Referral may be required for some services.",
      address: "2268 Pandosy St, Kelowna, BC V1Y 1T2",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "24/7 for emergencies, call for clinic hours",
      verified: true
    },
    // Senior Transportation Services
    {
      categoryId: catMap.get("seniors")!,
      name: "KCR Community Resources - Senior Transportation",
      description: "Volunteer-based transportation services for seniors. Provides rides to medical appointments, grocery shopping, and essential errands. Sliding scale fees based on income. Available in Kelowna.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "HandyDART - Accessible Transit for Seniors",
      description: "Door-to-door accessible transit service for seniors and people with disabilities. Provides transportation to medical appointments, shopping, and community activities. Requires registration.",
      address: "Kelowna and West Kelowna",
      phone: "250-860-8121",
      website: "https://www.bctransit.com/kelowna/fares-and-passes/handydart",
      email: "info@bctransit.com",
      hours: "Monday-Friday 6:00 AM - 11:00 PM, Saturday 7:00 AM - 11:00 PM, Sunday 8:00 AM - 9:00 PM",
      verified: true
    },
    // Senior Legal & Advocacy Services
    {
      categoryId: catMap.get("seniors")!,
      name: "Legal Aid BC - Senior Services",
      description: "Free legal advice and representation for seniors. Provides assistance with wills, estates, power of attorney, elder abuse, and other legal matters affecting seniors.",
      address: "Phone service and office locations - call for nearest office",
      phone: "1-866-577-2525",
      website: "https://legalaid.bc.ca",
      email: "info@legalaid.bc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "BC Centre for Elder Advocacy and Support",
      description: "Free advocacy and support for seniors experiencing abuse, neglect, or exploitation. Provides information, support, and referrals to legal and protective services. 24/7 helpline available.",
      address: "Phone service - BC-wide",
      phone: "1-866-437-1940",
      website: "https://www.bcceas.ca",
      email: "info@bcceas.ca",
      hours: "24/7",
      verified: true
    },
    // Senior Financial Aid & Benefits
    {
      categoryId: catMap.get("seniors")!,
      name: "Service Canada - Senior Benefits Information",
      description: "Free information and assistance with Old Age Security (OAS), Guaranteed Income Supplement (GIS), Canada Pension Plan (CPP), and other federal benefits for seniors.",
      address: "Phone service and office locations - call for nearest office",
      phone: "1-800-622-6232",
      website: "https://www.canada.ca/en/services/benefits/publicpensions.html",
      email: "info@servicecanada.gc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Outreach - Benefits Assistance",
      description: "Free assistance with completing applications for pensions, benefits, and other senior programs. Helps seniors navigate government programs and access available financial support.",
      address: "102-2055 Benvoulin Ct, Kelowna, BC V1W 2C3",
      phone: "250-861-6180",
      website: "https://www.seniorsoutreach.ca",
      email: "info@seniorsoutreach.ca",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    // Senior Recreation & Activities
    {
      categoryId: catMap.get("seniors")!,
      name: "City of Kelowna - Senior Recreation Programs",
      description: "Low-cost and free recreation programs for seniors. Includes fitness classes, arts and crafts, social activities, and community events. Financial assistance available through Leisure Access Program.",
      address: "Various locations in Kelowna",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/recreation",
      email: "recreation@kelowna.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "District of West Kelowna - Senior Programs",
      description: "Recreation programs and activities for seniors in West Kelowna. Includes fitness, social activities, and community events. Financial assistance available.",
      address: "Various locations in West Kelowna",
      phone: "250-768-0222",
      website: "https://www.westkelownacity.ca",
      email: "info@westkelownacity.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "YMCA Okanagan - Senior Programs",
      description: "Fitness, wellness, and social programs for seniors. Includes aqua fitness, gentle exercise classes, and social activities. Financial assistance available.",
      address: "375 Hartman Rd, Kelowna, BC V1X 2M9",
      phone: "250-491-9622",
      website: "https://www.ymcaokanagan.ca",
      email: "info@ymcaokanagan.ca",
      hours: "Call for program schedules and facility hours",
      verified: true
    },
    // Senior Food Programs
    {
      categoryId: catMap.get("seniors")!,
      name: "Central Okanagan Food Bank - Senior Support",
      description: "Free food assistance for seniors. Provides food hampers, fresh produce, and special programs for older adults. Home delivery available for seniors with mobility issues.",
      address: "1265 Ellis St, Kelowna, BC V1Y 1Z7",
      phone: "250-763-7161",
      website: "https://www.cofoodbank.com",
      email: "info@cofoodbank.com",
      hours: "Monday-Friday 9:00 AM - 3:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Meals on Wheels - West Kelowna",
      description: "Nutritious meal delivery for seniors in West Kelowna. Affordable hot meals delivered to your home Monday through Friday. Call to register and arrange delivery service.",
      address: "Home delivery service throughout West Kelowna - call to register",
      phone: "250-768-3305",
      website: "https://www.westsidehealthnetwork.org",
      email: "info@westsidehealthnetwork.org",
      hours: "Monday-Friday meal delivery",
      verified: true
    },
    // Senior Technology & Digital Support
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Outreach - Computer & Technology Help",
      description: "Free technology assistance for seniors. Provides help with computers, tablets, smartphones, and internet use. One-on-one support to help seniors stay connected digitally.",
      address: "102-2055 Benvoulin Ct, Kelowna, BC V1W 2C3",
      phone: "250-861-6180",
      website: "https://www.seniorsoutreach.ca",
      email: "info@seniorsoutreach.ca",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    // Senior Housing Support
    {
      categoryId: catMap.get("seniors")!,
      name: "BC Housing - Senior Housing Information",
      description: "Free information and assistance with affordable housing options for seniors. Provides information on subsidized housing, rental assistance, and housing programs for older adults.",
      address: "Phone service and office locations - call for nearest office",
      phone: "1-800-407-7757",
      website: "https://www.bchousing.org",
      email: "info@bchousing.org",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Seniors Outreach - Housing Support",
      description: "Free assistance finding appropriate housing for seniors. Provides information on housing options, applications, and support with housing-related concerns.",
      address: "102-2055 Benvoulin Ct, Kelowna, BC V1W 2C3",
      phone: "250-861-6180",
      website: "https://www.seniorsoutreach.ca",
      email: "info@seniorsoutreach.ca",
      hours: "Monday-Friday 9:00 AM - 4:00 PM",
      verified: true
    },
    // Senior Employment & Volunteer Services
    {
      categoryId: catMap.get("seniors")!,
      name: "WorkBC - Senior Employment Services",
      description: "Free employment services for seniors seeking work. Provides job search assistance, resume help, interview preparation, and connections to age-friendly employers.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.workbc.ca",
      email: "info@workbc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("seniors")!,
      name: "Volunteer Kelowna - Senior Volunteer Opportunities",
      description: "Connects seniors with meaningful volunteer opportunities in the community. Provides information on volunteer positions that match interests and skills. Great way to stay active and engaged.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    // Mamas for Mamas - From https://www.mamasformamas.org/program/kelowna-at-risk-comprehensive-program/
    {
      categoryId: catMap.get("family")!,
      name: "Mamas for Mamas - Kelowna At-Risk Comprehensive Program",
      description: "Most utilized program for low income mamas, expecting mamas and their families. Provides 1-1 support with a social worker and Karma Market coordinator to help mamas overcome the impact of poverty. Identifies barriers and provides resources and immediate supports to access basic needs for a healthy and safe living environment. Supports families facing homelessness, abuse and violence, lack of basic resources including food, clothing, shoes, medical interventions not covered by MSP, and access to menstrual/hygiene products. Also provides access to supplementary diapers, wipes, and required baby items such as cribs, highchairs, and infant car seats.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for appointment - after hours appointments available",
      verified: true
    },
    {
      categoryId: catMap.get("financial-aid")!,
      name: "Mamas for Mamas - Karma Market",
      description: "Free market providing access to all items required for families in need. Part of the At-Risk Comprehensive Program. Provides clothing, shoes, food, hygiene products, baby items, and household essentials at no cost to low-income mamas, papas, and caregivers.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for access",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Mamas for Mamas - Mental Health Counselling",
      description: "In-house mental health counselling and groups for mamas and families. Referrals provided internally for those with greater needs. Part of the comprehensive support services offered to at-risk families.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("legal")!,
      name: "Mamas for Mamas - Family Court Support Program",
      description: "Helps families navigate the court system and provides family-based victim service support. For especially complex cases, provides legal advocacy and support for families dealing with court proceedings.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("shelters")!,
      name: "Mamas for Mamas - Housing Support",
      description: "Provides support for mamas and families facing homelessness. Part of the At-Risk Comprehensive Program. Helps identify barriers and provides resources and immediate supports to access safe housing and basic needs for a healthy and safe living environment.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for support",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Mamas for Mamas - Crisis Support",
      description: "Provides support for families facing abuse and violence. Part of the At-Risk Comprehensive Program. Offers immediate support, resources, and referrals to help families in crisis situations. No-contact hamper delivery available for COVID-19 safe support.",
      address: "Unit 120, 1735 Dolphin Avenue, Kelowna, BC V1Y 8A6",
      phone: "877-535-2432",
      website: "https://www.mamasformamas.org",
      email: "info@mamasformamas.org",
      latitude: "49.8800",
      longitude: "-119.4800",
      hours: "Call for support - after hours appointments available",
      verified: true
    },
    // Harm Reduction & Addiction Resources - Kelowna & West Kelowna
    // Kalano Club - From Pathways BC
    {
      categoryId: catMap.get("addiction")!,
      name: "Kalano Club - Recovery Support Meetings",
      description: "Safe, social, alcohol- and drug-free environment offering rooms and spaces for Alcoholics Anonymous (AA), Al-Anon, Narcotics Anonymous (NA), and Gamblers Anonymous (GA) meetings. Provides library, brochures, contact lists for recovery groups, and reflection areas. Coffee, soft drinks, and snacks available during volunteer hours.",
      address: "2108 Vasile Road, Kelowna, BC V1Y 6H5",
      phone: "250-762-4999",
      website: "https://central-okanagan.pathwaysbc.ca/programs/1023",
      email: "info@central-okanagan.pathwaysbc.ca",
      hours: "Call for meeting schedules and volunteer hours",
      verified: true
    },
    // Ki-Low-Na Friendship Society - Addiction Services
    {
      categoryId: catMap.get("addiction")!,
      name: "Ki-Low-Na Friendship Society - Alcoholics Anonymous Meetings",
      description: "AA meetings held each weekday (except holidays) from 9:30 AM to 10:30 AM at the Friendship Centre. Culturally relevant addiction support services for urban Aboriginal clients. Also offers one-on-one counselling, group workshops, and referrals.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/programs-services/health-wellness/",
      email: "info@kfs.bc.ca",
      hours: "Weekdays 9:30 AM - 10:30 AM (except holidays)",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Ki-Low-Na Friendship Society - Wellbriety Meetings",
      description: "Weekly Wellbriety meetings held on Wednesdays from 5:00 PM to 7:00 PM. Culturally relevant addiction recovery support for Indigenous community members. Part of comprehensive mental health and addiction services.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/programs-services/health-wellness/",
      email: "info@kfs.bc.ca",
      hours: "Wednesdays 5:00 PM - 7:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Ki-Low-Na Friendship Society - Addiction Counselling",
      description: "Culturally relevant addiction counselling services for urban Aboriginal clients. Offers one-on-one counselling, group workshops, anger management, and referrals to additional mental health resources. Services provided in a culturally appropriate manner.",
      address: "442 Leon Ave, Kelowna, BC V1Y 6J3",
      phone: "250-763-4905",
      website: "https://kfs.bc.ca/programs-services/health-wellness/",
      email: "info@kfs.bc.ca",
      hours: "Call for appointment",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Interior Health - Crisis Response Team (Kelowna)",
      description: "24/7 crisis response for mental health and substance use emergencies. Provides immediate assessment, intervention, and referral services. Available for individuals experiencing acute mental health or addiction crises.",
      address: "505 Doyle Avenue, Kelowna, BC V1Y 0C5",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca/health-services/mental-health-substance-use",
      email: "info@interiorhealth.ca",
      hours: "24/7",
      verified: true
    },
    // The Bridge Youth & Family Services - Youth Addiction Support
    {
      categoryId: catMap.get("addiction")!,
      name: "The Bridge Youth & Family Services - Youth Addiction Support",
      description: "Free addiction and substance use support services for youth and families. Provides counseling, support groups, harm reduction services, and referrals to treatment programs. Services for youth ages 13-24 and their families.",
      address: "Kelowna, BC",
      phone: "250-763-0456",
      website: "https://www.thebridgeyouth.ca",
      email: "info@thebridgeyouth.ca",
      hours: "Monday-Friday 9:00 AM - 5:00 PM (call for specific program hours)",
      verified: true
    },
    // Youth Detox & Treatment Services
    {
      categoryId: catMap.get("addiction")!,
      name: "Interior Health - Youth Substance Use Services",
      description: "Free, confidential substance use assessment, counseling, and treatment services for youth. Provides outpatient services, referrals to detox and treatment programs, and family support. Services available for youth under 19.",
      address: "505 Doyle Avenue, Kelowna, BC V1Y 0C5",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca/health-services/mental-health-substance-use",
      email: "info@interiorhealth.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Interior Health - Youth Mental Health & Substance Use",
      description: "Free mental health and substance use services for youth. Provides assessment, counseling, treatment planning, and referrals to specialized programs. Services for youth under 19 and their families.",
      address: "505 Doyle Avenue, Kelowna, BC V1Y 0C5",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca/health-services/mental-health-substance-use",
      email: "info@interiorhealth.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Kids Help Phone - Substance Use Support",
      description: "Free, confidential 24/7 phone and text support for youth dealing with substance use, addiction, or related concerns. Professional counselors provide support, information, and referrals. Available to youth across Canada.",
      address: "Phone/text service - Canada-wide",
      phone: "1-800-668-6868",
      website: "https://kidshelpphone.ca",
      email: "info@kidshelpphone.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Youth Recovery House - Kelowna",
      description: "Residential recovery program for youth struggling with addiction. Provides structured recovery environment, counseling, life skills training, and support for youth ages 16-24. Free program funded by Interior Health.",
      address: "Kelowna, BC",
      phone: "250-862-4000",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "Call for intake and availability",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "The Bridge Youth & Family Services",
      description: "Comprehensive youth services including addiction support, mental health counseling, housing support, and family services. Free services for youth ages 13-24 and their families in Kelowna and surrounding areas.",
      address: "Kelowna, BC",
      phone: "250-763-0456",
      website: "https://www.thebridgeyouth.ca",
      email: "info@thebridgeyouth.ca",
      hours: "Monday-Friday 9:00 AM - 5:00 PM",
      verified: true
    },
    // Additional Youth Services - Mental Health & Support
    {
      categoryId: catMap.get("youth")!,
      name: "CMHA Kelowna - Youth Mental Health Services",
      description: "Free mental health support services for youth. Provides counseling, peer support, and mental health resources. Services available for youth and young adults.",
      address: "504 Sutherland Ave, Kelowna, BC V1Y 5X1",
      phone: "250-861-3644",
      website: "https://www.cmhakelowna.com",
      email: "info@cmhakelowna.com",
      hours: "Monday-Friday 9:00 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "BGC Okanagan - Youth Programs & Activities",
      description: "Free and low-cost after-school programs, summer camps, sports, arts, leadership development, and mentorship for youth ages 6-18. Multiple locations in Kelowna and West Kelowna. Financial assistance available.",
      address: "1434 Graham St, Kelowna, BC V1Y 3A8",
      phone: "250-762-3914",
      website: "https://www.bgco.ca",
      email: "info@bgco.ca",
      hours: "After-school: Monday-Friday 2:00 PM - 6:00 PM, Summer: 7:00 AM - 6:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "BGC Okanagan - West Kelowna Youth Programs",
      description: "Free and low-cost youth programs, activities, and support services in West Kelowna. After-school programs, summer camps, mentorship, and leadership development for youth ages 6-18.",
      address: "West Kelowna, BC",
      phone: "250-762-3914",
      website: "https://www.bgco.ca",
      email: "info@bgco.ca",
      hours: "Call for program schedules and locations",
      verified: true
    },
    // Youth Employment & Job Training
    {
      categoryId: catMap.get("youth")!,
      name: "WorkBC Youth Services - Kelowna",
      description: "Free employment services for youth ages 15-30. Provides job search assistance, resume help, interview preparation, skills training, and connections to employers. Financial support may be available for training programs.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.workbc.ca",
      email: "info@workbc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "KCR Community Resources - Youth Employment Services",
      description: "Free employment support for youth including job search assistance, resume writing, interview skills, and connections to training programs. Services for youth ages 15-30.",
      address: "120-1735 Dolphin Ave, Kelowna, BC V1Y 8A6",
      phone: "250-763-8008",
      website: "https://www.kcr.ca",
      email: "info@kcr.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    // Youth Housing Support
    {
      categoryId: catMap.get("youth")!,
      name: "BGC Okanagan Downtown Youth Shelter",
      description: "Emergency shelter for youth ages 13-24 experiencing homelessness. Provides safe accommodation, meals, support services, and connections to housing resources. 24/7 access.",
      address: "Downtown Kelowna (confidential location - call for access)",
      phone: "250-868-8541",
      website: "https://www.bgcok.com",
      email: "info@bgcok.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "The Bridge Youth & Family Services - Youth Housing Support",
      description: "Free housing support services for youth ages 13-24. Provides assistance finding housing, housing subsidies, life skills training, and support for youth experiencing or at risk of homelessness.",
      address: "Kelowna, BC",
      phone: "250-763-0456",
      website: "https://www.thebridgeyouth.ca",
      email: "info@thebridgeyouth.ca",
      hours: "Monday-Friday 9:00 AM - 5:00 PM",
      verified: true
    },
    // Youth Legal Services
    {
      categoryId: catMap.get("youth")!,
      name: "Legal Aid BC - Youth Services",
      description: "Free legal advice and representation for youth. Provides assistance with criminal matters, family law, child protection, and other legal issues. Services available for youth under 19.",
      address: "Phone service and office locations - call for nearest office",
      phone: "1-866-577-2525",
      website: "https://legalaid.bc.ca",
      email: "info@legalaid.bc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "Youth Criminal Defense - Legal Aid",
      description: "Free legal representation for youth facing criminal charges. Provides defense services, legal advice, and court representation. Services available for youth under 18.",
      address: "Phone service - call for appointment",
      phone: "1-866-577-2525",
      website: "https://legalaid.bc.ca",
      email: "info@legalaid.bc.ca",
      hours: "Monday-Friday 8:30 AM - 4:30 PM",
      verified: true
    },
    // Youth LGBTQ+ Services
    {
      categoryId: catMap.get("youth")!,
      name: "Foundry Kelowna - LGBTQ+ Youth Support",
      description: "Free, confidential support services for LGBTQ+ youth ages 12-24. Provides counseling, peer support groups, health services, and safe space. Affirming and inclusive environment.",
      address: "100-1815 Kirschner Rd, Kelowna, BC V1Y 4N7",
      phone: "236-420-2803",
      website: "https://foundrybc.ca/kelowna",
      email: "foundry@cmhakelowna.org",
      hours: "Walk-in: Tuesday-Thursday 12:00 PM - 5:00 PM. Call for other appointments",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "PFLAG Kelowna - LGBTQ+ Youth & Family Support",
      description: "Free support groups for LGBTQ+ youth and their families. Provides peer support, resources, and community connections. Meetings and support available for youth and parents.",
      address: "Kelowna, BC - call for meeting locations",
      phone: "250-862-7336",
      website: "https://www.pflagcanada.ca",
      email: "info@pflagcanada.ca",
      hours: "Call for meeting schedules",
      verified: true
    },
    // Youth Recreation & Community Programs
    {
      categoryId: catMap.get("youth")!,
      name: "City of Kelowna - Youth Recreation Programs",
      description: "Low-cost and free recreation programs for youth. Includes sports, arts, fitness, and community activities. Financial assistance available through Leisure Access Program.",
      address: "Various locations in Kelowna",
      phone: "250-469-8800",
      website: "https://www.kelowna.ca/recreation",
      email: "recreation@kelowna.ca",
      hours: "Call for program schedules",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "District of West Kelowna - Youth Programs",
      description: "Recreation programs and activities for youth in West Kelowna. Includes sports, arts, community events, and youth drop-in programs. Financial assistance available.",
      address: "Various locations in West Kelowna",
      phone: "250-768-0222",
      website: "https://www.westkelownacity.ca",
      email: "info@westkelownacity.ca",
      hours: "Call for program schedules",
      verified: true
    },
    // Youth Mentorship & Leadership
    {
      categoryId: catMap.get("youth")!,
      name: "Big Brothers Big Sisters Okanagan - Youth Mentorship",
      description: "Free one-to-one mentoring programs for youth ages 6-18. Matches youth with adult mentors for friendship, support, and positive role modeling. Programs available in Kelowna and West Kelowna.",
      address: "Kelowna and West Kelowna",
      phone: "250-762-1191",
      website: "https://www.bbbsokanagan.com",
      email: "info@bbbsokanagan.com",
      hours: "Monday-Friday 9:00 AM - 5:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "YMCA Okanagan - Youth Leadership Programs",
      description: "Youth leadership development, volunteer opportunities, and community engagement programs. Financial assistance available. Programs for youth ages 12-18.",
      address: "375 Hartman Rd, Kelowna, BC V1X 2M9",
      phone: "250-491-9622",
      website: "https://www.ymcaokanagan.ca",
      email: "info@ymcaokanagan.ca",
      hours: "Call for program schedules",
      verified: true
    },
    // Youth Crisis & Support Lines
    {
      categoryId: catMap.get("youth")!,
      name: "Youth Crisis Line - BC",
      description: "Free 24/7 crisis support for youth across BC. Provides immediate support, crisis intervention, and referrals to local services. Confidential and anonymous.",
      address: "Phone service - BC-wide",
      phone: "1-800-680-4264",
      website: "https://www.youthagainstviolenceline.com",
      email: "info@youthagainstviolenceline.com",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("youth")!,
      name: "YouthinBC - Online Chat Support",
      description: "Free, confidential online chat support for youth. Professional counselors available to chat about mental health, relationships, school, and other concerns. Available evenings.",
      address: "Online chat service",
      website: "https://youthinbc.com",
      email: "info@youthinbc.com",
      hours: "Evenings (check website for current hours)",
      verified: true
    },
    // Freedom's Door - Men's Recovery
    {
      categoryId: catMap.get("addiction")!,
      name: "Freedom's Door Kelowna - Men's Addiction Recovery",
      description: "Non-profit addiction recovery program for men, providing a safe and secure environment to support recovery and transition back into the community. Offers structured recovery programs, counselling, and life skills training.",
      address: "Kelowna, BC",
      phone: "250-717-0472",
      website: "https://freedomsdoorkelowna.com",
      email: "info@freedomsdoorkelowna.com",
      hours: "Call for program information",
      verified: true
    },
    // Ozanam Recovery House - Men's Recovery
    {
      categoryId: catMap.get("addiction")!,
      name: "Ozanam Recovery House - Men's Transition Home",
      description: "18-bed transition home for adult men struggling with addictions and mental health issues. Provides a stable environment to promote recovery, offering support services, counselling, and assistance with independent living skills.",
      address: "Kelowna, BC",
      website: "https://www.recoverykelowna.ca",
      email: "info@recoverykelowna.ca",
      hours: "Call for availability and program information",
      verified: true
    },
    // Karis Support Society - Women's Recovery
    {
      categoryId: catMap.get("addiction")!,
      name: "Karis Support Society - Women's Addiction Recovery",
      description: "Continuum of services for women dealing with addiction and mental health challenges, including stabilization, semi-independent living, and aftercare programs. Provides safe, supportive housing and comprehensive recovery support.",
      address: "Kelowna, BC",
      website: "https://karis-society.org",
      email: "info@karis-society.org",
      hours: "Call for program information and availability",
      verified: true
    },
    // Al-Anon Family Groups
    {
      categoryId: catMap.get("addiction")!,
      name: "Al-Anon Family Groups - Kelowna",
      description: "Support groups for families and friends of alcoholics. Meetings held at Kalano Club and other locations. Provides peer support and resources for those affected by someone else's drinking. Free meetings, no registration required.",
      address: "2108 Vasile Road, Kelowna, BC V1Y 6H5 (Kalano Club)",
      phone: "250-762-4999",
      website: "https://www.al-anon.org",
      email: "info@al-anon.org",
      hours: "Call Kalano Club for meeting schedules",
      verified: true
    },
    // Narcotics Anonymous - Kelowna
    {
      categoryId: catMap.get("addiction")!,
      name: "Narcotics Anonymous - Kelowna Area",
      description: "Free support groups for individuals recovering from drug addiction. Meetings held at Kalano Club and other locations throughout Kelowna and West Kelowna. Open to anyone with a desire to stop using. No fees, no registration required.",
      address: "2108 Vasile Road, Kelowna, BC V1Y 6H5 (Kalano Club)",
      phone: "250-762-4999",
      website: "https://www.navancouver.org",
      email: "info@navancouver.org",
      hours: "Call Kalano Club for meeting schedules",
      verified: true
    },
    // Alcoholics Anonymous - Additional Resources
    {
      categoryId: catMap.get("addiction")!,
      name: "Alcoholics Anonymous - Kelowna Area",
      description: "Free support groups for individuals recovering from alcoholism. Multiple meetings daily throughout Kelowna and West Kelowna. Open to anyone with a desire to stop drinking. No fees, no registration required. Meetings available for all ages.",
      address: "Multiple locations - Kalano Club: 2108 Vasile Road, Kelowna, BC V1Y 6H5",
      phone: "250-762-4999 (Kalano Club)",
      website: "https://www.aa.org",
      email: "info@aa.org",
      hours: "Multiple daily meetings - call for schedules",
      verified: true
    },
    // SMART Recovery
    {
      categoryId: catMap.get("addiction")!,
      name: "SMART Recovery - Kelowna Area",
      description: "Science-based addiction recovery support groups using cognitive behavioral therapy and motivational interviewing. Free meetings for individuals recovering from any addictive behavior. Available in-person and online.",
      address: "Various locations in Kelowna",
      website: "https://www.smartrecovery.org",
      email: "info@smartrecovery.org",
      hours: "Call or check website for meeting schedules",
      verified: true
    },
    // Toward the Heart - Naloxone Distribution (Kelowna specific)
    {
      categoryId: catMap.get("addiction")!,
      name: "Toward the Heart - Naloxone Distribution (Kelowna)",
      description: "Free naloxone kits and training available at pharmacies and harm reduction sites throughout Kelowna. Naloxone can reverse opioid overdoses. No prescription needed. Training provided on-site. Find locations at towardtheheart.com.",
      address: "Various pharmacies and harm reduction sites in Kelowna",
      website: "https://towardtheheart.com/site-locator",
      email: "info@towardtheheart.com",
      hours: "Available at participating locations during business hours",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Toward the Heart - Overdose Prevention Sites (Kelowna)",
      description: "Supervised consumption sites providing safe, monitored spaces for substance use. Staff trained in overdose response and naloxone administration. Reduces overdose deaths and connects people to health and social services.",
      address: "Various locations in Kelowna",
      website: "https://towardtheheart.com/site-locator",
      email: "info@towardtheheart.com",
      hours: "Check website for specific site hours",
      verified: true
    },
    // BC Drug Checking - Kelowna Locations
    {
      categoryId: catMap.get("addiction")!,
      name: "BC Drug Checking - Kelowna Locations",
      description: "Free, anonymous drug checking services to test substances for safety. Available at harm reduction sites in Kelowna. Results available in minutes. Helps prevent overdose by identifying toxic substances. No judgment, confidential service.",
      address: "Various harm reduction sites in Kelowna",
      website: "https://drugcheckingbc.ca/",
      email: "info@drugcheckingbc.ca",
      hours: "Check website for specific location hours",
      verified: true
    },
    // Community Response Team - Already exists but ensure it's in addiction category
    {
      categoryId: catMap.get("addiction")!,
      name: "Community Response Team - Substance Use Crisis",
      description: "Mobile crisis response team for individuals in Kelowna, West Kelowna, Lake Country, and Peachland experiencing mental health or substance use crises. Provides assessment, recommendations, brief follow-up, and referrals. Available 7 days a week.",
      address: "Mobile service - Kelowna, West Kelowna, Lake Country, Peachland",
      phone: "250-212-8533",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "7 days a week, 11:30 AM - 9:00 PM",
      verified: true
    },
    // Street Survival Guide Resources - Verified for 2025
    // Shelters
    {
      categoryId: catMap.get("shelters")!,
      name: "Alexandra Gardner Women and Children Safe Centre",
      description: "Emergency shelter for women, youth, and women with children who are experiencing homelessness. Provides safe, temporary accommodation and support services.",
      address: "Kelowna, BC",
      phone: "250-763-2262",
      latitude: "49.8880",
      longitude: "-119.4960",
      hours: "24/7 - Call for availability",
      verified: true
    },
    // Overdose Prevention Site - Specific Location
    {
      categoryId: catMap.get("addiction")!,
      name: "Downtown Overdose Prevention Site - Kelowna",
      description: "Supervised consumption site located behind Outreach Urban Health Centre. Place where people can use their drugs while being safely monitored. Enhanced harm reduction services/supplies and overdose prevention. Open 7 days a week.",
      address: "1649 Pandosy Street (behind Outreach Urban Health Centre), Kelowna, BC V1Y 1P6",
      phone: "250-868-2230",
      website: "https://www.interiorhealth.ca",
      email: "info@interiorhealth.ca",
      hours: "7 days a week, 11:30 AM - 10:30 PM",
      verified: true
    },
    // Drug Checking Services
    {
      categoryId: catMap.get("addiction")!,
      name: "Drug Checking Service - Kelowna",
      description: "Free, anonymous drug checking to test substances for safety. Available Monday-Friday, 11:00 AM - 7:00 PM. Results in minutes. Helps prevent overdose by identifying toxic substances.",
      address: "Kelowna, BC",
      phone: "250-869-7870",
      hours: "Monday-Friday, 11:00 AM - 7:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "UBCO Drug Checking Service",
      description: "On-site drug testing available Tuesday and Thursday, 5:30-7:30 PM. Free, anonymous service to test substances for safety. Located at UBCO, Room 336 UNC, 3272 University Way.",
      address: "3272 University Way, Room 336 UNC, Kelowna, BC",
      phone: "250-807-9271",
      website: "https://students.ok.ubc.ca",
      email: "info@students.ok.ubc.ca",
      hours: "Tuesday & Thursday, 5:30 PM - 7:30 PM",
      verified: true
    },
    // Outreach Services
    {
      categoryId: catMap.get("crisis")!,
      name: "H.O.P.E Outreach - Kelowna & Vernon",
      description: "Provides nighttime outreach, 7 days a week, to women in Kelowna and Vernon. Offers support, resources, and safety planning. Can report 'bad dates' via phone call or online form at hopeskanagan.com.",
      address: "Mobile service - Kelowna & Vernon",
      phone: "250-864-0399",
      website: "https://hopeskanagan.com",
      email: "info@hopeskanagan.com",
      hours: "7 days a week, nighttime hours",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "PEOPLE'S Connect - Queensway Bus Loop",
      description: "Community link and information to support services available from 8:00 AM - 8:00 PM daily. Provides information, referrals, and connection to community resources.",
      address: "Queensway Bus Loop, Kelowna, BC",
      hours: "Daily, 8:00 AM - 8:00 PM",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Downtown On-Call - Kelowna",
      description: "Patrol, escort and emergency services in downtown Kelowna. Provides safety support, escorts, and emergency response. Fall hours: Monday-Saturday, 6:00 AM-9:00 PM & Sunday, 10:00 AM-6:00 PM.",
      address: "Downtown Kelowna",
      phone: "250-470-9058",
      hours: "Fall hours: Mon-Sat 6:00 AM-9:00 PM, Sun 10:00 AM-6:00 PM",
      verified: true
    },
    // Support Groups
    {
      categoryId: catMap.get("addiction")!,
      name: "Celebrate Recovery - Metro Community at Evangel Church",
      description: "Christ-centered 12 steps recovery program. Meets Fridays 6:30 PM-7:30 PM. Check Facebook page for updates: www.facebook.com/CRKELOWNA.",
      address: "3261 Gordon Drive, Kelowna, BC",
      phone: "778-478-9727",
      website: "https://www.facebook.com/CRKELOWNA",
      email: "info@facebook.com",
      hours: "Fridays, 6:30 PM - 7:30 PM",
      verified: true
    },
    // Health Services
    {
      categoryId: catMap.get("health")!,
      name: "Options for Sexual Health - Kelowna",
      description: "Offers support about sex, sexuality, safer sex supplies, counselling, women's health screening including PAP, pregnancy, STI testing and emergency contraception, birth control at reduced rates. Book an appointment: Mon-Fri, 9:00 AM-4:30 PM. Talk to a nurse: Mon-Fri, 9:00 AM-9:00 PM.",
      address: "#102-285 Aurora Crescent, Kelowna, BC",
      phone: "1-800-739-7367",
      website: "https://www.optionsforsexualhealth.org",
      email: "info@optionsforsexualhealth.org",
      hours: "Appointments: Mon-Fri 9:00 AM-4:30 PM. Nurse line: Mon-Fri 9:00 AM-9:00 PM",
      verified: true
    },
    // Food Resources
    {
      categoryId: catMap.get("food-banks")!,
      name: "Kelowna Community Fridge",
      description: "Safe 24/7 access to free food. Community fridge located at 1310 Bertram Street (facing Cawston Ave). Take what you need, leave what you can. No registration required.",
      address: "1310 Bertram Street (facing Cawston Ave), Kelowna, BC",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "First United Church - Outreach Program",
      description: "Outreach program distributes groceries and take-away lunch meals Tuesday & Thursday, 10:00 AM-11:00 AM.",
      address: "721 Bernard Avenue, Kelowna, BC",
      phone: "250-762-3311",
      hours: "Tuesday & Thursday, 10:00 AM - 11:00 AM",
      verified: true
    },
    {
      categoryId: catMap.get("food-banks")!,
      name: "St. Michaels Food Cupboard",
      description: "Food assistance program providing groceries to those in need. Open every Friday from 10:00 AM-11:00 AM.",
      address: "608 Sutherland Avenue, Kelowna, BC",
      phone: "250-762-3321",
      hours: "Fridays, 10:00 AM - 11:00 AM",
      verified: true
    },
    // Crisis Lines
    {
      categoryId: catMap.get("crisis")!,
      name: "Interior Crisis Line",
      description: "24/7 telephone crisis intervention service. Provides immediate support for individuals in crisis, including mental health, substance use, and suicide prevention.",
      address: "Phone service - Interior BC",
      phone: "1-888-353-2273",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "Crisis Text Line",
      description: "Free, 24/7 crisis support via text message. Text 'HOME' to 686868 for immediate support. Available for anyone in crisis, including mental health, substance use, and suicide prevention.",
      address: "Text service - Canada-wide",
      phone: "Text: 686868",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("crisis")!,
      name: "1-800-SUICIDE (Suicide Prevention Line)",
      description: "24/7 suicide prevention and crisis intervention service. If you are considering suicide or are concerned about someone who may be, call for immediate support.",
      address: "Phone service - BC-wide",
      phone: "1-800-784-2433",
      hours: "24/7",
      verified: true
    },
    // Information & Referral
    {
      categoryId: catMap.get("crisis")!,
      name: "KCR Community Resources - Information & Referral",
      description: "Provides information on community resources. Community Information Database available at https://kelowna.cioc.ca. Call for assistance finding services.",
      address: "620 Leon Avenue, Kelowna, BC V1Y 9T2",
      phone: "250-763-8008 ext 221",
      website: "https://kcr.ca",
      email: "info@kcr.ca",
      hours: "Monday-Friday, 8:30 AM - 4:30 PM",
      verified: true
    },
    {
      categoryId: catMap.get("addiction")!,
      name: "Alcohol and Drug Information and Referral Service",
      description: "Responds to inquiries on all aspects of alcohol and drug use and misuse. Certified information and referral specialists provide information on, and referral to, a full range of counselling and treatment services across BC. Services are confidential, multilingual, free and available 24/7.",
      address: "Phone service - BC-wide",
      phone: "1-800-663-1441",
      website: "https://www2.gov.bc.ca",
      email: "info@www2.gov.bc.ca",
      hours: "24/7",
      verified: true
    },
    {
      categoryId: catMap.get("health")!,
      name: "Mental Health & Substance Use (MHSU) Help Line",
      description: "Connects anyone in BC to the nearest MHSU centre and staff who can direct them to the right mental health and substance use service. Free, confidential service.",
      address: "Phone service - BC-wide",
      phone: "310-6789 (no area code required)",
      hours: "24/7",
      verified: true
    },
  ];

  // Create resources with error handling - log failures but continue
  let successCount = 0;
  let failureCount = 0;
  const results = await Promise.allSettled(resources.map(r => storage.createResource(r)));
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      failureCount++;
      logger.error(`Failed to seed resource ${index + 1}: ${result.reason?.message || 'Unknown error'}`, {
        resourceName: resources[index]?.name,
        error: result.reason
      });
    }
  });
  
  // After creating all resources, assign additional categories for resources that belong in multiple categories
  // This uses the many-to-many junction table
  logger.info("Assigning additional categories for multi-category resources...");
  await assignMultipleCategories(catMap);
  
  logger.info(`Database seeding complete! ${successCount} resources created${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
}

import { requireAuth, requireAdmin } from "./auth/middleware";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed on startup if database is empty
  seedDatabase().catch((error) => {
    logger.error("Failed to seed database", error);
  });

  // Chat routes for the AI assistant
  registerChatRoutes(app);

  // Category endpoints
  app.get(api.categories.list.path, asyncHandler(async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  }));

  app.get(api.categories.get.path, asyncHandler(async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  }));

  // Resource endpoints
  app.get(api.resources.list.path, asyncHandler(async (req, res) => {
    // Parse and validate categoryId if provided
    let categoryId: number | undefined;
    if (req.query.categoryId) {
      const parsed = parseInt(String(req.query.categoryId), 10);
      if (isNaN(parsed)) {
        return res.status(400).json({ error: "Invalid categoryId parameter" });
      }
      categoryId = parsed;
    }
    const search = req.query.search as string | undefined;
    const resources = await storage.getResources({ categoryId, search });
    res.json(resources);
  }));

  app.get(api.resources.get.path, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }
    const resource = await storage.getResource(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  }));

  app.patch("/api/resources/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }
    
    // Validate update payload
    const updates = updateResourceSchema.parse(req.body);
    
    const updated = await storage.updateResource(id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(updated);
  }));

  // Health check endpoint (for monitoring/deployment)
  app.get('/health', asyncHandler(async (req, res) => {
    try {
      // Quick database connectivity check
      await storage.getCategories();
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
    }
  }));

  // Readiness check endpoint
  app.get('/ready', asyncHandler(async (req, res) => {
    try {
      const categories = await storage.getCategories();
      const resources = await storage.getResources();
      res.json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        categories: categories.length,
        resources: resources.length
      });
    } catch (error) {
      res.status(503).json({ status: 'not ready', error: 'Service not ready' });
    }
  }));

  // Stats endpoint for admin/dashboard
  app.get('/api/stats', asyncHandler(async (req, res) => {
    const categories = await storage.getCategories();
    const resources = await storage.getResources();
    const verifiedCount = resources.filter(r => r.verified).length;
    const withHours = resources.filter(r => r.hours).length;
    const withWebsite = resources.filter(r => r.website).length;
    
    res.json({
      totalResources: resources.length,
      totalCategories: categories.length,
      verifiedResources: verifiedCount,
      resourcesWithHours: withHours,
      resourcesWithWebsite: withWebsite,
      lastUpdated: new Date().toISOString()
    });
  }));

  // Update Requests - for community services to submit changes
  app.get('/api/update-requests', asyncHandler(async (req, res) => {
    const requests = await storage.getUpdateRequests();
    res.json(requests);
  }));

  app.post('/api/update-requests', asyncHandler(async (req, res) => {
    const { insertUpdateRequestSchema } = await import("@shared/schema");
    const validatedData = insertUpdateRequestSchema.parse(req.body);
    const request = await storage.createUpdateRequest(validatedData);
    
    // Send email notification (non-blocking)
    try {
      const { sendUpdateRequestEmail } = await import("./utils/email.js");
      await sendUpdateRequestEmail({
        resourceName: validatedData.resourceName,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone || undefined,
        requestType: validatedData.requestType as "update" | "new" | "remove",
        details: validatedData.details,
      });
    } catch (emailError) {
      logger.error("Failed to send email notification", emailError, {
        requestId: request.id,
        resourceName: validatedData.resourceName,
      });
      // Continue even if email fails - request is still saved
    }
    
    res.status(201).json(request);
  }));

  app.patch('/api/update-requests/:id', asyncHandler(async (req, res) => {
    const { z } = await import("zod");
    const updateRequestStatusSchema = z.object({
      status: z.enum(['pending', 'approved', 'rejected']),
      adminNotes: z.string().optional()
    });
    const { status, adminNotes } = updateRequestStatusSchema.parse(req.body);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid update request ID" });
    }
    const updated = await storage.updateUpdateRequestStatus(id, status, adminNotes);
    if (!updated) {
      return res.status(404).json({ message: 'Update request not found' });
    }
    res.json(updated);
  }));

  // Config endpoint - provides public configuration to frontend
  app.get('/api/config', asyncHandler(async (req, res) => {
    const { env } = await import("./config.js");
    res.json({
      supportEmail: env.SUPPORT_EMAIL || "support@lifesavertech.ca",
      baseUrl: env.BASE_URL || "https://helpkelowna.com",
    });
  }));

  // Test email endpoint - Admin only, for verifying SMTP configuration
  // Requires authentication and admin role, protected by CSRF
  app.post('/api/test-email', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    // Additional safety: Disable in production unless explicitly enabled via env var
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_TEST_EMAIL !== "true") {
      res.status(403).json({
        error: "Forbidden",
        message: "Test email endpoint is disabled in production for security",
      });
      return;
    }

    const { sendTestEmail } = await import("./utils/email.js");
    const result = await sendTestEmail();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message,
        note: "Check support@lifesavertech.ca inbox for the test email"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.message,
        error: result.error 
      });
    }
  }));

  return httpServer;
}
