/**
 * @fileoverview Footer component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Modern, portfolio-worthy footer with clean design and proper hierarchy.
 */

import { Link } from "wouter";
import { Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Crisis Support - Compact version for footer */}
        <div className="pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-100">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Crisis Support
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <a
              href="tel:911"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all text-sm font-semibold text-red-700 min-h-[44px] touch-manipulation group"
              aria-label="Call 911 for emergency"
            >
              <Phone className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-bold">911</span>
              <span className="text-xs text-red-600/80 ml-auto">Emergency</span>
            </a>
            <a
              href="tel:18883532273"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all text-sm font-semibold text-blue-700 min-h-[44px] touch-manipulation group"
              aria-label="Call BC Crisis Line at 1-888-353-2273"
            >
              <Phone className="w-4 h-4 shrink-0 text-blue-600" />
              <span className="text-xs">1-888-353-2273</span>
              <span className="text-xs text-blue-600/80 ml-auto hidden sm:inline">Crisis</span>
            </a>
            <a
              href="tel:211"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all text-sm font-semibold text-green-700 min-h-[44px] touch-manipulation group"
              aria-label="Call 211 for help information"
            >
              <Phone className="w-4 h-4 shrink-0 text-green-600" />
              <span className="font-bold">211</span>
              <span className="text-xs text-green-600/80 ml-auto">Help Line</span>
            </a>
          </div>
        </div>

        {/* Main Footer Content - Clean, organized layout */}
        <div className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 sm:gap-8">
            {/* Brand Section */}
            <div className="flex-shrink-0">
              <Link href="/" className="inline-block mb-2 group">
                <span className="font-display font-bold text-lg sm:text-xl text-gray-900 group-hover:text-primary transition-colors">
                  Help<span className="text-primary">Kelowna</span>
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs">
                Connecting people in need with community support in Kelowna and West Kelowna.
              </p>
            </div>

            {/* Navigation Links - Clean, organized */}
            <nav className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8" aria-label="Footer navigation">
              <div className="flex flex-col gap-2 min-w-[120px]">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                  Resources
                </h3>
                <Link 
                  href="/categories" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors py-1"
                  aria-label="Browse all categories"
                >
                  Categories
                </Link>
                <Link 
                  href="/map" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors py-1"
                  aria-label="View resources on map"
                >
                  Map View
                </Link>
              </div>

              <div className="flex flex-col gap-2 min-w-[120px]">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                  About
                </h3>
                <Link 
                  href="/about" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors py-1"
                  aria-label="About Help Kelowna"
                >
                  About Us
                </Link>
                <Link 
                  href="/request-update" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors py-1"
                  aria-label="Update a listing"
                >
                  Update Listing
                </Link>
              </div>

              <div className="flex flex-col gap-2 min-w-[120px]">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                  Legal
                </h3>
                <Link 
                  href="/disclaimer" 
                  className="text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors py-1"
                  aria-label="Disclaimer and legal information"
                >
                  Disclaimer
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Bottom Bar - Minimal and clean */}
        <div className="py-4 sm:py-5 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              © {new Date().getFullYear()} helpkelowna.com
            </p>
            <p className="text-xs text-gray-500 text-center sm:text-right">
              Powered by{" "}
              <a 
                href="https://lifesavertech.ca" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors font-medium"
                aria-label="Visit Lifesaver Technology Services website"
              >
                Lifesaver Technology Services
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
