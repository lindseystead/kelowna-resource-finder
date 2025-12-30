/**
 * @fileoverview Database connection and configuration
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Establishes PostgreSQL database connection using Drizzle ORM.
 * Environment variables must be loaded before database initialization.
 */

import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Fail fast if database isn't configured
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool - defaults to 10 connections which is fine for our scale
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Drizzle instance with schema - gives us type-safe queries
export const db = drizzle(pool, { schema });
