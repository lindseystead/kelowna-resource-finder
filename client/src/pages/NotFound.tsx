/**
 * @fileoverview 404 Not Found page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays a user-friendly 404 error page with navigation options.
 */

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />
      {/* 2025 Mobile-First Design */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 sm:pt-8 p-6 sm:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 shrink-0" aria-hidden="true" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">404 Page Not Found</h1>
            </div>

            <p className="mt-3 sm:mt-4 text-sm text-gray-600 mb-5 sm:mb-6 px-1">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-primary text-white rounded-lg sm:rounded-xl font-medium hover:bg-primary/90 active:bg-primary/95 transition-colors touch-manipulation w-full sm:w-auto"
              aria-label="Return to home page"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Return to Home</span>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

