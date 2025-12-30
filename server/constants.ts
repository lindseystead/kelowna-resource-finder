/**
 * @fileoverview Application constants and configuration values
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Centralized constants to avoid magic numbers and improve maintainability.
 */

/**
 * Rate limiting config - prevents abuse and DoS
 */
export const RATE_LIMIT = {
  /** 15 minute window for rate limits */
  WINDOW_MS: 15 * 60 * 1000,
  
  /** General API endpoints - pretty generous */
  STANDARD_MAX: 100,
  
  /** Heavy endpoints (search, chat) - more restrictive */
  STRICT_MAX: 20,
  
  /** Auth endpoints - prevent brute force */
  AUTH_MAX: 5,
  
  /** Login specifically - even stricter */
  LOGIN_MAX: 3,
} as const;

/**
 * Chat limits - balance UX with API costs
 */
export const CHAT = {
  /** Max message length (characters) */
  MAX_MESSAGE_LENGTH: 5000,
  
  /** How many previous messages to include in context (affects API cost) */
  MAX_HISTORY_MESSAGES: 10,
  
  /** Max conversations in list view */
  MAX_CONVERSATIONS: 100,
} as const;

/**
 * Request size limits.
 */
export const REQUEST_LIMITS = {
  /** Maximum JSON body size */
  JSON_SIZE: "1mb",
  
  /** Maximum URL-encoded body size */
  URL_ENCODED_SIZE: "1mb",
} as const;

/**
 * Session configuration constants.
 */
export const SESSION = {
  /** Minimum session secret length in characters */
  MIN_SECRET_LENGTH: 32,
} as const;

/**
 * Password configuration constants.
 */
export const PASSWORD = {
  /** Minimum password length in characters */
  MIN_LENGTH: 8,
  
  /** Bcrypt salt rounds (OWASP recommended minimum) */
  SALT_ROUNDS: 12,
} as const;

