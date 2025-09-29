import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Mic, 
  Volume2, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface WakeWordControlProps {
  onWakeWordDetected: (command: string) => void;
}

export function WakeWordControl({ onWakeWordDetected }: WakeWordControlProps) {
  const { language } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [selectedWakeWord, setSelectedWakeWord] = useState("hey farmer");
  const [lastDetection, setLastDetection] = useState<string | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);

  const wakeWords = {
    en: [
      "hey farmer",
      "crop assistant", 
      "field helper",
      "agriculture ai",
      "farm buddy"
    ],
    hi: [
      "हे किसान",
      "फसल सहायक",
      "खेत सहायक", 
      "कृषि एआई",
      "फार्म मित्र"
    ],
    te: [
      "హే రైతు",
      "పంట సహాయకుడు",
      "పొలం సహాయకుడు",
      "వ్యవసాయ AI",
      "ఫార్మ్ మిత్రుడు"
    ]
  };

  useEffect(() => {
    let recognition: any = null;

    if (isEnabled && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        // Check for wake word
        const currentWakeWords = wakeWords[language as keyof typeof wakeWords] || wakeWords.en;
        const detectedWakeWord = currentWakeWords.find(word => 
          transcript.includes(word.toLowerCase())
        );

        if (detectedWakeWord) {
          setLastDetection(detectedWakeWord);
          setDetectionCount(prev => prev + 1);
          
          // Extract command after wake word
          const commandStart = transcript.indexOf(detectedWakeWord.toLowerCase()) + detectedWakeWord.length;
          const command = transcript.substring(commandStart).trim();
          
          if (command) {
            onWakeWordDetected(command);
            playWakeWordConfirmation();
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Wake word recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsEnabled(false);
        }
      };

      recognition.onend = () => {
        if (isEnabled) {
          // Restart recognition to keep listening
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart wake word recognition:', error);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    }

    return () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };
  }, [isEnabled, language, selectedWakeWord]);

  const playWakeWordConfirmation = () => {
    if ('speechSynthesis' in window) {
      const confirmations = {
        en: "Yes, I'm listening",
        hi: "हाँ, मैं सुन रहा हूँ",
        te: "అవును, నేను వింటున్నాను"
      };
      
      const text = confirmations[language as keyof typeof confirmations] || confirmations.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      utterance.rate = 1.1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setIsListening(false);
      setLastDetection(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Wake Word Control</span>
          </div>
          <div className="flex items-center space-x-2">
            {isListening && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>Active</span>
              </Badge>
            )}
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        {isEnabled ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Wake word detection is active</p>
                <p className="text-sm">
                  Say "{selectedWakeWord}" followed by your command
                </p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Wake word detection is disabled. Enable to use hands-free commands.
            </AlertDescription>
          </Alert>
        )}

        {/* Wake Word Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Wake Word:</label>
          <div className="grid grid-cols-1 gap-2">
            {(wakeWords[language as keyof typeof wakeWords] || wakeWords.en).map((word) => (
              <Button
                key={word}
                variant={selectedWakeWord === word ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWakeWord(word)}
                className="justify-start"
              >
                <Mic className="h-4 w-4 mr-2" />
                "{word}"
              </Button>
            ))}
          </div>
        </div>

        {/* Sensitivity Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Detection Sensitivity: {Math.round(sensitivity * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Less sensitive</span>
            <span>More sensitive</span>
          </div>
        </div>

        {/* Detection Stats */}
        {detectionCount > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Detection Statistics:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-600">Total Detections</p>
                <p className="font-medium">{detectionCount}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-600">Last Wake Word</p>
                <p className="font-medium">"{lastDetection}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Usage Examples:</p>
          <div className="space-y-1 text-xs text-gray-600">
            {language === 'en' && (
              <>
                <p>• "{selectedWakeWord}, analyze my field"</p>
                <p>• "{selectedWakeWord}, check weather forecast"</p>
                <p>• "{selectedWakeWord}, show my profile"</p>
              </>
            )}
            {language === 'hi' && (
              <>
                <p>• "{selectedWakeWord}, मेरे खेत का विश्लेषण करें"</p>
                <p>• "{selectedWakeWord}, मौसम पूर्वानुमान जांचें"</p>
                <p>• "{selectedWakeWord}, मेरी प्रोफ़ाइल दिखाएं"</p>
              </>
            )}
            {language === 'te' && (
              <>
                <p>• "{selectedWakeWord}, నా పొలం విశ్లేషించండి"</p>
                <p>• "{selectedWakeWord}, వాతావరణ సమాచారం చూడండి"</p>
                <p>• "{selectedWakeWord}, నా ప్రొఫైల్ చూపించండి"</p>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Continuous listening for hands-free operation</p>
          <p>• Customizable wake words in multiple languages</p>
          <p>• Adjustable sensitivity for different environments</p>
          <p>• Voice confirmation when wake word is detected</p>
        </div>
      </CardContent>
    </Card>
  );
}