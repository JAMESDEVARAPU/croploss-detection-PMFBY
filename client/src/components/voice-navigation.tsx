import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  Navigation, 
  Home, 
  User, 
  Settings, 
  LogOut,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface VoiceNavigationProps {
  onNavigate: (route: string) => void;
  currentRoute?: string;
}

export function VoiceNavigation({ onNavigate, currentRoute = "/" }: VoiceNavigationProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);

  const navigationCommands = {
    en: {
      home: ["go home", "home page", "main page", "dashboard"],
      analysis: ["analyze", "analysis", "crop analysis", "satellite analysis"],
      profile: ["profile", "my profile", "user profile", "account"],
      settings: ["settings", "preferences", "configuration"],
      logout: ["logout", "sign out", "exit", "log out"]
    },
    hi: {
      home: ["घर जाएं", "होम पेज", "मुख्य पृष्ठ", "डैशबोर्ड"],
      analysis: ["विश्लेषण", "फसल विश्लेषण", "उपग्रह विश्लेषण"],
      profile: ["प्रोफ़ाइल", "मेरी प्रोफ़ाइल", "उपयोगकर्ता प्रोफ़ाइल"],
      settings: ["सेटिंग्स", "प्राथमिकताएं", "कॉन्फ़िगरेशन"],
      logout: ["लॉगआउट", "साइन आउट", "बाहर निकलें"]
    },
    te: {
      home: ["ఇంటికి వెళ్లు", "హోమ్ పేజీ", "ప్రధాన పేజీ", "డాష్బోర్డ్"],
      analysis: ["విశ్లేషణ", "పంట విశ్లేషణ", "ఉపగ్రహ విశ్లేషణ"],
      profile: ["ప్రొఫైల్", "నా ప్రొఫైల్", "వినియోగదారు ప్రొఫైల్"],
      settings: ["సెట్టింగ్స్", "ప్రాధాన్యతలు", "కాన్ఫిగరేషన్"],
      logout: ["లాగ్అవుట్", "సైన్ అవుట్", "నిష్క్రమణ"]
    }
  };

  const routes = [
    { 
      key: 'home', 
      path: '/', 
      icon: Home, 
      label: { en: 'Home', hi: 'होम', te: 'హోమ్' }
    },
    { 
      key: 'analysis', 
      path: '/analysis', 
      icon: Navigation, 
      label: { en: 'Analysis', hi: 'विश्लेषण', te: 'విశ్లేషణ' }
    },
    { 
      key: 'profile', 
      path: '/profile', 
      icon: User, 
      label: { en: 'Profile', hi: 'प्रोफ़ाइल', te: 'ప్రొఫైల్' }
    },
    { 
      key: 'settings', 
      path: '/settings', 
      icon: Settings, 
      label: { en: 'Settings', hi: 'सेटिंग्स', te: 'సెట్టింగ్స్' }
    },
    { 
      key: 'logout', 
      path: '/logout', 
      icon: LogOut, 
      label: { en: 'Logout', hi: 'लॉगआउट', te: 'లాగ్అవుట్' }
    }
  ];

  useEffect(() => {
    setAvailableRoutes(routes);
  }, []);

  const handleVoiceNavigation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice navigation not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setLastCommand(transcript);
      
      // Match command to route
      const matchedRoute = findMatchingRoute(transcript);
      if (matchedRoute) {
        onNavigate(matchedRoute.path);
        speakConfirmation(matchedRoute.key);
      } else {
        speakError();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      speakError();
    };

    recognition.start();
  };

  const findMatchingRoute = (transcript: string) => {
    const commands = navigationCommands[language as keyof typeof navigationCommands];
    
    for (const [routeKey, phrases] of Object.entries(commands)) {
      for (const phrase of phrases) {
        if (transcript.includes(phrase.toLowerCase())) {
          return routes.find(route => route.key === routeKey);
        }
      }
    }
    
    return null;
  };

  const speakConfirmation = (routeKey: string) => {
    if ('speechSynthesis' in window) {
      const confirmations = {
        en: `Navigating to ${routeKey}`,
        hi: `${routeKey} पर जा रहे हैं`,
        te: `${routeKey}కి వెళ్తున్నాము`
      };
      
      const text = confirmations[language as keyof typeof confirmations] || confirmations.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const speakError = () => {
    if ('speechSynthesis' in window) {
      const errors = {
        en: "Command not recognized. Please try again.",
        hi: "आदेश पहचाना नहीं गया। कृपया पुनः प्रयास करें।",
        te: "ఆదేశం గుర్తించబడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి."
      };
      
      const text = errors[language as keyof typeof errors] || errors.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-primary" />
            <span>Voice Navigation</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={handleVoiceNavigation}
            disabled={isListening}
            size="lg"
            className={`w-20 h-20 rounded-full ${
              isListening ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              {isListening ? (
                <Mic className="h-6 w-6 animate-pulse" />
              ) : (
                <Navigation className="h-6 w-6" />
              )}
              <span className="text-xs">
                {isListening ? 'Listening...' : 'Navigate'}
              </span>
            </div>
          </Button>

          {lastCommand && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Last command: "{lastCommand}"
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Available Routes */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Available Routes:</p>
          <div className="space-y-1">
            {availableRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = currentRoute === route.path;
              
              return (
                <div
                  key={route.key}
                  className={`flex items-center justify-between p-2 rounded ${
                    isActive ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">
                      {route.label[language as keyof typeof route.label]}
                    </span>
                  </div>
                  {isActive && <ArrowRight className="h-4 w-4 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Commands Help */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Voice Commands:</p>
          <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
            {language === 'en' && (
              <>
                <p>• "Go home" - Navigate to home page</p>
                <p>• "Analysis" - Go to crop analysis</p>
                <p>• "Profile" - View user profile</p>
                <p>• "Settings" - Open settings</p>
              </>
            )}
            {language === 'hi' && (
              <>
                <p>• "घर जाएं" - होम पेज पर जाएं</p>
                <p>• "विश्लेषण" - फसल विश्लेषण पर जाएं</p>
                <p>• "प्रोफ़ाइल" - उपयोगकर्ता प्रोफ़ाइल देखें</p>
                <p>• "सेटिंग्स" - सेटिंग्स खोलें</p>
              </>
            )}
            {language === 'te' && (
              <>
                <p>• "ఇంటికి వెళ్లు" - హోమ్ పేజీకి వెళ్లండి</p>
                <p>• "విశ్లేషణ" - పంట విశ్లేషణకు వెళ్లండి</p>
                <p>• "ప్రొఫైల్" - వినియోగదారు ప్రొఫైల్ చూడండి</p>
                <p>• "సెట్టింగ్స్" - సెట్టింగ్స్ తెరవండి</p>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Speak clearly for better recognition</p>
          <p>• Supports multiple languages</p>
          <p>• Voice feedback confirms navigation</p>
        </div>
      </CardContent>
    </Card>
  );
}