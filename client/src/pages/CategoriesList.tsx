/**
 * @fileoverview Categories list page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays all available resource categories in a grid layout.
 */

import { useCategories } from "@/hooks/use-resources";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryCardSkeleton } from "@/components/CategoryCardSkeleton";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";

export default function CategoriesList() {
  const { data: categories, isLoading, error } = useCategories();

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      {/* 2025 Mobile-First Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            All Support Services
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Browse our complete directory of community resources available in Kelowna.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 sm:py-20">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" aria-label="Loading categories" />
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-10 bg-red-50 rounded-xl border border-red-100 px-4">
            <p className="text-sm sm:text-base text-red-600 font-medium">
              Could not load categories. Please try again.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categories?.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
