/**
 * @fileoverview Homepage component for Help Kelowna
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Simplified homepage optimized for crisis-adjacent UX: calm, minimal, dignified.
 * Answers one question: "How do I find help?"
 * 
 * UX Tradeoffs:
 * - Secondary resources (GospelMissionInfo, Official Databases) moved to dedicated pages to reduce cognitive load
 * - Long reassurance copy moved to /about to keep homepage focused
 * - Crisis support accessible via Footer and category pages, keeping homepage focused on primary search
 * - Visual effects reduced ~30% for calmer, more predictable interface
 */

import { useCategories } from "@/hooks/use-resources";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryCardSkeleton } from "@/components/CategoryCardSkeleton";
import { SearchBar } from "@/components/SearchBar";
import { Navigation } from "@/components/Navigation";
import { NeedsAssessmentModal } from "@/components/NeedsAssessmentModal";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { Loader2, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const { data: categories, isLoading, error } = useCategories();
  const [showAssessment, setShowAssessment] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <SEOHead
        title="Help Kelowna - Free, Low-Cost & Public Resources | Food, Shelter, Health, Legal & Crisis Support in Kelowna & West Kelowna"
        description="Find free, low-cost, and public resources in Kelowna. 250+ community services and resources including food support, emergency shelters, mental health services, legal aid, crisis hotlines, and more. Serving Kelowna and West Kelowna, BC. Always call ahead to confirm availability and details."
        keywords="help kelowna, free help kelowna, low cost resources kelowna, food bank kelowna, shelter kelowna, crisis help kelowna, mental health kelowna, legal aid kelowna, emergency help kelowna, west kelowna resources, community services kelowna, public resources kelowna"
      />
      <StructuredData type="WebSite" />
      <StructuredData type="Organization" />
      <Navigation />

      {/* Hero Section - Clean, modern design with better contrast */}
      <section className="bg-gradient-to-b from-white via-gray-50/30 to-white border-b border-gray-200/60">
        {/* Mobile-first: Start with mobile padding, scale up */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-18 lg:py-20">
          <div className="text-center">
            {/* Clean, professional typography with better contrast */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight leading-[1.1]">
              <span className="text-primary">Help Kelowna</span>
            </h1>
            
            {/* Supportive description with improved readability */}
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-2 sm:mb-3 max-w-2xl mx-auto leading-relaxed font-medium">
              Free, low-cost, and public resources for Kelowna and West Kelowna
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
              250+ community services including food, shelter, health, legal, and crisis support
            </p>

            {/* Primary CTA: Search - Mobile-optimized spacing */}
            <div className="mb-6 sm:mb-8">
              <SearchBar className="max-w-2xl mx-auto" />
            </div>
            
            {/* Secondary actions - Touch-friendly with proper mobile responsiveness */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="gap-2 min-h-[44px] w-full sm:w-auto px-4 sm:px-6 touch-manipulation whitespace-nowrap"
                data-testid="button-browse-categories"
              >
                <Link href="/categories" className="flex items-center justify-center gap-2">
                  <span className="truncate">Browse Categories</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => setShowAssessment(true)}
                className="gap-2 text-sm sm:text-base min-h-[44px] w-full sm:w-auto px-4 sm:px-6 touch-manipulation whitespace-nowrap"
                data-testid="button-needs-assessment"
                aria-label="Help me find resources"
              >
                <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline truncate">Help me find resources</span>
                <span className="sm:hidden truncate">Need help finding resources?</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid - Enhanced with better visual hierarchy and contrast */}
      <section className="py-10 sm:py-14 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header - Clean, modern design */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                Browse by Category
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Find the support you need</p>
            </div>
            <Link 
              href="/categories" 
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 min-h-[40px] touch-manipulation group"
              aria-label="View all categories"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
            </Link>
          </div>

          {/* Loading state - Mobile-optimized */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 sm:py-20 bg-red-50 rounded-xl border border-red-100 px-4">
              <p className="text-sm sm:text-base text-red-600 font-medium">
                Failed to load categories. Please try again later.
              </p>
            </div>
          ) : (
            <>
              {/* Compact grid with proportional spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Limited to 6 categories on homepage to reduce cognitive load */}
                {categories?.slice(0, 6).map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>

              {/* Mobile "View all" button - Enhanced design */}
              <div className="mt-10 sm:mt-14 text-center sm:hidden">
                <Link 
                  href="/categories" 
                  className="inline-flex items-center justify-center px-8 py-3.5 min-h-[48px] border-2 border-primary/30 rounded-xl text-base font-semibold text-primary bg-white hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 gap-2 touch-manipulation shadow-sm hover:shadow-md active:scale-[0.98]"
                  aria-label="View all categories"
                >
                  View all categories
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      
      <Footer />

      <NeedsAssessmentModal isOpen={showAssessment} onClose={() => setShowAssessment(false)} />
    </div>
  );
}
