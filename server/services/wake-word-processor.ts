import { voiceService } from './voice-service.js';

export interface WakeWordConfig {
  sensitivity: number;
  keywords: string[];
  language: string;
  offlineMode: boolean;
}

export interface WakeWordDetection {
  detected: boolean;
  keyword: string;
  confidence: number;
  timestamp: Date;
  audioLevel: number;
}

export interface WakeWordProcessingResult {
  wakeWordDetected: boolean;
  followUpCommand?: any;
  processingTime: number;
  confidence: number;
}

export class WakeWordProcessor {
  private voiceService: typeof voiceService;
  private isListening: boolean = false;
  private detectionHistory: WakeWordDetection[] = [];

  constructor() {
    this.voiceService = voiceService;
  }

  // Wake word patterns for different languages
  private getWakeWordPatterns(language: string): string[] {
    const patterns = {
      'en': [
        'hey krishirakshak',
        'krishirakshak',
        'hey krishi',
        'krishi rakshak',
        'hey krishi rakshak'
      ],
      'hi': [
        'हे कृषिरक्षक',
        'कृषिरक्षक', 
        'हे कृषि',
        'कृषि रक्षक',
        'हे कृषि रक्षक'
      ],
      'te': [
        'హే కృషిరక్షక',
        'కృషిరక్షక',
        'హే కృషి',
        'కృషి రక్షక',
        'హే కృషి రక్షక'
      ]
    };

    return patterns[language as keyof typeof patterns] || patterns['en'];
  }

  // Process audio input for wake word detection
  async processAudioForWakeWord(
    audioInput: string,
    config: WakeWordConfig
  ): Promise<WakeWordDetection> {
    const startTime = Date.now();
    
    // Normalize input for comparison
    const normalizedInput = audioInput.toLowerCase().trim();
    const wakeWordPatterns = this.getWakeWordPatterns(config.language);
    
    // Check for wake word matches
    let bestMatch = {
      detected: false,
      keyword: '',
      confidence: 0,
      similarity: 0
    };

    for (const pattern of wakeWordPatterns) {
      const similarity = this.calculateSimilarity(normalizedInput, pattern.toLowerCase());
      
      // Adjust confidence based on similarity and sensitivity
      const confidence = similarity * (config.sensitivity / 100);
      
      if (confidence > bestMatch.confidence && confidence > 0.6) { // 60% minimum threshold
        bestMatch = {
          detected: true,
          keyword: pattern,
          confidence: confidence * 100,
          similarity
        };
      }
    }

    // Simulate audio level detection (in real implementation, this would come from audio analysis)
    const audioLevel = this.simulateAudioLevel(normalizedInput);

    const detection: WakeWordDetection = {
      detected: bestMatch.detected,
      keyword: bestMatch.keyword,
      confidence: bestMatch.confidence,
      timestamp: new Date(),
      audioLevel
    };

    // Store detection in history
    this.detectionHistory.push(detection);
    
    // Keep only last 50 detections
    if (this.detectionHistory.length > 50) {
      this.detectionHistory.shift();
    }

    return detection;
  }

  // Process complete wake word interaction (wake word + command)
  async processWakeWordInteraction(
    audioInput: string,
    mobile: string,
    language: string,
    sensitivity: number = 80
  ): Promise<WakeWordProcessingResult> {
    const startTime = Date.now();
    
    const config: WakeWordConfig = {
      sensitivity,
      keywords: this.getWakeWordPatterns(language),
      language,
      offlineMode: true
    };

    try {
      // Step 1: Check for wake word
      const wakeWordDetection = await this.processAudioForWakeWord(audioInput, config);
      
      if (!wakeWordDetection.detected) {
        return {
          wakeWordDetected: false,
          processingTime: Date.now() - startTime,
          confidence: wakeWordDetection.confidence
        };
      }

      // Step 2: Extract command after wake word
      const commandText = this.extractCommandFromInput(audioInput, wakeWordDetection.keyword);
      
      if (!commandText) {
        return {
          wakeWordDetected: true,
          processingTime: Date.now() - startTime,
          confidence: wakeWordDetection.confidence
        };
      }

      // Step 3: Process the follow-up command using parseVoiceCommand
      const parsedCommand = this.voiceService.parseVoiceCommand(commandText);
      const commandResult = {
        ...parsedCommand,
        transcription: commandText,
        mobile,
        language
      };

      return {
        wakeWordDetected: true,
        followUpCommand: commandResult,
        processingTime: Date.now() - startTime,
        confidence: wakeWordDetection.confidence
      };

    } catch (error) {
      console.error('Wake word processing error:', error);
      return {
        wakeWordDetected: false,
        processingTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  // Extract command text after wake word
  private extractCommandFromInput(fullInput: string, wakeWord: string): string {
    const normalizedInput = fullInput.toLowerCase();
    const normalizedWakeWord = wakeWord.toLowerCase();
    
    // Find wake word position
    const wakeWordIndex = normalizedInput.indexOf(normalizedWakeWord);
    
    if (wakeWordIndex === -1) return '';
    
    // Extract text after wake word
    const commandStart = wakeWordIndex + normalizedWakeWord.length;
    const commandText = fullInput.substring(commandStart).trim();
    
    // Remove common filler words
    const fillerWords = ['please', 'can you', 'could you', 'कृपया', 'దయచేసి'];
    let cleanCommand = commandText;
    
    for (const filler of fillerWords) {
      cleanCommand = cleanCommand.replace(new RegExp(`^${filler}\\s+`, 'i'), '');
    }
    
    return cleanCommand.trim();
  }

  // Calculate string similarity using Levenshtein distance
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str2.length][str1.length];
    
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  // Simulate audio level for demonstration
  private simulateAudioLevel(input: string): number {
    // Simulate audio level based on input length and complexity
    const baseLevel = Math.min(100, input.length * 2);
    const variability = Math.random() * 20 - 10; // ±10 variation
    return Math.max(0, Math.min(100, baseLevel + variability));
  }

  // Get wake word detection statistics
  getDetectionStatistics() {
    const recentDetections = this.detectionHistory.filter(
      d => d.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );

    const successfulDetections = recentDetections.filter(d => d.detected);
    
    return {
      totalDetections: this.detectionHistory.length,
      recentDetections: recentDetections.length,
      successfulDetections: successfulDetections.length,
      averageConfidence: successfulDetections.length > 0 
        ? successfulDetections.reduce((sum, d) => sum + d.confidence, 0) / successfulDetections.length 
        : 0,
      lastDetection: this.detectionHistory[this.detectionHistory.length - 1] || null
    };
  }

  // Configure wake word sensitivity
  setSensitivity(sensitivity: number) {
    // Clamp sensitivity between 10-100
    return Math.max(10, Math.min(100, sensitivity));
  }

  // Test wake word patterns
  async testWakeWordPatterns(language: string): Promise<{
    patterns: string[];
    testResults: { pattern: string; confidence: number }[];
  }> {
    const patterns = this.getWakeWordPatterns(language);
    const testResults = [];

    for (const pattern of patterns) {
      const config: WakeWordConfig = {
        sensitivity: 80,
        keywords: [pattern],
        language,
        offlineMode: true
      };

      const detection = await this.processAudioForWakeWord(pattern, config);
      testResults.push({
        pattern,
        confidence: detection.confidence
      });
    }

    return {
      patterns,
      testResults
    };
  }

  // Clear detection history
  clearHistory() {
    this.detectionHistory = [];
  }

  // Get listening status
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Start/stop listening
  setListening(listening: boolean) {
    this.isListening = listening;
  }
}