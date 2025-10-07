import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedCoordinateInput } from "@/components/enhanced-coordinate-input";
import { AnalysisResults } from "@/components/analysis-results";
import { OfflineIndicator } from "@/components/offline-indicator";
import { XAIExplanationEnhanced } from "@/components/xai-explanation-enhanced";
import { VoiceAssistant } from "@/components/voice-assistant";
import { ConversationalVoiceAssistant } from "@/components/conversational-voice-assistant";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import {
  Leaf,
  User,
  Phone,
  Mail,
  Building,
  Brain,
  Zap,
  Shield,
  ArrowLeft,
  Satellite
} from "lucide-react";

interface SatelliteAnalysisProps {
  user: any;
  onLogout: () => void;
}

export default function SatelliteAnalysis({ user, onLogout }: SatelliteAnalysisProps) {
  const { language } = useLanguage();
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  const handleAnalysisStart = (analysisId: string, analysisData?: any) => {
    setCurrentAnalysisId(analysisId);
    if (analysisData) {
      setCurrentAnalysis(analysisData);
    }
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
  };

  const handleVoiceAnalysisComplete = async (data: {
    userName: string;
    latitude: number;
    longitude: number;
    fieldArea: number;
  }) => {
    const analysisData = {
      latitude: data.latitude,
      longitude: data.longitude,
      fieldArea: data.fieldArea,
      userName: data.userName,
      cropType: 'rice',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };

    try {
      const response = await fetch('/api/satellite-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentAnalysisId(result.id);
        setCurrentAnalysis(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Satellite className="text-primary text-2xl h-8 w-8" />
                <h1 className="text-xl font-semibold text-gray-900">Satellite Analysis</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Voice Assistant */}
              <VoiceAssistant onCommand={handleVoiceCommand} />
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2"
                >
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
                </Button>
                
                {showProfile && (
                  <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
                    <CardHeader className="pb-2">
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <div className="space-y-1 text-xs">
                          <div><span className="text-gray-600">Name:</span> <span className="font-medium">{user.name}</span></div>
                          <div><span className="text-gray-600">Mobile:</span> <span className="font-medium">{user.mobile}</span></div>
                          <div><span className="text-gray-600">Email:</span> <span className="font-medium">{user.email || 'N/A'}</span></div>
                          <div><span className="text-gray-600">Language:</span> <span className="font-medium">
                            {user.preferredLanguage === 'en' ? 'English' : 
                             user.preferredLanguage === 'hi' ? 'हिंदी' : 'తెలుగు'}
                          </span></div>
                        </div>
                      </div>

                      {/* Farm Info */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-900 border-b pb-1">Farm Info</h5>
                        <div className="space-y-1 text-xs">
                          <div><span className="text-gray-600">Location:</span> <span className="font-medium">{user.farmLocation || 'N/A'}</span></div>
                          {currentAnalysis && (
                            <>
                              <div><span className="text-gray-600">Crop:</span> <span className="font-medium capitalize">{currentAnalysis.cropType}</span></div>
                              <div><span className="text-gray-600">Area:</span> <span className="font-medium">{currentAnalysis.fieldArea}ha</span></div>
                              <div><span className="text-gray-600">Coordinates:</span> <span className="font-medium font-mono">{currentAnalysis.latitude?.toFixed(4)}, {currentAnalysis.longitude?.toFixed(4)}</span></div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Location Details */}
                      {currentAnalysis && (currentAnalysis.village || currentAnalysis.district) && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-gray-900 border-b pb-1">Location Details</h5>
                          <div className="space-y-1 text-xs">
                            <div><span className="text-gray-600">Village:</span> <span className="font-medium">{currentAnalysis.village || 'Unknown'}</span></div>
                            <div><span className="text-gray-600">Mandal:</span> <span className="font-medium">{currentAnalysis.mandal || 'Unknown'}</span></div>
                            <div><span className="text-gray-600">District:</span> <span className="font-medium">{currentAnalysis.district || 'Unknown'}</span></div>
                            <div><span className="text-gray-600">State:</span> <span className="font-medium">{currentAnalysis.state || 'Unknown'}</span></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Conversational Voice Assistant */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'en' ? '🎤 Voice-Guided Analysis' : 
                     language === 'hi' ? '🎤 वॉयस-गाइडेड विश्लेषण' : 
                     '🎤 వాయిస్-గైడెడ్ విశ్లేషణ'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Start a voice conversation to automatically analyze your field' : 
                     language === 'hi' ? 'अपने खेत का स्वचालित विश्लेषण करने के लिए वॉयस बातचीत शुरू करें' : 
                     'మీ పొలాన్ని స్వయంచాలకంగా విశ్లేషించడానికి వాయిస్ సంభాషణ ప్రారంభించండి'}
                  </p>
                </div>
                <ConversationalVoiceAssistant 
                  user={user}
                  onAnalysisComplete={handleVoiceAnalysisComplete}
                />
              </div>
            </CardContent>
          </Card>
          
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
      <footer className="bg-white border-t mt-12">
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