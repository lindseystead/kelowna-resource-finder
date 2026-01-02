/**
 * @fileoverview Session management configuration
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Professional-grade session configuration following OWASP best practices.
 * 
 * Security features:
 * - Secure cookies (HTTPS only in production)
 * - HttpOnly flag (prevents XSS)
 * - SameSite protection (CSRF mitigation)
 * - PostgreSQL-backed session store (persistent, scalable)
 * - Automatic session cleanup
 * - Strong session secret
 */

import session from "express-session";
import PgSession from "connect-pg-simple";
import { pool } from "../db";
import { env, getSessionSecret } from "../config";

const PgSessionStore = PgSession(session);

export const sessionMiddleware = session({
  store: new PgSessionStore({
    // Type assertion needed due to connect-pg-simple type incompatibility with pg Pool.
    // The pool is compatible at runtime, but TypeScript types don't align perfectly.
    // This is a known limitation of the connect-pg-simple library's type definitions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pool: pool as any,
    tableName: "user_sessions", // Custom table name
    // CRITICAL: Set to false in production to prevent filesystem SQL file reads
    // The session table must be created via migration (006_add_session_table.sql)
    // before deploying to production. This prevents ENOENT errors when connect-pg-simple
    // tries to read table.sql from the filesystem.
    createTableIfMissing: env.NODE_ENV === "development", // Only auto-create in dev
  }),
  secret: getSessionSecret(),
  name: "kelowna_aid.sid", // Custom session name (security through obscurity)
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    secure: env.NODE_ENV === "production", // HTTPS only in production (required for sameSite: "none")
    httpOnly: true, // Prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // In production with cross-origin (Vercel frontend + Railway backend),
    // we need sameSite: "none" for cookies to work across domains
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  },
  rolling: true, // Reset expiration on activity
});

/**
 * Extends Express Request type to include session user data.
 */
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    userRole?: "admin" | "user";
    loginTime?: number;
  }
}

