import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "./hooks/use-language";
import { WakeWordProvider } from "./hooks/use-wake-word";
import { LanguageSwitcher } from "./components/language-switcher";
import { WakeWordIndicator } from "./components/wake-word-indicator";
import { BottomNav } from "./components/bottom-nav";
import SatelliteAnalysis from "@/pages/satellite-analysis";
import GpsCoordinates from "@/pages/gps-coordinates";
import VoiceAnalysis from "@/pages/voice-analysis";
import DistrictAnalysis from "@/pages/district-analysis";
import Profile from "@/pages/profile";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

import { useState, useEffect } from "react";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('krishirakshak_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('krishirakshak_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('krishirakshak_user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={() => <SatelliteAnalysis user={user} onLogout={handleLogout} />} />
        <Route path="/gps" component={() => <GpsCoordinates user={user} />} />
        <Route path="/voice-analysis" component={() => <VoiceAnalysis user={user} />} />
        <Route path="/district-analysis" component={() => <DistrictAnalysis user={user} />} />
        <Route path="/profile" component={() => <Profile user={user} onLogout={handleLogout} />} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WakeWordProvider>
          <TooltipProvider>
            <div className="absolute top-4 right-4 z-50">
              <LanguageSwitcher />
            </div>
            <WakeWordIndicator />
            <Toaster />
            <Router />
          </TooltipProvider>
        </WakeWordProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
