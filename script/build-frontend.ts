/**
 * @fileoverview Frontend-only build script for Vercel deployment
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Builds only the React frontend for static hosting on Vercel.
 * Backend is deployed separately on Railway.
 */

import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import path from "path";

async function buildFrontend() {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  // Clean dist/public directory
  await rm(distPath, { recursive: true, force: true });

  console.log("Building frontend for Vercel...");
  await viteBuild();
  
  console.log(`✅ Frontend built successfully to ${distPath}`);
  console.log("📦 Ready to deploy to Vercel");
}

buildFrontend().catch((err) => {
  console.error("❌ Frontend build failed:", err);
  process.exit(1);
});

