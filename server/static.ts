/**
 * @fileoverview Static file serving middleware
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Serves static files from the build directory and handles SPA routing fallback.
 */

import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use cwd so this works in both dev (tsx/esm) and prod (bundled cjs in dist/)
  const distPath = path.resolve(process.cwd(), "dist");
  const legacyDistPublicPath = path.resolve(process.cwd(), "dist", "public");

  // Back-compat: some older builds used dist/public
  const staticRoot = fs.existsSync(legacyDistPublicPath) ? legacyDistPublicPath : distPath;

  if (!fs.existsSync(staticRoot)) {
    throw new Error(
      `Could not find the build directory: ${staticRoot}, make sure to build the client first`,
    );
  }

  app.use(express.static(staticRoot));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(staticRoot, "index.html"));
  });
}
