/**
 * @fileoverview React application entry point
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Initializes and renders the React application root component.
 */

// Suppress errors from third-party scripts (browser extensions, injected scripts, etc.)
// These errors don't affect our app functionality but clutter the console
// Must be set up BEFORE any other code runs to catch early errors
(function suppressThirdPartyErrors() {
  const isThirdPartyError = (source: string): boolean => {
    return (
      source.includes('net.js') ||
      source.includes('effulgent-jelly') ||
      source.includes('netlify.app') ||
      (source.includes('CORS policy') && source.includes('netlify'))
    );
  };

  // Suppress errors from third-party scripts
  window.addEventListener('error', (event) => {
    const errorSource = (event.filename || event.message || '').toLowerCase();
    if (isThirdPartyError(errorSource)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Suppress unhandled promise rejections from third-party scripts
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = (event.reason?.message || event.reason?.toString() || '').toLowerCase();
    if (isThirdPartyError(errorMessage)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
})();

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a <div id='root'></div> element.");
}

createRoot(rootElement).render(<App />);
