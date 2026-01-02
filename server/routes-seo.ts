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
export function registerSEORoutes(app: Express) {
  // Sitemap generation
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { env } = await import("./config.js");
      const baseUrl = env.BASE_URL || "https://helpkelowna.com";
      const resources = await storage.getResources();
      const categories = await storage.getCategories();

      // Static pages
      const staticPages = [
        { url: "", priority: 1.0, changefreq: "daily" },
        { url: "/about", priority: 0.8, changefreq: "monthly" },
        { url: "/categories", priority: 0.9, changefreq: "weekly" },
        { url: "/map", priority: 0.8, changefreq: "weekly" },
        { url: "/favorites", priority: 0.7, changefreq: "monthly" },
        { url: "/request-update", priority: 0.6, changefreq: "monthly" },
        { url: "/disclaimer", priority: 0.5, changefreq: "yearly" },
      ];

      // Category pages
      const categoryPages = categories.map((cat) => ({
        url: `/category/${cat.slug}`,
        priority: 0.9,
        changefreq: "weekly",
      }));

      // Resource pages
      const resourcePages = resources.map((resource) => ({
        url: `/resource/${resource.id}`,
        priority: 0.8,
        changefreq: "monthly",
      }));

      const allPages = [...staticPages, ...categoryPages, ...resourcePages];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
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

