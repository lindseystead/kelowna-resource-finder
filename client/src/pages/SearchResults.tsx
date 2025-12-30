import { useResources } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { Navigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, MapPin, Info } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useUserLocation } from "@/hooks/use-location";
import { calculateDistance } from "@/lib/distance";
import { isOpenNow, sortByOpenStatus } from "@/lib/hours";
import { useState } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const query = searchParams.get("q") || "";
  const { location: userLocation } = useUserLocation();

  const [filters, setFilters] = useState({ openNow: false, verified: false, freeServices: false, westKelowna: false, nearby: false });
  const { data: resources, isLoading } = useResources({ search: query });
  const currentTime = useCurrentTime(); // Updates every 10 seconds to refresh open/closed status
  
  // Filter and sort resources
  const filteredResources = resources?.filter(r => {
    if (filters.verified && !r.verified) return false;
    if (filters.openNow) {
      const status = isOpenNow(r.hours);
      if (!status || !status.isOpen) return false;
    }
    if (filters.freeServices) {
      const desc = r.description.toLowerCase();
      const name = r.name.toLowerCase();
      const isFree = desc.includes('free') || desc.includes('no cost') || desc.includes('no charge') || 
                     name.includes('free') || desc.includes('subsidized') || desc.includes('low-cost');
      if (!isFree) return false;
    }
    if (filters.westKelowna) {
      const address = (r.address || '').toLowerCase();
      const desc = r.description.toLowerCase();
      const name = r.name.toLowerCase();
      const isWestKelowna = address.includes('west kelowna') || desc.includes('west kelowna') || name.includes('west kelowna');
      if (!isWestKelowna) return false;
    }
    if (filters.nearby && userLocation && r.latitude && r.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(r.latitude),
        parseFloat(r.longitude)
      );
      // Show resources within 10km
      if (distance > 10) return false;
    }
    return true;
  });
  
  // Sort: Open resources first, then by distance, then alphabetically
  // IMPORTANT: Open resources must always stay at the top
  const sortedResources = filteredResources
    ? [...filteredResources].sort((a, b) => {
        // First priority: Open resources always first
        const statusA = isOpenNow(a.hours);
        const statusB = isOpenNow(b.hours);
        const aOpen = statusA?.isOpen ?? false;
        const bOpen = statusB?.isOpen ?? false;
        
        // If one is open and the other isn't, open wins
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        
        // Within the same open/closed group, sort by distance if available
        if (userLocation) {
          const hasLocA = a.latitude && a.longitude;
          const hasLocB = b.latitude && b.longitude;
          if (hasLocA && hasLocB) {
            const distA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              parseFloat(a.latitude!),
              parseFloat(a.longitude!)
            );
            const distB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              parseFloat(b.latitude!),
              parseFloat(b.longitude!)
            );
            if (distA !== distB) return distA - distB;
          } else if (hasLocA && !hasLocB) {
            return -1;
          } else if (!hasLocA && hasLocB) {
            return 1;
          }
        }
        
        // Final priority: Alphabetical by name
        return a.name.localeCompare(b.name);
      })
    : filteredResources;

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      {/* Header - 2025 Mobile-First */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-4 sm:mb-6 transition-colors min-h-[44px] touch-manipulation"
            aria-label="Return to home page"
          >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> 
            <span>Back Home</span>
          </Link>
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              Search Results
            </h1>
            <SearchBar defaultValue={query} className="mb-2" />
          </div>
        </div>
      </div>

      {/* Results - 2025 Mobile-First */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {isLoading ? (
          <div className="flex justify-center py-12 sm:py-20">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" aria-label="Loading search results" />
          </div>
        ) : (
          <div>
            <FilterBar filters={filters} onFilterChange={setFilters} hasUserLocation={!!userLocation} />
            
            {query && (
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 font-medium px-1">
                Found {sortedResources?.length || 0} results for "{query}"
                {filters.openNow || filters.verified || filters.freeServices || filters.westKelowna ? ` (filtered from ${resources?.length || 0})` : ''}
              </p>
            )}
            {!query && (
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 font-medium px-1">
                Showing {sortedResources?.length || 0} resources
                {filters.openNow || filters.verified || filters.freeServices || filters.westKelowna ? ` (filtered from ${resources?.length || 0})` : ''}
              </p>
            )}
            
            <div className="mb-4 space-y-1.5">
              <div className="flex items-start sm:items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                <Info className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                <span>Resources that are open right now appear first.</span>
              </div>
              {userLocation && (
                <div className="flex items-start sm:items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                  <span>Showing distances from your location.</span>
                </div>
              )}
            </div>

            {sortedResources && sortedResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {sortedResources.map((resource, index) => (
                  <ResourceCard key={resource.id} resource={resource} index={index} userLocation={userLocation} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl border border-dashed border-gray-200 px-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No matches found</h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1 max-w-md mx-auto px-2">
                  We couldn't find any resources matching your search. Try using broader terms like "food" or "health".
                </p>
                <div className="mt-6 sm:mt-8">
                  <Link 
                    href="/categories" 
                    className="text-primary font-medium hover:underline min-h-[44px] inline-flex items-center touch-manipulation"
                    aria-label="Browse all categories"
                  >
                    Browse all categories instead
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
