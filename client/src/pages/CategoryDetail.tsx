import { useCategory, useResources } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { Navigation } from "@/components/Navigation";
import { FilterBar } from "@/components/FilterBar";
import { ShelterDashboard } from "@/components/ShelterDashboard";
import { Footer } from "@/components/Footer";
import { EmergencyFoodInfo } from "@/components/EmergencyFoodInfo";
import { HarmReductionInfo } from "@/components/HarmReductionInfo";
import { Loader2, ArrowLeft, Search, MapPin, Info } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useMemo } from "react";
import { useUserLocation } from "@/hooks/use-location";
import { calculateDistance } from "@/lib/distance";
import { isOpenNow, sortByOpenStatus } from "@/lib/hours";
import { useCurrentTime } from "@/hooks/use-current-time";
import { groupResourcesByServiceType, shouldGroupByServiceType, type ResourceGroup } from "@/lib/resource-groups";

export default function CategoryDetail() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug || "";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ openNow: false, verified: false, freeServices: false, westKelowna: false, nearby: false });
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const currentTime = useCurrentTime(); // Updates every 10 seconds to refresh open/closed status

  const { data: category, isLoading: isLoadingCategory } = useCategory(slug);
  
  const { data: resources, isLoading: isLoadingResources } = useResources(
    category ? { categoryId: category.id } : undefined
  );

  const filteredResources = resources?.filter(r => {
    // Text search filter
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Applied filters
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
      const desc = (r.description || '').toLowerCase();
      const name = r.name.toLowerCase();
      const westKelownaPatterns = ['west kelowna', 'westbank', 'west bank', 'westside', 'west side', 'w.k.', 'wk'];
      const isWestKelowna = westKelownaPatterns.some(pattern => 
        address.includes(pattern) || desc.includes(pattern) || name.includes(pattern)
      );
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

  const isLoading = isLoadingCategory || (!!category && isLoadingResources);

  // Determine if we should group by service type
  const shouldGroup = useMemo(() => {
    if (!category || !sortedResources) return false;
    return shouldGroupByServiceType(category.slug, sortedResources.length);
  }, [category, sortedResources]);

  // Group resources by service type if applicable
  const groupedResources = useMemo(() => {
    if (!shouldGroup || !sortedResources) return null;
    return groupResourcesByServiceType(sortedResources);
  }, [shouldGroup, sortedResources]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex justify-center items-center py-12">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" aria-label="Loading category" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md">The category you're looking for doesn't exist.</p>
          <Link 
            href="/" 
            className="text-primary font-medium hover:underline flex items-center gap-2 min-h-[44px] touch-manipulation"
            aria-label="Return to home page"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> 
            <span>Back Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      {/* Header - Enhanced with better visual design */}
      <div className="bg-gradient-to-b from-white via-gray-50/30 to-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          {/* Breadcrumb Navigation - Enhanced */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-5 sm:mb-7 overflow-x-auto" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors whitespace-nowrap touch-manipulation min-h-[44px] flex items-center font-medium">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/categories" className="hover:text-primary transition-colors whitespace-nowrap touch-manipulation min-h-[44px] flex items-center font-medium">
              Categories
            </Link>
            {category && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-semibold whitespace-nowrap">{category.name}</span>
              </>
            )}
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                  {category.name}
                </h1>
              </div>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed break-words pl-4">
                {category.description}
              </p>
            </div>
            
            {/* In-category search - Enhanced design */}
            <div className="relative w-full md:w-80 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                className="
                  block w-full pl-12 pr-4
                  py-3.5 sm:py-3
                  min-h-[52px] sm:min-h-[48px]
                  bg-white border-2 border-gray-200 
                  rounded-xl text-base sm:text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-all touch-manipulation shadow-sm hover:shadow-md
                  placeholder:text-gray-400
                "
                placeholder={`Search ${category.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={`Search within ${category.name} resources`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results - 2025 Mobile-First */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Show Emergency Food Info for food-banks category */}
        {slug === "food-banks" && (
          <div className="mb-12">
            <EmergencyFoodInfo />
          </div>
        )}
        
        {/* Show City of Kelowna Shelter Dashboard for shelters category */}
        {slug === "shelters" && (
          <div className="mb-12">
            <ShelterDashboard />
          </div>
        )}
        
        {/* Show Harm Reduction Info for addiction category */}
        {slug === "addiction" && (
          <div className="mb-12">
            <HarmReductionInfo />
          </div>
        )}
        
        <FilterBar filters={filters} onFilterChange={setFilters} hasUserLocation={!!userLocation} />
        
        <div className="mb-4 sm:mb-6 space-y-2">
          <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg border border-gray-200">
            <Info className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <span>Resources that are open right now appear first.</span>
          </div>
          {userLocation && (
            <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg border border-gray-200">
              <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <span>Showing distances from your location.</span>
            </div>
          )}
        </div>

        {sortedResources && sortedResources.length > 0 ? (
          shouldGroup && groupedResources ? (
            // Grouped view with section headers
            <div className="space-y-10 sm:space-y-12">
              {groupedResources.map((group: ResourceGroup) => (
                <div key={group.title} className="space-y-4 sm:space-y-5">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700 whitespace-nowrap">
                      {group.title}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                  {/* Resources Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
                    {group.resources.map((resource, index) => (
                      <ResourceCard key={resource.id} resource={resource} index={index} userLocation={userLocation} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Standard ungrouped view
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-6">
              {sortedResources.map((resource, index) => (
                <ResourceCard key={resource.id} resource={resource} index={index} userLocation={userLocation} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl border border-dashed border-gray-200 px-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No resources found</h3>
            <p className="text-sm sm:text-base text-gray-500 mt-1 px-2">
              Try adjusting your search or browse other categories.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
