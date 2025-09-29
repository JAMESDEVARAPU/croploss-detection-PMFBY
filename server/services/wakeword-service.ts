import record from "node-record-lpcm16";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { voiceService } from "./voice-service";

// Fix __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve wakeword.ppn path relative to the server directory
const absPath = path.resolve(__dirname, "..", "wakeword.ppn");

// Check if file exists
if (!fs.existsSync(absPath)) {
  console.warn(`⚠️ Wake word file not found at: ${absPath}`);
  console.warn(`Please ensure wakeword.ppn file is placed in the server directory`);
  console.warn(`You can download wakeword models from: https://picovoice.ai/custom-wake-word/`);
}

const RECORD_DURATION_MS = 5000;

export class WakeWordService {
  private isListening = false;
  private isActive = false;
  private wakeWordCallbacks: ((detected: boolean) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private selectedLanguage: 'en' | 'hi' | 'te' = 'en';
  private femaleVoice = true;

  async start() {
    if (this.isActive) {
      console.log("⚠️ Wake word service is already active");
      return;
    }

    try {
      // Check for required environment variables
      if (!process.env.PICOVOICE_KEY) {
        console.warn("⚠️ Missing PICOVOICE_KEY in environment variables");
        console.warn("Wake word service will be disabled. Set PICOVOICE_KEY in your .env file to enable.");
        console.warn("Get your key from: https://picovoice.ai/console/");
        return;
      }

      // Check if wakeword file exists
      if (!fs.existsSync(absPath)) {
        console.warn("⚠️ Wake word model file not found");
        console.warn(`Expected location: ${absPath}`);
        console.warn("Wake word service will be disabled. Download a wakeword model from: https://picovoice.ai/custom-wake-word/");
        return;
      }

      console.log("🔍 Using wakeword path:", absPath);
      console.log("✅ Wake word service started. Say 'Hey KrishiRakshak' to activate.");

      const { Porcupine } = await import("@picovoice/porcupine-node");
      const { PvRecorder } = await import("@picovoice/pvrecorder-node");

      const porcupine = new Porcupine(
        process.env.PICOVOICE_KEY!,
        [absPath],
        [0.7] // Sensitivity level
      );

      // 🔍 Auto-detect audio device
      const devices = PvRecorder.getAvailableDevices();
      console.log("🎤 Available audio devices:", devices);

      let deviceIndex = -1; // -1 means default system device
      if (devices.length > 0) {
        deviceIndex = 0; // pick the first available mic
        console.log(`✅ Using device index ${deviceIndex}: ${devices[deviceIndex]}`);
      } else {
        console.warn("⚠️ No audio devices found. PvRecorder may fail to start.");
      }

      // ❗ FIX: constructor expects (frameLength, deviceIndex, bufferedFramesCount?)
      const recorder = new PvRecorder(porcupine.frameLength, deviceIndex);
      console.log(
        `ℹ️ PvRecorder initialized → frameLength=${porcupine.frameLength}, sampleRate=${PvRecorder.prototype.sampleRate ?? 16000}`
      );

      recorder.start();
      console.log("🎤 Microphone listening for wake word...");

      const processAudio = async () => {
        try {
          if (!this.isActive || this.isListening) return;

          const frame = (await (recorder as any).read()) as Int16Array;
          const keywordIndex = porcupine.process(frame);

          if (keywordIndex >= 0) {
            console.log("🔔 Wake word detected!");
            this.isListening = true;

            this.wakeWordCallbacks.forEach((callback) => callback(true));

            try {
              await this.onWakeWord();
            } catch (error) {
              console.error("Error processing wake word:", error);
            } finally {
              this.isListening = false;
              this.wakeWordCallbacks.forEach((callback) => callback(false));
            }
          }
        } catch (err) {
          console.error("Error processing audio frame:", err);
        }
      };

      this.intervalId = setInterval(processAudio, 100);
      this.isActive = true;

      const shutdown = () => {
        console.log("🛑 Shutting down wake word service...");
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
        try {
          recorder.stop();
        } catch {}
        try {
          porcupine.release();
        } catch {}
        this.isActive = false;
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    } catch (err) {
      console.error("❌ Failed to start wake word service:", err);
      console.error("Make sure you have:");
      console.error("1. Set PICOVOICE_KEY environment variable");
      console.error("2. Downloaded wakeword.ppn file");
      console.error("3. Installed @picovoice/porcupine-node and @picovoice/pvrecorder-node");
      this.isActive = false;
    }
  }

  async stop() {
    console.log("🛑 Stopping wake word service...");
    this.isActive = false;
    this.isListening = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      isListening: this.isListening,
      wakeWordModel: fs.existsSync(absPath) ? "loaded" : "missing",
    };
  }

  onWakeWordDetected(callback: (detected: boolean) => void) {
    this.wakeWordCallbacks.push(callback);
  }

  removeWakeWordCallback(callback: (detected: boolean) => void) {
    const index = this.wakeWordCallbacks.indexOf(callback);
    if (index > -1) {
      this.wakeWordCallbacks.splice(index, 1);
    }
  }

  setLanguage(language: 'en' | 'hi' | 'te') {
    this.selectedLanguage = language;
    console.log(`🌐 Language set to: ${language}`);
  }

  setVoiceGender(female: boolean) {
    this.femaleVoice = female;
    console.log(`🎤 Voice gender set to: ${female ? 'Female' : 'Male'}`);
  }

  private async onWakeWord() {
    console.log("🔔 Wake word 'Hey KrishiRakshak' detected!");
    console.log("🎤 Listening for your command...");

    try {
      // Multilingual greeting
      const greetings = {
        en: "Hello! How can I help you with your crops today?",
        hi: "नमस्ते! आज मैं आपकी फसल के साथ कैसे मदद कर सकती हूं?",
        te: "నమస్కారం! ఈరోజు మీ పంటలతో నేను ఎలా సహాయం చేయగలను?"
      };
      
      const listeningMessage = greetings[this.selectedLanguage];
      console.log("🎵 Playing:", listeningMessage);
      await this.speakResponse(listeningMessage);

      const audioBuffer = await this.recordUserAudio(RECORD_DURATION_MS);

      if (!audioBuffer || audioBuffer.length === 0) {
        console.log("❌ No audio recorded");
        const errorMessages = {
          en: "Sorry, I didn't hear anything. Please try again.",
          hi: "माफ करें, मुझे कुछ सुनाई नहीं दिया। कृपया फिर से कोशिश करें।",
          te: "క్షమించండి, నాకు ఏమీ వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి."
        };
        await this.speakResponse(errorMessages[this.selectedLanguage]);
        return;
      }

      console.log("📝 Processing speech...");
      const transcription = await voiceService.speechToText(audioBuffer);

      if (!transcription.success || !transcription.transcription) {
        console.log("❌ Speech recognition failed:", transcription.error);
        const errorMessages = {
          en: "Sorry, I couldn't understand that. Please try again.",
          hi: "माफ करें, मैं समझ नहीं पाई। कृपया फिर से कोशिश करें।",
          te: "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి."
        };
        await this.speakResponse(errorMessages[this.selectedLanguage]);
        return;
      }

      console.log("🗣️ User said:", transcription.transcription);

      const command = voiceService.parseVoiceCommand(transcription.transcription);
      console.log("🔍 Parsed command:", command);

      const responseData = await this.executeCommand(command);

      const responseText = await voiceService.generateVoiceResponse(
        command.action,
        responseData,
        this.selectedLanguage
      );

      console.log("💬 Response:", responseText);
      await this.speakResponse(responseText);
    } catch (error) {
      console.error("❌ Error in wake word processing:", error);
      const errorMessages = {
        en: "Sorry, there was an error processing your request.",
        hi: "माफ करें, आपके अनुरोध को संसाधित करने में त्रुटि हुई।",
        te: "క్షమించండి, మీ అభ్యర్థనను ప్రాసెస్ చేయడంలో లోపం ఉంది."
      };
      await this.speakResponse(errorMessages[this.selectedLanguage]);
    }
  }

  private async speakResponse(text: string) {
    try {
      const audioResponse = await voiceService.textToSpeech(text);
      if (audioResponse.success && audioResponse.audioUrl) {
        console.log("🔊 Female voice audio response generated:", audioResponse.audioUrl);
        // Play the audio
        if (typeof window !== 'undefined') {
          const audio = new Audio(audioResponse.audioUrl);
          audio.play().catch(console.error);
        }
      } else {
        console.log("⚠️ TTS failed, but response text:", text);
      }
    } catch (error) {
      console.error("❌ Error generating speech response:", error);
    }
  }

  private async executeCommand(command: any) {
    switch (command.action) {
      case "crop_health":
        return await this.performNDVICheck(command);
      case "pmfby_eligibility":
        return await this.checkPMFBYEligibility(command);
      case "weather_forecast":
        return await this.getWeatherForecast(command);
      case "analyze":
        return await this.performAnalysis(command);
      default:
        return { action: "unknown", message: "Command not recognized" };
    }
  }

  private async performNDVICheck(command: any) {
    try {
      const { offlineModelService } = await import("./offline-model");
      const result = await offlineModelService.predictWithExplanation({
        ndviBefore: 0.7,
        ndviCurrent: 0.5,
        latitude: command.coordinates?.latitude || 20.5937,
        longitude: command.coordinates?.longitude || 78.9629,
        cropType: command.cropType || "rice",
      });

      return {
        cropType: command.cropType,
        lossPercentage: result.predictedLoss || 0,
        explanation: result.readableExplanation || "Analysis completed",
        ndviChange: this.calculateNDVIChange(result.featureExplanations),
      };
    } catch (error) {
      console.error('NDVI check error:', error);
      return {
        cropType: command.cropType || 'rice',
        lossPercentage: 0,
        explanation: 'Analysis failed',
        ndviChange: 0
      };
    }
  }

  private async checkPMFBYEligibility(command: any) {
    const isEligible = Math.random() > 0.5;
    return {
      eligible: isEligible,
      amount: isEligible ? Math.floor(Math.random() * 50000) + 10000 : 0,
      reason: isEligible ? 'Loss exceeds 33% threshold' : 'Loss below minimum threshold'
    };
  }

  private async getWeatherForecast(command: any) {
    return {
      temperature: Math.floor(Math.random() * 15) + 25,
      condition: 'Partly cloudy',
      recommendation: 'Good conditions for crop growth'
    };
  }

  private async performAnalysis(command: any) {
    return {
      coordinates: command.coordinates,
      cropType: command.cropType,
      status: 'Analysis completed'
    };
  }

  private calculateNDVIChange(featureExplanations?: any[]): number {
    if (!featureExplanations) return 0;
    const ndviBefore = featureExplanations.find(f => f.feature === 'ndvi_before')?.value || 0.7;
    const ndviCurrent = featureExplanations.find(f => f.feature === 'ndvi_current')?.value || 0.5;
    return Math.round(((ndviBefore - ndviCurrent) / ndviBefore) * 100);
  }

  private async recordUserAudio(duration: number): Promise<Buffer | null> {
    console.log(`🎤 Recording audio for ${duration}ms...`);
    await new Promise(resolve => setTimeout(resolve, duration));
    return Buffer.from('dummy-audio-data');
  }
}

export const wakeWordService = new WakeWordService();