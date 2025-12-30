/**
 * @fileoverview Authentication API routes
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Handles user authentication, registration, and session management.
 * Includes rate limiting to prevent brute force attacks.
 */

import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "../db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./middleware";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import rateLimit from "express-rate-limit";
import { RATE_LIMIT, PASSWORD } from "../constants";

// Rate limit auth endpoints - prevent brute force
const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't penalize successful logins
});

// Even stricter for login (most targeted endpoint)
const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.LOGIN_MAX,
  message: "Too many login attempts, please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = insertUserSchema.extend({
  password: z.string().min(PASSWORD.MIN_LENGTH, `Password must be at least ${PASSWORD.MIN_LENGTH} characters`),
});

/**
 * POST /api/auth/login
 * Authenticates a user and creates a session.
 */
async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Normalize email (lowercase, trim) before lookup
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      // Generic error message - don't reveal if email exists (security)
      res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        error: "Account disabled",
        message: "Your account has been disabled. Please contact an administrator.",
      });
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
      return;
    }

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role as "admin" | "user";
    req.session.loginTime = Date.now();

    // Update last login time
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        message: error.errors[0]?.message || "Invalid request data",
        details: error.errors,
      });
      return;
    }

    logger.error("Login error", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to process login request",
    });
  }
}

/**
 * POST /api/auth/logout
 * Destroys the current session.
 */
function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      logger.error("Error destroying session", err);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to log out",
      });
      return;
    }

    res.clearCookie("kelowna_aid.sid");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information.
 */
async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.session?.userId) {
    res.status(401).json({
      error: "Not authenticated",
      message: "Please log in to view your profile",
    });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      // Session exists but user doesn't - clear session
      req.session.destroy(() => {});
      res.status(401).json({
        error: "User not found",
        message: "Your session is invalid",
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error("Error fetching user", { error });
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user information",
    });
  }
}

/**
 * POST /api/auth/register (Admin only)
 * Creates a new user account.
 */
async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = createUserSchema.parse(req.body);

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      res.status(409).json({
        error: "User already exists",
        message: "An account with this email already exists",
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, PASSWORD.SALT_ROUNDS);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || "admin",
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    res.status(201).json({
      success: true,
      user: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        message: error.errors[0]?.message || "Invalid request data",
        details: error.errors,
      });
      return;
    }

    logger.error("Registration error", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create user",
    });
  }
}

/**
 * Registers all authentication routes.
 */
export function registerAuthRoutes(app: Express): void {
  // Public routes
  app.post("/api/auth/login", loginRateLimiter, asyncHandler(login));
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", requireAuth, asyncHandler(getCurrentUser));

  // Admin-only routes
  app.post("/api/auth/register", requireAuth, requireAdmin, asyncHandler(register));
}

