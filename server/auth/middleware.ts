/**
 * @fileoverview Authentication and authorization middleware
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Middleware functions for requiring authentication, admin privileges, and optional authentication.
 */

import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../utils/logger";

/**
 * Require user to be logged in
 * Checks session for userId - returns 401 if not authenticated
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.userId) {
    res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource",
    });
    return;
  }

  next();
}

/**
 * Require admin role
 * Must be used after requireAuth - checks if user has admin role
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Double-check auth (defensive programming)
  if (!req.session?.userId) {
    res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource",
    });
    return;
  }

  // Verify user still exists and has admin role
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, req.session.userId),
          eq(users.role, "admin"),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) {
          logger.error("Error destroying session", err);
        }
      });

      res.status(403).json({
        error: "Access denied",
        message: "Admin privileges required",
      });
      return;
    }

    // Update session with current user data
    req.session.userRole = user.role as "admin" | "user";
    req.session.userEmail = user.email;

    next();
  } catch (error) {
    logger.error("Error checking admin status", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify admin status",
    });
  }
}

/**
 * Optional authentication middleware.
 * Attaches user data to request if logged in, but doesn't require it.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.session?.userId) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, req.session.userId),
            eq(users.isActive, true)
          )
        )
        .limit(1);

      if (user) {
        req.session.userRole = user.role as "admin" | "user";
        req.session.userEmail = user.email;
      } else {
        // User was deleted or deactivated, clear session
        req.session.destroy(() => {});
      }
    } catch (error) {
      logger.error("Error loading user data", error);
      // Continue without user data
    }
  }

  next();
}

