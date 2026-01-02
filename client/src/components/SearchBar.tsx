/**
 * @fileoverview SearchBar component for searching community resources
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 */

import { Search } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  /** Initial search query value */
  defaultValue?: string;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Callback fired when search is submitted */
  onSubmit?: (query: string) => void;
}

export function SearchBar({
  defaultValue = "",
  className,
  placeholder = "Search for food, shelter, mental health, or other support...",
  onSubmit,
}: SearchBarProps) {
  const [query, setQuery] = useState<string>(defaultValue);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const displayPlaceholder = isMobile ? "Search resources..." : placeholder;

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      let trimmedQuery = query.trim();
      
      // Handle edge cases: empty, too long, only special characters
      if (!trimmedQuery) {
        return; // Don't search if empty
      }
      
      // Limit query length to prevent abuse (200 chars is reasonable)
      if (trimmedQuery.length > 200) {
        trimmedQuery = trimmedQuery.substring(0, 200);
      }
      
      // Remove excessive whitespace
      trimmedQuery = trimmedQuery.replace(/\s+/g, ' ').trim();
      
      // If after cleaning it's empty, don't search
      if (!trimmedQuery) {
        return;
      }
      
      if (onSubmit) {
        onSubmit(trimmedQuery);
      } else {
        setLocation(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    },
    [query, onSubmit, setLocation]
  );

  return (
    <form
      onSubmit={handleSearch}
      className={cn("relative max-w-2xl mx-auto w-full group", className)}
      role="search"
      aria-label="Search community resources"
    >
      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none z-10">
        <Search
          className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-primary transition-colors duration-200"
          aria-hidden="true"
        />
      </div>
      <input
        ref={inputRef}
        type="search"
        className={cn(
          "block w-full pl-10 sm:pl-14 pr-20 sm:pr-32",
          "py-3 sm:py-4 md:py-5",
          "bg-white border border-gray-300",
          "text-gray-900 placeholder-gray-500",
          "rounded-xl",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          "transition-all duration-200",
          "text-base sm:text-lg",
          "min-w-0 min-h-[44px]",
          "touch-manipulation"
        )}
        placeholder={displayPlaceholder}
        value={query}
        onChange={handleInputChange}
        data-testid="input-search"
        aria-label="Search for community resources"
        aria-describedby="search-description"
        autoComplete="off"
        enterKeyHint="search"
      />
      <span id="search-description" className="sr-only">
        Search for community resources in Kelowna and West Kelowna
      </span>
      <button
        type="submit"
        className={cn(
          "absolute inset-y-1 sm:inset-y-1.5 md:inset-y-2 right-1 sm:right-2",
          "px-3 sm:px-5 md:px-6",
          "py-2 sm:py-0 min-h-[44px]",
          "bg-primary text-white font-medium rounded-lg sm:rounded-xl",
          "hover:bg-primary/90 active:bg-primary/95 active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          "transition-all duration-150",
          "text-xs sm:text-sm md:text-base whitespace-nowrap",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "min-w-[60px] sm:min-w-[80px]",
          "touch-manipulation"
        )}
        data-testid="button-search"
        aria-label="Submit search"
        disabled={!query.trim()}
      >
        <span className="hidden sm:inline">Search</span>
        <span className="sm:hidden">Go</span>
      </button>
    </form>
  );
}
