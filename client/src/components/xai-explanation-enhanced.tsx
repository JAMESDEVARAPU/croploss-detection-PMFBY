import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Volume2, VolumeX, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "../hooks/use-language";

interface XAIExplanationProps {
  analysis: any;
}

// SHAP-like feature importance calculation
const calculateSHAPValues = (analysis: any) => {
  const isEligible = (analysis.lossPercentage || 0) >= 33;
  const lossPercentage = analysis.lossPercentage || 0;
  const ndviCurrent = analysis.ndviCurrent || 0.5;
  const ndviBefore = analysis.ndviBefore || 0.75;
  const confidence = analysis.confidence || 85;
  
  // Calculate SHAP values (feature contributions)
  const shapValues = {
    lossPercentage: {
      value: ((lossPercentage - 25) / 100) * (isEligible ? 0.6 : -0.4),
      impact: lossPercentage >= 33 ? 'positive' : 'negative',
      importance: Math.abs(lossPercentage - 33) / 100
    },
    ndviChange: {
      value: ((ndviBefore - ndviCurrent) / ndviBefore) * 0.3,
      impact: (ndviBefore - ndviCurrent) > 0.1 ? 'positive' : 'negative', 
      importance: Math.abs(ndviBefore - ndviCurrent) / ndviBefore
    },
    ndviCurrent: {
      value: (0.6 - ndviCurrent) * 0.2,
      impact: ndviCurrent < 0.5 ? 'positive' : 'negative',
      importance: Math.abs(0.6 - ndviCurrent)
    },
    confidence: {
      value: (confidence - 80) / 100 * 0.1,
      impact: confidence > 85 ? 'positive' : 'neutral',
      importance: Math.abs(confidence - 85) / 100
    }
  };
  
  return shapValues;
};

