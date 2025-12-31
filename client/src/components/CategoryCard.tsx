/**
 * @fileoverview Category card component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays a category card with icon, name, and description for navigation.
 */

import { Link } from "wouter";
import * as LucideIcons from "lucide-react";
import { type Category } from "@shared/schema";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  index?: number;
}

/**
 * Type-safe icon lookup from lucide-react.
 * Returns the requested icon component or HelpCircle as fallback.
 * Handles common icon name variations.
 */
function getIconComponent(iconName: string): LucideIcon {
  // Normalize icon name (trim whitespace)
  const normalizedName = iconName.trim();
  
  // Map common icon name variations to lucide-react names
  const iconMap: Record<string, string> = {
    "Utensils": "UtensilsCrossed",
    "UtensilsCrossed": "UtensilsCrossed",
    "Home": "Home",
    "Heart": "Heart",
    "Scale": "Scale",
    "Phone": "Phone",
    "Users": "Users",
    "Briefcase": "Briefcase",
    "HeartHandshake": "HeartHandshake",
    "Sparkles": "Sparkles",
    "Church": "Church",
    "User": "User",
    "Feather": "Feather",
    "Globe": "Globe",
    "Bus": "Bus",
    "Wallet": "Wallet",
    "Accessibility": "Accessibility",
    "Gift": "Gift",
    "Stethoscope": "Stethoscope",
    "House": "Home",
    "HomeIcon": "Home",
    "ShoppingBag": "ShoppingBag",
    "ShoppingCart": "ShoppingCart",
    "BookOpen": "BookOpen",
    "Building2": "Building2",
    "GraduationCap": "GraduationCap",
  };
  
  // Try mapped name first, then original name
  const mappedName = iconMap[normalizedName] || normalizedName;
  
  // Try to get the icon component directly
  const iconKey = mappedName as keyof typeof LucideIcons;
  const IconComponent = LucideIcons[iconKey];
  
  // If found and it's a valid component (function or React component object)
  if (IconComponent && (typeof IconComponent === "function" || (typeof IconComponent === "object" && IconComponent !== null && '$$typeof' in IconComponent))) {
    return IconComponent as LucideIcon;
  }
  
  // Try with "Icon" suffix as fallback
  const iconWithSuffix = `${mappedName}Icon` as keyof typeof LucideIcons;
  const IconComponentWithSuffix = LucideIcons[iconWithSuffix];
  if (IconComponentWithSuffix && (typeof IconComponentWithSuffix === "function" || (typeof IconComponentWithSuffix === "object" && IconComponentWithSuffix !== null))) {
    return IconComponentWithSuffix as LucideIcon;
  }
  
  // Fallback to HelpCircle if icon not found
  if (process.env.NODE_ENV === 'development') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${iconName}" (mapped to "${mappedName}") not found in lucide-react, using HelpCircle as fallback`);
    }
  }
  return (LucideIcons.HelpCircle || LucideIcons.HelpCircleIcon) as LucideIcon;
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const IconComponent = getIconComponent(category.icon);

  return (
    <Link href={`/category/${category.slug}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="
          group bg-white rounded-lg p-3 sm:p-4 h-full
          border border-gray-200/60
          hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5
          active:border-primary/50 active:shadow-md
          transition-all duration-200 cursor-pointer
          touch-manipulation
          min-h-[100px] sm:min-h-[110px]
        "
        role="button"
        tabIndex={0}
        aria-label={`Browse ${category.name} resources`}
      >
        <div className="flex items-center gap-3 sm:gap-3.5 h-full">
          {/* Icon - Compact with subtle background */}
          <div className="
            w-10 h-10 sm:w-11 sm:h-11 rounded-lg
            flex items-center justify-center shrink-0
            bg-gray-50 text-gray-700
            group-hover:bg-primary group-hover:text-white
            group-hover:scale-105
            active:scale-95
            transition-all duration-200 ease-out
            border border-gray-200/50 group-hover:border-primary/20
          ">
            <IconComponent className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2} aria-hidden="true" />
          </div>
          
          {/* Content - Compact typography */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 group-hover:text-primary transition-colors duration-200 line-clamp-1 overflow-hidden break-words leading-tight">
              {category.name}
            </h3>
            <p className="text-xs text-gray-500 leading-snug line-clamp-2 overflow-hidden break-words">
              {category.description}
            </p>
          </div>
          
          {/* Subtle arrow indicator */}
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
