import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

export interface OfflineModelInput {
  ndviBefore: number;
  ndviCurrent: number;
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
  private scriptPath: string;

  constructor() {
    this.pythonPath = 'python3';
    // Use relative path from server directory
    this.scriptPath = path.join(process.cwd(), 'server/services/xai-explainer.py');
  }

  /**
   * Predict crop loss using local ML model with XAI explanations
   */
  async predictWithExplanation(input: OfflineModelInput): Promise<OfflineModelResult> {
    return new Promise((resolve) => {
      const args = [
        this.scriptPath,
        input.ndviBefore.toString(),
        input.ndviCurrent.toString(),
        input.latitude.toString(),
        input.longitude.toString(),
        (input.daysSinceSowing || 60).toString(),
        input.cropType || 'rice'
      ];

      const pythonProcess = spawn(this.pythonPath, args);
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Python process exited with code ${code}: ${stderr}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            resolve({
              success: true,
              predictedLoss: result.xai_prediction.predicted_loss,
              weatherFactors: result.xai_prediction.weather_factors,
              featureExplanations: result.xai_prediction.feature_explanations,
              readableExplanation: result.explanation_summary,
              pmfbyEligibility: result.pmfby_eligibility,
              confidence: result.xai_prediction.confidence
            });
          } else {
            resolve({
              success: false,
              error: result.error
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${parseError.message}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`
        });
      });
    });
  }

  /**
   * Check if the model can work offline (no internet required)
   */
  async checkOfflineCapability(): Promise<boolean> {
    try {
      const testInput: OfflineModelInput = {
        ndviBefore: 0.7,
        ndviCurrent: 0.5,
        latitude: 28.6,
        longitude: 77.2
      };
      
      const result = await this.predictWithExplanation(testInput);
      return result.success;
    } catch (error) {
      console.error('Offline capability check failed:', error);
      return false;
    }
  }

  /**
   * Get model status and capabilities
   */
  async getModelInfo(): Promise<{
    available: boolean;
    offlineCapable: boolean;
    features: string[];
    supportedCrops: string[];
    version: string;
  }> {
    const offlineCapable = await this.checkOfflineCapability();
    
    return {
      available: true,
      offlineCapable,
      features: [
        'NDVI-based crop health assessment',
        'Weather pattern integration', 
        'XAI explanations with SHAP values',
        'Multi-language support',
        'PMFBY eligibility checking',
        'Offline prediction capability'
      ],
      supportedCrops: ['rice', 'wheat', 'cotton', 'sugarcane', 'maize'],
      version: '1.0.0'
    };
  }

  /**
   * Generate simplified explanation for farmers
   */
  generateFarmerFriendlyExplanation(
    result: OfflineModelResult, 
    language: 'en' | 'hi' | 'te' = 'en'
  ): string {
    if (!result.success || !result.featureExplanations) {
      return language === 'hi' ? 'विश्लेषण में त्रुटि' : 
             language === 'te' ? 'విశ్లేషణలో లోపం' : 
             'Analysis error';
    }

    const loss = result.predictedLoss || 0;
    const eligible = result.pmfbyEligibility?.eligible || false;
    
    const explanations = {
      en: {
        lowLoss: `Good news! Your crop loss is only ${loss.toFixed(1)}%. Your crops are in good condition.`,
        moderateLoss: `Your crop shows ${loss.toFixed(1)}% loss due to stress conditions.`,
        highLoss: `Alert: Your crop has ${loss.toFixed(1)}% loss, indicating serious damage.`,
        eligible: 'You are eligible for PMFBY compensation.',
        notEligible: 'Unfortunately, you are not eligible for PMFBY compensation as loss is below the threshold.',
        mainFactors: 'Main factors affecting your crop:'
      },
      hi: {
        lowLoss: `खुशखबरी! आपकी फसल की हानि केवल ${loss.toFixed(1)}% है। आपकी फसल अच्छी स्थिति में है।`,
        moderateLoss: `तनाव की स्थिति के कारण आपकी फसल में ${loss.toFixed(1)}% हानि है।`,
        highLoss: `चेतावनी: आपकी फसल में ${loss.toFixed(1)}% हानि है, जो गंभीर नुकसान दर्शाता है।`,
        eligible: 'आप PMFBY मुआवजे के लिए पात्र हैं।',
        notEligible: 'दुर्भाग्य से, आप PMFBY मुआवजे के लिए पात्र नहीं हैं क्योंकि हानि सीमा से कम है।',
        mainFactors: 'आपकी फसल को प्रभावित करने वाले मुख्य कारक:'
      },
      te: {
        lowLoss: `శుభవార్త! మీ పంట నష్టం కేవలం ${loss.toFixed(1)}% మాత్రమే. మీ పంటలు మంచి స్థితిలో ఉన్నాయి.`,
        moderateLoss: `ఒత్తిడి పరిస్థితుల కారణంగా మీ పంటలో ${loss.toFixed(1)}% నష్టం ఉంది.`,
        highLoss: `హెచ్చరిక: మీ పంటలో ${loss.toFixed(1)}% నష్టం ఉంది, ఇది తీవ్ర నష్టాన్ని సూచిస్తుంది.`,
        eligible: 'మీరు PMFBY పరిహారానికి అర్హులు.',
        notEligible: 'దురదృష్టవశాత్తు, నష్టం థ్రెషోల్డ్ కంటే తక్కువగా ఉన్నందున మీరు PMFBY పరిహారానికి అర్హులు కాదు.',
        mainFactors: 'మీ పంటను ప్రభావితం చేసిన ప్రధాన కారకాలు:'
      }
    };

    const msgs = explanations[language];
    let explanation = '';

    if (loss < 15) {
      explanation += msgs.lowLoss;
    } else if (loss < 35) {
      explanation += msgs.moderateLoss;
    } else {
      explanation += msgs.highLoss;
    }

    explanation += '\n\n';
    explanation += eligible ? msgs.eligible : msgs.notEligible;

    // Add top contributing factors
    if (result.featureExplanations && result.featureExplanations.length > 0) {
      explanation += '\n\n' + msgs.mainFactors;
      const topFactors = result.featureExplanations.slice(0, 3);
      
      topFactors.forEach((factor, index) => {
        const featureName = this.translateFeatureName(factor.feature, language);
        explanation += `\n${index + 1}. ${featureName}`;
      });
    }

    return explanation;
  }

  private translateFeatureName(feature: string, language: 'en' | 'hi' | 'te'): string {
    const translations = {
      en: {
        'ndvi_before': 'Initial crop health',
        'ndvi_current': 'Current crop health', 
        'rainfall': 'Rainfall pattern',
        'temperature': 'Temperature conditions',
        'humidity': 'Humidity levels',
        'wind_speed': 'Wind conditions',
        'days_since_sowing': 'Crop maturity stage'
      },
      hi: {
        'ndvi_before': 'प्रारंभिक फसल स्वास्थ्य',
        'ndvi_current': 'वर्तमान फसल स्वास्थ्य',
        'rainfall': 'बारिश का पैटर्न',
        'temperature': 'तापमान की स्थिति',
        'humidity': 'नमी का स्तर',
        'wind_speed': 'हवा की स्थिति',
        'days_since_sowing': 'फसल की परिपक्वता अवस्था'
      },
      te: {
        'ndvi_before': 'ప్రారంభ పంట ఆరోగ్యం',
        'ndvi_current': 'ప్రస్తుత పంట ఆరోగ్యం',
        'rainfall': 'వర్షపాతం నమూనా',
        'temperature': 'ఉష్ణోగ్రత పరిస్థితులు',
        'humidity': 'తేమ స్థాయిలు',
        'wind_speed': 'గాలి పరిస్థితులు',
        'days_since_sowing': 'పంట పరిపక్వత దశ'
      }
    };

    return translations[language][feature as keyof typeof translations.en] || feature;
  }
}

export const offlineModelService = new OfflineModelService();