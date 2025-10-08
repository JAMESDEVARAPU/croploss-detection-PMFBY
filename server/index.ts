// server/index.ts
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "./db"; // initialize DB after loading env
import { wakeWordService } from "./services/wakeword-service";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any;

  const originalResJson = res.json;
  res.json = function (body, ...args) {
    capturedJsonResponse = body;
    return originalResJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // REST API only - no static frontend serving needed
  app.get("/", (req, res) => {
    res.json({ 
      message: "Crop Loss Assessment API", 
      version: "1.0.0",
      endpoints: {
        users: "/api/users",
        cropAnalysis: "/api/crop-analysis",
        pmfbyRules: "/api/pmfby-rules",
        offlineAnalysis: "/api/offline-analysis",
        xaiAnalysis: "/api/xai-analysis",
        voiceCommand: "/api/voice-command",
        weather: "/api/weather/:lat/:lng",
        modelInfo: "/api/model/info"
      }
    });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
    log(`Public access: http://0.0.0.0:${port}`);
    log(`Local access: http://localhost:${port}`);
    wakeWordService.start();
  });
})();
