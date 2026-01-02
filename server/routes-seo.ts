/**
 * @fileoverview SEO routes for sitemap and robots.txt generation
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Generates sitemap.xml and robots.txt for search engine optimization.
 */

import type { Express } from "express";
import { storage } from "./storage";
import { logger } from "./utils/logger";
import { env } from "./config";

export function registerSEORoutes(app: Express) {
  // Sitemap generation
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = env.BASE_URL || "https://www.helpkelowna.com";
      const resources = await storage.getResources();
      const categories = await storage.getCategories();
      
      // Use current date for lastmod
      const lastmod = new Date().toISOString().split("T")[0];

      // Key categories that should have higher priority (most searched)
      const keyCategorySlugs = ["food-banks", "shelters", "crisis", "health", "legal"];

      // Static pages (high priority)
      const staticPages = [
        { url: "", priority: 1.0, changefreq: "weekly" },
        { url: "/categories", priority: 0.9, changefreq: "weekly" },
        { url: "/map", priority: 0.85, changefreq: "daily" },
        { url: "/about", priority: 0.7, changefreq: "monthly" },
      ];

      // Category pages - prioritize key categories
      const categoryPages = categories.map((cat) => {
        const isKeyCategory = keyCategorySlugs.includes(cat.slug);
        return {
          url: `/category/${cat.slug}`,
          priority: isKeyCategory ? 0.95 : 0.85,
          changefreq: isKeyCategory ? "daily" : "weekly",
        };
      });

      // Resource pages (important for individual resource discovery)
      const resourcePages = resources.map((resource) => ({
        url: `/resource/${resource.id}`,
        priority: 0.8,
        changefreq: "monthly",
      }));

      // Combine all pages
      const allPages = [...staticPages, ...categoryPages, ...resourcePages];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      logger.error("Error generating sitemap", error);
      res.status(500).send("Error generating sitemap");
    }
  });
}

