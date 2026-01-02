/**
 * @fileoverview Resource detail page component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays detailed information about a single resource including hours, location,
 * contact information, directions, and transit options.
 */

import { useResource, useCategory, useResources } from "@/hooks/use-resources";
import { Navigation } from "@/components/Navigation";
import { ShareBar } from "@/components/ShareBar";
import { Footer } from "@/components/Footer";
import { Loader2, MapPin, Phone, Globe, AlertCircle, ArrowLeft, CheckCircle, Clock, Navigation2, Bus, Info, Map, Mail } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiUrl } from "@/lib/api";
import { motion } from "framer-motion";
import { generateResourceEmailLinkSync } from "@/lib/email-templates";
import { isOpenNow } from "@/lib/hours";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useUserLocation } from "@/hooks/use-location";
import { useState, useEffect } from "react";
import { getSupportEmail } from "@/lib/config";

export default function ResourceDetail() {
  const [, params] = useRoute("/resource/:id");
  const id = parseInt(params?.id || "0");
  const [activeTab, setActiveTab] = useState<"info" | "directions" | "transit">("info");
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [supportEmail, setSupportEmail] = useState("support@lifesavertech.ca");

  useEffect(() => {
    getSupportEmail().then(setSupportEmail).catch(() => {
      // Fallback already set in state
    });
  }, []);

  const { data: resource, isLoading } = useResource(id);
  const { location: userLocation, loading: locationLoading, error: locationError, requestLocation, permissionDenied, hasRequested } = useUserLocation();
  
  // Fetch categories to find the parent category name
  const { data: categories } = useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.categories.list.path));
      return api.categories.list.responses[200].parse(await res.json());
    },
    enabled: !!resource
  });
  
  const parentCategory = categories?.find(c => c.id === resource?.categoryId);
  const currentTime = useCurrentTime();
  const openStatus = resource ? isOpenNow(resource.hours) : null;

  const getDirectionsUrl = () => {
    if (!resource?.latitude || !resource?.longitude) return null;
    
    const destination = `${resource.latitude},${resource.longitude}`;
    
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=driving`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
  };

  const isValidAddressForTransit = (address: string | null | undefined): boolean => {
    if (!address) return false;
    const addrLower = address.toLowerCase();
    const invalidPatterns = [
      'confidential',
      'phone service',
      'phone/text service',
      'various locations',
      'available anywhere',
      'canada-wide',
      'mobile app',
      'transit exchange',
      'kelowna, bc',
      'west kelowna, bc',
    ];
    return !invalidPatterns.some(pattern => addrLower.includes(pattern));
  };

  const getTransitUrl = () => {
    if (!resource?.address || !isValidAddressForTransit(resource.address)) {
      return null;
    }
    const destination = encodeURIComponent(resource.address);
    
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=transit`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h2>
          <Link href="/" className="text-primary hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      <main className="py-6 sm:py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors whitespace-nowrap touch-manipulation min-h-[44px] flex items-center">Home</Link>
            {parentCategory && (
              <>
                <span>/</span>
                <Link href={`/category/${parentCategory.slug}`} className="hover:text-primary transition-colors whitespace-nowrap touch-manipulation min-h-[44px] flex items-center">
                  {parentCategory.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium whitespace-nowrap">{resource.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-8"
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                {openStatus && (
                  <div 
                    className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-sm sm:text-base font-semibold ${
                      openStatus.isOpen 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    }`}
                    data-testid="status-open-detail"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                      <span className="text-base sm:text-lg font-bold">
                        {openStatus.isOpen ? 'OPEN NOW' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-col items-start sm:items-end gap-1 w-full sm:w-auto">
                      <span className="text-xs sm:text-sm font-medium bg-white/20 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-sm">
                        {openStatus.isOpen ? (
                          openStatus.status
                        ) : (
                          <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {openStatus.timeUntilOpen || openStatus.status}
                            {openStatus.nextOpenTime && (
                              <span className="opacity-80 text-xs hidden sm:inline">• {openStatus.nextOpenTime}</span>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                
                    {/* Show hours info even if status is unknown */}
                    {!openStatus && resource.hours && (
                      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          <span className="font-bold text-sm sm:text-base">HOURS</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium bg-white/20 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-sm sm:ml-auto w-full sm:w-auto text-center sm:text-left">
                          {resource.hours}
                        </span>
                      </div>
                    )}
                
                <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-2 break-words">
                      {resource.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      {resource.verified && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100" title={resource.lastVerified ? `Verified on ${new Date(resource.lastVerified).toLocaleDateString()}. Please call ahead to confirm current information.` : "This resource has been verified, but please call ahead to confirm current information"}>
                          <CheckCircle className="w-4 h-4" />
                          Verified{resource.lastVerified ? ` (${new Date(resource.lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : ''}
                        </div>
                      )}
                      {resource.hours && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
                          <Clock className="w-4 h-4" />
                          {resource.hours}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose prose-blue max-w-none text-gray-600">
                  <p className="whitespace-pre-line leading-relaxed text-base sm:text-lg break-words">
                    {resource.description}
                  </p>
                </div>

                {/* Tabs Navigation */}
                <div className="mt-6 sm:mt-8 border-b border-gray-200 overflow-x-auto">
                  <nav className="flex gap-1 sm:gap-2 min-w-max" aria-label="Resource tabs">
                    <button
                      onClick={() => setActiveTab("info")}
                      className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 min-h-[44px] touch-manipulation whitespace-nowrap ${
                        activeTab === "info"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Information
                    </button>
                    {resource.latitude && resource.longitude && (
                      <button
                        onClick={() => setActiveTab("directions")}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 min-h-[44px] touch-manipulation whitespace-nowrap ${
                          activeTab === "directions"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Navigation2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                        Directions
                      </button>
                    )}
                    {resource.address && (
                      <button
                        onClick={() => setActiveTab("transit")}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 min-h-[44px] touch-manipulation whitespace-nowrap ${
                          activeTab === "transit"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Bus className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                        Transit
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-4 sm:mt-6">
                  {activeTab === "info" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {resource.address && (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide mb-1">Location</h3>
                            <p className="text-sm sm:text-base text-gray-600 break-words">{resource.address}</p>
                          </div>
                        </div>
                      )}

                      {resource.phone && (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide mb-1">Phone</h3>
                            <a href={`tel:${resource.phone}`} className="text-sm sm:text-lg text-gray-600 hover:text-primary font-medium break-words">
                              {resource.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {resource.email && (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide mb-1">Email</h3>
                            <a 
                              href={generateResourceEmailLinkSync(resource.name, resource.email)}
                              className="text-sm sm:text-base text-primary hover:underline break-all"
                              aria-label={`Send email to ${resource.name}`}
                            >
                              {resource.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {resource.website && (
                        <div className="flex items-start gap-2 sm:gap-3 sm:col-span-2">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide mb-1">Website</h3>
                            <a 
                              href={resource.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm sm:text-base text-primary hover:underline break-all"
                            >
                              {resource.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Accessibility Info - parsed from description if mentioned */}
                      {(() => {
                        const desc = resource.description.toLowerCase();
                        const hasWheelchair = desc.includes('wheelchair') || desc.includes('accessible') || desc.includes('ada');
                        const hasParking = desc.includes('parking') || desc.includes('park');
                        const hasLanguages = desc.includes('language') || desc.includes('translation') || desc.includes('interpreter');
                        
                        if (hasWheelchair || hasParking || hasLanguages) {
                          return (
                            <div className="flex items-start gap-3 sm:col-span-2 mt-2 pt-4 border-t border-gray-200">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                <Info className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-2">Accessibility & Services</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {hasWheelchair && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-600">✓</span>
                                      <span>Wheelchair accessible</span>
                                    </div>
                                  )}
                                  {hasParking && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-600">✓</span>
                                      <span>Parking available</span>
                                    </div>
                                  )}
                                  {hasLanguages && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-600">✓</span>
                                      <span>Language services available</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Please call ahead to confirm specific accessibility needs.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {activeTab === "directions" && resource.latitude && resource.longitude && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-blue-600 rounded-lg shrink-0">
                            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Get Directions</h3>
                            {hasRequested && locationLoading ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span>Getting your location...</span>
                              </div>
                            ) : hasRequested && permissionDenied ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4">
                                <p className="text-sm text-amber-800 mb-2">
                                  <strong>Location access denied.</strong> We'll open directions without your current location.
                                </p>
                                <p className="text-xs text-amber-700 mb-3">
                                  To enable location-based directions, please allow location access in your browser settings and try again.
                                </p>
                                <button
                                  onClick={requestLocation}
                                  className="text-xs text-amber-800 underline hover:text-amber-900 touch-manipulation min-h-[44px]"
                                >
                                  Try requesting location again
                                </button>
                              </div>
                            ) : hasRequested && locationError ? (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                                <p className="text-sm text-red-800 mb-2">
                                  <strong>Unable to get location:</strong> {locationError}
                                </p>
                                <button
                                  onClick={requestLocation}
                                  className="text-xs text-red-800 underline hover:text-red-900 touch-manipulation min-h-[44px]"
                                >
                                  Try again
                                </button>
                              </div>
                            ) : userLocation ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
                                <p className="text-sm text-green-800">
                                  <strong>✓ Location found!</strong> Directions will start from your current location.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                  <strong>Location access:</strong> Your browser will prompt you for permission when you click the button below.
                                </p>
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                if (!userLocation && !locationLoading && !hasRequested) {
                                  requestLocation();
                                }
                                setTimeout(() => {
                                  const url = getDirectionsUrl() || `https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`;
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                }, userLocation ? 0 : 500);
                              }}
                              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-primary/90 active:bg-primary/80 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 touch-manipulation min-h-[44px]"
                            >
                              <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                              Open in Google Maps
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Destination</h4>
                        <p className="text-gray-600 text-sm sm:text-base break-words">{resource.address || `${resource.latitude}, ${resource.longitude}`}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === "transit" && resource.address && (
                    <div className="space-y-4 sm:space-y-6">
                      {isValidAddressForTransit(resource.address) ? (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                              <div className="p-2 sm:p-3 bg-blue-600 rounded-lg shrink-0">
                                <Bus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Transit Directions</h3>
                                {hasRequested && locationLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                    <span>Getting your location...</span>
                                  </div>
                                ) : hasRequested && permissionDenied ? (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <p className="text-sm text-amber-800 mb-2">
                                      <strong>Location access denied.</strong> We'll open the trip planner without your current location.
                                    </p>
                                    <p className="text-xs text-amber-700 mb-3">
                                      To enable location-based transit planning, please allow location access in your browser settings and try again.
                                    </p>
                                    <button
                                      onClick={requestLocation}
                                      className="text-xs text-amber-800 underline hover:text-amber-900 touch-manipulation min-h-[44px]"
                                    >
                                      Try requesting location again
                                    </button>
                                  </div>
                                ) : hasRequested && locationError ? (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <p className="text-sm text-red-800 mb-2">
                                      <strong>Unable to get location:</strong> {locationError}
                                    </p>
                                    <button
                                      onClick={requestLocation}
                                      className="text-xs text-red-800 underline hover:text-red-900 touch-manipulation min-h-[44px]"
                                    >
                                      Try again
                                    </button>
                                  </div>
                                ) : userLocation ? (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <p className="text-sm text-green-800">
                                      <strong>✓ Location found!</strong> Transit routes will start from your current location.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                                    <p className="text-sm text-blue-800">
                                      <strong>Location access:</strong> Your browser will prompt you for permission when you click the button below.
                                    </p>
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => {
                                    if (!userLocation && !locationLoading && !hasRequested) {
                                      requestLocation();
                                    }
                                    setTimeout(() => {
                                      const url = getTransitUrl();
                                      if (url) {
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                      } else {
                                        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(resource.address)}&travelmode=transit`;
                                        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
                                      }
                                    }, userLocation ? 0 : 500);
                                  }}
                                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 touch-manipulation min-h-[44px]"
                                >
                                  <Bus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                  Plan Transit Route
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Destination</h4>
                            <p className="text-gray-600 text-sm sm:text-base break-words">{resource.address}</p>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base flex items-center gap-2">
                              <Info className="w-4 h-4 shrink-0" />
                              What You'll See
                            </h4>
                            <ul className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-1.5 sm:space-y-2 list-disc list-inside">
                              <li><strong>Bus routes:</strong> Which BC Transit buses to take</li>
                              <li><strong>Bus numbers:</strong> Specific route numbers (e.g., Route 1, Route 8)</li>
                              <li><strong>Stop locations:</strong> Where to get on and off the bus</li>
                              <li><strong>Walking directions:</strong> How to walk to/from bus stops</li>
                              <li><strong>Travel time:</strong> Estimated time including walking and transit</li>
                              <li><strong>Transfers:</strong> If you need to change buses</li>
                              <li><strong>Schedule:</strong> Departure and arrival times</li>
                            </ul>
                            <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                              If you've allowed location access, your route will automatically start from your current location. Otherwise, you can enter your starting point in Google Maps.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-amber-500 rounded-lg shrink-0">
                              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">Transit Directions Not Available</h3>
                              <p className="text-sm sm:text-base text-gray-700 mb-4">
                                This resource doesn't have a specific street address that can be used for transit planning. The address "{resource.address}" is not suitable for transit route planning.
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                For transit directions, please contact the organization directly or visit their website for more information.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                  <ShareBar resource={resource} className="w-full" />
                </div>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100">
                <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                <div className="space-y-2.5 sm:space-y-3">
                  {resource.phone && (
                    <a 
                      href={`tel:${resource.phone}`}
                      className="flex items-center justify-center w-full py-3 px-4 bg-primary text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:-translate-y-0.5 touch-manipulation min-h-[44px]"
                    >
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                      <span className="truncate">Call {resource.phone}</span>
                    </a>
                  )}
                  {resource.latitude && resource.longitude && (
                    <button
                      onClick={() => setActiveTab("directions")}
                      className="flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 touch-manipulation min-h-[44px]"
                    >
                      <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                      Get Directions
                    </button>
                  )}
                  {resource.website && (
                    <a 
                      href={resource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full py-3 px-4 bg-white border-2 border-gray-100 text-gray-700 font-semibold text-sm sm:text-base rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]"
                    >
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Related Resources */}
              {resource && categories && (() => {
                const parentCategory = categories.find(c => c.id === resource.categoryId);
                if (!parentCategory) return null;
                
                // Fetch related resources in the same category
                const { data: relatedResources } = useQuery({
                  queryKey: [api.resources.list.path, parentCategory.id],
                  queryFn: async () => {
                    const url = new URL(apiUrl(api.resources.list.path), window.location.origin);
                    url.searchParams.append("categoryId", String(parentCategory.id));
                    const res = await fetch(url.toString());
                    if (!res.ok) return [];
                    const all = await api.resources.list.responses[200].parse(await res.json());
                    // Exclude current resource and limit to 4
                    return all.filter(r => r.id !== resource.id).slice(0, 4);
                  },
                  enabled: !!parentCategory,
                });
                
                if (!relatedResources || relatedResources.length === 0) return null;
                
                return (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100">
                    <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Related Resources</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Other resources in {parentCategory.name}:
                    </p>
                    <div className="space-y-2">
                      {relatedResources.map(related => (
                        <Link
                          key={related.id}
                          href={`/resource/${related.id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors touch-manipulation min-h-[44px]"
                        >
                          <div className="font-medium text-sm sm:text-base text-gray-900">{related.name}</div>
                          {related.description && (
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                              {related.description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Report/Edit Resource */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100">
                <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Report Incorrect Information</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Found incorrect information or want to add details about this resource?
                </p>
                <Link
                  href={`/request-update?resourceId=${resource.id}&resourceName=${encodeURIComponent(resource.name)}&address=${encodeURIComponent(resource.address || '')}&phone=${encodeURIComponent(resource.phone || '')}&email=${encodeURIComponent(resource.email || '')}&website=${encodeURIComponent(resource.website || '')}&hours=${encodeURIComponent(resource.hours || '')}`}
                  className="flex items-center justify-center w-full py-3 px-4 bg-slate-600 text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-slate-700 transition-all shadow-md shadow-slate-500/20 hover:-translate-y-0.5 touch-manipulation min-h-[44px]"
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                  Report or Edit Resource
                </Link>
              </div>

              {/* Safety/Disclaimer */}
              <div className="bg-orange-50 rounded-xl p-4 sm:p-6 border border-orange-100">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-900 text-xs sm:text-sm mb-1">Before you visit</h4>
                    <p className="text-orange-800/80 text-xs sm:text-sm leading-relaxed">
                      Hours and services may vary. We recommend calling ahead to confirm availability and requirements.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
