/**
 * Production build for "defaults" deployment:
 * - Works on Vercel (frontend static) and Railway (backend Node) without tsx.
 * - Produces a single `dist/` directory:
 *    - `dist/index.html` + assets (frontend)
 *    - `dist/index.cjs` (backend bundle)
 */

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";
import { readFile } from "node:fs/promises";

// Server deps to bundle to reduce cold start times
// Note: pg has native bindings and should NOT be bundled
const allowlist = [
  "bcrypt",
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
  // Vite may empty the outDir; run it first so it "owns" dist/
  const distPath = path.resolve(process.cwd(), "dist");
  if (existsSync(distPath)) {
    await rm(distPath, { recursive: true, force: true });
  }

  console.log("Building frontend (Vite)...");
  await viteBuild();

  console.log("Building backend (esbuild)...");
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

            const extensions = [".ts", ".js"];
            for (const ext of extensions) {
              const fullPath = basePath + ext;
              if (existsSync(fullPath)) return { path: fullPath };
            }

            return { path: basePath };
          });
        },
      },
    ],
  });

  console.log("✅ Build complete (dist/)");
}

buildAll().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});


