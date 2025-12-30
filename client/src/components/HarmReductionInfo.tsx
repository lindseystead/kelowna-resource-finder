import { Phone, AlertTriangle, Shield, TestTube, MapPin, Smartphone, ExternalLink, MessageSquare } from "lucide-react";

/**
 * Harm Reduction Resources Component
 * 
 * Displays critical harm reduction resources from Toward the Heart
 * Helps people access naloxone, overdose prevention, drug checking, and alerts
 */
export function HarmReductionInfo() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-1.5 bg-gray-100 rounded-md">
          <Shield className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
            Harm Reduction & Overdose Prevention
          </h2>
          <p className="text-sm text-gray-600">
            Free, anonymous services to help keep you safe. Get naloxone, find overdose prevention sites, check drugs, and receive toxic drug alerts.
          </p>
        </div>
      </div>

      {/* Critical Emergency Services */}
      <div className="bg-gray-100 border-l-2 border-gray-400 p-2.5 rounded mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle className="w-4 h-4 text-gray-700" />
          <h3 className="font-semibold text-sm text-gray-900">In an Overdose Emergency?</h3>
        </div>
        <div className="space-y-1 text-xs text-gray-700">
          <p className="font-medium">Call 911 immediately</p>
          <p>Administer naloxone if available. Stay with the person until help arrives.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Toxic Drug Alerts */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Toxic Drug Alerts</h3>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Get free, anonymous text alerts about toxic drugs in your area. Available for Interior Health region.
          </p>
          <div className="space-y-2">
            <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
              <p className="font-medium text-xs text-gray-900 mb-1">Text to sign up:</p>
              <a 
                href="sms:253787&body=JOIN" 
                className="text-lg font-bold text-primary hover:text-primary/80"
              >
                253787 (ALERTS)
              </a>
              <p className="text-xs text-gray-600 mt-0.5">Text: <span className="font-mono">JOIN</span></p>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Text <span className="font-mono">FIND</span> for harm reduction supplies</p>
              <p>• Text <span className="font-mono">NARCAN</span> for naloxone locations</p>
              <p>• Text <span className="font-mono">SAFE</span> for overdose prevention sites</p>
              <p>• Text <span className="font-mono">TREAT</span> for treatment services</p>
            </div>
          </div>
        </div>

        {/* Naloxone & Supplies */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Free Naloxone Kits</h3>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Naloxone can reverse an opioid overdose. Free kits available at pharmacies and harm reduction sites.
          </p>
          <div className="space-y-2">
            <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
              <p className="font-medium text-xs text-gray-900 mb-1">Find naloxone:</p>
              <a 
                href="https://towardtheheart.com/find-a-site" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1"
              >
                Search Toward the Heart <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Available at most pharmacies (free, no prescription needed)</p>
              <p>• Take Home Naloxone sites across BC</p>
              <p>• Training provided when you pick up</p>
            </div>
          </div>
        </div>

        {/* Overdose Prevention Sites */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Overdose Prevention Sites</h3>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Safe places to use drugs under supervision. Staff can respond to overdoses immediately.
          </p>
          <div className="space-y-2">
            <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
              <p className="font-medium text-xs text-gray-900 mb-1">Find a site:</p>
              <a 
                href="https://towardtheheart.com/find-a-site" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1"
              >
                Search Toward the Heart <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Supervised consumption available</p>
              <p>• Trained staff on-site</p>
              <p>• No judgment, anonymous</p>
            </div>
          </div>
        </div>

        {/* Drug Checking */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TestTube className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-base text-gray-900">Drug Checking</h3>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Get your drugs tested for safety. Free, anonymous service to check what's in your substances.
          </p>
          <div className="space-y-2">
            <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
              <p className="font-medium text-xs text-gray-900 mb-1">Find drug checking:</p>
              <a 
                href="https://drugcheckingbc.ca/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1"
              >
                BC Drug Checking <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Available at harm reduction sites</p>
              <p>• Results in minutes</p>
              <p>• Helps identify toxic substances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Services */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-base text-gray-900">Virtual Overdose Prevention</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
            <h4 className="font-medium text-xs text-gray-900 mb-1">Lifeguard App</h4>
            <p className="text-xs text-gray-600 mb-2">
              Use Alone Timer connects you to help if you become unresponsive. Free app for safer substance use.
            </p>
            <a 
              href="https://www.lifeguarddh.com/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1"
            >
              Download Lifeguard App <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="bg-white border-l-2 border-gray-300 p-2 rounded">
            <h4 className="font-medium text-xs text-gray-900 mb-1">NORS Hotline</h4>
            <p className="text-xs text-gray-600 mb-2">
              National Overdose Response Service - confidential support while you use. Available Canada-wide.
            </p>
            <a 
              href="tel:1-888-688-6677" 
              className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold text-sm"
            >
              <Phone className="w-4 h-4" />
              1-888-688-NORS (6677)
            </a>
            <p className="text-xs text-gray-500 mt-0.5">24/7 support line</p>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h3 className="font-semibold text-base text-gray-900 mb-2">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-medium text-gray-900 mb-1.5">Text Commands (253787):</p>
            <ul className="space-y-0.5 text-gray-600">
              <li><span className="font-mono">JOIN</span> - Sign up for alerts</li>
              <li><span className="font-mono">FIND</span> - Harm reduction supplies</li>
              <li><span className="font-mono">NARCAN</span> - Naloxone locations</li>
              <li><span className="font-mono">SAFE</span> - Overdose prevention sites</li>
              <li><span className="font-mono">TREAT</span> - Treatment services</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1.5">More Resources:</p>
            <ul className="space-y-0.5 text-gray-600">
              <li>
                <a href="https://towardtheheart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Toward the Heart <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a href="https://drugcheckingbc.ca/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  BC Drug Checking <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                <a href="https://www2.gov.bc.ca/gov/content/overdose" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  BC Overdose Prevention <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

