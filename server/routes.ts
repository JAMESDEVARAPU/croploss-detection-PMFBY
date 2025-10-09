import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCropAnalysisSchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import { pmfbyService } from "./services/pmfby-rules";
import { smsService } from "./services/sms-service";
import { WakeWordProcessor } from "./services/wake-word-processor";

// Helper function to generate satellite image URLs
function generateSatelliteImageUrl(latitude: number, longitude: number, timepoint: 'before' | 'after'): string {
  // Generate deterministic URLs based on coordinates for demo purposes
  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static';
  const zoom = 14;
  const width = 400;
  const height = 400;
  
  // Add some offset for "before" vs "after" to show different images
  const timeOffset = timepoint === 'before' ? 0 : 0.001;
  const adjustedLat = latitude + timeOffset;
  const adjustedLng = longitude + timeOffset;
  
  return `${baseUrl}/${adjustedLng},${adjustedLat},${zoom}/${width}x${height}?access_token=pk.demo`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const { name, mobile, email, farmLocation, preferredLanguage } = req.body;
      
      if (!name || !mobile) {
        return res.status(400).json({ error: "Name and mobile number are required" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByMobile(mobile);
      
      if (existingUser) {
        // Update user information if changed
        const updatedUser = await storage.updateUser(existingUser.id, {
          name,
          email,
          farmLocation,
          preferredLanguage: preferredLanguage || existingUser.preferredLanguage
        });
        return res.json({ success: true, user: updatedUser });
      }

      // Create new user
      const newUser = await storage.createUser({
        name,
        mobile,
        email,
        farmLocation,
        preferredLanguage: preferredLanguage || "en"
      });

      res.json({ success: true, user: newUser });

    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.get("/api/users/:mobile", async (req, res) => {
    try {
      const user = await storage.getUserByMobile(req.params.mobile);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { language } = req.body;
      const user = await storage.updateUser(req.params.id, { preferredLanguage: language });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Crop analysis routes
  app.post("/api/crop-analysis", async (req, res) => {
    try {
      const analysisData = insertCropAnalysisSchema.parse(req.body);
      
      // Get user by mobile
      const user = await storage.getUserByMobile(analysisData.mobile);
      if (!user) {
        return res.status(400).json({ 
          error: "Mobile number not registered", 
          message: `The mobile number ${analysisData.mobile} is not registered. Please register first or check your mobile number.`,
          code: "USER_NOT_FOUND"
        });
      }

      // Create initial analysis record
      const analysis = await storage.createCropAnalysis({
        ...analysisData,
        userId: user.id,
      });

      res.json(analysis);

      // Start background analysis
      performGEEAnalysis(analysis.id);

    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid analysis data" });
    }
  });

  // Wake word detection and processing route
  app.post("/api/wake-word", async (req, res) => {
    try {
      const { audioInput, mobile, language = 'en', sensitivity = 80 } = req.body;
      
      const wakeWordProcessor = new WakeWordProcessor();
      const result = await wakeWordProcessor.processWakeWordInteraction(
        audioInput,
        mobile,
        language,
        sensitivity
      );
      
      res.json({
        success: true,
        ...result
      });
      
    } catch (error) {
      console.error('Wake word processing error:', error);
      res.status(500).json({ 
        success: false,
        error: "Wake word processing failed" 
      });
    }
  });

  // Enhanced voice command route with multilingual support
  app.post("/api/voice-command", async (req, res) => {
    try {
      const { command, mobile, language = 'en' } = req.body;
      
      const { voiceService } = await import("./services/voice-service");
      const parsedCommand = voiceService.parseVoiceCommand(command);
      
      // Process different voice actions
      let responseData: any = {};
      
      switch (parsedCommand.action) {
        case 'crop_health':
          // Simulate crop health analysis
          responseData = {
            action: 'crop_health',
            cropType: parsedCommand.cropType,
            lossPercentage: Math.floor(Math.random() * 60), // 0-60% loss
            coordinates: parsedCommand.coordinates,
            mobile: mobile || '9959321421'
          };
          break;
          
        case 'pmfby_eligibility':
          // Simulate PMFBY eligibility check
          const isEligible = Math.random() > 0.5;
          responseData = {
            action: 'pmfby_eligibility',
            eligible: isEligible,
            amount: isEligible ? Math.floor(Math.random() * 50000) + 10000 : 0,
            reason: isEligible ? 'Loss exceeds 33% threshold' : 'Loss below minimum threshold',
            coordinates: parsedCommand.coordinates
          };
          break;
          
        case 'explain_decision':
          // Generate explanation
          responseData = {
            action: 'explain_decision',
            explanation: 'Analysis based on NDVI satellite data showing vegetation health decline',
            ndviChange: Math.floor(Math.random() * 40) + 20, // 20-60% change
            factors: ['drought stress', 'heat damage', 'pest infestation']
          };
          break;
          
        case 'weather_forecast':
          // Get weather data with agricultural recommendations
          const { weatherService } = await import("./services/weather-service");
          const weatherForecast = await weatherService.getWeatherForecast(
            parsedCommand.coordinates?.latitude || 20.5937,
            parsedCommand.coordinates?.longitude || 78.9629,
            language
          );
          const recommendations = weatherService.getAgriculturalRecommendations(
            weatherForecast.current,
            parsedCommand.cropType || 'rice',
            language
          );
          
          responseData = {
            action: 'weather_forecast',
            ...weatherForecast.current,
            recommendation: recommendations,
            alerts: weatherForecast.alerts,
            forecast: weatherForecast.forecast.slice(0, 3) // Next 3 days
          };
          break;
          
        default:
          // Fallback to analyze
          responseData = {
            action: 'analyze',
            coordinates: parsedCommand.coordinates,
            cropType: parsedCommand.cropType,
            mobile: mobile || '9959321421'
          };
      }
      
      // Generate voice response
      const voiceResponse = await voiceService.generateVoiceResponse(
        parsedCommand.action, 
        responseData, 
        language
      );
      
      res.json({ 
        success: true, 
        command: responseData,
        voiceResponse: voiceResponse,
        parsedAction: parsedCommand.action
      });
      
    } catch (error) {
      res.status(500).json({ error: "Voice command processing failed" });
    }
  });

  // User profile login route
  app.post("/api/login", async (req, res) => {
    try {
      const { mobile, name } = req.body;
      
      // Get or create user
      let user = await storage.getUserByMobile(mobile);
      if (!user) {
        user = await storage.createUser({
          name: name || mobile,
          mobile,
          preferredLanguage: "en"
        });
      }
      
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Offline capability check
  app.get("/api/offline-status", async (req, res) => {
    try {
      const offlineModelService = (await import("./services/offline-model")).offlineModelService;
      const isOfflineCapable = await offlineModelService.checkOfflineCapability();
      const modelInfo = await offlineModelService.getModelInfo();
      
      res.json({
        offlineCapable: isOfflineCapable,
        features: modelInfo.features,
        modelVersion: modelInfo.version,
        supportedCrops: modelInfo.supportedCrops
      });
    } catch (error) {
      res.json({
        offlineCapable: true, // Default to true for farmer usability
        features: ['Basic crop loss analysis', 'PMFBY eligibility checking'],
        modelVersion: '1.0.0',
        supportedCrops: ['rice', 'wheat', 'cotton', 'sugarcane', 'maize']
      });
    }
  });

  app.get("/api/crop-analysis/:id", async (req, res) => {
    try {
      const analysis = await storage.getCropAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.get("/api/crop-analysis/user/:userId", async (req, res) => {
    try {
      const analyses = await storage.getCropAnalysesByUser(req.params.userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user analyses" });
    }
  });

  // PMFBY rules
  app.get("/api/pmfby-rules", async (req, res) => {
    try {
      const rules = await storage.getAllPMFBYRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PMFBY rules" });
    }
  });

  // Offline analysis route for farmers without internet
  app.post("/api/offline-analysis", async (req, res) => {
    try {
      const { latitude, longitude, cropType, fieldArea, mobile, language = 'en' } = req.body;
      
      if (!latitude || !longitude || !cropType || !mobile) {
        return res.status(400).json({ error: "Missing required fields for offline analysis" });
      }

      // Get or create user
      let user = await storage.getUserByMobile(mobile);
      if (!user) {
        return res.status(400).json({ 
          error: "Mobile number not registered", 
          message: `The mobile number ${mobile} is not registered. Please register first or check your mobile number.`,
          code: "USER_NOT_FOUND"
        });
      }

      // Use offline model service for coordinate-based analysis
      const { offlineModelService } = await import("./services/offline-model");
      const offlineResult = await offlineModelService.predictFromCoordinates({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cropType
      });

      if (offlineResult.success) {
        // Get NDVI values from the offline result
        const ndviBefore = offlineResult.featureExplanations?.find(f => f.feature === 'ndvi_before')?.value || 0.7;
        const ndviCurrent = offlineResult.featureExplanations?.find(f => f.feature === 'ndvi_current')?.value || 0.5;
        
        // Create analysis record
        const analysis = await storage.createCropAnalysis({
          userId: user.id,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          fieldArea: fieldArea ? parseFloat(fieldArea) : 1.0,
          cropType,
          lossPercentage: offlineResult.predictedLoss || 0,
          ndviBefore: ndviBefore,
          ndviCurrent: ndviCurrent,
          confidence: offlineResult.confidence,
          pmfbyEligible: offlineResult.pmfbyEligibility?.eligible || false,
          compensationAmount: offlineResult.pmfbyEligibility?.eligible ? 
            calculateCompensation(offlineResult.predictedLoss || 0, fieldArea || 1.0, cropType) : 0,
          damageCause: (offlineResult.predictedLoss || 0) > 30 ? "Environmental stress" : "Minor stress",
          smsStatus: "completed",
          satelliteImageBefore: generateSatelliteImageUrl(parseFloat(latitude), parseFloat(longitude), 'before'),
          satelliteImageAfter: generateSatelliteImageUrl(parseFloat(latitude), parseFloat(longitude), 'after')
        });

        // Generate farmer-friendly explanation
        const explanation = offlineModelService.generateFarmerFriendlyExplanation(
          offlineResult, 
          language as 'en' | 'hi' | 'te'
        );

        res.json({
          success: true,
          analysisId: analysis.id,
          analysis: analysis,
          explanation: explanation,
          offlineMode: true,
          message: "Offline analysis completed successfully"
        });
      } else {
        res.status(500).json({ 
          error: "Offline analysis failed", 
          details: offlineResult.error 
        });
      }

    } catch (error) {
      console.error('Offline analysis error:', error);
      res.status(500).json({ error: "Offline analysis failed" });
    }
  });

  // Helper function to calculate compensation
  function calculateCompensation(lossPercentage: number, fieldArea: number, cropType: string): number {
    const baseRates = {
      'rice': 50000,
      'wheat': 45000, 
      'cotton': 60000,
      'sugarcane': 80000,
      'maize': 40000
    };
    
    const baseRate = baseRates[cropType as keyof typeof baseRates] || 50000;
    return Math.round((lossPercentage / 100) * fieldArea * baseRate);
  }

  // Helper function to try offline analysis
  async function tryOfflineAnalysis(analysis: any) {
    try {
      const { offlineModelService } = await import("./services/offline-model");
      
      // Simulate NDVI values if not provided
      const ndviBefore = 0.7; // Healthy crop baseline
      const ndviCurrent = Math.max(0.1, 0.7 - (Math.random() * 0.4)); // Simulate some loss
      
      const result = await offlineModelService.predictWithExplanation({
        ndviBefore,
        ndviCurrent, 
        latitude: analysis.latitude,
        longitude: analysis.longitude,
        cropType: analysis.cropType
      });
      
      return result.success ? result : null;
    } catch (error) {
      console.log('Offline analysis not available:', error);
      return null;
    }
  }

  // Background analysis function
  async function performGEEAnalysis(analysisId: string) {
    try {
      const analysis = await storage.getCropAnalysis(analysisId);
      if (!analysis) return;

      // Call Python GEE script
      const pythonScript = path.join(process.cwd(), "server", "services", "gee-analysis.py");
      const pythonProcess = spawn("python3", [
        pythonScript,
        analysis.latitude.toString(),
        analysis.longitude.toString(),
        analysis.cropType,
        analysis.fieldArea.toString(),
      ]);

      let result = "";
      let errorOutput = "";
      
      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        try {
          console.log(`Python script exit code: ${code}`);
          console.log(`Python stdout: ${result}`);
          console.log(`Python stderr: ${errorOutput}`);
          
          // Try to parse result even if exit code is not 0, as long as we have valid JSON
          if (!result.trim()) {
            throw new Error(`No output from Python script. Exit code: ${code}, Error: ${errorOutput}`);
          }

          const geeResult = JSON.parse(result);
          
          if (!geeResult.success) {
            await storage.updateCropAnalysis(analysisId, {
              smsStatus: "failed",
            });
            return;
          }

          // Update analysis with GEE results
          const updatedAnalysis = await storage.updateCropAnalysis(analysisId, {
            lossPercentage: geeResult.loss_percentage,
            ndviBefore: geeResult.ndvi_before,
            ndviCurrent: geeResult.ndvi_current,
            confidence: geeResult.confidence,
            affectedArea: geeResult.affected_area,
            estimatedValue: geeResult.estimated_value,
            damageCause: geeResult.damage_cause,
            satelliteImages: geeResult.satellite_images,
            acquisitionDates: geeResult.acquisition_dates,
          });

          if (!updatedAnalysis) return;

          // Check PMFBY eligibility
          const eligibility = await pmfbyService.checkEligibility(updatedAnalysis);
          
          await storage.updateCropAnalysis(analysisId, {
            pmfbyEligible: eligibility.eligible,
            compensationAmount: eligibility.compensationAmount,
          });

          // Get user for SMS
          const user = await storage.getUser(updatedAnalysis.userId!);
          if (!user) return;

          // Send SMS notification
          const templateKey = eligibility.eligible ? "eligible" : "notEligible";
          const smsResult = await smsService.sendSMS(
            user.mobile,
            templateKey,
            user.language,
            {
              lossPercentage: Math.round(updatedAnalysis.lossPercentage || 0).toString(),
              amount: eligibility.compensationAmount.toString(),
              reason: eligibility.reason,
            }
          );

          await storage.updateCropAnalysis(analysisId, {
            smsStatus: smsResult.success ? "sent" : "failed",
          });

        } catch (error) {
          console.error("Analysis processing failed:", error);
          await storage.updateCropAnalysis(analysisId, {
            smsStatus: "failed",
          });
        }
      });

    } catch (error) {
      console.error("Failed to start GEE analysis:", error);
      await storage.updateCropAnalysis(analysisId, {
        smsStatus: "failed",
      });
    }
  }

  // District lookup for offline mode
  app.get("/api/district-lookup", async (req, res) => {
    try {
      const { district, mandal } = req.query;
      
      if (!district || !mandal) {
        return res.status(400).json({ error: "District and mandal are required" });
      }

      // Database of district and mandal coordinates for Andhra Pradesh and Telangana
      const locationDatabase: Record<string, Record<string, { latitude: number; longitude: number; }>> = {
        // Andhra Pradesh districts
        'krishna': {
          'gudivada': { latitude: 16.4350, longitude: 80.9956 },
          'machilipatnam': { latitude: 16.1875, longitude: 81.1389 },
          'vijayawada': { latitude: 16.5062, longitude: 80.6480 },
          'nuzvid': { latitude: 16.7889, longitude: 80.8464 }
        },
        'guntur': {
          'guntur': { latitude: 16.3067, longitude: 80.4365 },
          'tenali': { latitude: 16.2428, longitude: 80.6433 },
          'narasaraopet': { latitude: 16.2348, longitude: 80.0490 }
        },
        'east godavari': {
          'kakinada': { latitude: 16.9891, longitude: 82.2475 },
          'rajahmundry': { latitude: 17.0005, longitude: 81.8040 },
          'amalapuram': { latitude: 16.5790, longitude: 82.0070 }
        },
        'west godavari': {
          'eluru': { latitude: 16.7107, longitude: 81.0950 },
          'bhimavaram': { latitude: 16.5449, longitude: 81.5212 },
          'tanuku': { latitude: 16.7549, longitude: 81.6800 }
        },
        // Telangana districts
        'warangal': {
          'warangal': { latitude: 17.9689, longitude: 79.5941 },
          'hanamkonda': { latitude: 18.0145, longitude: 79.5718 }
        },
        'khammam': {
          'khammam': { latitude: 17.2473, longitude: 80.1514 },
          'kothagudem': { latitude: 17.5504, longitude: 80.6189 }
        }
      };

      // Normalize input
      const districtLower = String(district).toLowerCase().trim();
      const mandalLower = String(mandal).toLowerCase().trim();

      // Find coordinates
      const districtData = locationDatabase[districtLower];
      if (districtData && districtData[mandalLower]) {
        res.json(districtData[mandalLower]);
      } else {
        // Return approximate center coordinates for the district if mandal not found
        const approximateCoords: Record<string, { latitude: number; longitude: number; }> = {
          'krishna': { latitude: 16.5062, longitude: 80.6480 },
          'guntur': { latitude: 16.3067, longitude: 80.4365 },
          'east godavari': { latitude: 16.9891, longitude: 82.2475 },
          'west godavari': { latitude: 16.7107, longitude: 81.0950 },
          'warangal': { latitude: 17.9689, longitude: 79.5941 },
          'khammam': { latitude: 17.2473, longitude: 80.1514 }
        };
        
        if (approximateCoords[districtLower]) {
          res.json(approximateCoords[districtLower]);
        } else {
          // Default to Andhra Pradesh center if district not found
          res.json({ latitude: 16.5062, longitude: 80.6480 });
        }
      }
    } catch (error) {
      console.error('District lookup error:', error);
      res.status(500).json({ error: "Failed to lookup district coordinates" });
    }
  });

  // XAI Explanation Routes
  app.post("/api/xai-analysis", async (req, res) => {
    try {
      const { ndviBefore, ndviCurrent, latitude, longitude, daysSinceSowing, cropType, language } = req.body;
      
      if (!ndviBefore || !ndviCurrent || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields for XAI analysis" });
      }

      const { offlineModelService } = await import("./services/offline-model");
      const result = await offlineModelService.predictWithExplanation({
        ndviBefore,
        ndviCurrent,
        latitude,
        longitude,
        daysSinceSowing,
        cropType
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Generate farmer-friendly explanation
      const friendlyExplanation = offlineModelService.generateFarmerFriendlyExplanation(
        result,
        language || 'en'
      );

      res.json({
        ...result,
        farmerFriendlyExplanation: friendlyExplanation
      });

    } catch (error) {
      console.error('XAI Analysis error:', error);
      res.status(500).json({ error: "Failed to generate XAI analysis" });
    }
  });

  // Enhanced Voice Analysis Routes with Speech Processing
  app.post("/api/voice/analyze", async (req, res) => {
    try {
      const { transcription, language } = req.body;
      
      if (!transcription) {
        return res.status(400).json({ error: "Transcription is required" });
      }

      const { voiceService } = await import("./services/voice-service");
      const parsedCommand = voiceService.parseVoiceCommand(transcription);

      res.json({
        success: true,
        parsed: parsedCommand,
        action: parsedCommand.action
      });

    } catch (error) {
      console.error('Voice analysis error:', error);
      res.status(500).json({ error: "Failed to process voice command" });
    }
  });

  // Advanced Speech Processing Route
  app.post("/api/speech/process", async (req, res) => {
    try {
      const { audioInput, language = 'en' } = req.body;
      
      if (!audioInput) {
        return res.status(400).json({ error: "Audio input is required" });
      }

      const { speechProcessor } = await import("./services/speech-processor");
      const processedSpeech = await speechProcessor.processSpeech(audioInput, language);

      res.json({
        success: true,
        ...processedSpeech
      });

    } catch (error) {
      console.error('Speech processing error:', error);
      res.status(500).json({ error: "Failed to process speech input" });
    }
  });

  // Model Info Route
  app.get("/api/model/info", async (req, res) => {
    try {
      const { offlineModelService } = await import("./services/offline-model");
      const modelInfo = await offlineModelService.getModelInfo();
      res.json(modelInfo);
    } catch (error) {
      console.error('Model info error:', error);
      res.status(500).json({ error: "Failed to get model information" });
    }
  });

  // Weather API Route
  app.get("/api/weather/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const { language = 'en', cropType = 'rice' } = req.query;
      
      const { weatherService } = await import("./services/weather-service");
      const weatherForecast = await weatherService.getWeatherForecast(
        parseFloat(lat),
        parseFloat(lng),
        language as string
      );
      const recommendations = weatherService.getAgriculturalRecommendations(
        weatherForecast.current,
        cropType as string,
        language as string
      );

      res.json({
        ...weatherForecast,
        recommendations
      });
    } catch (error) {
      console.error('Weather API error:', error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
