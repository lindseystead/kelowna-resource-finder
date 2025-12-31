/**
 * @fileoverview Backend-only build script for Railway deployment
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Builds only the Express backend for Railway deployment.
 * Frontend is deployed separately on Vercel.
 */

import { build as esbuild } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Server deps to bundle to reduce cold start times
// Note: pg has native bindings and should NOT be bundled
const allowlist = [
  // NOTE: do NOT bundle native deps like bcrypt; keep them external so node-pre-gyp
  // can resolve its package metadata/binaries correctly at runtime.
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "helmet",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "uuid",
  "ws",
  "zod",
];

async function buildBackend() {
  console.log("Building backend for Railway...");
  
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: [...externals, "pg", "@mapbox/node-pre-gyp"],
    logLevel: "info",
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
    plugins: [
      {
        name: "path-alias",
        setup(build) {
          build.onResolve({ filter: /^@shared\// }, (args) => {
            const filePath = args.path.replace("@shared/", "");
            const basePath = path.resolve(process.cwd(), "shared", filePath);
            
            // Try different extensions
            const extensions = [".ts", ".js"];
            for (const ext of extensions) {
              const fullPath = basePath + ext;
              if (existsSync(fullPath)) {
                return { path: fullPath };
              }
            }
            
            // Fallback to base path (esbuild will try extensions)
            return { path: basePath };
          });
        },
      },
    ],
  });
  
  console.log("✅ Backend built successfully to dist/index.cjs");
  console.log("📦 Ready to deploy to Railway");
}

buildBackend().catch((err) => {
  console.error("❌ Backend build failed:", err);
  process.exit(1);
});

