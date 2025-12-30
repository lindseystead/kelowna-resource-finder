/**
 * @fileoverview Logging utility for production-ready error and info logging
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Simple, production-ready logging utility that:
 * - Formats logs consistently
 * - Hides sensitive information in production
 * - Provides structured logging for error tracking services
 * - Can be easily extended to integrate with services like Sentry, Datadog, etc.
 */

import { env } from "../config";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Formats a log message with context and metadata.
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Logs an info message.
 * Use for general information, successful operations, etc.
 */
export function logInfo(message: string, context?: LogContext): void {
  if (env.NODE_ENV === "production") {
    // Structured logs for production (easier to parse/aggregate)
    console.log(formatLog("info", message, context));
  } else {
    // Pretty output for dev
    console.log(`ℹ️  ${message}`, context || "");
  }
}

/**
 * Logs a warning message.
 * Use for non-critical issues, deprecations, etc.
 */
export function logWarn(message: string, context?: LogContext): void {
  if (env.NODE_ENV === "production") {
    console.warn(formatLog("warn", message, context));
  } else {
    console.warn(`⚠️  ${message}`, context || "");
  }
}

/**
 * Logs an error message.
 * Use for errors, exceptions, failures, etc.
 * In production, this should integrate with error tracking services.
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const errorContext: LogContext = {
    ...context,
    error: error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: env.NODE_ENV !== "production" ? error.stack : undefined,
        }
      : String(error),
  };

  if (env.NODE_ENV === "production") {
    // Structured error logs - could hook into Sentry/Datadog here
    console.error(formatLog("error", message, errorContext));
  } else {
    // Full stack traces in dev
    console.error(`❌ ${message}`, errorContext);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Logs a debug message.
 * Only shown in development mode.
 */
export function logDebug(message: string, context?: LogContext): void {
  if (env.NODE_ENV !== "production") {
    console.debug(`🔍 ${message}`, context || "");
  }
}

/**
 * Logger object with all log methods for convenience.
 */
export const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
};