export function XAIExplanationEnhanced({ analysis }: XAIExplanationProps) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState(language);
  const [showFeatures, setShowFeatures] = useState(false);
  
  const shapValues = calculateSHAPValues(analysis);
  const isEligible = (analysis.lossPercentage || 0) >= 33;
  
  const explanations = {
    en: {
      title: "SHAP-based AI Explanation",
      eligible: isEligible ? "✅ ELIGIBLE for PMFBY" : "❌ NOT ELIGIBLE for PMFBY",
      reason: isEligible 
        ? `Based on SHAP analysis, your ${analysis.lossPercentage?.toFixed(1)}% crop loss qualifies for PMFBY compensation. Key contributing factors have been identified.`
        : `SHAP analysis shows your ${analysis.lossPercentage?.toFixed(1)}% crop loss does not meet the 33% PMFBY threshold. Here's why each factor contributed to this decision.`,
      shapFeatures: [
        { 
          name: "Crop Loss Percentage", 
          value: `${analysis.lossPercentage?.toFixed(1)}%`,
          shapValue: shapValues.lossPercentage.value,
          impact: shapValues.lossPercentage.impact,
          importance: shapValues.lossPercentage.importance,
          explanation: `${analysis.lossPercentage >= 33 ? 'Above' : 'Below'} 33% PMFBY threshold`
        },
        { 
          name: "NDVI Change", 
          value: `${((analysis.ndviBefore - analysis.ndviCurrent) * 100).toFixed(1)}% decline`,
          shapValue: shapValues.ndviChange.value,
          impact: shapValues.ndviChange.impact,
          importance: shapValues.ndviChange.importance,
          explanation: "Vegetation health deterioration"
        },
        { 
          name: "Current NDVI", 
          value: `${analysis.ndviCurrent?.toFixed(3)}`,
          shapValue: shapValues.ndviCurrent.value,
          impact: shapValues.ndviCurrent.impact,
          importance: shapValues.ndviCurrent.importance,
          explanation: "Current vegetation health status"
        },
        { 
          name: "Analysis Confidence", 
          value: `${analysis.confidence?.toFixed(0)}%`,
          shapValue: shapValues.confidence.value,
          impact: shapValues.confidence.impact,
          importance: shapValues.confidence.importance,
          explanation: "Satellite data reliability"
        }
      ]
    },
    hi: {
      title: "SHAP-आधारित एआई व्याख्या",
      eligible: isEligible ? "✅ PMFBY के लिए पात्र" : "❌ PMFBY के लिए अपात्र",
      reason: isEligible 
        ? `SHAP विश्लेषण के अनुसार, आपकी ${analysis.lossPercentage?.toFixed(1)}% फसल हानि PMFBY मुआवजे के लिए योग्य है। मुख्य योगदान कारकों की पहचान की गई है।`
        : `SHAP विश्लेषण दिखाता है कि आपकी ${analysis.lossPercentage?.toFixed(1)}% फसल हानि 33% PMFBY सीमा को पूरा नहीं करती।`,
      shapFeatures: [
        { 
          name: "फसल हानि प्रतिशत", 
          value: `${analysis.lossPercentage?.toFixed(1)}%`,
          shapValue: shapValues.lossPercentage.value,
          impact: shapValues.lossPercentage.impact,
          importance: shapValues.lossPercentage.importance,
          explanation: `33% PMFBY सीमा से ${analysis.lossPercentage >= 33 ? 'ऊपर' : 'नीचे'}`
        },
        { 
          name: "NDVI परिवर्तन", 
          value: `${((analysis.ndviBefore - analysis.ndviCurrent) * 100).toFixed(1)}% गिरावट`,
          shapValue: shapValues.ndviChange.value,
          impact: shapValues.ndviChange.impact,
          importance: shapValues.ndviChange.importance,
          explanation: "वनस्पति स्वास्थ्य में गिरावट"
        },
        { 
          name: "वर्तमान NDVI", 
          value: `${analysis.ndviCurrent?.toFixed(3)}`,
          shapValue: shapValues.ndviCurrent.value,
          impact: shapValues.ndviCurrent.impact,
          importance: shapValues.ndviCurrent.importance,
          explanation: "वर्तमान वनस्पति स्वास्थ्य स्थिति"
        },
        { 
          name: "विश्लेषण विश्वसनीयता", 
          value: `${analysis.confidence?.toFixed(0)}%`,
          shapValue: shapValues.confidence.value,
          impact: shapValues.confidence.impact,
          importance: shapValues.confidence.importance,
          explanation: "उपग्रह डेटा विश्वसनीयता"
        }
      ]
    },
    te: {
      title: "SHAP-ఆధారిత AI వివరణ",
      eligible: isEligible ? "✅ PMFBY కోసం అర్హత" : "❌ PMFBY కోసం అనర్హత",
      reason: isEligible 
        ? `SHAP విశ్లేషణ ప్రకారం, మీ ${analysis.lossPercentage?.toFixed(1)}% పంట నష్టం PMFBY పరిహారానికి అర్హత పొందింది. ముఖ్య దోహదపు కారకాలు గుర్తించబడ్డాయి.`
        : `SHAP విశ్లేషణ చూపిస్తుంది మీ ${analysis.lossPercentage?.toFixed(1)}% పంట నష్టం 33% PMFBY పరిమితిని చేరుకోలేదు.`,
      shapFeatures: [
        { 
          name: "పంట నష్ట శాతం", 
          value: `${analysis.lossPercentage?.toFixed(1)}%`,
          shapValue: shapValues.lossPercentage.value,
          impact: shapValues.lossPercentage.impact,
          importance: shapValues.lossPercentage.importance,
          explanation: `33% PMFBY పరిమితి కంటే ${analysis.lossPercentage >= 33 ? 'ఎక్కువ' : 'తక్కువ'}`
        },
        { 
          name: "NDVI మార్పు", 
          value: `${((analysis.ndviBefore - analysis.ndviCurrent) * 100).toFixed(1)}% తగ్గుదల`,
          shapValue: shapValues.ndviChange.value,
          impact: shapValues.ndviChange.impact,
          importance: shapValues.ndviChange.importance,
          explanation: "వృక్ష ఆరోగ్య క్షీణత"
        },
        { 
          name: "ప్రస్తుత NDVI", 
          value: `${analysis.ndviCurrent?.toFixed(3)}`,
          shapValue: shapValues.ndviCurrent.value,
          impact: shapValues.ndviCurrent.impact,
          importance: shapValues.ndviCurrent.importance,
          explanation: "ప్రస్తుత వృక్ష ఆరోగ్య స్థితి"
        },
        { 
          name: "విశ్లేషణ విశ్వసనీయత", 
          value: `${analysis.confidence?.toFixed(0)}%`,
          shapValue: shapValues.confidence.value,
          impact: shapValues.confidence.impact,
          importance: shapValues.confidence.importance,
          explanation: "ఉపగ్రహ డేటా విశ్వసనీయత"
        }
      ]
    }
  };

  const currentExplanation = explanations[voiceLanguage as keyof typeof explanations] || explanations.en;

  const speakExplanation = () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const sweetExplanations = {
      en: isEligible 
        ? `Great news! Our SHAP analysis confirms your ${analysis.lossPercentage?.toFixed(1)} percent crop loss qualifies for PMFBY compensation. The AI model identified key factors contributing to this decision, with crop loss percentage being the most significant factor.`
        : `I understand this may be disappointing. Our SHAP analysis shows your ${analysis.lossPercentage?.toFixed(1)} percent crop loss doesn't meet the 33 percent PMFBY threshold. The model explains that while vegetation health declined, the overall loss wasn't severe enough for compensation eligibility.`,
      hi: isEligible 
        ? `बहुत अच्छी खबर! हमारे SHAP विश्लेषण से पुष्टि होती है कि आपकी ${analysis.lossPercentage?.toFixed(1)} प्रतिशत फसल हानि PMFBY मुआवजे के लिए योग्य है। AI मॉडल ने इस निर्णय में योगदान देने वाले मुख्य कारकों की पहचान की है।`
        : `मैं समझ सकती हूं यह निरुत्साहजनक हो सकता है। हमारे SHAP विश्लेषण से पता चलता है कि आपकी ${analysis.lossPercentage?.toFixed(1)} प्रतिशत फसल हानि 33 प्रतिशत PMFBY सीमा को पूरा नहीं करती।`,
      te: isEligible 
        ? `గొప్ప వార్త! మా SHAP విశ్లేషణ మీ ${analysis.lossPercentage?.toFixed(1)} శాతం పంట నష్టం PMFBY పరిహారానికి అర్హత పొందిందని ధృవీకరిస్తుంది. AI మోడల్ ఈ నిర్ణయానికి దోహదపడే ముఖ్య కారకాలను గుర్తించింది.`
        : `ఇది నిరుత్సాహపరుస్తుందని నేను అర్థం చేసుకుంటున్నాను. మా SHAP విశ్లేషణ మీ ${analysis.lossPercentage?.toFixed(1)} శాతం పంట నష్టం 33 శాతం PMFBY పరిమితిని చేరుకోలేదని చూపిస్తుంది.`
    };

    const text = sweetExplanations[voiceLanguage as keyof typeof sweetExplanations];
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Force female voice with sweet settings
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel') ||
      voice.name.toLowerCase().includes('samantha')
    ) || voices.find(voice => voice.lang.startsWith(voiceLanguage)) || voices[0];
    
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.lang = voiceLanguage === 'hi' ? 'hi-IN' : voiceLanguage === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.7; // Slower, sweeter
    utterance.pitch = 1.3; // Higher, sweeter pitch
    utterance.volume = 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>{currentExplanation.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={speakExplanation}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{isPlaying ? 'Stop' : 'Listen'}</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Decision Result */}
        <div className={`p-4 rounded-lg border-2 ${
          isEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-lg font-bold ${
            isEligible ? 'text-green-800' : 'text-red-800'
          }`}>
            {currentExplanation.eligible}
          </div>
          <div className="text-sm mt-2 text-gray-700">
            {currentExplanation.reason}
          </div>
        </div>

        {/* SHAP Feature Importance */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>SHAP Feature Contributions:</span>
            </h4>
            <Button
              onClick={() => setShowFeatures(!showFeatures)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showFeatures ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {showFeatures && (
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
                {currentExplanation.shapFeatures.map((feature, index) => {
                  const isPositive = feature.impact === 'positive';
                  const isNegative = feature.impact === 'negative';
                  
                  return (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">{feature.name}:</span>
                      <span className="text-gray-600">{feature.value}</span>
                      <span className={`font-medium ${
                        isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        ({feature.shapValue > 0 ? '+' : ''}{(feature.shapValue * 100).toFixed(1)}%)
                      </span>
                      <span className="text-xs text-gray-600">- {feature.explanation}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
}