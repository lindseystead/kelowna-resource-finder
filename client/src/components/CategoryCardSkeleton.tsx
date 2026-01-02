/**
 * @fileoverview Skeleton loader for CategoryCard component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Loading placeholder that matches the structure of CategoryCard.
 */

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 animate-pulse">
      {/* Icon skeleton */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-lg mb-4"></div>
      
      {/* Title skeleton */}
      <div className="h-6 sm:h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      
      {/* Resource count skeleton */}
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
}

