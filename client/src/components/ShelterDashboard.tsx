/**
 * @fileoverview Shelter dashboard component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Embeds the official Power BI dashboard from the City of Kelowna
 * showing outdoor overnight sheltering information.
 * 
 * Source: https://www.kelowna.ca/our-community/social-wellness/outdoor-overnight-sheltering
 */

import { ExternalLink } from "lucide-react";
export function ShelterDashboard() {
  // Power BI embed URL from City of Kelowna's official page
  const powerBiEmbedUrl = "https://app.powerbi.com/view?r=eyJrIjoiNGFhNTFmZTctYWNlYy00MWEzLWEzOGQtMWYxMzg5MDEzMWY3IiwidCI6ImM2NTU4NDAxLWYxY2YtNDhjZi05NjA3LWM2ZTNkM2ExMDlmMyJ9";

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Kelowna Shelter Availability Dashboard
          </h2>
          <p className="text-gray-600">
            Real-time information about outdoor overnight sheltering in Kelowna
          </p>
        </div>
        <a
          href="https://www.kelowna.ca/our-community/social-wellness/outdoor-overnight-sheltering"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View on City Website
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="aspect-video w-full">
          <iframe
            src={powerBiEmbedUrl}
            className="w-full h-full border-0"
            title="City of Kelowna Shelter Dashboard"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
        <p>
          <strong>Data Source:</strong> City of Kelowna - Outdoor Overnight Sheltering Dashboard
        </p>
        <p className="mt-1">
          This dashboard is provided by the City of Kelowna and shows real-time information 
          about designated outdoor sheltering sites, availability, and related resources.
        </p>
      </div>
    </div>
  );
}

