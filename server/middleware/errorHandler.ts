/**
 * @fileoverview Error handling middleware and custom error classes
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides centralized error handling, custom error types, and async handler utilities.
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config";
import { logger } from "../utils/logger";

/**
 * Custom error class for application-specific errors.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper for async route handlers - catches errors automatically
 * Saves us from writing try-catch in every single route
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware.
 * Handles all errors consistently across the application.
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error in request handler", err);

  // Zod validation errors - user sent bad data
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      message: err.errors[0]?.message || "Invalid request data",
      details: env.NODE_ENV !== "production" ? err.errors : undefined,
    });
    return;
  }

  // Our custom app errors - we control the message
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Handle standard errors
  const statusCode = (err as Error & { status?: number; statusCode?: number }).status ||
    (err as Error & { status?: number; statusCode?: number }).statusCode ||
    500;

  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : message,
    message: env.NODE_ENV === "production" && statusCode >= 500
      ? "An error occurred. Please try again later."
      : message,
  });
}

/**
 * 404 Not Found handler.
 * Must be registered after all routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found.",
  });
}

