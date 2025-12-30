/**
 * @fileoverview Kelowna Gospel Mission services information component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays comprehensive information about Kelowna Gospel Mission's services
 * prominently on the homepage. Includes all their programs and facilities.
 * 
 * Source: https://kelownagospelmission.ca/services/
 */

import { Phone, Home, Heart, Stethoscope, Users, ExternalLink, MapPin, Clock, UtensilsCrossed } from "lucide-react";
import { Link } from "wouter";
export function GospelMissionInfo() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 mb-6 shadow-sm">
      {/* Header with Logo Placeholder */}
      <div className="flex flex-col sm:flex-row items-start gap-3 mb-4">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            Kelowna's Gospel Mission
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Comprehensive support services for people experiencing homelessness and crisis. 
            Providing shelter, meals, healthcare, and pathways to stability.
          </p>
          <a 
            href="https://kelownagospelmission.ca/services/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Learn more <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Emergency Shelters */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-base text-gray-900">Emergency Shelters</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white border-l-2 border-gray-300 p-3 rounded hover:shadow-sm transition-shadow">
            <div className="flex flex-col gap-3 mb-2">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">The Leon Shelter</span>
              <a 
                href="tel:2507633737" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm leading-tight min-h-[44px] touch-manipulation"
                aria-label="Call The Leon Shelter at 250-763-3737"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="tracking-wide">250-763-3737</span>
              </a>
            </div>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              60 emergency beds for men. Access to showers, laundry, hygiene supplies, and three hot meals daily. 
              For those maintaining sobriety while living in shelter.
            </p>
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="break-words">251 Leon Avenue, Kelowna</span>
            </div>
          </div>

          <div className="bg-white border-l-2 border-gray-300 p-3 rounded hover:shadow-sm transition-shadow">
            <div className="flex flex-col gap-2 mb-2">
              <span className="font-medium text-sm text-gray-900">Bay Ave Community Shelter</span>
              <a 
                href="tel:2364200899" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm leading-tight min-h-[44px] touch-manipulation"
                aria-label="Call Bay Ave Community Shelter at 236-420-0899"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="tracking-wide">236-420-0899</span>
              </a>
            </div>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              Co-ed facility offering space for meals, washrooms, and case management services.
            </p>
            <div className="flex items-start gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="break-words">858 Ellis Street, Kelowna</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Services */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-base text-gray-900">Gateway to Wrap-Around Care</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
          <div className="text-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
            <UtensilsCrossed className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <span className="font-medium text-gray-900 text-xs block">Nutritious Meals</span>
          </div>
          <div className="text-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
            <Users className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <span className="font-medium text-gray-900 text-xs block">Showers</span>
          </div>
          <div className="text-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
            <Heart className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <span className="font-medium text-gray-900 text-xs block">Personal Care</span>
          </div>
          <div className="text-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors">
            <Users className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <span className="font-medium text-gray-900 text-xs block">Free Haircuts</span>
          </div>
          <div className="text-center p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors col-span-2 sm:col-span-1">
            <Home className="w-4 h-4 text-gray-600 mx-auto mb-1" />
            <span className="font-medium text-gray-900 text-xs block">Laundry</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Caseworkers connect people with opportunities to tackle barriers and walk with them as they move toward permanent housing.
        </p>
      </div>

      {/* Housing Communities */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-base text-gray-900">Therapeutic & Transitional Communities</h3>
        </div>
        
        <div className="space-y-2">
          <div className="bg-white border-l-2 border-gray-300 p-3 rounded hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-sm text-gray-900 mb-1">Women's Community</h4>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              Secure environment for women in crisis, offering temporary transitional housing and long-term communal housing.
            </p>
            <div className="text-xs text-gray-600 space-y-1 mb-2">
              <p><strong className="font-medium">Harmony House & Shiloh:</strong> Temporary transitional housing</p>
              <p><strong className="font-medium">Selah 1 & 2:</strong> Affordable independent community living for women seeking a sober, supportive environment</p>
            </div>
            <p className="text-xs text-gray-500">
              For more information, email: <a href="mailto:agallant@kelownagospelmission.ca" className="text-primary hover:underline break-all">agallant@kelownagospelmission.ca</a>
            </p>
          </div>

          <div className="bg-white border-l-2 border-gray-300 p-3 rounded hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-sm text-gray-900 mb-1">Momentum Community</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Supporting transitional housing for men 19+ who show the desire and ability to achieve independent living 
              after experiencing homelessness. Provides life-saving training through case workers and community partners.
            </p>
          </div>
        </div>
      </div>

      {/* Dental Clinic */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-base text-gray-900">KGM Community Dental</h3>
        </div>
        
        <div className="bg-white border-l-2 border-gray-300 p-3 rounded hover:shadow-sm transition-shadow">
          <div className="flex flex-col gap-2 mb-2">
            <span className="font-medium text-sm text-gray-900">Free & Low-Cost Dental Care</span>
            <a 
              href="tel:7787383636" 
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm leading-tight min-h-[44px] touch-manipulation"
              aria-label="Call KGM Community Dental at 778-738-3636"
            >
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="tracking-wide">778-738-3636</span>
            </a>
          </div>
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
            Essential oral health care accessible to all. Services include cleanings, check-ups, X-rays, extractions, and fillings.
          </p>
          <div className="text-xs text-gray-600 space-y-1 mb-2">
            <p><strong className="font-medium">Available to:</strong> Low-income individuals and families, income assistance recipients</p>
            <p><strong className="font-medium">Accepts:</strong> Government ministry dental coverage, Healthy Kids, Persons with Disability plans, First Nations Health Authority</p>
          </div>
          <p className="text-xs text-gray-500">
            Email: <a href="mailto:dentalclinic@kelownagospelmission.ca" className="text-primary hover:underline break-all">dentalclinic@kelownagospelmission.ca</a>
          </p>
        </div>
      </div>

      {/* Community Outreach */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-base text-gray-900">Community Outreach</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Outreach team brings food, clothing, basic health care, and emotional support for those sleeping rough or 
          experiencing episodic homelessness. Building trust to connect people to services and bring them into shelter.
        </p>
      </div>

      {/* Source Citation */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Information sourced from{" "}
          <a 
            href="https://kelownagospelmission.ca/services/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Kelowna's Gospel Mission Services
          </a>
        </p>
      </div>
    </div>
  );
}

