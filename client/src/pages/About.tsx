/**
 * @fileoverview About page component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays information about the Help Kelowna project, mission, and values.
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { Heart, Users, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { getSupportEmail } from "@/lib/config";

export default function About() {
  const [supportEmail, setSupportEmail] = useState("support@lifesavertech.ca");

  useEffect(() => {
    getSupportEmail().then(setSupportEmail).catch(() => {
      // Fallback already set in state
    });
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      {/* 2025 Mobile-First Design */}
      <main className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              About Help Kelowna
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto px-2 break-words">
              Connecting people in need across Kelowna and West Kelowna with free and low-cost community support services.
            </p>
          </div>

          {/* Mission Statement - Prominent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 sm:mb-12">
            <div className="p-6 sm:p-8 md:p-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <div className="space-y-6">
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
                  Help Kelowna was created because finding help shouldn't be hard. When you're in crisis or struggling, the last thing you need is to spend hours searching for services. We make it simple, fast, and dignified.
                </p>
                <p className="text-base text-gray-600 leading-relaxed">
                  This platform brings together a list of many free and low-cost support services for West Kelowna and Kelowna residents in one place. We currently list 250+ resources including food support, shelters, crisis lines, mental health support, addiction recovery, medical clinics, and much more. This is not an exhaustive list of all available resources, but rather a curated collection to help connect people with the support they need.
                </p>
              </div>
            </div>
          </div>

          {/* You Matter Section - Emphasized */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-xl border border-primary/10 overflow-hidden mb-8 sm:mb-12">
            <div className="p-6 sm:p-8 md:p-12">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-4">You Matter. Help is Available.</h3>
              <div className="space-y-4">
                <p className="text-base text-gray-700 leading-relaxed">
                  Life can be challenging, and asking for help takes courage. Whether you're facing a crisis, struggling with housing, need food, or looking for support - we're here to connect you with caring, professional services in our community.
                </p>
                <p className="text-base text-gray-700 leading-relaxed font-medium">
                  Help Kelowna is a community initiative connecting people across Kelowna and West Kelowna with free and low-cost support services. Finding help should be simple, dignified, and fast.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-2">Compassion First</h3>
              <p className="text-xs sm:text-sm text-gray-500">Built with empathy for those navigating difficult times.</p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-2">Community Resource</h3>
              <p className="text-xs sm:text-sm text-gray-500">We verify information when possible, but cannot guarantee accuracy. Always call ahead to confirm.</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-gray-900 mb-2">Community Driven</h3>
              <p className="text-xs sm:text-sm text-gray-500">Open to contributions and feedback from local residents.</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Know of a resource we missed?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto px-2 break-words">
              Help us keep this directory growing. If you know of a service that helps people in Kelowna or West Kelowna, please let us know.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link 
                href="/request-update"
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-primary text-white font-medium rounded-xl hover:bg-primary/90 active:bg-primary/95 transition-colors shadow-lg shadow-primary/25 touch-manipulation"
                aria-label="Suggest a new resource"
              >
                Suggest a Resource
              </Link>
              <a
                href={`mailto:${supportEmail}?subject=New Resource Suggestion`}
                className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-primary hover:text-primary active:bg-gray-50 transition-colors touch-manipulation"
                aria-label="Email us to suggest a resource"
              >
                Email Us Directly
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              All submissions are reviewed within 1-2 business days.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

