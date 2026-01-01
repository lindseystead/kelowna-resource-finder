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

// Prefer IPv4 results when both AAAA and A records exist.
// Some hosting environments (including Railway) may not have IPv6 egress,
// which can cause `connect ENETUNREACH <ipv6>` against Supabase.
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

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

function shouldRelaxTlsForDatabase(connectionString: string): boolean {
  // Allow explicit override via env (recommended: set to "false" in Railway only if needed).
  if (process.env.PGSSL_REJECT_UNAUTHORIZED === "false") return true;
  if (process.env.PGSSL_REJECT_UNAUTHORIZED === "true") return false;

  // Supabase pooler/direct endpoints sometimes surface TLS chain issues in certain runtimes.
  // If the platform cannot validate the full chain, we relax validation rather than fail hard.
  // This keeps encryption (TLS) but skips strict chain verification.
  try {
    const url = new URL(connectionString);
    const host = url.hostname.toLowerCase();
    return host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com");
  } catch {
    return false;
  }
}

// Connection pool - defaults to 10 connections which is fine for our scale
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production" && shouldRelaxTlsForDatabase(process.env.DATABASE_URL)
      ? { rejectUnauthorized: false }
      : undefined,
});

// Drizzle instance with schema - gives us type-safe queries
export const db = drizzle(pool, { schema });
