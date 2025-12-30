/**
 * @fileoverview Official resource databases and external directories
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Links to official, comprehensive resource databases.
 * Moved from homepage to reduce cognitive load while maintaining access to authoritative sources.
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { ExternalLink, Database, Phone, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function OfficialResources() {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <SEOHead
        title="Official Resource Databases - Help Kelowna"
        description="Access official, comprehensive resource databases for Kelowna and West Kelowna. Thousands of verified community services."
        keywords="official resources kelowna, resource databases, kelowna directory, bc 211, city of kelowna resources"
      />
      <StructuredData type="WebSite" />
      <Navigation />

      {/* 2025 Mobile-First Design */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            Official Resource Databases
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2 break-words">
            For the most comprehensive and up-to-date information, these official databases contain thousands of Kelowna and West Kelowna resources.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <Card className="hover-elevate">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-blue-100 rounded-lg shrink-0">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2">Kelowna Community Resources</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                    The official City of Kelowna directory with 1000+ local organizations and services.
                  </p>
                  <a 
                    href="https://kelowna.cioc.ca" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                    data-testid="link-cioc"
                    aria-label="Browse Kelowna Community Resources directory"
                  >
                    Browse Directory <ExternalLink className="w-3 h-3 ml-1 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-green-100 rounded-lg shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2">BC 211 Helpline</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                    Province-wide directory. Dial 211 or text for 24/7 help finding services.
                  </p>
                  <a 
                    href="https://bc.211.ca" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                    data-testid="link-bc211"
                    aria-label="Visit BC 211 website"
                  >
                    Visit BC211 <ExternalLink className="w-3 h-3 ml-1 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-purple-100 rounded-lg shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2">City of Kelowna Shelter Dashboard</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                    Real-time information about outdoor overnight sheltering and shelter availability in Kelowna.
                  </p>
                  <a 
                    href="https://www.kelowna.ca/our-community/social-wellness/outdoor-overnight-sheltering" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                    data-testid="link-kelowna-shelter"
                    aria-label="View City of Kelowna Shelter Dashboard"
                  >
                    View Shelter Dashboard <ExternalLink className="w-3 h-3 ml-1 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

