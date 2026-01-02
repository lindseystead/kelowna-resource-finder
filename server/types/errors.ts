/**
 * @fileoverview Centralized error type definitions
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides type-safe error handling throughout the application.
 */

/**
 * Standard application error with optional status code
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    (error as AppError).statusCode !== undefined
  );
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

/**
 * Safely extracts error status code from unknown error type
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode ?? 500;
  }
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (typeof statusCode === "number") {
      return statusCode;
    }
  }
  return 500;
}

