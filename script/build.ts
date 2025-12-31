/**
 * @fileoverview Build script for production deployment
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Builds both client and server for production. Bundles server dependencies
 * to reduce cold start times and optimize deployment.
 */

import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
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

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
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
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
