/**
 * @fileoverview Crisis hotlines component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays essential crisis support numbers in a clean, accessible format.
 * Designed to be helpful without being visually overwhelming.
 */

import { Phone } from "lucide-react";
export function CrisisHotlines() {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 via-gray-900/30 to-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full"></div>
        <h3 className="text-base sm:text-lg font-bold text-white">Crisis Support</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <a
          href="tel:911"
          className="group flex items-center gap-3 px-4 py-3.5 bg-white border-2 border-red-200 rounded-xl hover:border-red-500 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100/50 transition-all duration-200 text-sm font-medium text-gray-900 min-h-[56px] touch-manipulation shadow-sm hover:shadow-md active:scale-[0.98]"
          aria-label="Call 911 for emergency"
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-500 flex items-center justify-center transition-colors duration-200 shrink-0">
            <Phone className="w-5 h-5 text-red-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-gray-900 group-hover:text-red-700 transition-colors">911</div>
            <div className="text-xs text-gray-600 group-hover:text-red-600 transition-colors">Emergency</div>
          </div>
        </a>
        <a
          href="tel:18883532273"
          className="group flex items-center gap-3 px-4 py-3.5 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-200 text-sm font-medium text-gray-900 min-h-[56px] touch-manipulation shadow-sm hover:shadow-md active:scale-[0.98]"
          aria-label="Call BC Crisis Line at 1-888-353-2273"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors duration-200 shrink-0">
            <Phone className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors break-all">1-888-353-2273</div>
            <div className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors">Crisis Line</div>
          </div>
        </a>
        <a
          href="tel:211"
          className="group flex items-center gap-3 px-4 py-3.5 bg-white border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100/50 transition-all duration-200 text-sm font-medium text-gray-900 min-h-[56px] touch-manipulation shadow-sm hover:shadow-md active:scale-[0.98]"
          aria-label="Call 211 for help information"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 group-hover:bg-green-500 flex items-center justify-center transition-colors duration-200 shrink-0">
            <Phone className="w-5 h-5 text-green-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-gray-900 group-hover:text-green-700 transition-colors">211</div>
            <div className="text-xs text-gray-600 group-hover:text-green-600 transition-colors">Help Info</div>
          </div>
        </a>
      </div>
      <p className="text-xs sm:text-sm text-gray-300 mt-4 leading-relaxed px-1">
        For life-threatening emergencies, call <strong className="text-red-400">911</strong>. For mental health crises, call <strong className="text-blue-400">1-888-353-2273</strong>. For help finding services, call <strong className="text-green-400">211</strong>.
      </p>
    </div>
  );
}

