/**
 * @fileoverview SEO head component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Manages meta tags, Open Graph, and Twitter Card data for SEO.
 */

import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * SEO Head Component
 * Dynamically updates meta tags for better SEO
 */
export function SEOHead({
  title = "Help Kelowna - Community Support Directory | Kelowna & West Kelowna",
  description = "Find free community support services in Kelowna and West Kelowna. Food support, shelters, mental health, crisis support, holiday help, and more. Your local resource directory for people in need.",
  keywords = "help kelowna, kelowna resources, free help kelowna, food bank kelowna, shelter kelowna, crisis support kelowna, mental health kelowna, community services kelowna, west kelowna resources, emergency help kelowna, social services kelowna",
  image = "/og-image.png",
  url = typeof window !== "undefined" ? window.location.href : "https://helpkelowna.com",
  type = "website",
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:site_name", "Help Kelowna", true);
    updateMetaTag("og:locale", "en_CA", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Canonical URL
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, keywords, image, url, type]);

  return null;
}

