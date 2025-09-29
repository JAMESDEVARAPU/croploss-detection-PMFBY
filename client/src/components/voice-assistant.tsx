import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setFinalTranscript("");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      setTranscript(transcript);
      
      if (result.isFinal) {
        setFinalTranscript(transcript);
        onCommand(transcript);
        setTimeout(() => {
          setTranscript("");
          setFinalTranscript("");
        }, 1500);
      }
    };
    
    recognitionRef.current = recognition;
  }, [language, onCommand, finalTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setFinalTranscript("");
      recognitionRef.current.start();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={toggleListening}
        variant={isListening ? "default" : "ghost"}
        size="sm"
        className={`rounded-full w-10 h-10 p-0 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
      >
        {isListening ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4" />}
      </Button>
      
      {(transcript || finalTranscript || isListening) && (
        <div className="absolute top-12 right-0 bg-white border rounded-lg p-3 shadow-lg min-w-64 max-w-80 z-50">
          <div className="text-xs text-gray-500 mb-1">
            {isListening ? "🎤 Listening..." : "✅ Processing"}
          </div>
          {finalTranscript && (
            <div className="text-sm font-medium text-green-700 mb-1">
              Final: {finalTranscript}
            </div>
          )}
          {transcript && (
            <div className="text-sm text-gray-700">
              {transcript}
            </div>
          )}
          {!transcript && !finalTranscript && isListening && (
            <div className="text-sm text-gray-400 italic">
              Speak now...
            </div>
          )}
        </div>
      )}
    </div>
  );
}