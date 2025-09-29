interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
}

interface CommandIntent {
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresExecution: boolean;
}

interface ProcessedSpeech {
  transcription: TranscriptionResult;
  intent: CommandIntent;
  structuredOutput: any;
  executionResponse?: string;
}

export class SpeechProcessor {
  private languagePatterns = {
    'en': {
      'crop_health': [
        /check\s+(my\s+)?crop\s+health/i,
        /how\s+(is|are)\s+(my\s+)?crops?/i,
        /crop\s+condition/i,
        /field\s+status/i
      ],
      'pmfby_eligibility': [
        /am\s+i\s+eligible\s+for\s+compensation/i,
        /compensation\s+eligibility/i,
        /pmfby\s+claim/i,
        /insurance\s+claim/i
      ],
      'explain_decision': [
        /explain\s+(the\s+)?decision/i,
        /why\s+(was\s+)?my\s+claim\s+(rejected|approved)/i,
        /reason\s+for\s+decision/i,
        /tell\s+me\s+why/i
      ],
      'weather_forecast': [
        /weather\s+forecast/i,
        /what.+weather/i,
        /rain\s+prediction/i,
        /temperature\s+today/i
      ],
      'set_alarm': [
        /set\s+(an\s+)?alarm\s+(at|for)\s+(\d{1,2}(\:\d{2})?\s*(am|pm)?)/i,
        /wake\s+me\s+up\s+at\s+(\d{1,2}(\:\d{2})?\s*(am|pm)?)/i
      ],
      'play_music': [
        /play\s+(some\s+)?music/i,
        /start\s+music/i,
        /turn\s+on\s+music/i
      ],
      'lights_control': [
        /turn\s+(on|off)\s+(the\s+)?lights?/i,
        /(switch\s+)?(on|off)\s+lights?/i
      ]
    },
    'hi': {
      'crop_health': [
        /फसल\s+की\s+जांच/i,
        /खेत\s+की\s+स्थिति/i,
        /फसल\s+कैसी\s+है/i
      ],
      'pmfby_eligibility': [
        /मुआवजा\s+मिलेगा/i,
        /क्या\s+मैं\s+पात्र\s+हूं/i,
        /बीमा\s+का\s+दावा/i
      ],
      'explain_decision': [
        /फैसले\s+की\s+व्याख्या/i,
        /क्यों\s+खारिज\s+हुआ/i,
        /कारण\s+बताएं/i
      ],
      'weather_forecast': [
        /मौसम\s+की\s+भविष्यवाणी/i,
        /आज\s+का\s+मौसम/i,
        /बारिश\s+होगी/i
      ]
    },
    'te': {
      'crop_health': [
        /పంట\s+ఆరోగ్యం/i,
        /పొలం\s+పరిస్థితి/i,
        /పంట\s+ఎలా\s+ఉంది/i
      ],
      'pmfby_eligibility': [
        /పరిహారం\s+దొరుకుతుందా/i,
        /నేను\s+అర్హుడినా/i,
        /బీమా\s+క్లెయిం/i
      ],
      'explain_decision': [
        /నిర్ణయాన్ని\s+వివరించండి/i,
        /ఎందుకు\s+తిరస్కరించారు/i,
        /కారణం\s+చెప్పండి/i
      ],
      'weather_forecast': [
        /వాతావరణ\s+సమాచారం/i,
        /ఈ\s+రోజు\s+వాతావరణం/i,
        /వర్షం\s+వస్తుందా/i
      ]
    }
  };

  /**
   * Process speech input with enhanced accuracy
   */
  async processSpeech(audioInput: string, detectedLanguage: string = 'en'): Promise<ProcessedSpeech> {
    // Step 1: Transcribe speech to text
    const transcription = await this.transcribeWithAccuracy(audioInput, detectedLanguage);
    
    // Step 2: Detect intent and extract parameters
    const intent = await this.detectIntent(transcription.text, detectedLanguage);
    
    // Step 3: Generate structured output
    const structuredOutput = this.generateStructuredOutput(intent, transcription);
    
    // Step 4: Execute if required and generate response
    const executionResponse = intent.requiresExecution ? 
      await this.executeCommand(intent, structuredOutput) : undefined;

    return {
      transcription,
      intent,
      structuredOutput,
      executionResponse
    };
  }

