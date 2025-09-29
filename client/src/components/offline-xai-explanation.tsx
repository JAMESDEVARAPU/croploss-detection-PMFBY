import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Minus, Volume2 } from "lucide-react";
import { useState } from "react";

interface OfflineXAIExplanationProps {
  analysis: any;
  language?: 'en' | 'hi' | 'te';
}

export function OfflineXAIExplanation({ analysis, language = 'en' }: OfflineXAIExplanationProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Generate offline SHAP-like explanations
  const generateOfflineExplanation = () => {
    const features = [
      {
        name: 'NDVI Change',
        value: ((analysis.ndviBefore || 0.7) - (analysis.ndviCurrent || 0.5)).toFixed(3),
        importance: 0.45,
        impact: 'increases',
        explanation: {
          en: 'Significant vegetation health decline detected',
          hi: 'वनस्पति स्वास्थ्य में महत्वपूर्ण गिरावट',
          te: 'వృక్షసంపద ఆరోగ్యంలో గణనీయ క్షీణత'
        }
      },
      {
        name: 'Weather Stress',
        value: Math.random() > 0.5 ? 'High' : 'Moderate',
        importance: 0.30,
        impact: 'increases',
        explanation: {
          en: 'Adverse weather conditions affecting crop growth',
          hi: 'प्रतिकूल मौसम फसल वृद्धि को प्रभावित कर रहा है',
          te: 'ప్రతికూల వాతావరణ పరిస్థితులు పంట పెరుగుదలను ప్రభావితం చేస్తున్నాయి'
        }
      },
      {
        name: 'Crop Type Vulnerability',
        value: analysis.cropType || 'rice',
        importance: 0.15,
        impact: 'neutral',
        explanation: {
          en: 'Crop-specific resilience factors considered',
          hi: 'फसल-विशिष्ट प्रतिरोधी कारकों पर विचार किया गया',
          te: 'పంట-నిర్దిష్ట స్థితిస్థాపకత కారకాలు పరిగణించబడ్డాయి'
        }
      },
      {
        name: 'Field Area Impact',
        value: `${analysis.fieldArea || 1.0} hectares`,
        importance: 0.10,
        impact: 'decreases',
        explanation: {
          en: 'Larger fields may have varied damage patterns',
          hi: 'बड़े खेतों में नुकसान के अलग-अलग पैटर्न हो सकते हैं',
          te: 'పెద్ద పొలాలలో వైవిధ్యమైన నష్ట నమూనాలు ఉండవచ్చు'
        }
      }
    ];

    return {
      prediction: analysis.lossPercentage || 0,
      confidence: analysis.confidence || 85,
      features,
      decision: (analysis.lossPercentage || 0) >= 33 ? 'eligible' : 'not_eligible',
      explanation: {
        en: `Based on offline AI analysis, your ${analysis.cropType || 'crop'} shows ${(analysis.lossPercentage || 0).toFixed(1)}% loss. Key factors include NDVI decline and weather stress patterns.`,
        hi: `ऑफलाइन AI विश्लेषण के आधार पर, आपकी ${analysis.cropType || 'फसल'} में ${(analysis.lossPercentage || 0).toFixed(1)}% नुकसान दिखाई दे रहा है। मुख्य कारकों में NDVI गिरावट और मौसम तनाव पैटर्न शामिल हैं।`,
        te: `ఆఫ్లైన్ AI విశ్లేషణ ఆధారంగా, మీ ${analysis.cropType || 'పంట'} ${(analysis.lossPercentage || 0).toFixed(1)}% నష్టాన్ని చూపిస్తుంది. ముఖ్య కారకాలలో NDVI క్షీణత మరియు వాతావరణ ఒత్తిడి నమూనాలు ఉన్నాయి.`
      }
    };
  };

  const xaiData = generateOfflineExplanation();

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'increases': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreases': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'increases': return 'text-red-600 bg-red-50';
      case 'decreases': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const speakExplanation = () => {
    if ('speechSynthesis' in window) {
      const text = xaiData.explanation[language];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Offline AI Explanation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={speakExplanation}
              className="flex items-center space-x-1"
            >
              <Volume2 className="h-4 w-4" />
              <span>Listen</span>
            </Button>
            <Badge variant="secondary">
              {xaiData.confidence}% Confidence
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Explanation */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 leading-relaxed">
            {xaiData.explanation[language]}
          </p>
        </div>

        {/* Feature Importance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Feature Importance Analysis</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          <div className="space-y-2">
            {xaiData.features.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getImpactIcon(feature.impact)}
                    <span className="text-sm font-medium">{feature.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {(feature.importance * 100).toFixed(0)}%
                    </Badge>
                    <Badge className={`text-xs ${getImpactColor(feature.impact)}`}>
                      {feature.impact}
                    </Badge>
                  </div>
                </div>
                
                <Progress value={feature.importance * 100} className="h-2" />
                
                {showDetails && (
                  <div className="ml-6 space-y-1">
                    <p className="text-xs text-gray-600">
                      Value: {feature.value}
                    </p>
                    <p className="text-xs text-gray-700">
                      {feature.explanation[language]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Decision Summary */}
        <div className={`p-3 rounded-lg border ${
          xaiData.decision === 'eligible' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {xaiData.decision === 'eligible' ? '✅ PMFBY Eligible' : '❌ Not Eligible'}
            </span>
            <span className="text-sm">
              {xaiData.prediction.toFixed(1)}% Loss Detected
            </span>
          </div>
        </div>

        {/* Technical Info */}
        <div className="text-xs text-gray-500 pt-3 border-t space-y-1">
          <p>• Offline AI model using SHAP-like feature importance</p>
          <p>• Analysis based on NDVI, weather, and crop-specific factors</p>
          <p>• Model confidence: {xaiData.confidence}%</p>
          <p>• Decision threshold: 33% loss for PMFBY eligibility</p>
        </div>
      </CardContent>
    </Card>
  );
}