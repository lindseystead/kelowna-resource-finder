/**
 * @fileoverview Interactive map view showing all resources with coordinates
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Mobile-first responsive map interface with filtering and category selection.
 * Shows resources with geographic coordinates on an interactive Leaflet map.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Globe, MapPin, ExternalLink, Locate, Bus, Navigation2, Clock, Loader2, Filter, Mail, CheckCircle, DollarSign, AlertCircle } from "lucide-react";
import type { Resource, Category } from "@shared/schema";
import { isOpenNow } from "@/lib/hours";
import { generateResourceEmailLinkSync } from "@/lib/email-templates";
import { apiUrl } from "@/lib/api";
import { api } from "@shared/routes";
import "leaflet/dist/leaflet.css";

const KELOWNA_CENTER: [number, number] = [49.8880, -119.4960];
const DEFAULT_ZOOM = 12;

const categoryColors: Record<string, string> = {
  "food-banks": "#22c55e",
  "shelters": "#3b82f6",
  "health": "#ef4444",
  "crisis": "#dc2626",
  "legal": "#8b5cf6",
  "family": "#f97316",
  "employment": "#6366f1",
  "addiction": "#ec4899",
  "youth": "#14b8a6",
  "faith-based": "#a855f7",
  "seniors": "#64748b",
  "indigenous": "#eab308",
  "newcomers": "#06b6d4",
  "transportation": "#84cc16",
  "financial-aid": "#f59e0b",
  "disability": "#0ea5e9",
  "holiday-support": "#e11d48",
  "medical-clinics": "#dc2626",
  "home-care": "#10b981",
  "thrift-stores": "#a855f7",
  "libraries": "#06b6d4",
  "community-centers": "#f59e0b",
  "education": "#8b5cf6",
};

function createCustomIcon(color: string) {
  return divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function LocateButton() {
  const map = useMap();
  
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 14 });
  };
  
  return (
    <Button
      size="icon"
      variant="outline"
      className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] bg-white shadow-lg hover:shadow-xl border-gray-200 min-h-[44px] min-w-[44px]"
      onClick={handleLocate}
      data-testid="button-locate-me"
      aria-label="Locate my position on the map"
    >
      <Locate className="w-5 h-5" aria-hidden="true" />
    </Button>
  );
}

export default function MapView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filters, setFilters] = useState({
    openNow: false,
    verified: false,
    freeServices: false,
    westKelowna: false,
  });

  // Fetch resources with proper queryFn
  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useQuery<Resource[]>({
    queryKey: [api.resources.list.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.resources.list.path), {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch resources: ${res.status} ${res.statusText}`);
      }
      return api.resources.list.responses[200].parse(await res.json());
    },
  });

  // Fetch categories with proper queryFn
  const { data: categories = [], error: categoriesError } = useQuery<Category[]>({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.categories.list.path), {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      }
      return api.categories.list.responses[200].parse(await res.json());
    },
  });

  const categoryMap = useMemo(() => 
    new Map(categories.map(c => [c.id, c])),
    [categories]
  );

  // Helper function to validate coordinates
  // Validates that coordinates are:
  // 1. Not null/undefined
  // 2. Valid numbers
  // 3. Within valid latitude/longitude ranges (global bounds)
  // Note: We don't restrict to Kelowna area bounds to allow nearby resources (West Kelowna, Lake Country, etc.)
  const isValidCoordinate = (lat: string | null | undefined, lng: string | null | undefined): boolean => {
    if (!lat || !lng) return false;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Check if numbers are valid
    if (isNaN(latNum) || isNaN(lngNum)) return false;
    
    // Validate latitude (global bounds: -90 to 90)
    if (latNum < -90 || latNum > 90) return false;
    
    // Validate longitude (global bounds: -180 to 180)
    if (lngNum < -180 || lngNum > 180) return false;
    
    // Return true if valid coordinates (allows resources outside Kelowna bounds)
    // This ensures resources with valid coordinates show up, even if slightly outside the area
    return true;
  };

  // Calculate resource statistics
  const resourceStats = useMemo(() => {
    const totalResources = resources.length;
    const resourcesWithCoords = resources.filter(r => isValidCoordinate(r.latitude, r.longitude)).length;
    return { totalResources, resourcesWithCoords };
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Show all resources - those without coordinates will be handled in the map display
      // (they won't show as markers but will be counted in stats)
      
      if (selectedCategory !== "all") {
        if (!resource.categoryId) return false;
        const category = categoryMap.get(resource.categoryId);
        if (!category || category.slug !== selectedCategory) return false;
      }
      
      if (filters.openNow) {
        const openStatus = isOpenNow(resource.hours);
        if (!openStatus || !openStatus.isOpen) return false;
      }
      
      if (filters.verified && !resource.verified) return false;
      
      if (filters.freeServices) {
        const desc = (resource.description || '').toLowerCase();
        const name = (resource.name || '').toLowerCase();
        if (!desc.includes('free') && !desc.includes('no cost') && !desc.includes('no charge') && 
            !name.includes('free') && !desc.includes('subsidized') && !desc.includes('low-cost')) return false;
      }
      
      if (filters.westKelowna) {
        const addr = (resource.address || '').toLowerCase();
        const desc = (resource.description || '').toLowerCase();
        const name = (resource.name || '').toLowerCase();
        const westKelownaPatterns = ['west kelowna', 'westbank', 'west bank', 'westside', 'west side', 'w.k.', 'wk'];
        const hasWestKelowna = westKelownaPatterns.some(pattern => 
          addr.includes(pattern) || desc.includes(pattern) || name.includes(pattern)
        );
        if (!hasWestKelowna) return false;
      }
      
      return true;
    });
  }, [resources, selectedCategory, filters, categoryMap]);

  // Filter resources with valid coordinates for map display
  // Dev-only logging to diagnose map issues
  const resourcesWithCoords = useMemo(() => {
    const valid = filteredResources.filter((r): r is Resource & { latitude: string; longitude: string } => 
      isValidCoordinate(r.latitude, r.longitude) && !!r.latitude && !!r.longitude
    );
    if (import.meta.env.DEV && resources.length > 0) {
      console.log('[MapView] Resource stats:', {
        totalResources: resources.length,
        filteredResources: filteredResources.length,
        resourcesWithValidCoords: valid.length,
        sampleCoords: resources.slice(0, 3).map(r => ({
          name: r.name,
          lat: r.latitude,
          lng: r.longitude,
          valid: isValidCoordinate(r.latitude, r.longitude),
        })),
      });
    }
    return valid;
  }, [filteredResources, resources]);

  const handleFilterChange = (filterName: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName as keyof typeof prev],
    }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      {/* Header Section - Mobile First */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Title and Stats */}
          <div className="mb-4 sm:mb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              Resource Map
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <span className="font-medium">
                {resourcesWithCoords.length} {resourcesWithCoords.length === 1 ? 'resource' : 'resources'} shown on map
              </span>
              {filteredResources.length > resourcesWithCoords.length && (
                <span className="text-xs sm:text-sm text-gray-500">
                  ({filteredResources.length} total • {resourcesWithCoords.length} with valid locations)
                </span>
              )}
            </div>
          </div>
          
          {/* Filters Section - Mobile First Layout */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Category Selector - Full width on mobile */}
            <div className="w-full sm:w-auto sm:max-w-xs">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger 
                  className="w-full sm:w-[200px] h-11 sm:h-10 text-sm font-medium border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  data-testid="select-category-filter"
                  aria-label="Filter by category"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] sm:max-h-[50vh]">
                  <SelectItem value="all" className="font-medium">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug} className="text-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Buttons - Responsive Grid */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              <Button
                variant={filters.openNow ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("openNow")}
                className="min-h-[44px] px-3 sm:px-3 text-xs sm:text-sm font-medium border-gray-300 hover:border-primary/40 transition-colors gap-1.5 sm:gap-1.5 touch-manipulation"
                data-testid="button-filter-open"
                aria-pressed={filters.openNow}
                aria-label="Filter for resources open now"
              >
                <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                <span>Open Now</span>
              </Button>
              <Button
                variant={filters.verified ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("verified")}
                className="min-h-[44px] px-3 sm:px-3 text-xs sm:text-sm font-medium border-gray-300 hover:border-primary/40 transition-colors gap-1.5 sm:gap-1.5 touch-manipulation"
                data-testid="button-filter-verified"
                aria-pressed={filters.verified}
                aria-label="Filter for verified resources"
              >
                <CheckCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                <span>Verified</span>
              </Button>
              <Button
                variant={filters.freeServices ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("freeServices")}
                className="min-h-[44px] px-3 sm:px-3 text-xs sm:text-sm font-medium border-gray-300 hover:border-primary/40 transition-colors gap-1.5 sm:gap-1.5 touch-manipulation"
                data-testid="button-filter-free"
                aria-pressed={filters.freeServices}
                aria-label="Filter for free services"
              >
                <DollarSign className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                <span>Free</span>
              </Button>
              <Button
                variant={filters.westKelowna ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("westKelowna")}
                className="min-h-[44px] px-3 sm:px-3 text-xs sm:text-sm font-medium border-gray-300 hover:border-primary/40 transition-colors gap-1.5 sm:gap-1.5 touch-manipulation"
                data-testid="button-filter-westkelowna"
                aria-pressed={filters.westKelowna}
                aria-label="Filter for West Kelowna resources"
              >
                <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">West Kelowna</span>
                <span className="sm:hidden">West K</span>
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ openNow: false, verified: false, freeServices: false, westKelowna: false })}
                  className="min-h-[44px] px-4 sm:px-3 text-sm text-gray-600 hover:text-gray-900"
                  aria-label={`Clear ${activeFilterCount} active filters`}
                >
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container - Mobile First */}
      <div className="flex-1 relative min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
        {resourcesLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mb-3" aria-hidden="true" />
            <p className="text-sm sm:text-base text-gray-600 font-medium">Loading map...</p>
          </div>
        ) : resourcesError || categoriesError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl font-semibold text-red-900 mb-2">Failed to load map data</h3>
              <p className="text-sm sm:text-base text-red-700 mb-4">
                {resourcesError?.message || categoriesError?.message || "Unable to connect to the server"}
              </p>
              {import.meta.env.DEV && (
                <p className="text-xs text-red-600 mb-4">
                  API URL: {apiUrl(api.resources.list.path)}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation"
                aria-label="Retry loading map data"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 px-4">
            <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" aria-hidden="true" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center max-w-md">
              Try adjusting your filters or select a different category to see resources on the map.
            </p>
          </div>
        ) : resourcesWithCoords.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 px-4">
            <MapContainer
              center={KELOWNA_CENTER}
              zoom={DEFAULT_ZOOM}
              className="absolute inset-0 w-full h-full z-0 opacity-50"
              scrollWheelZoom={true}
              touchZoom={true}
              doubleClickZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </MapContainer>
            <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 sm:p-8 max-w-md text-center">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No resources with locations</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {filteredResources.length > 0 
                  ? `${filteredResources.length} resource${filteredResources.length === 1 ? '' : 's'} found, but none have valid map coordinates.`
                  : 'No resources match your current filters.'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Resources without coordinates are still available in the list view. Try adjusting your filters or browse by category.
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={KELOWNA_CENTER}
            zoom={DEFAULT_ZOOM}
            className="absolute inset-0 w-full h-full z-0"
            scrollWheelZoom={true}
            touchZoom={true}
            doubleClickZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocateButton />
            
            {resourcesWithCoords.map(resource => {
              const category = resource.categoryId ? categoryMap.get(resource.categoryId) : undefined;
              const color = category ? categoryColors[category.slug] || "#6366f1" : "#6366f1";
              // Double-check coordinates are valid before rendering Marker
              if (!resource.latitude || !resource.longitude) return null;
              const lat = parseFloat(resource.latitude);
              const lng = parseFloat(resource.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              
              return (
                <Marker
                  key={resource.id}
                  position={[lat, lng]}
                  icon={createCustomIcon(color)}
                >
                  <Popup className="resource-popup" maxWidth={320} minWidth={280} maxHeight={600}>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 leading-tight flex-1 min-w-0 break-words overflow-hidden">
                          {resource.name}
                        </h3>
                        {resource.verified && (
                          <Badge variant="secondary" className="text-xs shrink-0">Verified</Badge>
                        )}
                      </div>
                      
                      {category && (
                        <Badge 
                          className="mb-3 text-xs font-medium"
                          style={{ backgroundColor: color, color: "white", border: "none" }}
                        >
                          {category.name}
                        </Badge>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-words leading-relaxed overflow-hidden">
                        {resource.description}
                      </p>
                      
                      {/* Hours of Service */}
                      {resource.hours && (() => {
                        const openStatus = isOpenNow(resource.hours);
                        return (
                          <div className={`mb-4 px-3 py-2.5 rounded-lg border ${
                            openStatus?.isOpen 
                              ? 'bg-green-50 border-green-200' 
                              : openStatus 
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-start gap-2.5">
                              <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${
                                openStatus?.isOpen 
                                  ? 'text-green-600' 
                                  : openStatus 
                                    ? 'text-amber-600'
                                    : 'text-gray-500'
                              }`} aria-hidden="true" />
                              <div className="flex-1 min-w-0">
                                {openStatus && (
                                  <div className="font-semibold text-sm text-gray-900 mb-1">
                                    {openStatus.isOpen ? (
                                      <span className="text-green-700">Open Now</span>
                                    ) : (
                                      <span className="text-amber-700">{openStatus.status}</span>
                                    )}
                                  </div>
                                )}
                                <div className="text-xs sm:text-sm text-gray-600 break-words">
                                  <span className="font-medium">Hours:</span> {resource.hours}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-start gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                          <span className="text-xs sm:text-sm break-words leading-relaxed">{resource.address}</span>
                        </div>
                        {resource.phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
                            <a 
                              href={`tel:${resource.phone}`} 
                              className="text-xs sm:text-sm hover:text-primary hover:underline transition-colors break-all"
                              aria-label={`Call ${resource.name} at ${resource.phone}`}
                            >
                              {resource.phone}
                            </a>
                          </div>
                        )}
                        {resource.email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
                            <a 
                              href={generateResourceEmailLinkSync(resource.name, resource.email)}
                              className="text-xs sm:text-sm hover:text-primary hover:underline transition-colors break-all"
                              aria-label={`Send email to ${resource.name}`}
                            >
                              {resource.email}
                            </a>
                          </div>
                        )}
                        {resource.website && (
                          <div className="flex items-center gap-2 text-gray-700 min-w-0">
                            <Globe className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
                            <a 
                              href={resource.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs sm:text-sm hover:text-primary hover:underline transition-colors break-all min-w-0 flex-1"
                              aria-label={`Visit website for ${resource.name}`}
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 sm:py-2 rounded-lg transition-colors min-h-[44px]"
                          data-testid={`button-directions-${resource.id}`}
                          aria-label={`Get driving directions to ${resource.name}`}
                        >
                          <Navigation2 className="w-4 h-4" aria-hidden="true" />
                          Directions
                        </a>
                        {resource.address && (() => {
                          const addrLower = resource.address.toLowerCase();
                          const invalidPatterns = ['confidential', 'phone service', 'phone/text service', 'various locations', 'available anywhere', 'canada-wide', 'mobile app'];
                          const isValid = !invalidPatterns.some(pattern => addrLower.includes(pattern)) && 
                                         !(addrLower === 'kelowna, bc' || addrLower === 'west kelowna, bc');
                          return isValid;
                        })() && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(resource.address)}&travelmode=transit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 py-2.5 sm:py-2 rounded-lg transition-colors min-h-[44px]"
                            data-testid={`button-transit-${resource.id}`}
                            aria-label={`Get transit directions to ${resource.name}`}
                          >
                            <Bus className="w-4 h-4" aria-hidden="true" />
                            Transit
                          </a>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="default"
                        className="w-full gap-2 !text-white hover:!text-white min-h-[44px] text-sm font-medium" 
                        asChild 
                        data-testid={`button-view-resource-${resource.id}`}
                      >
                        <a href={`/resource/${resource.id}`} className="!text-white hover:!text-white no-underline flex items-center justify-center">
                          View Details
                          <ExternalLink className="w-4 h-4 !text-white" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
      
      {/* Legend - Mobile First, Scrollable with Counts */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" aria-hidden="true" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Category Legend</h2>
          </div>
          <div className="overflow-x-auto px-2 sm:px-0 -mx-2 sm:mx-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 min-w-max sm:min-w-0">
              {categories.map(cat => {
                const color = categoryColors[cat.slug] || "#6366f1";
                // Count resources in this category that are currently visible on map
                const categoryResourceCount = resourcesWithCoords.filter(r => {
                  const resourceCategory = categoryMap.get(r.categoryId || 0);
                  return resourceCategory?.slug === cat.slug;
                }).length;
                
                return (
                  <div 
                    key={cat.slug} 
                    className="flex items-center gap-2.5 sm:gap-3 px-2 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm text-gray-700"
                  >
                    <div 
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-sm shrink-0" 
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium flex-1 min-w-0">{cat.name}</span>
                    <span className="text-gray-500 font-normal shrink-0">({categoryResourceCount})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
