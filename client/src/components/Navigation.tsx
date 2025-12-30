/**
 * @fileoverview Main navigation component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Provides main site navigation with mobile menu support and favorites count.
 */

import { Link, useLocation } from "wouter";
import { HeartHandshake, Menu, X, Heart, Map } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFavorites } from "@/lib/favorites";
import { WeatherWidget } from "@/components/WeatherWidget";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [favCount, setFavCount] = useState(0);
  
  useEffect(() => {
    const updateCount = () => setFavCount(getFavorites().length);
    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Find Help" },
    { href: "/map", label: "Map", icon: Map },
    { href: "/favorites", label: "Saved", icon: Heart, badge: favCount },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <WeatherWidget />
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group min-h-[44px] touch-manipulation">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg group-hover:bg-primary/20 active:bg-primary/30 transition-colors">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-gray-900 tracking-tight">
              Help<span className="text-primary">Kelowna</span>
            </span>
          </Link>

          {/* Desktop Nav - 2025 Mobile-First */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-medium transition-colors hover:text-primary active:text-primary/80 relative py-1 flex items-center gap-1.5 min-h-[44px] touch-manipulation",
                  location === link.href ? "text-primary" : "text-gray-600"
                )}
                data-testid={`link-nav-${link.href.replace('/', '') || 'home'}`}
                aria-label={link.label}
              >
                {link.icon && <link.icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[1.25rem] text-center" aria-label={`${link.badge} saved items`}>
                    {link.badge}
                  </span>
                )}
                {location === link.href && (
                  <motion.div
                    layoutId="underline"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button - 2025 Touch-Friendly */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors"
              data-testid="button-mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              {...(isOpen ? { "aria-expanded": "true" } : { "aria-expanded": "false" })}
            >
              {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] items-center gap-2 touch-manipulation",
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 active:bg-gray-100 hover:text-gray-900"
                  )}
                  data-testid={`link-mobile-nav-${link.href.replace('/', '') || 'home'}`}
                  aria-label={link.label}
                >
                  {link.icon && <link.icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[1.25rem] text-center" aria-label={`${link.badge} saved items`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </>
  );
}
