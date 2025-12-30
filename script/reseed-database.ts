#!/usr/bin/env tsx
/**
 * @fileoverview Database reseeding script
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Script to clear and reseed the database.
 * 
 * Usage:
 *   tsx script/reseed-database.ts
 * 
 * WARNING: This will delete ALL data from the database!
 */

import { config } from "dotenv";
import { db } from "../server/db";
import { categories, resources, updateRequests, conversations, messages, users } from "../shared/schema";
import { sql } from "drizzle-orm";

config();

async function reseedDatabase() {
  try {
    console.log("🗑️  Clearing existing data...");
    
    // Delete in correct order (respecting foreign keys)
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(updateRequests);
    await db.delete(resources);
    await db.delete(categories);
    // Note: We don't delete users to preserve admin accounts
    
    console.log("✅ Database cleared!");
    console.log("🌱 Database will be reseeded automatically on next server start.");
    console.log("💡 Restart your server with 'npm run dev' to trigger seeding.");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

reseedDatabase();
