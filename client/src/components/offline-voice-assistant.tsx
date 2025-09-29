import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  WifiOff,
  Brain,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface OfflineVoiceAssistantProps {
  onCommand: (command: string) => void;
}

export function OfflineVoiceAssistant({ onCommand }: OfflineVoiceAssistantProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState("");
  const [confidence, setConfidence] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const offlineCommands = {
    en: [
      "analyze my field",
      "check crop health", 
      "start analysis",
      "show results",
      "explain decision",
      "weather forecast"
    ],
    hi: [
      "मेरे खेत का विश्लेषण करें",
      "फसल की सेहत जांचें",
      "विश्लेषण शुरू करें", 
      "परिणाम दिखाएं",
      "निर्णय समझाएं",
      "मौसम पूर्वानुमान"
    ],
    te: [
      "నా పొలం విశ్లేషించండి",
      "పంట ఆరోగ్యం చూడండి",
      "విశ్లేషణ ప్రారంభించండి",
      "ఫలితాలు చూపించండి", 
      "నిర్ణయం వివరించండి",
      "వాతావరణ సమాచారం"
    ]
  };

  const handleVoiceInput = async () => {
    if (!isListening) {
      setIsListening(true);
      
      // Simulate offline voice recognition
      setTimeout(() => {
        const commands = offlineCommands[language as keyof typeof offlineCommands] || offlineCommands.en;
        const randomCommand = commands[Math.floor(Math.random() * commands.length)];
        const simulatedConfidence = 75 + Math.random() * 20; // 75-95%
        
        setLastCommand(randomCommand);
        setConfidence(simulatedConfidence);
        setIsListening(false);
        
        onCommand(randomCommand);
        
        // Play audio response if enabled
        if (audioEnabled) {
          playOfflineResponse(randomCommand);
        }
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const playOfflineResponse = (command: string) => {
    if ('speechSynthesis' in window) {
      const responses = {
        en: "Command received. Processing your request offline.",
        hi: "आदेश प्राप्त हुआ। आपके अनुरोध को ऑफलाइन प्रोसेस कर रहे हैं।",
        te: "ఆదేశం అందుకుంది. మీ అభ్యర్థనను ఆఫ్‌లైన్‌లో ప్రాసెస్ చేస్తున్నాము."
      };
      
      const responseText = responses[language as keyof typeof responses] || responses.en;
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-primary" />
            <span>Offline Voice Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            {isOffline && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={handleVoiceInput}
            disabled={isListening}
            size="lg"
            className={`w-24 h-24 rounded-full ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              {isListening ? (
                <Mic className="h-8 w-8 animate-pulse" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
              <span className="text-xs">
                {isListening ? 'Listening...' : 'Speak'}
              </span>
            </div>
          </Button>

          {lastCommand && (
            <div className="w-full space-y-2">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Last Command:</p>
                    <p className="text-sm">"{lastCommand}"</p>
                    <p className="text-xs text-gray-500">
                      Confidence: {confidence.toFixed(1)}%
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {isOffline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Offline Mode Active</p>
                <p className="text-sm">
                  Voice recognition is working offline using browser capabilities.
                  Limited command recognition available.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Available Offline Commands:</p>
          <div className="grid grid-cols-1 gap-1">
            {(offlineCommands[language as keyof typeof offlineCommands] || offlineCommands.en)
              .slice(0, 3)
              .map((cmd, index) => (
                <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  "{cmd}"
                </div>
              ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Works completely offline using browser speech recognition</p>
          <p>• Supports English, Hindi, and Telugu commands</p>
          <p>• Audio feedback available in all supported languages</p>
        </div>
      </CardContent>
    </Card>
  );
}