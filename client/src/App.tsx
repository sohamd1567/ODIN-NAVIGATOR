import React from "react";
import "./styles/odin-theme.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { MissionProvider } from "@/context/MissionContext";
import { GroqAnalysisProvider } from "@/context/GroqAnalysisContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { NotificationManager } from "@/components/NotificationManager";
import ContextualAlertBanner from "@/components/ContextualAlertBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("🎯 ODIN Navigator - Full System Restored!");
  
  return (
    <QueryClientProvider client={queryClient}>
      <MissionProvider>
        <GroqAnalysisProvider>
          <NotificationProvider>
            <TooltipProvider>
              <div className="p-2">
                <ContextualAlertBanner />
              </div>
              <NotificationManager 
                maxVisible={3}
                position="top-right"
                enableSound={true}
              />
              <Toaster />
              <Router />
            </TooltipProvider>
          </NotificationProvider>
        </GroqAnalysisProvider>
      </MissionProvider>
    </QueryClientProvider>
  );
}

export default App;
