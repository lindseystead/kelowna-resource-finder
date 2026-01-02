/**
 * @fileoverview Structured data component for SEO
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Adds JSON-LD structured data for better SEO
 */

import { useEffect } from "react";

// Type for JSON-LD structured data (flexible structure for schema.org)
// Using any here is acceptable for JSON-LD data which has a very flexible schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StructuredDataValue = any;

interface StructuredDataProps {
  type?: "WebSite" | "Organization" | "LocalBusiness" | "Service";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}

export function StructuredData({ type = "WebSite", data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data script
    const existingScript = document.getElementById("structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    // Get base URL from config (async, but we'll use a fallback for initial render)
    const getBaseUrlSync = () => {
      if (typeof window !== "undefined" && window.location.origin) {
        return window.location.origin;
      }
      return import.meta.env.VITE_BASE_URL || "https://helpkelowna.com";
    };

    const baseUrl = getBaseUrlSync();

    // Base structured data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let structuredData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": type,
    };

    if (type === "WebSite") {
      structuredData = {
        ...structuredData,
        name: "Help Kelowna",
        alternateName: "Help Kelowna Community Support Directory",
        url: baseUrl,
        description: "Find free community support services in Kelowna and West Kelowna. Food support, shelters, mental health, crisis support, and more.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      };
    } else if (type === "Organization") {
      structuredData = {
        ...structuredData,
        name: "Help Kelowna",
        url: baseUrl,
        logo: `${baseUrl}/favicon.svg`,
        description: "Community support directory connecting people in Kelowna and West Kelowna with free and low-cost support services.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kelowna",
          addressRegion: "BC",
          addressCountry: "CA",
        },
        sameAs: [
          // Add social media links if available
        ],
      };
    } else if (type === "LocalBusiness") {
      structuredData = {
        ...structuredData,
        name: "Help Kelowna",
        description: "Community support directory for Kelowna and West Kelowna",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kelowna",
          addressRegion: "BC",
          addressCountry: "CA",
        },
        areaServed: {
          "@type": "City",
          name: "Kelowna",
        },
        ...data,
      };
    } else if (type === "Service") {
      structuredData = {
        ...structuredData,
        serviceType: "Community Support Directory",
        areaServed: {
          "@type": "City",
          name: "Kelowna",
        },
        provider: {
          "@type": "Organization",
          name: "Help Kelowna",
        },
        ...data,
      };
    }

    // Merge with custom data
    if (data) {
      structuredData = { ...structuredData, ...data };
    }

    // Create and append script
    const script = document.createElement("script");
    script.id = "structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}

