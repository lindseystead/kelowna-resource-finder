#!/usr/bin/env tsx
/**
 * @fileoverview Script to add email column to resources table
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Safely adds the email column to the resources table without affecting other tables.
 */

import { config } from "dotenv";
import { pool } from "../server/db";

config();

async function addEmailColumn() {
  try {
    console.log("Adding email column to resources table...");
    
    // Add email column (nullable, as not all resources have email addresses)
    await pool.query(`
      ALTER TABLE resources 
      ADD COLUMN IF NOT EXISTS email text;
    `);
    
    // Add index for email lookups (optional, but useful if searching by email)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_email 
      ON resources(email) 
      WHERE email IS NOT NULL;
    `);
    
    console.log("✅ Email column added successfully!");
    console.log("✅ Index created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding email column:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addEmailColumn();

