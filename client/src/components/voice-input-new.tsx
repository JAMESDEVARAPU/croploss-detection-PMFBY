import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Volume2, VolumeX, Zap, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface VoiceInputNewProps {
  onVoiceCommand: (command: string) => void;
  placeholder?: string;
}

export function VoiceInputNew({ onVoiceCommand, placeholder = "Click to speak..." }: VoiceInputNewProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setConfidence(0);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setConfidence(confidence * 100);
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        onVoiceCommand(transcript.trim());
        
        // Play confirmation sound if audio enabled
        if (audioEnabled) {
          playConfirmation();
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const playConfirmation = () => {
    if ('speechSynthesis' in window) {
      const confirmations = {
        en: "Command received",
        hi: "आदेश प्राप्त हुआ",
        te: "ఆదేశం అందుకుంది"
      };
      
      const text = confirmations[language as keyof typeof confirmations] || confirmations.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      utterance.rate = 1.2;
      utterance.volume = 0.6;
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-primary" />
            <span>Voice Input</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {language.toUpperCase()}
            </Badge>
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
            onClick={isListening ? stopListening : startListening}
            size="lg"
            className={`w-20 h-20 rounded-full ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              {isListening ? (
                <Mic className="h-6 w-6 animate-pulse" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
              <span className="text-xs">
                {isListening ? 'Stop' : 'Speak'}
              </span>
            </div>
          </Button>

          {/* Live Transcript */}
          <div className="w-full min-h-[60px] p-3 border rounded-lg bg-gray-50">
            {isListening && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Listening...</span>
              </div>
            )}
            <p className="text-sm">
              {transcript || (isListening ? "Speak now..." : placeholder)}
            </p>
          </div>

          {/* Confidence Score */}
          {confidence > 0 && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Confidence: {confidence.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Quick Commands */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Commands:</p>
          <div className="grid grid-cols-1 gap-1">
            {language === 'en' && (
              <>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("analyze my field")}>
                  "Analyze my field"
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("check weather")}>
                  "Check weather"
                </Button>
              </>
            )}
            {language === 'hi' && (
              <>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("मेरे खेत का विश्लेषण करें")}>
                  "मेरे खेत का विश्लेषण करें"
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("मौसम जांचें")}>
                  "मौसम जांचें"
                </Button>
              </>
            )}
            {language === 'te' && (
              <>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("నా పొలం విశ్లేషించండి")}>
                  "నా పొలం విశ్లేషించండి"
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onVoiceCommand("వాతావరణం చూడండి")}>
                  "వాతావరణం చూడండి"
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supports English, Hindi, and Telugu voice commands</p>
          <p>• Real-time speech recognition with confidence scoring</p>
          <p>• Click quick commands or speak naturally</p>
        </div>
      </CardContent>
    </Card>
  );
}