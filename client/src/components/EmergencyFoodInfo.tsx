import { Phone, UtensilsCrossed, AlertCircle, ExternalLink, Clock } from "lucide-react";
import { Link } from "wouter";

/**
 * Emergency Food Resources Component
 * 
 * Displays critical emergency food resources prominently at the top of the food banks page.
 * Helps people in crisis find immediate food assistance.
 */
export function EmergencyFoodInfo() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-1.5 bg-gray-100 rounded-md">
          <AlertCircle className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
            Need Emergency Food Right Now?
          </h2>
          <p className="text-sm text-gray-600">
            If you're in a crisis situation and need food immediately, here are your fastest options:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Immediate & Crisis Support */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Immediate & Crisis Support</h3>
          </div>
          
          <div className="space-y-2.5">
            <div className="bg-white border-l-2 border-gray-300 p-2.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">Hands In Service</span>
                <a 
                  href="tel:250-861-5465" 
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
                >
                  <Phone className="w-3 h-3" />
                  (250) 861-5465
                </a>
              </div>
              <p className="text-xs text-gray-600">
                One-time emergency food hampers for sudden crises like illness or income loss. Call now for immediate help.
              </p>
            </div>

            <div className="bg-white border-l-2 border-gray-300 p-2.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">Central Okanagan Food Bank</span>
                <a 
                  href="tel:250-763-7161" 
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
                >
                  <Phone className="w-3 h-3" />
                  (250) 763-7161
                </a>
              </div>
              <p className="text-xs text-gray-600">
                Food assistance during financial hardship. Emergency hamper program for immediate crises (like natural disasters). Accessible to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Ongoing & Shelter Support */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Ongoing & Shelter Support</h3>
          </div>
          
          <div className="space-y-2.5">
            <div className="bg-white border-l-2 border-gray-300 p-2.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">Kelowna's Gospel Mission</span>
                <a 
                  href="tel:250-763-3737" 
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
                >
                  <Phone className="w-3 h-3" />
                  (250) 763-3737
                </a>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Hot meals, shelter (men's, women's, overflow), personal care items, and laundry services daily. No ID required.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                <div className="flex items-start gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Mobile Outreach Team - Meal Service:</p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Seven days a week:</strong><br/>
                      • 9:30 AM at Richter Street and Wedell Place<br/>
                      • 12:00 PM at Library parkade (1360 Ellis Street)<br/>
                      • 5:00 PM at Richter and Wedell (five times per week)<br/>
                      • Breakfast in Rutland: Three days per week (location varies)<br/>
                      <strong>Call (250) 763-3737 for current schedule and locations.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-l-2 border-gray-300 p-2.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">Salvation Army</span>
                <a 
                  href="tel:250-860-2329" 
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
                >
                  <Phone className="w-3 h-3" />
                  (250) 860-2329
                </a>
              </div>
              <p className="text-xs text-gray-600">
                Non-perishable and fresh food to those facing shortages. Food bank locations in Kelowna area.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provincial & Evacuation Support */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-base text-gray-900">Provincial & Evacuation Support</h3>
        </div>
        
        <div className="bg-white border-l-2 border-gray-300 p-2.5 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-gray-900">Emergency Support Services (ESS)</span>
            <a 
              href="https://www2.gov.bc.ca/gov/content/safety/emergency-management/preparedbc/evacuee/emergency-support-services"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
            >
              Visit Website
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-gray-600">
            If you're evacuated due to a disaster, ESS provides immediate food, accommodation, and clothing. Contact via BC government website.
          </p>
        </div>
      </div>

      {/* Quick Action Guide */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h3 className="font-semibold text-base text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600" />
          What to Do
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-gray-700">1.</span>
            <div>
              <span className="font-medium text-gray-900">Quick, temporary fix in a sudden crisis:</span>
              <p className="text-gray-600">Call <a href="tel:250-861-5465" className="text-primary hover:underline font-medium">Hands In Service (250-861-5465)</a></p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-gray-700">2.</span>
            <div>
              <span className="font-medium text-gray-900">Ongoing food insecurity:</span>
              <p className="text-gray-600">Visit or contact the <Link href="/category/food-banks" className="text-primary hover:underline font-medium">Central Okanagan Food Bank</Link></p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-gray-700">3.</span>
            <div>
              <span className="font-medium text-gray-900">Need a hot meal or shelter:</span>
              <p className="text-gray-600">Go to <Link href="/category/shelters" className="text-primary hover:underline font-medium">Kelowna's Gospel Mission</Link></p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-semibold text-gray-700">4.</span>
            <div>
              <span className="font-medium text-gray-900">Evacuated from your home:</span>
              <p className="text-gray-600">Connect with <a href="https://www2.gov.bc.ca/gov/content/safety/emergency-management/preparedbc/evacuee/emergency-support-services" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Emergency Support Services (ESS)</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

