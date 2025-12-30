/**
 * @fileoverview Security middleware configuration
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Implements security headers, CORS, and rate limiting middleware.
 */

import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config";
import { logger } from "../utils/logger";
import { RATE_LIMIT } from "../constants";

/**
 * Security headers middleware using Helmet.js.
 * Configures various HTTP headers to protect against common vulnerabilities.
 */
export const securityHeaders = helmet({
  // Disable CSP in dev (Vite needs it), enable in prod
  contentSecurityPolicy: env.NODE_ENV === "development" ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Tailwind + Google Fonts
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Vite HMR needs this
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // WebSocket for HMR
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * CORS configuration.
 * Restricts origins in production, allows all in development.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests without origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Dev mode - allow everything for easier testing
    if (env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // In production, check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];
    
    if (allowedOrigins.length === 0) {
      // If no ALLOWED_ORIGINS set, allow all (not recommended for production)
      logger.warn("ALLOWED_ORIGINS not set. Allowing all origins.", {
        environment: env.NODE_ENV,
      });
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  exposedHeaders: ["X-Request-ID"],
});

/**
 * Global API rate limiter.
 * Protects all API endpoints from abuse.
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.STANDARD_MAX,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/ready";
  },
});

/**
 * Strict rate limiter for resource-intensive endpoints.
 */
export const strictRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.STRICT_MAX,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

