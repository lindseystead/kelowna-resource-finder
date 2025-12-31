/**
 * @fileoverview Resource card component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays a resource card with details, distance, hours, and favorite functionality.
 */

import { Link } from "wouter";
import { MapPin, Phone, ExternalLink, Globe, CheckCircle, Navigation, Clock, Heart, Bus, Calendar, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { type Resource } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { calculateDistance } from "@/lib/distance";
import { useFavorites } from "@/hooks/use-favorites";
import { useState, useEffect } from "react";
import { isFavorite as checkFavorite } from "@/lib/favorites";
import { isOpenNow } from "@/lib/hours";
import { useCurrentTime } from "@/hooks/use-current-time";

interface ResourceCardProps {
  resource: Resource;
  index?: number;
  userLocation?: { lat: number; lng: number } | null;
}

export function ResourceCard({ resource, index = 0, userLocation }: ResourceCardProps) {
  const { toggleFavorite } = useFavorites();
  const [isFav, setIsFav] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const currentTime = useCurrentTime(); // Updates every 10 seconds to refresh open/closed status
  
  useEffect(() => {
    setIsFav(checkFavorite(resource.id));
  }, [resource.id]); // checkFavorite is a stable import from lib, no need in deps
  
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleFavorite(resource.id);
    setIsFav(newState);
  };

  const distance = userLocation && resource.latitude && resource.longitude
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(resource.latitude),
        parseFloat(resource.longitude)
      )
    : null;
  
  // Recalculate open status when currentTime changes (currentTime updates every 10 seconds)
  // The component will re-render when currentTime changes, recalculating open status
  const openStatus = isOpenNow(resource.hours);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="
        bg-white rounded-xl overflow-hidden border border-gray-200
        shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1
        active:border-primary/50 active:shadow-xl active:translate-y-0
        transition-all duration-300 ease-out flex flex-col h-full
        touch-manipulation group
      "
      data-testid={`card-resource-${resource.id}`}
      role="article"
      aria-label={`Resource: ${resource.name}`}
    >
      <div className="p-4 sm:p-5 md:p-6 flex-1">
        {/* Open/Closed Banner - Most Prominent */}
        {openStatus && (
          <div 
            className={`-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-3 text-xs sm:text-sm font-semibold ${
              openStatus.isOpen 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            }`}
            data-testid={`status-open-${resource.id}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                {openStatus.isOpen ? 'OPEN NOW' : 'CLOSED'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm min-w-0 w-full sm:w-auto">
              {openStatus.isOpen ? (
                <span className="break-words min-w-0 text-xs">{openStatus.status}</span>
              ) : (
                <span className="flex items-center gap-1 min-w-0 flex-wrap text-xs">
                  <span className="break-words min-w-0">{openStatus.timeUntilOpen || openStatus.status}</span>
                  {openStatus.nextOpenTime && (
                    <span className="opacity-80 shrink-0 hidden sm:inline">• {openStatus.nextOpenTime}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Show hours info even if status is unknown - More prominent */}
        {!openStatus && resource.hours && (
          <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-2.5 flex items-start gap-1.5 sm:gap-2 text-xs font-semibold bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
            <span className="font-semibold break-words min-w-0 flex-1 text-xs">Hours: {resource.hours}</span>
          </div>
        )}
        
        {/* Always show hours if available, even when open status is known */}
        {openStatus && resource.hours && (
          <div className="mb-3 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-1.5 sm:gap-2 text-xs text-gray-700 min-w-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0 mt-0.5" />
              <span className="font-medium break-words min-w-0 flex-1 text-xs">
                Hours: <span className="text-gray-600">{resource.hours}</span>
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-2 mb-3 sm:mb-2">
          <div className="flex items-start gap-2 sm:gap-2 flex-1 min-w-0">
            <Link href={`/resource/${resource.id}`} className="group flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg sm:text-lg text-gray-900 group-hover:text-primary transition-colors break-words line-clamp-2 overflow-hidden leading-tight hyphens-auto">
                {resource.name}
              </h3>
            </Link>
            <button
              onClick={handleFavorite}
              className="p-2.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              data-testid={`button-favorite-${resource.id}`}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart 
                className={`w-5 h-5 sm:w-5 sm:h-5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                aria-hidden="true"
              />
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
            {distance !== null && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-200/50 whitespace-nowrap shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
              </div>
            )}
            {resource.verified && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-200/50 whitespace-nowrap shadow-sm group-hover:shadow-md group-hover:border-green-300 transition-all" title="This resource has been verified, but please call ahead to confirm current information">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Verified</span>
              </div>
            )}
            {resource.lastVerified && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200/50 whitespace-nowrap shadow-sm" title={`Last verified: ${new Date(resource.lastVerified).toLocaleDateString()}`}>
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{new Date(resource.lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <span className="sm:hidden">{new Date(resource.lastVerified).getFullYear()}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Description with Read More/Less */}
        <div className="mb-4 sm:mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={isDescriptionExpanded ? "expanded" : "collapsed"}
              initial={false}
              animate={{ height: "auto" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p 
                className={`text-sm sm:text-sm text-gray-500 break-words leading-relaxed hyphens-auto ${
                  !isDescriptionExpanded ? "line-clamp-3 sm:line-clamp-2" : ""
                }`}
              >
                {resource.description}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Read More/Less Button - Show if description might be truncated */}
          {(() => {
            // Check if description is likely to be truncated
            // line-clamp-3 on mobile = ~150 chars, line-clamp-2 on desktop = ~100 chars
            const likelyTruncated = resource.description.length > 100;
            return likelyTruncated;
          })() && (
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
              className="mt-2.5 sm:mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 active:text-primary/70 transition-all touch-manipulation group px-2 py-1 -ml-2 rounded-lg hover:bg-primary/5 active:bg-primary/10 min-h-[44px]"
              aria-label={isDescriptionExpanded ? "Show less description" : "Show more description"}
              aria-expanded={isDescriptionExpanded}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{isDescriptionExpanded ? "Show less" : "Read more"}</span>
              <motion.div
                animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center"
              >
                {isDescriptionExpanded ? (
                  <ChevronUp className="w-4 h-4 sm:w-4 sm:h-4 transition-transform" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                )}
              </motion.div>
            </motion.button>
          )}
        </div>
        
        <div className="space-y-2.5 sm:space-y-2 text-sm">
          <div className="flex items-start gap-2 text-gray-600 min-w-0">
            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="leading-tight break-words min-w-0 flex-1 text-sm sm:text-sm hyphens-auto">{resource.address}</span>
          </div>
          
          {resource.phone && (
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <a 
                href={`tel:${resource.phone}`} 
                className="hover:text-primary hover:underline transition-colors break-words min-w-0 flex-1 text-sm sm:text-sm"
                data-testid={`link-phone-${resource.id}`}
              >
                {resource.phone}
              </a>
            </div>
          )}

          {resource.email && (
            <div className="flex items-start sm:items-center gap-2 text-gray-600 min-w-0">
              <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
              <a 
                href={`mailto:${resource.email}?subject=Inquiry about ${encodeURIComponent(resource.name)} - Kelowna Aid&body=Hello ${encodeURIComponent(resource.name)},%0D%0A%0D%0AI found your organization on Kelowna Aid (https://kelownaaid.ca) and I would like to learn more about your services.%0D%0A%0D%0A[Please share any specific questions or information you need here]%0D%0A%0D%0AThank you for the important work you do in our community.%0D%0A%0D%0ABest regards,%0D%0A[Your name]%0D%0A[Your phone number - optional]`}
                className="hover:text-primary hover:underline transition-colors break-words min-w-0 flex-1 text-sm sm:text-sm leading-relaxed"
                data-testid={`link-email-${resource.id}`}
                aria-label={`Send email to ${resource.name}`}
              >
                {resource.email}
              </a>
            </div>
          )}

          {resource.website && (
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <a 
                href={resource.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary hover:underline transition-colors break-all min-w-0 flex-1"
                data-testid={`link-website-${resource.id}`}
              >
                Visit Website
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-2">
        <Link 
          href={`/resource/${resource.id}`}
          className="text-sm font-medium text-primary hover:text-primary/80 active:text-primary/70 flex items-center justify-center sm:justify-start gap-1.5 group shrink-0 min-h-[44px] touch-manipulation px-2"
          data-testid={`link-details-${resource.id}`}
          aria-label={`View details for ${resource.name}`}
        >
          View Details
          <ExternalLink className="w-4 h-4 sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </Link>
        
        {resource.latitude && resource.longitude && (
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-medium bg-white border border-gray-200 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-300 transition-colors flex items-center gap-1.5 sm:gap-1 whitespace-nowrap min-h-[44px] touch-manipulation flex-1 sm:flex-initial justify-center"
              data-testid={`link-directions-${resource.id}`}
              aria-label={`Get directions to ${resource.name}`}
            >
              <MapPin className="w-4 h-4 sm:w-3 sm:h-3 shrink-0" aria-hidden="true" />
              <span>Directions</span>
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
                className="text-xs sm:text-sm font-medium bg-blue-50 border border-blue-200 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-lg text-blue-700 hover:bg-blue-100 active:bg-blue-200 hover:border-blue-300 transition-colors flex items-center gap-1.5 sm:gap-1 whitespace-nowrap min-h-[44px] touch-manipulation flex-1 sm:flex-initial justify-center"
                data-testid={`link-transit-${resource.id}`}
                aria-label={`Get transit directions to ${resource.name}`}
              >
                <Bus className="w-4 h-4 sm:w-3 sm:h-3 shrink-0" aria-hidden="true" />
                <span>Transit</span>
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
