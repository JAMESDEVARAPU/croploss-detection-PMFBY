import { spawn } from 'child_process';
import path from 'path';
import OpenAI from 'openai';
import { SpeechClient } from '@google-cloud/speech';

interface VoiceServiceConfig {
  language: 'en' | 'hi' | 'te';
  voice?: string;
  openaiApiKey?: string;
}

interface VoiceOutput {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

interface VoiceInput {
  success: boolean;
  transcription?: string;
  confidence?: number;
  error?: string;
}

export class VoiceService {
  private config: VoiceServiceConfig;
  private openai: OpenAI | null = null;
  private googleSpeechClient: SpeechClient | null = null;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });
    }
    // Initialize Google Speech client if credentials are available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.googleSpeechClient = new SpeechClient();
    }
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
   * Check if internet is available
   */
  private async checkInternet(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Convert speech to text using offline Whisper (Python script)
   */
  private async speechToTextOffline(audioBuffer: Buffer, language?: string): Promise<VoiceInput> {
    return new Promise((resolve) => {
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'whisper-offline.py');
      const proc = spawn('python3', [pythonScript, language || this.config.language]);

      let result = '';
      let errorOutput = '';

      proc.stdout.on('data', (data: Buffer) => {
        result += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code: number | null) => {
        try {
          if (code !== 0 || !result.trim()) {
            throw new Error(`Whisper offline failed: ${errorOutput}`);
          }
          const parsed = JSON.parse(result);
          resolve({
            success: true,
            transcription: parsed.transcription,
            confidence: parsed.confidence || 0.9
          });
        } catch (error) {
          console.error('Offline Whisper error:', error);
          resolve({
            success: false,
            error: `Offline Whisper failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      });

      // Send audio buffer to stdin
      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Convert speech to text using Google Speech-to-Text
   */
  private async speechToTextGoogle(audioBuffer: Buffer, language?: string): Promise<VoiceInput> {
    try {
      if (!this.googleSpeechClient) {
        throw new Error('Google Speech client not initialized');
      }

      const audio = {
        content: audioBuffer.toString('base64'),
      };

      const config = {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode: this.mapLanguageCodeToGoogle(language || this.config.language),
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.googleSpeechClient.recognize(request);

      if (response.results && response.results.length > 0) {
        const transcription = response.results
          .map(result => result.alternatives?.[0]?.transcript)
          .join(' ');

        return {
          success: true,
          transcription: transcription,
          confidence: response.results[0].alternatives?.[0]?.confidence || 0.9
        };
      } else {
        throw new Error('No transcription results');
      }
    } catch (error) {
      console.error('Google STT error:', error);
      return {
        success: false,
        error: `Google STT Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper for online processing
   */
  private async speechToTextOnline(audioBuffer: Buffer, language?: string): Promise<VoiceInput> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      // Convert buffer to base64 for OpenAI API
      const base64Audio = audioBuffer.toString('base64');

      // Create a temporary file-like object for OpenAI
      const audioFile = {
        buffer: audioBuffer,
        name: 'audio.webm',
        type: 'audio/webm'
      };

      // Use OpenAI Whisper API for transcription
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile as any,
        model: 'whisper-1',
        language: this.mapLanguageCode(language || this.config.language),
        response_format: 'json',
      });

      return {
        success: true,
        transcription: transcription.text,
        confidence: 0.95 // OpenAI doesn't provide confidence scores, using high default
      };
    } catch (error) {
      console.error('OpenAI Whisper error:', error);
      return {
        success: false,
        error: `Whisper API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert speech to text with automatic mode selection
   */
  async speechToText(audioBuffer: Buffer, language?: string): Promise<VoiceInput> {
    const hasInternet = await this.checkInternet();

    if (!hasInternet) {
      // Offline mode: Use local Whisper
      console.log('Offline mode: Using local Whisper');
      return await this.speechToTextOffline(audioBuffer, language);
    } else {
      // Online mode: Try Google STT first, fallback to OpenAI Whisper
      console.log('Online mode: Using Google STT');
      const googleResult = await this.speechToTextGoogle(audioBuffer, language);
      if (googleResult.success) {
        return googleResult;
      } else {
        console.log('Google STT failed, falling back to OpenAI Whisper');
        return await this.speechToTextOnline(audioBuffer, language);
      }
    }
  }

  /**
   * Process base64 encoded audio data
   */
  async processBase64Audio(base64Audio: string, language?: string): Promise<VoiceInput> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      return this.speechToText(audioBuffer, language);
    } catch (error) {
      return {
        success: false,
        error: `Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Map language codes to OpenAI Whisper format
   */
  private mapLanguageCode(language: string): string {
    const languageMap = {
      'en': 'en',
      'hi': 'hi',
      'te': 'te'
    };
    return languageMap[language as keyof typeof languageMap] || 'en';
  }

  /**
   * Map language codes to Google Speech-to-Text format
   */
  private mapLanguageCodeToGoogle(language: string): string {
    const languageMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    return languageMap[language as keyof typeof languageMap] || 'en-US';
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
  private generateSimulatedTranscription(): string {
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

    const queries = sampleQueries[this.config.language] || sampleQueries['en'];
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
    const text = transcription.toLowerCase();

    // Log the transcription for debugging
    console.log('Voice command transcription:', transcription);
    console.log('Normalized text:', text);

    // Additional debug log for command matching
    const healthCommands = [
      'check my crop health', 'crop health', 'check crop health', 'analyze crop health',
      'check my crop', 'check my crops', 'check crop', 'check crops',
      'check my field', 'check field', 'field health', 'field status',
      'फसल की जांच करें', 'मेरी फसल की जांच करें', 'फसल स्वास्थ्य जांच', 'फसल की जांच',
      'प्लांट हेल्थ जांच', 'प्लांट की जांच', 'प्लांट की स्थिति',
      'పంట ఆరోగ్యం చూడండి', 'నా పంట ఆరోగ్యం చూడండి', 'పంట ఆరోగ్యం తనిఖీ',
      'fasal ki jaanch', 'fasal ki jaanch karen', 'panta aarogyam', 'panta aarogyam choodandi',
      'health check', 'स्वास्थ्य जांच', 'स्वास्थ्य जांच करें', 'crop check', 'field check'
    ];
    console.log('Checking crop health commands against text...');
    healthCommands.forEach((cmd: string) => {
      if (text.includes(cmd.toLowerCase())) {
        console.log(`Matched crop health command: ${cmd}`);
      }
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

    // Determine action based on command patterns (case-insensitive matching)
    const lowerText = text.toLowerCase();

    if (healthCommands.some(cmd => lowerText.includes(cmd.toLowerCase()))) {
      action = 'crop_health';
    } else if (eligibilityCommands.some(cmd => lowerText.includes(cmd.toLowerCase()))) {
      action = 'pmfby_eligibility';
    } else if (explainCommands.some(cmd => lowerText.includes(cmd.toLowerCase()))) {
      action = 'explain_decision';
    } else if (weatherCommands.some(cmd => lowerText.includes(cmd.toLowerCase()))) {
      action = 'weather_forecast';
    } else if (lowerText.includes('analyze') || lowerText.includes('विश्लेषण') || lowerText.includes('విశ్లేషణ')) {
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
