import type { Express } from "express";

export function addSimpleAnalysisRoute(app: Express) {
  app.post("/api/simple-analysis", async (req, res) => {
    try {
      const { latitude, longitude, cropType, mobile } = req.body;
      
      // Mock analysis result
      const mockResult = {
        success: true,
        analysisId: 'mock-' + Date.now(),
        analysis: {
          id: 'mock-' + Date.now(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          cropType,
          lossPercentage: 25.5,
          ndviBefore: 0.75,
          ndviCurrent: 0.56,
          confidence: 87,
          pmfbyEligible: true,
          compensationAmount: 15000,
          damageCause: 'Drought stress',
          smsStatus: 'completed',
          analysisDate: new Date().toISOString(),
          satelliteImageBefore: 'https://via.placeholder.com/512x512/22c55e/ffffff?text=Before+Image',
          satelliteImageAfter: 'https://via.placeholder.com/512x512/ef4444/ffffff?text=After+Image'
        },
        message: 'Mock analysis completed successfully'
      };
      
      res.json(mockResult);
    } catch (error) {
      console.error('Simple analysis error:', error);
      res.status(500).json({ error: 'Simple analysis failed' });
    }
  });
}