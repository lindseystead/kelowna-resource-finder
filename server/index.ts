/**
 * @fileoverview Main server entry point for Help Kelowna application
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Express server configuration and route registration for the Help Kelowna
 * community resource directory application.
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerSEORoutes } from "./routes-seo";
import { serveStatic } from "./static";
import { createServer } from "http";
import { securityHeaders, corsMiddleware, apiRateLimiter } from "./middleware/security";
import { errorHandler, notFoundHandler, asyncHandler } from "./middleware/errorHandler";
import { sessionMiddleware } from "./auth/session";
import { registerAuthRoutes } from "./auth/routes";
import { csrfToken, validateCsrf } from "./auth/csrf";
import { REQUEST_LIMITS } from "./constants";
import fs from "fs";
import path from "path";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security first - headers and CORS
app.use(securityHeaders);
app.use(corsMiddleware);

// Parse JSON and form data with size limits (prevent DoS)
app.use(
  express.json({
    limit: REQUEST_LIMITS.JSON_SIZE,
    verify: (req, _res, buf) => {
      req.rawBody = buf; // Store raw body for CSRF validation
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: REQUEST_LIMITS.URL_ENCODED_SIZE }));

// Sessions before routes (needed for auth)
app.use(sessionMiddleware);

// CSRF protection
app.use(csrfToken);
app.use(validateCsrf);

// Global API rate limiting (applies to all /api routes)
app.use("/api", apiRateLimiter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register authentication routes first
  registerAuthRoutes(app);

  // Register other routes
  await registerRoutes(httpServer, app);
  
  // Register SEO routes (sitemap, robots.txt)
  registerSEORoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    /**
     * Split-deployment support:
     * - In a monolith deploy, `dist/public` exists and we serve the SPA from the backend.
     * - In split deploy (Vercel frontend + Railway backend), `dist/public` is not built on Railway.
     *   In that case, run API-only mode instead of crashing on startup.
     */
    const distPublicPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    if (fs.existsSync(distPublicPath)) {
      serveStatic(app);
    } else {
      log(`Static build not found at ${distPublicPath}. Running API-only mode (split deployment).`);
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // 404 handler (must be after all routes including Vite)
  // Only handles API routes that weren't matched
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      notFoundHandler(req, res);
    } else {
      next();
    }
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