  /**
   * Enhanced transcription with accent and dialect support
   */
  private async transcribeWithAccuracy(audioInput: string, language: string): Promise<TranscriptionResult> {
    // In production, integrate with services like:
    // - Azure Speech Services (supports Indian accents)
    // - Google Speech-to-Text (dialect support)
    // - AWS Transcribe (custom vocabulary)
    
    // For demo, simulate realistic transcription with variations
    const simulatedTranscriptions = {
      'en': [
        "Check my rice field health at coordinates twenty eight point six one three nine",
        "Am I eligible for PMFBY compensation this season",
        "Explain why my cotton crop claim was rejected",
        "What's the weather forecast for next week",
        "Set an alarm for six thirty AM tomorrow",
        "Play some classical music please",
        "Turn off the bedroom lights"
      ],
      'hi': [
        "मेरे धान के खेत की जांच करें आज",
        "क्या मुझे इस साल मुआवजा मिलेगा",
        "मेरा कपास का दावा क्यों खारिज हुआ",
        "अगले हफ्ते का मौसम कैसा रहेगा",
        "कल सुबह छह बजे अलार्म लगाएं",
        "कुछ अच्छा संगीत बजाएं",
        "कमरे की लाइट बंद करें"
      ],
      'te': [
        "నేడు నా వరి పొలం ఆరోగ్యం చూడండి",
        "ఈ సంవత్సరం నాకు పరিహారం దొరుకుతుందా",
        "నా పత్తి క్లెయిం ఎందుకు తిరస్కరించారు",
        "వచ్చే వారం వాతావరణం ఎలా ఉంటుంది",
        "రేపు ఉదయం ఆరు గంటలకు అలారం పెట్టండి",
        "మంచి సంగీతం ప్లే చేయండి",
        "గది లైట్లు ఆపండి"
      ]
    };

    const transcriptions = simulatedTranscriptions[language as keyof typeof simulatedTranscriptions] || simulatedTranscriptions['en'];
    const selectedText = transcriptions[Math.floor(Math.random() * transcriptions.length)];
    
    return {
      text: selectedText,
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      language: language
    };
  }

  /**
   * Advanced intent detection with parameter extraction
   */
  private async detectIntent(text: string, language: string): Promise<CommandIntent> {
    const patterns = this.languagePatterns[language as keyof typeof this.languagePatterns] || this.languagePatterns['en'];
    
    let detectedAction = 'unknown';
    let confidence = 0;
    let parameters: Record<string, any> = {};
    let requiresExecution = false;

    // Check each pattern category
    for (const [action, regexPatterns] of Object.entries(patterns)) {
      for (const pattern of regexPatterns) {
        const match = text.match(pattern);
        if (match) {
          detectedAction = action;
          confidence = 0.9;
          requiresExecution = this.shouldExecuteCommand(action);
          
          // Extract parameters based on action type
          parameters = this.extractParameters(text, action, match);
          break;
        }
      }
      if (detectedAction !== 'unknown') break;
    }

    return {
      action: detectedAction,
      parameters,
      confidence,
      requiresExecution
    };
  }

