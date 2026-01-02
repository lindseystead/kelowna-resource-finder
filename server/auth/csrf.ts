/**
 * @fileoverview CSRF protection middleware
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Simple CSRF token generation and validation.
 * 
 * This implementation follows the double-submit cookie pattern:
 * 1. Generate a random token
 * 2. Store it in the session
 * 3. Send it as both a cookie and in the request body/header
 * 4. Verify they match
 * 
 * This protects against CSRF attacks while being stateless on the client.
 */

import { randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a secure random CSRF token.
 */
function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Middleware to generate and attach CSRF token to session.
 * Token is also sent as a cookie for easy access from JavaScript.
 */
export function csrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ensure session exists (create if needed)
  // With saveUninitialized: false, we need to explicitly create the session
  // by storing something in it
  if (!req.session) {
    // This shouldn't happen if session middleware is properly configured,
    // but handle it gracefully
    return next();
  }

  // Generate token on first request, reuse for session
  // Setting req.session.csrfToken will mark the session as modified
  // and express-session will save it automatically
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  // Set cookie - not httpOnly so JS can read it for AJAX requests
  // In production with cross-origin requests (Vercel frontend + Railway backend),
  // we need sameSite: "none" with secure: true for cookies to work
  const isProduction = process.env.NODE_ENV === "production";
  const token = req.session.csrfToken;
  
  // Always set the cookie, even if it already exists (ensures it's sent)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be false so JavaScript can read it
    secure: isProduction, // Required for sameSite: "none"
    sameSite: isProduction ? "none" : "strict", // "none" allows cross-origin, "strict" for same-origin
    path: "/",
    // Don't set domain - let browser handle it for cross-origin
    // Setting domain would restrict the cookie to that domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (match session cookie)
  });

  // Attach token to response for easy access
  res.locals.csrfToken = token;

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests.
 * 
 * Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF protection.
 * All other methods require a valid CSRF token.
 */
export function validateCsrf(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
  // These methods should never modify state, so CSRF protection isn't needed
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF validation for health/readiness checks
  if (req.path === "/health" || req.path === "/ready") {
    return next();
  }

  // For state-changing requests (POST, PATCH, DELETE, etc.), require CSRF token
  // Check if session exists - if not, this is a problem
  if (!req.session) {
    // Log error but don't expose internal details
    console.error("CSRF validation failed: session not initialized", {
      method: req.method,
      path: req.path,
    });
    res.status(403).json({
      error: "Session not initialized",
      message: "Please refresh the page and try again",
    });
    return;
  }

  const sessionToken = req.session.csrfToken;
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  const bodyToken = (req.body as { _csrf?: string })?._csrf;

  const providedToken = headerToken || bodyToken;

  // Require token for state-changing requests
  if (!sessionToken || !providedToken) {
    res.status(403).json({
      error: "CSRF token missing",
      message: "CSRF token is required for this request. Please refresh the page and try again.",
    });
    return;
  }

  // Validate token (use constant-time comparison to prevent timing attacks)
  if (sessionToken.length !== providedToken.length) {
    res.status(403).json({
      error: "Invalid CSRF token",
      message: "CSRF token validation failed",
    });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  const sessionBuffer = Buffer.from(sessionToken, "utf8");
  const providedBuffer = Buffer.from(providedToken, "utf8");
  
  try {
    const isValid = timingSafeEqual(sessionBuffer, providedBuffer);
    if (!isValid) {
      res.status(403).json({
        error: "Invalid CSRF token",
        message: "CSRF token validation failed",
      });
      return;
    }
  } catch (error) {
    // Buffer length mismatch (shouldn't happen due to check above, but be safe)
    res.status(403).json({
      error: "Invalid CSRF token",
      message: "CSRF token validation failed",
    });
    return;
  }

  next();
}

/**
 * Extends Express Session to include CSRF token.
 */
declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

