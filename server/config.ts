/**
 * @fileoverview Environment configuration and validation
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Validates and exports environment variables with type safety.
 * Ensures required configuration is present before application startup.
 */

import { config } from "dotenv";
config();

import { z } from "zod";
import { SESSION } from "./constants";

/**
 * Environment variable validation schema.
 * Ensures all required environment variables are present and valid.
 * Fails fast with clear error messages if configuration is invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default("5000"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(SESSION.MIN_SECRET_LENGTH, `SESSION_SECRET must be at least ${SESSION.MIN_SECRET_LENGTH} characters`).optional(),
  ALLOWED_ORIGINS: z.string().optional(), // Comma-separated list of allowed CORS origins
  SUPPORT_EMAIL: z.string().email().optional(), // Support email for contact forms
  BASE_URL: z.string().url().optional(), // Base URL for SEO and email links
});

/**
 * Validated environment variables.
 * Throws error on startup if configuration is invalid.
 */
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  BASE_URL: process.env.BASE_URL,
});

/**
 * Checks if OpenAI features are available.
 */
export const isOpenAIConfigured = (): boolean => {
  return !!env.OPENAI_API_KEY;
};


/**
 * Get session secret - required for cookie signing
 * Auto-generates in dev, but must be set in production
 */
export const getSessionSecret = (): string => {
  if (env.SESSION_SECRET) {
    return env.SESSION_SECRET;
  }
  
  // Can't auto-generate in prod (would change on every restart)
  if (env.NODE_ENV === "production") {
    throw new Error(
      `SESSION_SECRET is required in production. ` +
      `Generate a secure random string (at least ${SESSION.MIN_SECRET_LENGTH} characters): ` +
      `node -e "console.log(require('crypto').randomBytes(${SESSION.MIN_SECRET_LENGTH}).toString('hex'))"`
    );
  }
  
  // Development fallback (not secure, but convenient)
  // Note: Using console.warn here because logger may not be initialized yet during config loading
  console.warn("WARNING: Using insecure default SESSION_SECRET. Set SESSION_SECRET in .env for production.");
  return "dev-session-secret-change-in-production-min-32-chars";
};

