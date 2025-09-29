import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface VoiceInputProps {
  onVoiceCommand: (command: string) => void;
}

export function VoiceInput({ onVoiceCommand }: VoiceInputProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      onVoiceCommand(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="h-5 w-5" />
          <span>Voice Commands</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={startListening}
            disabled={isListening}
            size="lg"
            className={`w-16 h-16 rounded-full ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-primary'
            }`}
          >
            {isListening ? (
              <Mic className="h-6 w-6 animate-pulse" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          <p className="text-sm text-center">
            {isListening ? "Listening..." : "Click to speak"}
          </p>
          
          {transcript && (
            <div className="w-full p-3 bg-gray-100 rounded-lg">
              <p className="text-sm">Last command: "{transcript}"</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Try saying:</p>
          <div className="space-y-1 text-xs text-gray-600">
            {language === 'en' && (
              <>
                <p>• "Analyze my field"</p>
                <p>• "Check crop health"</p>
                <p>• "Show weather forecast"</p>
              </>
            )}
            {language === 'hi' && (
              <>
                <p>• "मेरे खेत का विश्लेषण करें"</p>
                <p>• "फसल की सेहत जांचें"</p>
                <p>• "मौसम पूर्वानुमान दिखाएं"</p>
              </>
            )}
            {language === 'te' && (
              <>
                <p>• "నా పొలం విశ్లేషించండి"</p>
                <p>• "పంట ఆరోగ్యం చూడండి"</p>
                <p>• "వాతావరణ సమాచారం చూపించండి"</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}