import { spawn } from 'child_process';

interface VoiceServiceConfig {
  language: 'en' | 'hi' | 'te';
  voice?: string;
}

interface VoiceOutput {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

interface VoiceInput {
  success: boolean;
  transcription?: string;
  error?: string;
}

export class VoiceService {
  private config: VoiceServiceConfig;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
  }

  /**
   * Convert text to speech in local language
   */
  async textToSpeech(text: string): Promise<VoiceOutput> {
    try {
      // For demo purposes, we'll simulate TTS generation
      // In production, integrate with services like Azure Speech, AWS Polly, or local TTS
      
      const simulatedAudioUrl = this.generateSimulatedAudioUrl(text);
      
      return {
        success: true,
        audioUrl: simulatedAudioUrl
      };
    } catch (error) {
      return {
        success: false,
        error: `TTS Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert speech to text in local language
   */
  async speechToText(audioBuffer: Buffer): Promise<VoiceInput> {
    try {
      // For demo purposes, simulate speech recognition
      // In production, integrate with services like Azure Speech, Google Speech-to-Text
      
      const simulatedTranscription = this.generateSimulatedTranscription();
      
      return {
        success: true,
        transcription: simulatedTranscription
      };
    } catch (error) {
      return {
        success: false,
        error: `STT Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process base64 audio input
   */
  async processBase64Audio(audioInput: string, language: string = 'en'): Promise<VoiceInput> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioInput, 'base64');
      
      // For demo purposes, simulate speech recognition
      const simulatedTranscription = this.generateSimulatedTranscription(language as 'en' | 'hi' | 'te');
      
      return {
        success: true,
        transcription: simulatedTranscription
      };
    } catch (error) {
      return {
        success: false,
        error: `Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate explanation in voice format
   */
  async explainInVoice(explanation: string, language: string = 'en'): Promise<VoiceOutput> {
    const translatedExplanation = this.translateExplanation(explanation, language);
    return this.textToSpeech(translatedExplanation);
  }

  /**
   * Translate explanation to local language
   */
  private translateExplanation(text: string, language: string): string {
    // Simple translation mapping - in production, use proper translation service
    const translations = {
      'hi': {
        'Your crops are in good condition': 'आपकी फसल अच्छी स्थिति में है',
        'moderate stress': 'मध्यम तनाव',
        'significant damage': 'महत्वपूर्ण नुकसान',
        'severe damage': 'गंभीर नुकसान',
        'eligible for compensation': 'मुआवजे के लिए पात्र',
        'not eligible': 'पात्र नहीं',
        'drought stress': 'सूखे का तनाव',
        'heat stress': 'गर्मी का तनाव'
      },
      'te': {
        'Your crops are in good condition': 'మీ పంటలు మంచి స్థితిలో ఉన్నాయి',
        'moderate stress': 'మధ్యస్థ ఒత్తిడి',
        'significant damage': 'గణనీయమైన నష్టం',
        'severe damage': 'తీవ్రమైన నష్టం',
        'eligible for compensation': 'పరిహారం కోసం అర్హులు',
        'not eligible': 'అర్హులు కాదు',
        'drought stress': 'కరువు ఒత్తిడి',
        'heat stress': 'వేడిమి ఒత్తిడి'
      }
    };

    if (language === 'en') return text;

    let translatedText = text;
    const langTranslations = translations[language as keyof typeof translations];
    
    if (langTranslations) {
      Object.entries(langTranslations).forEach(([english, translated]) => {
        translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
      });
    }

    return translatedText;
  }

  /**
   * Generate simulated audio URL for demonstration
   */
  private generateSimulatedAudioUrl(text: string): string {
    // In production, this would return actual generated audio file URL
    const audioId = Buffer.from(text).toString('base64').substring(0, 16);
    return `/api/audio/generated/${audioId}.mp3`;
  }

  /**
   * Generate simulated transcription for demonstration
   */
  private generateSimulatedTranscription(language: 'en' | 'hi' | 'te' = 'en'): string {
    const sampleQueries = {
      'en': [
        "Check my rice field at coordinates 28.6139, 77.2090",
        "What is the crop loss in my wheat field?",
        "Am I eligible for PMFBY compensation?",
        "Analyze my cotton field damage"
      ],
      'hi': [
        "मेरे धान के खेत की जांच करें निर्देशांक 28.6139, 77.2090 पर",
        "मेरे गेहूं के खेत में कितनी फसल खराब हुई है?",
        "क्या मैं PMFBY मुआवजे के लिए पात्र हूं?",
        "मेरे कपास के खेत की क्षति का विश्लेषण करें"
      ],
      'te': [
        "28.6139, 77.2090 కోఆర్డినేట్స్‌లో నా వరి పొలాన్ని తనిఖీ చేయండి",
        "నా గోధుమ పొలంలో పంట నష్టం ఎంత?",
        "నేను PMFBY పరిహారానికి అర్హుడినా?",
        "నా పత్తి పొలం నష్టాన్ని విశ్లేషించండి"
      ]
    };

    const queries = sampleQueries[language] || sampleQueries['en'];
    return queries[Math.floor(Math.random() * queries.length)];
  }

  /**
   * Process voice command and extract farm details
   */
  parseVoiceCommand(transcription: string): {
    coordinates?: { latitude: number; longitude: number };
    cropType?: string;
    fieldArea?: number;
    action: 'crop_health' | 'pmfby_eligibility' | 'explain_decision' | 'weather_forecast' | 'analyze' | 'unknown';
  } {
    let text = transcription.toLowerCase();
    
    // Remove wake word phrases first
    const wakeWords = [
      'hey krishi rakshak', 'hey krishirakshak', 'krishi rakshak', 'krishirakshak',
      'हे कृषि रक्षक', 'कृषि रक्षक', 'హే కృషి రక్షక', 'కృషి రక్షక'
    ];
    
    wakeWords.forEach(wakeWord => {
      text = text.replace(new RegExp(wakeWord, 'gi'), '').trim();
    });
    
    // Remove common filler words
    const fillerWords = ['please', 'can you', 'could you', 'कृपया', 'దయచేసి'];
    fillerWords.forEach(filler => {
      text = text.replace(new RegExp(filler, 'gi'), '').trim();
    });
    
    // Extract coordinates
    const coordMatch = text.match(/(\d+\.?\d*),?\s*(\d+\.?\d*)/);
    const coordinates = coordMatch ? {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2])
    } : { latitude: 20.5937, longitude: 78.9629 }; // Default to India center

    // Extract crop type with comprehensive multilingual support
    const cropMappings = {
      'rice': ['rice', 'धान', 'వరి', 'chawal', 'bhat'],
      'wheat': ['wheat', 'गेहूं', 'గోధుమ', 'gehun', 'godhum'],
      'cotton': ['cotton', 'कपास', 'పత్తి', 'kapas', 'patti'],
      'maize': ['maize', 'corn', 'मक्का', 'మొక్కజొన్న', 'makka', 'mokkajonnu'],
      'sugarcane': ['sugarcane', 'गन्ना', 'చెరకు', 'ganna', 'cheraku']
    };
    
    let cropType = 'rice'; // Default crop type
    
    // Check all crop mappings
    Object.entries(cropMappings).forEach(([crop, variants]) => {
      variants.forEach(variant => {
        if (text.includes(variant)) cropType = crop;
      });
    });

    // Comprehensive action detection for agricultural voice commands
    let action: 'crop_health' | 'pmfby_eligibility' | 'explain_decision' | 'weather_forecast' | 'analyze' | 'unknown' = 'unknown';
    
    // Crop health check commands
    const healthCommands = [
      'check my crop health', 'crop health', 'फसल की जांच करें', 'పంట ఆరోగ్యం చూడండి',
      'fasal ki jaanch', 'panta aarogyam', 'health check', 'स्वास्थ्य जांच'
    ];
    
    // PMFBY eligibility commands  
    const eligibilityCommands = [
      'am i eligible for compensation', 'eligible', 'compensation', 'pmfby',
      'क्या मुझे मुआवजा मिलेगा', 'मुआवजा', 'पात्र', 'నాకు పరిహారం దొరుకుతుందా',
      'muawaza milega', 'pariharam dorukutunda', 'insurance claim'
    ];
    
    // Explanation commands
    const explainCommands = [
      'explain the decision', 'explain', 'why', 'reason',
      'फैसले की व्याख्या करें', 'व्याख्या', 'क्यों', 'కారణం', 'వివరించండి',
      'vyakhya karen', 'vivarinchandi', 'decision explanation'
    ];
    
    // Weather forecast commands
    const weatherCommands = [
      'get weather forecast', 'weather', 'forecast', 'मौसम की भविष्यवाणी',
      'వాతావరణ సమాచారం', 'mausam', 'bhavishyavani', 'vatavarana samachar'
    ];

    // Determine action based on command patterns
    if (healthCommands.some(cmd => text.includes(cmd))) {
      action = 'crop_health';
    } else if (eligibilityCommands.some(cmd => text.includes(cmd))) {
      action = 'pmfby_eligibility';  
    } else if (explainCommands.some(cmd => text.includes(cmd))) {
      action = 'explain_decision';
    } else if (weatherCommands.some(cmd => text.includes(cmd))) {
      action = 'weather_forecast';
    } else if (text.includes('analyze') || text.includes('विश्लेषण') || text.includes('విశ్లేషణ')) {
      action = 'analyze';
    }

    return {
      coordinates,
      cropType,
      action
    };
  }

  /**
   * Generate voice response for different actions
   */
  async generateVoiceResponse(action: string, data: any, language: string = 'en'): Promise<string> {
    const responses = {
      'en': {
        crop_health: `Your ${data.cropType} crop shows ${data.lossPercentage || 0}% damage. ${data.lossPercentage > 33 ? 'Significant damage detected' : 'Crop is in acceptable condition'}.`,
        pmfby_eligibility: `${data.eligible ? 'You are eligible for PMFBY compensation' : 'You are not eligible for compensation'}. ${data.eligible ? `Estimated amount: ₹${data.amount}` : data.reason}`,
        explain_decision: `The decision is based on satellite analysis. NDVI values show ${data.ndviChange}% vegetation change. ${data.explanation}`,
        weather_forecast: `Today's weather: ${data.temperature}°C, ${data.condition}. ${data.recommendation}`
      },
      'hi': {
        crop_health: `आपकी ${data.cropType} फसल में ${data.lossPercentage || 0}% नुकसान दिख रहा है। ${data.lossPercentage > 33 ? 'गंभीर नुकसान पाया गया है' : 'फसल स्वीकार्य स्थिति में है'}।`,
        pmfby_eligibility: `${data.eligible ? 'आप PMFBY मुआवजे के लिए पात्र हैं' : 'आप मुआवजे के लिए पात्र नहीं हैं'}। ${data.eligible ? `अनुमानित राशि: ₹${data.amount}` : data.reason}`,
        explain_decision: `यह फैसला उपग्रह विश्लेषण पर आधारित है। NDVI मानों में ${data.ndviChange}% वनस्पति परिवर्तन दिखता है। ${data.explanation}`,
        weather_forecast: `आज का मौसम: ${data.temperature}°C, ${data.condition}। ${data.recommendation}`
      },
      'te': {
        crop_health: `మీ ${data.cropType} పంటలో ${data.lossPercentage || 0}% నష్టం కనిపిస్తుంది। ${data.lossPercentage > 33 ? 'గణనీయమైన నష్టం కనుగొనబడింది' : 'పంట ఆమోదయోగ్య స్థితిలో ఉంది'}।`,
        pmfby_eligibility: `${data.eligible ? 'మీరు PMFBY పరిహారానికి అర్హులు' : 'మీరు పరిహారానికి అర్హులు కాదు'}। ${data.eligible ? `అంచనా మొత్తం: ₹${data.amount}` : data.reason}`,
        explain_decision: `ఈ నిర్ణయం ఉపగ్రహ విశ్లేషణ ఆధారంగా ఉంది। NDVI విలువలు ${data.ndviChange}% వృక్షసంపద మార్పును చూపుతున్నాయి। ${data.explanation}`,
        weather_forecast: `నేటి వాతావరణం: ${data.temperature}°C, ${data.condition}। ${data.recommendation}`
      }
    };

    const langResponses = responses[language as keyof typeof responses] || responses['en'];
    return langResponses[action as keyof typeof langResponses] || 'Action completed successfully.';
  }
}

export const voiceService = new VoiceService({ language: 'en' });