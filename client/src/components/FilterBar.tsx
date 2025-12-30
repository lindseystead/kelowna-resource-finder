/**
 * @fileoverview Filter bar component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides filtering options for resources (open now, verified, free services, etc.).
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, X, DollarSign, MapPin } from "lucide-react";

interface FilterBarProps {
  filters: {
    openNow: boolean;
    verified: boolean;
    freeServices: boolean;
    westKelowna: boolean;
    nearby: boolean;
  };
  onFilterChange: (filters: { openNow: boolean; verified: boolean; freeServices: boolean; westKelowna: boolean; nearby: boolean }) => void;
  showLocationFilter?: boolean;
  hasUserLocation?: boolean;
}

export function FilterBar({ filters, onFilterChange, showLocationFilter = true, hasUserLocation = false }: FilterBarProps) {
  const activeCount = (filters.openNow ? 1 : 0) + (filters.verified ? 1 : 0) + (filters.freeServices ? 1 : 0) + (filters.westKelowna ? 1 : 0) + (filters.nearby ? 1 : 0);

  const clearFilters = () => {
    onFilterChange({ openNow: false, verified: false, freeServices: false, westKelowna: false, nearby: false });
  };

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <span className="text-xs sm:text-sm text-gray-500 font-medium shrink-0 w-full sm:w-auto mb-1 sm:mb-0">Filters:</span>
        
        <Button
          variant={filters.openNow ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ ...filters, openNow: !filters.openNow })}
          className="gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
          data-testid="filter-open-now"
          aria-label={filters.openNow ? "Remove open now filter" : "Filter by open now"}
        >
          <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
          <span>Open Now</span>
        </Button>
        
        <Button
          variant={filters.verified ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ ...filters, verified: !filters.verified })}
          className="gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
          data-testid="filter-verified"
          aria-label={filters.verified ? "Remove verified filter" : "Filter by verified only"}
        >
          <CheckCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Verified Only</span>
          <span className="sm:hidden">Verified</span>
        </Button>
        
        <Button
          variant={filters.freeServices ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ ...filters, freeServices: !filters.freeServices })}
          className="gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
          data-testid="filter-free"
          aria-label={filters.freeServices ? "Remove free services filter" : "Filter by free services"}
        >
          <DollarSign className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
          <span>Free</span>
        </Button>
        
        {hasUserLocation && (
          <Button
            variant={filters.nearby ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...filters, nearby: !filters.nearby })}
            className="gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
            data-testid="filter-nearby"
            aria-label={filters.nearby ? "Remove nearby filter" : "Filter by nearby resources"}
          >
            <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span>Nearby</span>
          </Button>
        )}
        
        {showLocationFilter && (
          <Button
            variant={filters.westKelowna ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...filters, westKelowna: !filters.westKelowna })}
            className="gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
            data-testid="filter-west-kelowna"
            aria-label={filters.westKelowna ? "Remove West Kelowna filter" : "Filter by West Kelowna"}
          >
            <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">West Kelowna</span>
            <span className="sm:hidden">West K</span>
          </Button>
        )}
        
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-gray-500 min-h-[44px] sm:min-h-[36px] px-3 sm:px-2.5 touch-manipulation text-xs sm:text-sm"
            data-testid="filter-clear"
            aria-label={`Clear ${activeCount} active filter${activeCount > 1 ? 's' : ''}`}
          >
            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span>Clear ({activeCount})</span>
          </Button>
        )}
      </div>
    </div>
  );
}