  /**
   * Extract specific parameters from recognized commands
   */
  private extractParameters(text: string, action: string, match: RegExpMatchArray): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (action) {
      case 'crop_health':
        // Extract coordinates if mentioned
        const coordMatch = text.match(/(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/);
        if (coordMatch) {
          parameters.coordinates = {
            latitude: parseFloat(coordMatch[1]),
            longitude: parseFloat(coordMatch[2])
          };
        }
        
        // Extract crop type
        const cropTypes = ['rice', 'wheat', 'cotton', 'maize', 'sugarcane', 'धान', 'गेहूं', 'कपास', 'వరి', 'గోధుమ', 'పత్తి'];
        const foundCrop = cropTypes.find(crop => text.toLowerCase().includes(crop));
        if (foundCrop) {
          parameters.cropType = foundCrop;
        }
        break;

      case 'set_alarm':
        // Extract time
        const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
          parameters.time = {
            hour: parseInt(timeMatch[1]),
            minute: timeMatch[2] ? parseInt(timeMatch[2]) : 0,
            period: timeMatch[3] || 'am'
          };
        }
        break;

      case 'lights_control':
        // Extract action (on/off)
        const lightAction = text.match(/(on|off)/i);
        if (lightAction) {
          parameters.action = lightAction[1].toLowerCase();
        }
        
        // Extract room/location
        const roomMatch = text.match(/(bedroom|kitchen|living room|bathroom)/i);
        if (roomMatch) {
          parameters.location = roomMatch[1];
        }
        break;

      case 'play_music':
        // Extract genre or artist
        const genreMatch = text.match(/(classical|jazz|rock|pop|bollywood)/i);
        if (genreMatch) {
          parameters.genre = genreMatch[1];
        }
        break;
    }

    return parameters;
  }

  /**
   * Determine if command requires immediate execution
   */
  private shouldExecuteCommand(action: string): boolean {
    const executionRequiredActions = ['set_alarm', 'lights_control', 'play_music'];
    return executionRequiredActions.includes(action);
  }

  /**
   * Generate structured JSON output for backend integration
   */
  private generateStructuredOutput(intent: CommandIntent, transcription: TranscriptionResult): any {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      input: {
        originalText: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence
      },
      command: {
        action: intent.action,
        parameters: intent.parameters,
        confidence: intent.confidence,
        requiresExecution: intent.requiresExecution
      },
      metadata: {
        processingTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        model: 'multilingual-agricultural-v2.1',
        apiVersion: '2024.1'
      }
    };
  }

  /**
   * Execute commands that require immediate action
   */
  private async executeCommand(intent: CommandIntent, structuredOutput: any): Promise<string> {
    const responses = {
      'en': {
        'set_alarm': (params: any) => `Alarm set for ${params.time?.hour || 6}:${(params.time?.minute || 0).toString().padStart(2, '0')} ${params.time?.period || 'AM'}`,
        'lights_control': (params: any) => `${params.location || 'Lights'} turned ${params.action || 'on'}`,
        'play_music': (params: any) => `Playing ${params.genre || 'music'}`
      },
      'hi': {
        'set_alarm': (params: any) => `अलार्म सेट किया गया ${params.time?.hour || 6}:${(params.time?.minute || 0).toString().padStart(2, '0')} ${params.time?.period || 'AM'} के लिए`,
        'lights_control': (params: any) => `${params.location || 'लाइट'} ${params.action === 'off' ? 'बंद' : 'चालू'} की गई`,
        'play_music': (params: any) => `${params.genre || 'संगीत'} चल रहा है`
      },
      'te': {
        'set_alarm': (params: any) => `అలారం సెట్ చేయబడింది ${params.time?.hour || 6}:${(params.time?.minute || 0).toString().padStart(2, '0')} ${params.time?.period || 'AM'} కు`,
        'lights_control': (params: any) => `${params.location || 'లైట్లు'} ${params.action === 'off' ? 'ఆపబడ్డాయి' : 'ఆన్ చేయబడ్డాయి'}`,
        'play_music': (params: any) => `${params.genre || 'సంగీతం'} ప్లే అవుతోంది`
      }
    };

    const language = structuredOutput.input.language;
    const langResponses = responses[language as keyof typeof responses] || responses['en'];
    const responseGenerator = langResponses[intent.action as keyof typeof langResponses];
    
    if (responseGenerator) {
      return responseGenerator(intent.parameters);
    }

    return 'Command executed successfully';
  }

  /**
   * Generate unique session ID for tracking
   */
  private generateSessionId(): string {
    return 'speech_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const speechProcessor = new SpeechProcessor();