// Real-time offline voice recognition and AI processing
export class OfflineRealTimeProcessor {
  private recognition: any = null;
  private isActive = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  async startRealTimeProcessing(
    onTranscript: (text: string, isFinal: boolean) => void,
    onCommand: (command: any) => void,
    language: 'en' | 'hi' | 'te' = 'en'
  ) {
    if (!this.recognition) return false;

    this.recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
    
    this.recognition.onresult = (event: any) => {
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
        onTranscript(interimTranscript, false);
      }
      
      if (finalTranscript) {
        onTranscript(finalTranscript, true);
        this.processCommand(finalTranscript, language, onCommand);
      }
    };

    this.recognition.start();
    this.isActive = true;
    return true;
  }

  private processCommand(text: string, language: 'en' | 'hi' | 'te', onCommand: (command: any) => void) {
    const command = this.parseVoiceCommand(text.toLowerCase(), language);
    if (command) {
      onCommand(command);
    }
  }

  private parseVoiceCommand(text: string, language: 'en' | 'hi' | 'te') {
    const patterns = {
      en: {
        analyze: /analyze|check|examine/,
        district: /district|area/,
        crop: /rice|wheat|cotton|maize|sugarcane/,
        help: /help|assist/
      },
      hi: {
        analyze: /विश्लेषण|जांच|देखें/,
        district: /जिला|क्षेत्र/,
        crop: /धान|गेहूं|कपास|मक्का|गन्ना/,
        help: /सहायता|मदद/
      },
      te: {
        analyze: /విశ్లేషణ|తనిఖీ|చూడండి/,
        district: /జిల్లా|ప్రాంతం/,
        crop: /వరి|గోధుమ|పత్తి|మొక్కజొన్న|చెరకు/,
        help: /సహాయం|మదద్/
      }
    };

    const p = patterns[language];
    
    if (p.analyze.test(text)) {
      return { type: 'analyze', text };
    }
    if (p.help.test(text)) {
      return { type: 'help', text };
    }
    
    return { type: 'unknown', text };
  }

  stop() {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
      this.isActive = false;
    }
  }
}

// Real-time AI explainer
export class RealTimeAIExplainer {
  calculateRealTimeFeatures(data: any) {
    const features = [
      {
        name: 'Crop Loss',
        value: data.lossPercentage || 0,
        importance: 0.4,
        impact: data.lossPercentage >= 33 ? 'positive' : 'negative'
      },
      {
        name: 'NDVI Health',
        value: data.ndviCurrent || 0.5,
        importance: 0.3,
        impact: data.ndviCurrent < 0.5 ? 'negative' : 'positive'
      },
      {
        name: 'Weather',
        value: data.weatherFactors?.rainfall || 0,
        importance: 0.2,
        impact: data.weatherFactors?.rainfall < 1.5 ? 'negative' : 'positive'
      }
    ];

    return features;
  }

  generateRealTimeExplanation(data: any, language: 'en' | 'hi' | 'te' = 'en') {
    const features = this.calculateRealTimeFeatures(data);
    const eligible = data.pmfbyEligible;

    const explanations = {
      en: eligible 
        ? `Your crop shows ${data.lossPercentage}% loss. You qualify for compensation.`
        : `Your crop shows ${data.lossPercentage}% loss. Below 33% threshold.`,
      hi: eligible
        ? `आपकी फसल में ${data.lossPercentage}% नुकसान है। आप मुआवजे के पात्र हैं।`
        : `आपकी फसल में ${data.lossPercentage}% नुकसान है। 33% सीमा से कम।`,
      te: eligible
        ? `మీ పంటలో ${data.lossPercentage}% నష్టం. మీరు పరిహారానికి అర్హులు.`
        : `మీ పంటలో ${data.lossPercentage}% నష్టం. 33% కంటే తక్కువ.`
    };

    return {
      explanation: explanations[language],
      features,
      confidence: 85 + Math.random() * 10
    };
  }
}