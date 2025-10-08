import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedCoordinateInput } from "@/components/enhanced-coordinate-input";
import { AnalysisResults } from "@/components/analysis-results";
import { OfflineIndicator } from "@/components/offline-indicator";
import { XAIExplanationEnhanced } from "@/components/xai-explanation-enhanced";
import { useLanguage } from "@/hooks/use-language";
import {
  Phone,
  Mail,
  Building,
  Satellite
} from "lucide-react";
import backgroundImage from "@assets/seva_1759926468291.jpg";

interface SatelliteAnalysisProps {
  user: any;
  onLogout: () => void;
}

export default function SatelliteAnalysis({ user, onLogout }: SatelliteAnalysisProps) {
  const { language } = useLanguage();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  const handleAnalysisStart = (analysisId: string, analysisData?: any) => {
    setCurrentAnalysisId(analysisId);
    if (analysisData) {
      setCurrentAnalysis(analysisData);
    }
  };

  return (
    <div 
      className="min-h-screen pb-20 relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white/85 backdrop-blur-[2px]"></div>
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Satellite className="text-primary text-2xl h-8 w-8" />
                <h1 className="text-xl font-semibold text-gray-900">Satellite Analysis</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={onLogout}
                data-testid="button-logout"
              >
                {language === 'en' ? 'Logout' : 
                 language === 'hi' ? 'लॉग आउट' : 
                 'లాగ్ అవుట్'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-6">
          {/* Satellite Analysis Input */}
          <div id="coordinate-input">
            <EnhancedCoordinateInput onAnalysisStart={handleAnalysisStart} />
          </div>
          
          {/* Analysis Results */}
          {currentAnalysis && (
            <div>
              <AnalysisResults 
                analysis={currentAnalysis} 
                isLoading={false} 
              />
              
              {/* XAI Explanation */}
              {currentAnalysis?.lossPercentage && (
                <XAIExplanationEnhanced analysis={currentAnalysis} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur border-t mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">About PMFBY</h4>
              <p className="text-sm text-gray-600">
                Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance coverage to farmers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>Helpline: 1800-123-4567</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email: support@pmfby.gov.in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Powered By</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4">🛰️</div>
                  <span>Google Earth Engine</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>Ministry of Agriculture</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-6 pt-6 text-center text-sm text-gray-500">
            © 2024 Crop Loss Detection System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}