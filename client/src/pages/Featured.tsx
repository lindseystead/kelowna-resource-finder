/**
 * @fileoverview Featured community partners and organizations
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Showcases key community partners and featured service providers.
 * Moved from homepage to reduce cognitive load while preserving visibility.
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GospelMissionInfo } from "@/components/GospelMissionInfo";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";

export default function Featured() {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <SEOHead
        title="Featured Partners - Help Kelowna"
        description="Learn about our featured community partners providing essential services in Kelowna and West Kelowna."
        keywords="kelowna partners, community organizations, featured services kelowna"
      />
      <StructuredData type="WebSite" />
      <Navigation />

      {/* 2025 Mobile-First Design */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
            Featured Community Partners
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-1">
            Key organizations providing comprehensive support services in our community.
          </p>
        </div>

        <GospelMissionInfo />
      </main>

      <Footer />
    </div>
  );
}

