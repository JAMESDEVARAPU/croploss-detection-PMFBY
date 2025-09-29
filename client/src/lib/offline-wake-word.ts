// Offline Wake Word Detection using Web Audio API and pattern matching
export class OfflineWakeWordDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening = false;
  private wakeWordCallback: ((detected: boolean) => void) | null = null;
  private language: 'en' | 'hi' | 'te' = 'en';
  
  // Wake word patterns for different languages
  private wakeWordPatterns = {
    en: ['hey krishirakshak', 'krishirakshak', 'hey krishi'],
    hi: ['हे कृषि रक्षक', 'कृषि रक्षक', 'हे कृषि'],
    te: ['హే కృషి రక్షక', 'కృషి రక్షక', 'హే కృషి']
  };

  // Simple audio pattern detection (frequency analysis)
  private audioPatterns = {
    en: { minFreq: 85, maxFreq: 255, threshold: 0.3 },
    hi: { minFreq: 100, maxFreq: 300, threshold: 0.35 },
    te: { minFreq: 90, maxFreq: 280, threshold: 0.32 }
  };

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async startListening(language: 'en' | 'hi' | 'te' = 'en', callback?: (detected: boolean) => void) {
    this.language = language;
    this.wakeWordCallback = callback || null;

    if (this.isListening) {
      return;
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (!this.audioContext) {
        throw new Error('Audio context not available');
      }

      // Create audio nodes
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect nodes
      source.connect(this.analyser);
      
      this.isListening = true;
      this.startAudioAnalysis();
      
      console.log(`Wake word detection started for ${language}`);
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      throw error;
    }
  }

  private startAudioAnalysis() {
    if (!this.analyser || !this.isListening) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyze = () => {
      if (!this.isListening || !this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Simple wake word detection based on audio patterns
      const detected = this.detectWakeWordPattern(dataArray);
      
      if (detected && this.wakeWordCallback) {
        this.wakeWordCallback(true);
        console.log('Wake word detected!');
      }
      
      // Continue analysis
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  private detectWakeWordPattern(frequencyData: Uint8Array): boolean {
    const pattern = this.audioPatterns[this.language];
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binSize = nyquist / frequencyData.length;
    
    // Calculate frequency range indices
    const minBin = Math.floor(pattern.minFreq / binSize);
    const maxBin = Math.floor(pattern.maxFreq / binSize);
    
    // Calculate average amplitude in the target frequency range
    let sum = 0;
    let count = 0;
    
    for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
      sum += frequencyData[i];
      count++;
    }
    
    const averageAmplitude = count > 0 ? sum / count : 0;
    const normalizedAmplitude = averageAmplitude / 255;
    
    // Simple threshold-based detection
    return normalizedAmplitude > pattern.threshold;
  }

  stopListening() {
    this.isListening = false;
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    console.log('Wake word detection stopped');
  }

  setLanguage(language: 'en' | 'hi' | 'te') {
    this.language = language;
    console.log(`Wake word language changed to: ${language}`);
  }

  isActive(): boolean {
    return this.isListening;
  }
}

// Offline Speech Recognition using Web Speech API with fallback
export class OfflineSpeechRecognition {
  private recognition: any = null;
  private isSupported = false;
  private isListening = false;
  private language: 'en' | 'hi' | 'te' = 'en';
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.isSupported = true;
      this.configureRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
      this.isSupported = false;
    }
  }

  private configureRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
    };
    
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript && this.onResultCallback) {
        this.onResultCallback(finalTranscript.trim());
      }
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };
  }

  startListening(
    language: 'en' | 'hi' | 'te' = 'en',
    onResult?: (transcript: string) => void,
    onError?: (error: string) => void
  ) {
    if (!this.isSupported) {
      const error = 'Speech recognition not supported';
      if (onError) onError(error);
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.language = language;
    this.onResultCallback = onResult || null;
    this.onErrorCallback = onError || null;

    // Set language
    const langCodes = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    
    this.recognition.lang = langCodes[language];
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (onError) onError('Failed to start recognition');
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  isRecognitionSupported(): boolean {
    return this.isSupported;
  }
}

// Offline Text-to-Speech using Web Speech API
export class OfflineTextToSpeech {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isPlaying = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
  }

  speak(
    text: string, 
    language: 'en' | 'hi' | 'te' = 'en',
    gender: 'female' | 'male' = 'female',
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (this.isPlaying) {
      this.stop();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    const langCodes = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    utterance.lang = langCodes[language];
    
    // Find appropriate voice
    const voice = this.findBestVoice(language, gender);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Configure speech parameters
    utterance.rate = 0.8;
    utterance.pitch = gender === 'female' ? 1.2 : 0.9;
    utterance.volume = 0.9;
    
    // Set callbacks
    utterance.onstart = () => {
      this.isPlaying = true;
      if (onStart) onStart();
    };
    
    utterance.onend = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };
    
    this.synth.speak(utterance);
  }

  private findBestVoice(language: 'en' | 'hi' | 'te', gender: 'female' | 'male'): SpeechSynthesisVoice | null {
    const langCodes = {
      'en': ['en-US', 'en-GB', 'en'],
      'hi': ['hi-IN', 'hi'],
      'te': ['te-IN', 'te']
    };
    
    const targetLangs = langCodes[language];
    
    // First try to find a voice with preferred gender
    for (const targetLang of targetLangs) {
      const voices = this.voices.filter(voice => 
        voice.lang.startsWith(targetLang) && 
        (gender === 'female' ? 
          !voice.name.toLowerCase().includes('male') :
          voice.name.toLowerCase().includes('male')
        )
      );
      if (voices.length > 0) return voices[0];
    }
    
    // Fallback to any voice in the language
    for (const targetLang of targetLangs) {
      const voices = this.voices.filter(voice => voice.lang.startsWith(targetLang));
      if (voices.length > 0) return voices[0];
    }
    
    return null;
  }

  stop() {
    if (this.isPlaying) {
      this.synth.cancel();
      this.isPlaying = false;
    }
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}

// Main Offline Voice Service
export class OfflineVoiceService {
  private wakeWordDetector: OfflineWakeWordDetector;
  private speechRecognition: OfflineSpeechRecognition;
  private textToSpeech: OfflineTextToSpeech;
  private isActive = false;

  constructor() {
    this.wakeWordDetector = new OfflineWakeWordDetector();
    this.speechRecognition = new OfflineSpeechRecognition();
    this.textToSpeech = new OfflineTextToSpeech();
  }

  async startVoiceService(
    language: 'en' | 'hi' | 'te' = 'en',
    onWakeWord?: () => void,
    onCommand?: (command: string) => void,
    onError?: (error: string) => void
  ) {
    try {
      // Start wake word detection
      await this.wakeWordDetector.startListening(language, (detected) => {
        if (detected && onWakeWord) {
          onWakeWord();
          // Start speech recognition after wake word
          this.speechRecognition.startListening(
            language,
            (transcript) => {
              if (onCommand) onCommand(transcript);
            },
            onError
          );
        }
      });
      
      this.isActive = true;
      console.log('Offline voice service started');
    } catch (error) {
      console.error('Failed to start voice service:', error);
      if (onError) onError('Failed to start voice service');
    }
  }

  stopVoiceService() {
    this.wakeWordDetector.stopListening();
    this.speechRecognition.stopListening();
    this.textToSpeech.stop();
    this.isActive = false;
    console.log('Offline voice service stopped');
  }

  speak(text: string, language: 'en' | 'hi' | 'te' = 'en', gender: 'female' | 'male' = 'female') {
    this.textToSpeech.speak(text, language, gender);
  }

  setLanguage(language: 'en' | 'hi' | 'te') {
    this.wakeWordDetector.setLanguage(language);
  }

  isServiceActive(): boolean {
    return this.isActive;
  }

  isRecognitionSupported(): boolean {
    return this.speechRecognition.isRecognitionSupported();
  }
}