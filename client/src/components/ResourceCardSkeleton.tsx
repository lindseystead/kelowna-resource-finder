/**
 * @fileoverview Skeleton loader for ResourceCard component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Loading placeholder that matches the structure of ResourceCard.
 */

export function ResourceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 animate-pulse">
      {/* Header with favorite button */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          {/* Subtitle skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        {/* Favorite button skeleton */}
        <div className="w-10 h-10 sm:w-9 sm:h-9 bg-gray-200 rounded-full shrink-0 ml-2"></div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>

      {/* Info badges skeleton */}
      <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>

      {/* Contact info skeleton */}
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
        <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );
}

