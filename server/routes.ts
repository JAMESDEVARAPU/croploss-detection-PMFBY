import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCropAnalysisSchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import { pmfbyService } from "./services/pmfby-rules";
import { smsService } from "./services/sms-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByMobile(userData.mobile);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid user data" });
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
      const user = await storage.updateUser(req.params.id, { language });
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
      
      // Get or create user
      let user = await storage.getUserByMobile(analysisData.mobile);
      if (!user) {
        user = await storage.createUser({
          mobile: analysisData.mobile,
          language: req.body.language || "en"
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

  const httpServer = createServer(app);
  return httpServer;
}
