import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Volume2, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface XAIExplanationProps {
  explanation: {
    success: boolean;
    predictedLoss?: number;
    weatherFactors?: {
      rainfall: number;
      temperature: number;
      humidity: number;
      windSpeed: number;
    };
    featureExplanations?: Array<{
      feature: string;
      value: number;
      importance: number;
      contribution: number;
      impact: 'increases' | 'decreases';
    }>;
    readableExplanation?: string;
    pmfbyEligibility?: {
      eligible: boolean;
      threshold: number;
      explanation: string;
      lossPercentage: number;
    };
    farmerFriendlyExplanation?: string;
    confidence?: number;
  };
  onVoiceExplanation?: () => void;
}

export function XAIExplanation({ explanation, onVoiceExplanation }: XAIExplanationProps) {
  const { t } = useLanguage();

  if (!explanation.success || !explanation.featureExplanations) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            XAI Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Unable to generate explainable AI analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const topFactors = explanation.featureExplanations.slice(0, 5);
  const loss = explanation.predictedLoss || 0;
  const eligible = explanation.pmfbyEligibility?.eligible || false;

  const getFeatureDisplayName = (feature: string) => {
    const names: { [key: string]: string } = {
      'ndvi_before': 'Initial Crop Health',
      'ndvi_current': 'Current Crop Health',
      'rainfall': 'Rainfall Pattern',
      'temperature': 'Temperature',
      'humidity': 'Humidity Levels',
      'wind_speed': 'Wind Conditions',
      'days_since_sowing': 'Crop Maturity'
    };
    return names[feature] || feature;
  };

  const getImpactColor = (impact: string) => {
    return impact === 'increases' ? 'text-red-600' : 'text-green-600';
  };

  const getImpactIcon = (impact: string) => {
    return impact === 'increases' ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-4">
      {/* Main Results Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Explainable AI Analysis
            <Badge variant={eligible ? "default" : "secondary"} className="ml-auto">
              {eligible ? "PMFBY Eligible" : "Not Eligible"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loss Percentage */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Predicted Crop Loss</span>
              <span className="text-sm font-bold">{loss.toFixed(1)}%</span>
            </div>
            <Progress value={loss} className="h-2" />
          </div>

          {/* Confidence */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Model Confidence</span>
              <span className="text-sm font-bold">{((explanation.confidence || 0.85) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(explanation.confidence || 0.85) * 100} className="h-2" />
          </div>

          {/* Voice Explanation Button */}
          <Button 
            onClick={onVoiceExplanation}
            variant="outline"
            className="w-full"
            data-testid="voice-explanation-button"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Listen to Explanation
          </Button>
        </CardContent>
      </Card>

      {/* Feature Importance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Why This Decision?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topFactors.map((factor, index) => {
            const Icon = getImpactIcon(factor.impact);
            return (
              <div key={factor.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-sm">{getFeatureDisplayName(factor.feature)}</p>
                    <p className="text-xs text-gray-600">
                      Value: {factor.value.toFixed(2)} | 
                      Impact: <span className={getImpactColor(factor.impact)}>{factor.impact} loss</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${getImpactColor(factor.impact)}`} />
                  <Badge variant="secondary">
                    {(factor.importance * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Farmer-Friendly Explanation */}
      {explanation.farmerFriendlyExplanation && (
        <Card>
          <CardHeader>
            <CardTitle>Simple Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {explanation.farmerFriendlyExplanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Factors */}
      {explanation.weatherFactors && (
        <Card>
          <CardHeader>
            <CardTitle>Weather Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Rainfall</p>
                <p className="text-lg font-bold">{explanation.weatherFactors.rainfall.toFixed(1)}mm</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600">Temperature</p>
                <p className="text-lg font-bold">{explanation.weatherFactors.temperature.toFixed(1)}°C</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Humidity</p>
                <p className="text-lg font-bold">{explanation.weatherFactors.humidity.toFixed(1)}%</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600">Wind Speed</p>
                <p className="text-lg font-bold">{explanation.weatherFactors.windSpeed.toFixed(1)}km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}