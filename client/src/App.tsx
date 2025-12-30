/**
 * @fileoverview Main React application component and routing
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Defines the application routing structure and provides global context providers.
 */

import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";

import Home from "@/pages/Home";
import CategoriesList from "@/pages/CategoriesList";
import CategoryDetail from "@/pages/CategoryDetail";
import ResourceDetail from "@/pages/ResourceDetail";
import SearchResults from "@/pages/SearchResults";
import About from "@/pages/About";
import Disclaimer from "@/pages/Disclaimer";
import Admin from "@/pages/Admin";
import Favorites from "@/pages/Favorites";
import RequestUpdate from "@/pages/RequestUpdate";
import MapView from "@/pages/MapView";
import Featured from "@/pages/Featured";
import OfficialResources from "@/pages/OfficialResources";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={CategoriesList} />
      <Route path="/category/:slug" component={CategoryDetail} />
      <Route path="/resource/:id" component={ResourceDetail} />
      <Route path="/search" component={SearchResults} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/map" component={MapView} />
      <Route path="/about" component={About} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/admin" component={Admin} />
      <Route path="/request-update" component={RequestUpdate} />
      <Route path="/featured" component={Featured} />
      <Route path="/official-resources" component={OfficialResources} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <Router />
          <AIChatWidget />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
