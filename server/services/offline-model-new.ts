import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface OfflineModelInput {
  ndviBefore?: number;
  ndviCurrent?: number;
  latitude: number;
  longitude: number;
  daysSinceSowing?: number;
  cropType?: string;
}

export interface XAIExplanation {
  feature: string;
  value: number;
  importance: number;
  contribution: number;
  impact: 'increases' | 'decreases';
}

export interface OfflineModelResult {
  success: boolean;
  predictedLoss?: number;
  weatherFactors?: {
    rainfall: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  featureExplanations?: XAIExplanation[];
  readableExplanation?: string;
  pmfbyEligibility?: {
    eligible: boolean;
    threshold: number;
    explanation: string;
    lossPercentage: number;
  };
  confidence?: number;
  error?: string;
}

export class OfflineModelService {
  private pythonPath: string;
  private predictorPath: string;
  private trainerPath: string;
  private csvDataPath: string;
  private modelDir: string;
  private isModelTrained = false;

  constructor() {
    this.pythonPath = 'python3';
    this.predictorPath = path.join(process.cwd(), 'server/services/offline-predictor.py');
    this.trainerPath = path.join(process.cwd(), 'server/services/offline-crop-trainer.py');
    this.csvDataPath = path.join(process.cwd(), 'attached_assets/Ranga_Reddy_REAL_Villages_Agricultural_Data_2025.csv');
    this.modelDir = path.join(process.cwd(), 'data/trained_model');
    
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      const modelPath = path.join(this.modelDir, 'crop_loss_model.pkl');
      
      if (!fs.existsSync(modelPath)) {
        console.log('Training new model from CSV data...');
        await this.trainModel();
      } else {
        console.log('Using existing trained model');
        this.isModelTrained = true;
      }
    } catch (error) {
      console.error('Error initializing model:', error);
    }
  }

  private async trainModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.csvDataPath)) {
        reject(new Error(`CSV file not found: ${this.csvDataPath}`));
        return;
      }

      const process = spawn(this.pythonPath, [this.trainerPath, this.csvDataPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Training:', data.toString().trim());
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('Model training completed successfully');
          this.isModelTrained = true;
          resolve();
        } else {
          reject(new Error(`Training failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start training process: ${error.message}`));
      });
    });
  }

  private async predictWithModel(input: OfflineModelInput): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isModelTrained) {
        reject(new Error('Model not trained yet'));
        return;
      }

      const args = [
        this.predictorPath,
        '--model-dir', this.modelDir,
        '--latitude', input.latitude.toString(),
        '--longitude', input.longitude.toString(),
        '--crop', input.cropType || 'Rice',
        '--ndvi', (input.ndviCurrent || 0.5).toString()
      ];

      const process = spawn(this.pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse prediction result: ${error}`));
          }
        } else {
          reject(new Error(`Prediction failed with code ${code}: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start prediction process: ${error.message}`));
      });
    });
  }

  async predictFromCoordinates(input: OfflineModelInput): Promise<OfflineModelResult> {
    try {
      if (!this.isModelTrained) {
        return {
          success: false,
          error: 'Model is still training. Please wait a moment and try again.'
        };
      }

      const prediction = await this.predictWithModel(input);
      
      if (prediction.error) {
        return {
          success: false,
          error: prediction.error
        };
      }

      const predictedLoss = prediction.predicted_loss_percentage;
      const confidence = prediction.confidence;

      const featureExplanations: XAIExplanation[] = Object.entries(prediction.feature_importance || {})
        .slice(0, 5)
        .map(([feature, importance]) => ({
          feature,
          value: prediction.input_features?.[feature] || 0,
          importance: importance as number,
          contribution: (importance as number) * 0.1,
          impact: (importance as number) > 0.1 ? 'increases' : 'decreases'
        }));

      const weatherFactors = {
        rainfall: prediction.input_features?.Rainfall_mm || 10,
        temperature: prediction.input_features?.Avg_Temp || 26,
        humidity: prediction.input_features?.Humidity_Percent || 75,
        windSpeed: prediction.input_features?.Wind_Speed_kmh || 15
      };

      const pmfbyThreshold = this.getPMFBYThreshold(input.cropType || 'rice');
      const pmfbyEligibility = {
        eligible: predictedLoss >= pmfbyThreshold,
        threshold: pmfbyThreshold,
        explanation: predictedLoss >= pmfbyThreshold ? 
          `Crop loss of ${predictedLoss.toFixed(1)}% exceeds PMFBY threshold of ${pmfbyThreshold}%` :
          `Crop loss of ${predictedLoss.toFixed(1)}% is below PMFBY threshold of ${pmfbyThreshold}%`,
        lossPercentage: predictedLoss
      };

      return {
        success: true,
        predictedLoss,
        weatherFactors,
        featureExplanations,
        readableExplanation: `ML model prediction: ${prediction.risk_level} risk (${predictedLoss.toFixed(1)}% loss) for ${input.cropType || 'crop'} at coordinates ${input.latitude}, ${input.longitude}`,
        pmfbyEligibility,
        confidence
      };

    } catch (error) {
      return {
        success: false,
        error: `Error in ML prediction: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getPMFBYThreshold(cropType: string): number {
    const thresholds: Record<string, number> = {
      'rice': 33,
      'wheat': 33,
      'cotton': 33,
      'sugarcane': 20,
      'groundnut': 33,
      'soybean': 33,
      'maize': 33,
      'tomato': 25,
      'onion': 25,
      'safflower': 33,
      'castor': 33,
      'turmeric': 25,
      'default': 33
    };
    
    return thresholds[cropType.toLowerCase()] || thresholds.default;
  }

  isModelReady(): boolean {
    return this.isModelTrained;
  }

  getModelStatus(): { trained: boolean; modelDir: string } {
    return {
      trained: this.isModelTrained,
      modelDir: this.modelDir
    };
  }

  async retrainModel(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Retraining model...');
      await this.trainModel();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}