import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

interface ConversationStep {
  question: string;
  action: string;
  nextStep?: string;
}

interface ConversationalVoiceAssistantProps {
  user: any;
  onAnalysisComplete: (data: {
    userName: string;
    latitude: number;
    longitude: number;
    fieldArea: number;
  }) => void;
}

export function ConversationalVoiceAssistant({ user, onAnalysisComplete }: ConversationalVoiceAssistantProps) {
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("select_language");
  const [transcript, setTranscript] = useState("");
  const [conversationData, setConversationData] = useState<any>({});
  const [conversationLog, setConversationLog] = useState<Array<{ speaker: string; text: string }>>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getConversationFlow = (): Record<string, ConversationStep> => ({
    select_language: {
      question: "Hello! नमस्ते! హలో! Which language do you prefer? English, Hindi, or Telugu? आप कौन सी भाषा पसंद करते हैं? మీరు ఏ భాషను ఇష్టపడతారు?",
      action: "get_language",
      nextStep: "get_name"
    },
    get_name: {
      question: selectedLanguage === 'en' ? "Hello! What is your name?" : 
                selectedLanguage === 'hi' ? "नमस्ते! आपका नाम क्या है?" : 
                "హలో! మీ పేరు ఏమిటి?",
      action: "get_name",
      nextStep: "ask_location"
    },
    ask_location: {
      question: selectedLanguage === 'en' ? "Can I access your GPS location to analyze your field?" : 
                selectedLanguage === 'hi' ? "क्या मैं आपके खेत का विश्लेषण करने के लिए GPS लोकेशन एक्सेस कर सकता हूं?" : 
                "మీ పొలాన్ని విశ్లేషించడానికి GPS లొకేషన్ యాక్సెస్ చేయవచ్చా?",
      action: "get_location_permission",
      nextStep: "ask_field_area"
    },
    ask_field_area: {
      question: selectedLanguage === 'en' ? "What is the area of your field in hectares?" : 
                selectedLanguage === 'hi' ? "आपके खेत का क्षेत्रफल हेक्टेयर में क्या है?" : 
                "మీ పొలం వైశాల్యం హెక్టార్లలో ఎంత?",
      action: "get_field_area",
      nextStep: "complete"
    },
    complete: {
      question: selectedLanguage === 'en' ? "Thank you! Starting satellite analysis now..." : 
                selectedLanguage === 'hi' ? "धन्यवाद! अब सैटेलाइट विश्लेषण शुरू कर रहे हैं..." : 
                "ధన్యవాదాలు! ఇప్పుడు ఉపగ్రహ విశ్లేషణ ప్రారంభిస్తున్నాం...",
      action: "start_analysis"
    }
  });

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'te' ? 'te-IN' : 'en-US';
    
    recognition.onstart = () => {
      console.log('Recognition started for language:', recognition.lang);
      setIsListening(true);
    };
    
    recognition.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
      
      // Auto-restart recognition if conversation is still active and not speaking
      if (isActive && !isSpeaking) {
        setTimeout(() => {
          if (recognitionRef.current && isActive && !isSpeaking) {
            try {
              console.log('Auto-restarting recognition...');
              recognitionRef.current.start();
            } catch (e) {
              console.log('Auto-restart failed:', e);
            }
          }
        }, 100);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.log('Recognition error:', event.error);
      setIsListening(false);
      
      // Auto-retry on network errors
      if (event.error === 'network' || event.error === 'no-speech') {
        setTimeout(() => {
          if (recognitionRef.current && isActive && !isSpeaking) {
            try {
              console.log('Retrying recognition after error...');
              recognitionRef.current.start();
            } catch (e) {
              console.log('Retry failed:', e);
            }
          }
        }, 500);
      }
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript) {
        console.log('Interim:', interimTranscript);
        setTranscript(interimTranscript);
      }
      
      if (finalTranscript) {
        console.log('Recognized:', finalTranscript);
        setTranscript('');
        // Stop recognition after getting a final result
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log('Stop error:', e);
          }
        }
        handleUserResponse(finalTranscript.trim());
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition cleanup error:', e);
        }
      }
    };
  }, [selectedLanguage, isActive, isSpeaking]);

  const speak = (text: string, lang?: string, callback?: () => void) => {
    // Stop recognition immediately when we start speaking
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const speakLang = lang || (selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'te' ? 'te-IN' : 'en-US');
        utterance.lang = speakLang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        console.log(`Available voices for ${speakLang}:`, voices.filter(v => v.lang.startsWith(speakLang.split('-')[0])));
        
        let selectedVoice = null;
        
        if (speakLang.startsWith('hi')) {
          selectedVoice = voices.find(voice => 
            voice.lang === 'hi-IN' || 
            voice.lang.startsWith('hi')
          );
        } else if (speakLang.startsWith('te')) {
          // Try to find Telugu voice, fallback to English if not available
          selectedVoice = voices.find(voice => 
            voice.lang === 'te-IN' || 
            voice.lang.startsWith('te')
          );
          
          // If no Telugu voice found, log warning and use English as fallback
          if (!selectedVoice) {
            console.warn('No Telugu voice found, using default voice. Telugu text will still be displayed.');
            selectedVoice = voices.find(voice => 
              voice.lang === 'en-US' || 
              voice.lang === 'en-GB' || 
              voice.lang.startsWith('en')
            );
          }
        } else {
          selectedVoice = voices.find(voice => 
            voice.lang === 'en-US' || 
            voice.lang === 'en-GB' || 
            voice.lang.startsWith('en')
          );
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
        }
        
        utterance.onstart = () => {
          console.log('Speaking:', text, 'with lang:', speakLang);
          setIsSpeaking(true);
          addToConversationLog('System', text);
        };
        
        utterance.onend = () => {
          console.log('Finished speaking');
          setIsSpeaking(false);
          
          // Wait a bit longer before starting to listen again
          if (callback) {
            setTimeout(callback, 500);
          } else {
            setTimeout(() => {
              if (recognitionRef.current && isActive) {
                try {
                  console.log('Starting recognition after speech');
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Recognition start error:', e);
                }
              }
            }, 800);
          }
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          // Proceed with callback even on error
          if (callback) {
            setTimeout(callback, 500);
          } else {
            setTimeout(() => {
              if (recognitionRef.current && isActive) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Recognition start error:', e);
                }
              }
            }, 800);
          }
        };
        
        synthRef.current = utterance;
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error('Error speaking:', e);
          setIsSpeaking(false);
          if (callback) {
            setTimeout(callback, 500);
          }
        }
      };
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        window.speechSynthesis.addEventListener('voiceschanged', speakText, { once: true });
        // Timeout fallback in case voices never load
        setTimeout(() => {
          if (!isSpeaking) {
            speakText();
          }
        }, 1000);
      } else {
        speakText();
      }
    } else if (callback) {
      addToConversationLog('System', text);
      setTimeout(callback, 500);
    }
  };

  const addToConversationLog = (speaker: string, text: string) => {
    setConversationLog(prev => [...prev, { speaker, text }]);
  };

  const startConversation = () => {
    setIsActive(true);
    setCurrentStep("select_language");
    setConversationData({});
    setConversationLog([]);
    setSelectedLanguage('en');
    
    const step = getConversationFlow()["select_language"];
    speak(step.question, 'en-US', () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition start error:', e);
        }
      }
    });
  };

  const stopConversation = () => {
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleUserResponse = async (response: string) => {
    console.log('User response:', response, 'Current step:', currentStep);
    addToConversationLog('User', response);
    
    const step = getConversationFlow()[currentStep];
    
    switch (step.action) {
      case "get_language":
        const responseLower = response.toLowerCase();
        let detectedLang = 'en';
        
        if (responseLower.includes('hindi') || responseLower.includes('हिंदी') || responseLower.includes('हिन्दी')) {
          detectedLang = 'hi';
        } else if (responseLower.includes('telugu') || responseLower.includes('తెలుగు')) {
          detectedLang = 'te';
        } else if (responseLower.includes('english') || responseLower.includes('इंग्लिश') || responseLower.includes('ఇంగ్లీష్')) {
          detectedLang = 'en';
        }
        
        setSelectedLanguage(detectedLang);
        setLanguage(detectedLang as 'en' | 'hi' | 'te');
        setConversationData({ ...conversationData, language: detectedLang });
        
        const confirmMessage = detectedLang === 'en' 
          ? "Great! I'll continue in English."
          : detectedLang === 'hi'
          ? "बढ़िया! मैं हिंदी में जारी रखूंगा।"
          : "బాగుంది! నేను తెలుగులో కొనసాగిస్తాను.";
        
        const langCode = detectedLang === 'hi' ? 'hi-IN' : detectedLang === 'te' ? 'te-IN' : 'en-US';
        
        speak(confirmMessage, langCode, () => {
          if (step.nextStep) {
            const nextStepKey = step.nextStep;
            // Get the next question with the correct language
            const nextQuestion = nextStepKey === 'get_name' 
              ? (detectedLang === 'en' ? "Hello! What is your name?" : 
                 detectedLang === 'hi' ? "नमस्ते! आपका नाम क्या है?" : 
                 "హలో! మీ పేరు ఏమిటి?")
              : '';
            
            // Add delay to allow recognition to reinitialize with new language
            setTimeout(() => {
              setCurrentStep(nextStepKey);
              speak(nextQuestion, langCode);
            }, 500);
          }
        });
        break;
        
      case "get_name":
        setConversationData({ ...conversationData, userName: response });
        
        const nameConfirmation = selectedLanguage === 'en' 
          ? `Nice to meet you, ${response}!`
          : selectedLanguage === 'hi'
          ? `आपसे मिलकर खुशी हुई, ${response}!`
          : `మిమ్మల్ని కలసినందుకు సంతోషం, ${response}!`;
        
        speak(nameConfirmation, undefined, () => {
          if (step.nextStep) {
            setCurrentStep(step.nextStep);
            speak(getConversationFlow()[step.nextStep].question);
          }
        });
        break;
        
      case "get_location_permission":
        const affirmativeWords = ['yes', 'yeah', 'ok', 'okay', 'sure', 'yep', 'yup', 'allow', 'हां', 'हाँ', 'ठीक', 'जी', 'అవును', 'సరే', 'ఓకే'];
        const negativeWords = ['nope', 'नहीं', 'లేదు', 'వద్దు'];
        
        const responseLowercase = response.toLowerCase().trim();
        
        // Use word boundary for English "yes" and "no" to avoid false positives
        const hasYes = /\b(yes|yeah|yep|yup|ok|okay|sure|allow)\b/i.test(response);
        const hasNo = /\b(no|nope)\b/i.test(response);
        
        // Check for non-English affirmative/negative words
        const hasOtherAffirmative = affirmativeWords.slice(7).some(word => 
          responseLowercase.includes(word)
        );
        const hasOtherNegative = negativeWords.slice(1).some(word =>
          responseLowercase.includes(word)
        );
        
        const isAffirmative = hasYes || hasOtherAffirmative;
        const isNegative = hasNo || hasOtherNegative;
        
        // If we don't detect clear yes/no, ask again
        if (!isAffirmative && !isNegative) {
          const retryMessage = selectedLanguage === 'en'
            ? "Please say yes or no. Can I access your GPS location?"
            : selectedLanguage === 'hi'
            ? "कृपया हां या नहीं कहें। क्या मैं GPS लोकेशन एक्सेस कर सकता हूं?"
            : "దయచేసి అవును లేదా లేదు అనండి. GPS లొకేషన్ యాక్సెస్ చేయవచ్చా?";
          
          speak(retryMessage);
          return;
        }
        
        if (isAffirmative && !isNegative) {
          if (navigator.geolocation) {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
              });
              
              const { latitude, longitude } = position.coords;
              setConversationData({ 
                ...conversationData, 
                latitude, 
                longitude 
              });
              
              const locationMessage = selectedLanguage === 'en' 
                ? `Great! I've got your location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`
                : selectedLanguage === 'hi'
                ? `बढ़िया! मुझे आपका स्थान मिल गया ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`
                : `బాగుంది! మీ లొకేషన్ ${latitude.toFixed(4)}, ${longitude.toFixed(4)} లభించింది.`;
              
              speak(locationMessage, undefined, () => {
                if (step.nextStep) {
                  setCurrentStep(step.nextStep);
                  speak(getConversationFlow()[step.nextStep].question);
                }
              });
            } catch (error) {
              const errorMessage = selectedLanguage === 'en' 
                ? "I couldn't access your location. Please enable GPS."
                : selectedLanguage === 'hi'
                ? "मुझे आपका स्थान नहीं मिल पाया। कृपया GPS सक्षम करें।"
                : "మీ లొకేషన్ యాక్సెస్ చేయలేకపోయాను. దయచేసి GPS ఎనేబుల్ చేయండి.";
              
              speak(errorMessage);
              stopConversation();
            }
          }
        } else {
          const declineMessage = selectedLanguage === 'en'
            ? "Okay, please manually enter your location then."
            : selectedLanguage === 'hi'
            ? "ठीक है, कृपया अपना स्थान मैन्युअल रूप से दर्ज करें।"
            : "సరే, దయచేసి మీ లొకేషన్ మాన్యువల్‌గా నమోదు చేయండి.";
          
          speak(declineMessage);
          stopConversation();
        }
        break;
        
      case "get_field_area":
        const areaMatch = response.match(/(\d+\.?\d*)/);
        if (areaMatch) {
          const fieldArea = parseFloat(areaMatch[1]);
          setConversationData({ ...conversationData, fieldArea });
          
          if (step.nextStep) {
            setCurrentStep(step.nextStep);
            speak(getConversationFlow()[step.nextStep].question, undefined, () => {
              onAnalysisComplete({
                ...conversationData,
                fieldArea
              });
              stopConversation();
            });
          }
        } else {
          const retryMessage = selectedLanguage === 'en'
            ? "Sorry, I didn't catch the area. Please say it again."
            : selectedLanguage === 'hi'
            ? "क्षमा करें, मुझे क्षेत्रफल समझ नहीं आया। कृपया फिर से बताएं।"
            : "క్షమించండి, నాకు వైశాల్యం అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి.";
          
          speak(retryMessage);
        }
        break;
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={isActive ? stopConversation : startConversation}
        variant={isActive ? "default" : "outline"}
        size="lg"
        data-testid="button-voice-conversation"
        className={`${isActive ? 'bg-primary hover:bg-primary-dark' : ''}`}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        {isActive 
          ? (selectedLanguage === 'en' ? 'Stop' : selectedLanguage === 'hi' ? 'बंद करें' : 'ఆపండి')
          : (language === 'en' ? 'Start Voice Assistant' : language === 'hi' ? 'वॉयस असिस्टेंट शुरू करें' : 'వాయిస్ అసిస్టెంట్ ప్రారంభించండి')
        }
        {isListening && <Mic className="h-4 w-4 ml-2 animate-pulse text-red-500" />}
        {isSpeaking && <Volume2 className="h-4 w-4 ml-2 animate-pulse text-blue-500" />}
      </Button>
      
      {isActive && conversationLog.length > 0 && (
        <Card className="absolute top-16 right-0 w-96 max-h-96 overflow-y-auto z-50 shadow-xl">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                {selectedLanguage === 'en' ? 'Conversation' : selectedLanguage === 'hi' ? 'बातचीत' : 'సంభాషణ'}
              </h3>
              <div className="flex items-center space-x-2">
                {isListening && (
                  <span className="flex items-center text-xs text-red-600">
                    <MicOff className="h-3 w-3 mr-1 animate-pulse" />
                    {selectedLanguage === 'en' ? 'Listening...' : selectedLanguage === 'hi' ? 'सुन रहा हूँ...' : 'వింటున్నాను...'}
                  </span>
                )}
                {isSpeaking && (
                  <span className="flex items-center text-xs text-blue-600">
                    <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                    {selectedLanguage === 'en' ? 'Speaking...' : selectedLanguage === 'hi' ? 'बोल रहा हूँ...' : 'మాట్లాడుతున్నాను...'}
                  </span>
                )}
              </div>
            </div>
            
            {conversationLog.map((log, idx) => (
              <div key={idx} className={`flex ${log.speaker === 'System' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-lg p-2 ${
                  log.speaker === 'System' 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'bg-green-50 text-green-900'
                }`}>
                  <div className="text-xs font-medium mb-1">{log.speaker}</div>
                  <div className="text-sm">{log.text}</div>
                </div>
              </div>
            ))}
            
            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg p-2 bg-yellow-50 text-yellow-900 border-2 border-yellow-300">
                  <div className="text-xs font-semibold mb-1 flex items-center">
                    <Mic className="h-3 w-3 mr-1 animate-pulse" />
                    {selectedLanguage === 'en' ? 'Hearing you...' : selectedLanguage === 'hi' ? 'सुन रहा हूँ...' : 'వింటున్నాను...'}
                  </div>
                  <div className="text-sm font-medium">{transcript}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
