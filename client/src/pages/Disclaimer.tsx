/**
 * @fileoverview Disclaimer page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays legal disclaimer and terms of use for the Help Kelowna directory.
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AlertTriangle, Shield, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { getSupportEmail } from "@/lib/config";

export default function Disclaimer() {
  const [supportEmail, setSupportEmail] = useState("support@lifesavertech.ca");

  useEffect(() => {
    getSupportEmail().then(setSupportEmail).catch(() => {
      // Fallback already set in state
    });
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      <main className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h1 className="font-display text-3xl font-bold text-gray-900">
                  Important Disclaimers
                </h1>
              </div>

              <div className="space-y-8 text-gray-700 leading-relaxed">
                {/* Mission Context */}
                <section className="bg-blue-50 border-l-4 border-primary p-4 sm:p-6 rounded-r-lg">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Help Kelowna's Mission:</strong> We believe finding help shouldn't be hard. This platform was created to make connecting with community support services simple, fast, and dignified. We are a community initiative focused on helping people across Kelowna and West Kelowna access free and low-cost support services when they need them most.
                  </p>
                </section>

                {/* Chat Support Disclaimer */}
                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Resource Helper Chat Support (AI-Powered Assistant)
                  </h2>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-lg mb-4">
                    <p className="font-semibold text-blue-900 mb-2">What the Resource Helper Can Do:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm sm:text-base">
                      <li>Help you find resources and services in Kelowna and West Kelowna</li>
                      <li>Provide general information about community support services</li>
                      <li>Help you navigate the app and plan your next steps</li>
                      <li>Answer questions about available services and eligibility</li>
                      <li>Provide emotional support through active listening and validation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-r-lg mb-4">
                    <p className="font-semibold text-red-900 mb-2">What the Resource Helper Cannot Do:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm sm:text-base">
                      <li>Provide medical, legal, or mental health advice or diagnosis</li>
                      <li>Prescribe treatments or medications</li>
                      <li>Replace professional counseling, therapy, or medical care</li>
                      <li>Provide crisis intervention beyond directing to professional services</li>
                      <li>Make decisions for you or guarantee service availability</li>
                      <li>Provide real-time emergency response or crisis intervention</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-6 rounded-r-lg mb-4">
                    <p className="font-semibold text-amber-900 mb-2">Important Limitations & Transparency:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm sm:text-base">
                      <li><strong>AI Technology:</strong> This assistant uses artificial intelligence and may occasionally provide incomplete or inaccurate information</li>
                      <li><strong>Not a Professional:</strong> The resource helper is not a licensed healthcare provider, lawyer, or social worker</li>
                      <li><strong>Information Accuracy:</strong> Always verify information directly with service providers before relying on it</li>
                      <li><strong>No Guarantees:</strong> We cannot guarantee service availability, eligibility, or outcomes</li>
                      <li><strong>BC-Specific:</strong> Information is focused on Kelowna and West Kelowna, BC services and may not apply to other jurisdictions</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 sm:p-6 rounded-lg mb-4">
                    <p className="font-semibold text-gray-900 mb-2">Privacy & Data Protection (PIPEDA Compliant):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm sm:text-base">
                      <li>Conversations are stored securely and used only to improve service quality</li>
                      <li>We comply with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA)</li>
                      <li>Your personal information is not shared with third parties without consent</li>
                      <li>You can request deletion of your conversation history at any time</li>
                      <li>For privacy concerns, contact us at <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a></li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 sm:p-6 rounded-r-lg">
                    <p className="font-semibold text-green-900 mb-2">When to Seek Professional Help:</p>
                    <p className="text-green-800 text-sm sm:text-base mb-2">
                      The resource helper is designed to be supportive, but it is not a substitute for professional care. 
                      Always consult qualified professionals for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-green-800 text-sm sm:text-base">
                      <li>Medical emergencies or health concerns</li>
                      <li>Legal matters or court proceedings</li>
                      <li>Mental health crises or severe emotional distress</li>
                      <li>Substance use emergencies or addiction treatment</li>
                      <li>Financial or housing crises requiring immediate intervention</li>
                    </ul>
                  </div>

                  <p className="mt-4 text-sm sm:text-base text-gray-700 italic">
                    <strong>By using the Resource Helper chat feature, you acknowledge that you understand these limitations 
                    and agree to use the information at your own discretion and risk.</strong> For life-threatening emergencies, 
                    call 911 immediately. For mental health crises in BC, call the Crisis Line at 1-888-353-2273.
                  </p>
                </section>

                {/* Resource Information Disclaimer */}
                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Resource Information
                  </h2>
                  <p className="mb-4">
                    We strive to provide accurate and up-to-date information about community resources. However:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Hours, services, and requirements may change without notice</li>
                    <li>We recommend calling ahead to confirm availability and requirements</li>
                    <li>Some services may have eligibility requirements or waiting lists</li>
                    <li>We cannot guarantee that all listed resources are currently accepting new clients</li>
                  </ul>
                  <p className="text-sm bg-gray-50 p-4 rounded-lg">
                    <strong>Always verify information directly with the service provider</strong> before visiting or relying on it.
                  </p>
                </section>

                {/* Emergency Situations */}
                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Emergency Situations</h2>
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
                    <p className="font-bold text-red-900 mb-3 text-lg">If you are in immediate danger or having a medical emergency:</p>
                    <ul className="space-y-2 text-red-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">911</span>
                        <span>Call immediately for life-threatening emergencies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">Crisis Line:</span>
                        <span>1-888-353-2273 (24/7 mental health crisis support)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">Kids Help Phone:</span>
                        <span>1-800-668-6868 (24/7 support for youth)</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Legal Disclaimer */}
                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Legal Disclaimer</h2>
                  <p className="mb-4">
                    Help Kelowna and Lifesaver Technology Services provide this directory as a public service. 
                    We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>The accuracy, completeness, or timeliness of resource information</li>
                    <li>The quality or availability of services provided by listed organizations</li>
                    <li>Any outcomes resulting from use of listed resources</li>
                    <li>Decisions made based on information provided by the resource helper</li>
                  </ul>
                  <p className="text-sm italic">
                    By using this service, you acknowledge that you understand these limitations and agree to use 
                    the information at your own discretion and risk.
                  </p>
                </section>

                {/* Contact */}
                <section className="bg-gray-50 p-6 rounded-xl">
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Questions or Concerns?</h2>
                  <p className="mb-2">
                    If you have questions about this disclaimer or need to report an issue, please contact:
                  </p>
                  <p className="font-semibold">
                    <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                      {supportEmail}
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

