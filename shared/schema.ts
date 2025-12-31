/**
 * @fileoverview Database schema definitions
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Defines database tables, types, and validation schemas using Drizzle ORM and Zod.
 */

import { pgTable, text, serial, boolean, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
/**
 * Categories table - Resource categories (Food Support, Shelters, Health, etc.)
 * Categories are seeded once on initial database setup and rarely change.
 * Slug is used for URL routing (e.g., /category/food-banks).
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Display name (e.g., "Food Support")
  slug: text("slug").notNull().unique(), // URL-friendly identifier (e.g., "food-banks")
  description: text("description"), // Optional category description
  icon: text("icon").notNull(), // Icon name for UI (Lucide icon identifier)
});

/**
 * Resources table - Community service listings
 * 
 * Data Source: Manually curated from public sources (organization websites, 
 * community directories, verified listings). Initial data seeded from 
 * server/routes.ts seedDatabase() function.
 * 
 * Collection Method: Initial data (250+ resources) is pre-seeded in 
 * server/routes.ts seedDatabase() function and loads automatically on first run.
 * 
 * The data was manually curated from publicly available sources:
 * - Information researched from organization websites
 * - Public directories (City of Kelowna, West Kelowna, BC 211)
 * - Community partner listings
 * - All data manually reviewed and verified before being added to the seed script
 * 
 * 
 * Lifecycle:
 * - Created: Via seed script (initial) or admin dashboard (updates)
 * - Updated: Admin-approved changes from update_requests table
 * - Verified: Defaults to true for seeded data; can be marked false if info becomes outdated
 * 
 * Note: Coordinates stored as text (not numeric) to preserve precision and handle
 * edge cases. Hours stored as free-form text (e.g., "Mon-Fri 9am-5pm") for flexibility.
 */
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id), // DEPRECATED: Kept for backward compatibility during migration
  name: text("name").notNull(), // Organization/service name
  description: text("description").notNull(), // Service description and eligibility info
  address: text("address").notNull(), // Full address or service location
  phone: text("phone"), // Contact phone (nullable - some services are online-only)
  email: text("email"), // Contact email (nullable - added via migration 004)
  website: text("website"), // Organization website URL (nullable)
  latitude: text("latitude"), // GPS latitude as string (nullable - some services are phone-only)
  longitude: text("longitude"), // GPS longitude as string (nullable)
  hours: text("hours"), // Operating hours as free-form text (nullable - varies by service type)
  verified: boolean("verified").default(true), // Whether info has been verified (defaults true for seeded data)
  lastVerified: timestamp("last_verified"), // Timestamp of last verification check (nullable)
  createdAt: timestamp("created_at").defaultNow(), // When resource was first added to database
});

/**
 * Resource-Category junction table - Many-to-many relationship
 * 
 * Allows resources to belong to multiple categories (e.g., a youth shelter
 * can be in both "shelters" and "youth" categories).
 * 
 * Design Decision: Many-to-many relationship provides better UX and accuracy.
 * Resources often span multiple categories (youth + shelters, crisis + youth, etc.).
 * This follows industry-standard database normalization practices.
 * 
 * Foreign keys use CASCADE delete: if a resource or category is deleted,
 * all associated junction table entries are automatically removed.
 */
export const resourceCategories = pgTable("resource_categories", {
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.resourceId, table.categoryId] }),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === BASE SCHEMAS ===
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
export const insertResourceCategorySchema = createInsertSchema(resourceCategories);
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// === TYPES ===
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type InsertResourceCategory = z.infer<typeof insertResourceCategorySchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

/**
 * Update Requests table - Community-submitted changes to resource listings
 * 
 * Workflow:
 * 1. Community member/organization submits update via /api/update-requests
 * 2. Email notification sent to admin (see server/utils/email.ts)
 * 3. Admin reviews in dashboard and approves/rejects
 * 4. If approved: Admin manually applies changes to resources table
 * 5. If rejected: Admin adds notes explaining why
 * 
 * Note: resourceId is nullable because 'new' requests don't reference existing resources.
 * All requests require moderation before being applied to the resources table.
 */
export const updateRequests = pgTable("update_requests", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id), // Nullable - 'new' requests don't have resourceId
  resourceName: text("resource_name").notNull(), // Name of resource being updated/added
  contactName: text("contact_name").notNull(), // Submitter's name
  contactEmail: text("contact_email").notNull(), // Submitter's email (validated via constraint)
  contactPhone: text("contact_phone"), // Optional phone number
  requestType: text("request_type").notNull(), // 'update', 'new', or 'remove'
  details: text("details").notNull(), // Full description of requested change (max 5000 chars)
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"), // Admin's notes on review decision
  createdAt: timestamp("created_at").defaultNow(), // When request was submitted
  reviewedAt: timestamp("reviewed_at"), // When admin reviewed (set on status change)
});

export const insertUpdateRequestSchema = createInsertSchema(updateRequests).omit({ id: true, createdAt: true, reviewedAt: true, status: true, adminNotes: true });

export type UpdateRequest = typeof updateRequests.$inferSelect;
export type InsertUpdateRequest = z.infer<typeof insertUpdateRequestSchema>;

/**
 * Users table - Admin and user accounts for authentication
 * 
 * Lifecycle:
 * - Created: Via script/create-admin.ts or admin registration endpoint
 * - Password: Hashed with bcrypt (12 rounds) before storage
 * - Sessions: Managed via express-session with PostgreSQL store
 * - Soft delete: isActive flag allows disabling accounts without deletion
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Login email (unique constraint)
  passwordHash: text("password_hash").notNull(), // bcrypt hash (never store plaintext)
  role: text("role").default("user").notNull(), // 'admin' or 'user' (admin can manage resources)
  createdAt: timestamp("created_at").defaultNow(), // Account creation time
  updatedAt: timestamp("updated_at").defaultNow(), // Auto-updated via trigger (migration 003)
  lastLoginAt: timestamp("last_login_at"), // Last successful login (nullable)
  isActive: boolean("is_active").default(true).notNull(), // Soft delete flag
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "user"]).default("user"),
}).omit({ id: true, createdAt: true, updatedAt: true, lastLoginAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Update schemas (for PATCH requests - all fields optional)
export const updateResourceSchema = createInsertSchema(resources)
  .omit({ id: true, createdAt: true })
  .partial(); // Make all fields optional for updates

// API Types
export type CreateResourceRequest = InsertResource;
export type UpdateResourceRequest = z.infer<typeof updateResourceSchema>;
