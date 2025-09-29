import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OfflineIndicator } from "@/components/offline-indicator";
import { WakeWordDetection } from "@/components/wake-word-detection";
import { VoiceInput } from "@/components/voice-input";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { useState } from "react";
import { 
  Leaf, 
  User,
  Phone,
  Mail,
  Building,
  Brain,
  Zap,
  Shield,
  Satellite,
  ArrowRight,
  TrendingUp,
  BarChart3,
  MapPin
} from "lucide-react";

interface HomeProps {
  user: any;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const { t, language } = useLanguage();
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const handleWakeWordDetected = (wakeWord: string) => {
    console.log('Wake word detected:', wakeWord);
  };

  const handleVoiceCommand = (command: any) => {
    console.log('Voice command processed:', command);
    setVoiceResult(command);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Leaf className="text-primary text-2xl h-8 w-8" />
                <h1 className="text-xl font-semibold text-gray-900">KrishiRakshak</h1>
                <Badge variant="secondary" className="hidden sm:flex">
                  <Brain className="h-3 w-3 mr-1" />
                  XAI Powered
                </Badge>
              </div>
              <span className="text-sm text-gray-500 hidden sm:block">Hybrid XAI-Powered Claim Eligibility System</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <OfflineIndicator />
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700 hidden sm:block">User Profile</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wake Word Detection Component */}
        <WakeWordDetection 
          onWakeWordDetected={handleWakeWordDetected}
          onVoiceCommand={handleVoiceCommand}
        />
        
        {/* Voice Input Fallback */}
        <VoiceInput onVoiceCommand={handleVoiceCommand} />
        
        {/* XAI Features Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-gray-900">Enhanced with Explainable AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-700">Offline Capable</span>
              </div>
            </div>
            <Badge variant="default">
              <Shield className="h-3 w-3 mr-1" />
              PMFBY Certified
            </Badge>
          </div>
        </div>

        {/* User Info Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{user.mobile}</span>
                    </div>
                    {user.farmLocation && (
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{user.farmLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
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
          </CardContent>
        </Card>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to KrishiRakshak</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your intelligent farming companion powered by satellite imagery and explainable AI. 
            Get instant crop loss assessments and PMFBY eligibility determinations.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Satellite Analysis */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Satellite className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Satellite Analysis</CardTitle>
                  <p className="text-sm text-gray-600">AI-powered crop loss detection</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Analyze your crops using advanced satellite imagery and machine learning models. 
                Get accurate loss assessments in minutes.
              </p>
              <Link href="/satellite-analysis">
                <Button className="w-full" data-testid="button-satellite-analysis">
                  Start Analysis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* PMFBY Eligibility */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">PMFBY Eligibility</CardTitle>
                  <p className="text-sm text-gray-600">Insurance claim verification</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Instant eligibility check for Pradhan Mantri Fasal Bima Yojana. 
                Know your compensation amount immediately.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automated eligibility verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Instant compensation calculation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multi-language support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* XAI Explanations */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">XAI Explanations</CardTitle>
                  <p className="text-sm text-gray-600">Understand AI decisions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get clear, understandable explanations for all AI decisions. 
                Know exactly why claims are approved or rejected.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Farmer-friendly explanations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Voice output support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Visual decision factors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Platform Capabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Satellite Technology</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Google Earth Engine integration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>NDVI-based crop health assessment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Temporal change detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Weather pattern analysis</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">AI & Machine Learning</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Local ML models for offline analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>SHAP-based decision explanations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Multi-language voice support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Transparent AI decision-making</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <span>Quick Start Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Input Coordinates</h4>
                <p className="text-sm text-gray-600">
                  Enter your field's latitude, longitude, and basic crop information.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-600">
                  Our AI analyzes satellite imagery and calculates crop loss percentage.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold text-lg">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Get Results</h4>
                <p className="text-sm text-gray-600">
                  Receive PMFBY eligibility status and detailed explanations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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