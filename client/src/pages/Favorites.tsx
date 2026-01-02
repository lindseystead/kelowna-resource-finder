/**
 * @fileoverview Favorites page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays user's favorited resources with sorting and filtering options.
 */

import { ResourceCard } from "@/components/ResourceCard";
import { ResourceCardSkeleton } from "@/components/ResourceCardSkeleton";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2, Heart, ArrowLeft, Printer, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useFavorites } from "@/hooks/use-favorites";
import { useResources } from "@/hooks/use-resources";
import { type Resource } from "@shared/schema";
import { useUserLocation } from "@/hooks/use-location";
import { sortByOpenStatus } from "@/lib/hours";
import { useCurrentTime } from "@/hooks/use-current-time";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const { favorites } = useFavorites();
  const { location: userLocation } = useUserLocation();
  const currentTime = useCurrentTime(); // Updates every 10 seconds to refresh open/closed status
  
  // Fetch all resources (no search filter)
  const { data: allResources, isLoading, error: resourcesError } = useResources();
  
  const favoriteResources = sortByOpenStatus(
    allResources?.filter(r => favorites.includes(r.id)) || []
  );

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      {/* Header - 2025 Mobile-First */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="no-print">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-4 sm:mb-6 transition-colors min-h-[44px] touch-manipulation" 
              data-testid="link-back-home"
              aria-label="Return to home page"
            >
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> 
              <span>Back Home</span>
            </Link>
          </div>
          
          {/* Print header - only visible when printing */}
          <div className="favorites-print-header hidden print:block">
            <h1>My Saved Resources - Help Kelowna</h1>
            <p>Printed on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>{favoriteResources.length} saved {favoriteResources.length === 1 ? 'resource' : 'resources'}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Saved Resources
                </h1>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  {favoriteResources.length} saved {favoriteResources.length === 1 ? 'resource' : 'resources'}
                </p>
              </div>
            </div>
            {favoriteResources.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2 min-h-[44px] px-3 sm:px-4 print-keep"
                data-testid="button-print-favorites"
                aria-label="Print saved resources"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Print List</span>
                <span className="sm:hidden">Print</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results - 2025 Mobile-First */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        ) : resourcesError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg sm:text-xl font-semibold text-red-900 mb-2">Failed to load resources</h3>
            <p className="text-sm sm:text-base text-red-700 mb-6 max-w-md mx-auto">
              We couldn't load your saved resources. Please check your connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation"
              aria-label="Retry loading resources"
            >
              Try Again
            </button>
          </div>
        ) : favoriteResources.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {favoriteResources.map((resource, index) => (
                <div key={resource.id} data-print-resource>
                  <ResourceCard 
                    resource={resource} 
                    index={index} 
                    userLocation={userLocation}
                  />
                  {/* Print-friendly version with all details */}
                  <div className="print-only">
                    <h3>{resource.name}</h3>
                    <p>{resource.description}</p>
                    <div className="print-contact-info">
                      {resource.address && (
                        <p><strong>Address:</strong> {resource.address}</p>
                      )}
                      {resource.phone && (
                        <p><strong>Phone:</strong> {resource.phone}</p>
                      )}
                      {resource.email && (
                        <p><strong>Email:</strong> {resource.email}</p>
                      )}
                      {resource.website && (
                        <p><strong>Website:</strong> {resource.website}</p>
                      )}
                      {resource.hours && (
                        <p><strong>Hours:</strong> {resource.hours}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl border border-dashed border-gray-200 px-4">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No saved resources yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-1 max-w-md mx-auto px-2">
              Click the heart icon on any resource to save it for quick access later.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link 
                href="/categories" 
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-primary text-white rounded-xl font-medium hover:bg-primary/90 active:bg-primary/95 transition-colors touch-manipulation"
                data-testid="link-browse-categories"
                aria-label="Browse all resources"
              >
                Browse Resources
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
