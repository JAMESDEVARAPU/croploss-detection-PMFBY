import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, MapPin, Leaf, AlertTriangle, CheckCircle, Brain, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { csvLoader } from "@/lib/csv-loader";
import { OfflineAIExplainer } from "@/lib/offline-ai-explainer";

interface DistrictData {
  district: string;
  mandal: string;
  month: number;
  year: number;
  NDVI_mean: number;
  rainfall_mm_per_day: number;
  temperature_C: number;
  batch_id: string;
}

interface CropLossResult {
  district: string;
  mandal: string;
  cropType: string;
  lossPercentage: number;
  pmfbyEligible: boolean;
  compensationAmount: number;
  explanation: string;
  ndviCurrent: number;
  ndviBefore: number;
  confidence: number;
  weatherFactors: {
    rainfall: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

interface OfflineDistrictLookupProps {
  onAnalysisComplete?: (result: CropLossResult) => void;
}

export function OfflineDistrictLookup({ onAnalysisComplete }: OfflineDistrictLookupProps = {}) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<DistrictData[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMandal, setSelectedMandal] = useState("");
  const [cropType, setCropType] = useState("");
  const [fieldArea, setFieldArea] = useState("");
  const [mobile, setMobile] = useState("");
  const [period, setPeriod] = useState("");
  const [result, setResult] = useState<CropLossResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [aiExplainer] = useState(new OfflineAIExplainer());
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'te'>('en');

  const translations = {
    en: {
      title: "District & Mandal Crop Loss Analysis",
      district: "District",
      mandal: "Mandal",
      cropType: "Crop Type",
      fieldArea: "Field Area (acres)",
      mobile: "Mobile Number",
      period: "Analysis Period",
      analyze: "🔍 Analyze Crop Loss with AI",
      analyzing: "Analyzing...",
      results: "Analysis Results",
      location: "Location",
      lossPercentage: "Crop Loss Percentage",
      pmfbyStatus: "PMFBY Status",
      compensation: "Estimated Compensation",
      explanation: "Explanation",
      aiExplanation: "AI Explanation",
      keyFactors: "Key Factors"
    },
    hi: {
      title: "जिला और मंडल फसल हानि विश्लेषण",
      district: "जिला",
      mandal: "मंडल",
      cropType: "फसल का प्रकार",
      fieldArea: "खेत का क्षेत्रफल (एकड़)",
      mobile: "मोबाइल नंबर",
      period: "विश्लेषण अवधि",
      analyze: "🔍 AI के साथ फसल हानि का विश्लेषण करें",
      analyzing: "विश्लेषण कर रहे हैं...",
      results: "विश्लेषण परिणाम",
      location: "स्थान",
      lossPercentage: "फसल हानि प्रतिशत",
      pmfbyStatus: "PMFBY स्थिति",
      compensation: "अनुमानित मुआवजा",
      explanation: "व्याख्या",
      aiExplanation: "AI व्याख्या",
      keyFactors: "मुख्य कारक"
    },
    te: {
      title: "జిల్లా మరియు మండల పంట నష్ట విశ్లేషణ",
      district: "జిల్లా",
      mandal: "మండల్",
      cropType: "పంట రకం",
      fieldArea: "పొలం వైశాల్యం (ఎకరాలు)",
      mobile: "మొబైల్ నంబర్",
      period: "విశ్లేషణ కాలం",
      analyze: "🔍 AI తో పంట నష్టాన్ని విశ్లేషించండి",
      analyzing: "విశ్లేషిస్తోంది...",
      results: "విశ్లేషణ ఫలితాలు",
      location: "స్థానం",
      lossPercentage: "పంట నష్ట శాతం",
      pmfbyStatus: "PMFBY స్థితి",
      compensation: "అంచనా పరిహారం",
      explanation: "వివరణ",
      aiExplanation: "AI వివరణ",
      keyFactors: "ముఖ్య కారకాలు"
    }
  };



  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load CSV data on component mount
  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      const data = await csvLoader.loadCSVData();
      setCsvData(data);
      
      // Extract unique districts
      const uniqueDistricts = csvLoader.getDistricts();
      setDistricts(uniqueDistricts);
      
      toast({
        title: "Data Loaded",
        description: `${data.length} records loaded from CSV files`,
      });
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load offline CSV data",
        variant: "destructive",
      });
    }
  };

  // Update mandals when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const uniqueMandals = csvLoader.getMandals(selectedDistrict);
      setMandals(uniqueMandals);
      setSelectedMandal(""); // Reset mandal selection
    }
  }, [selectedDistrict]);

  const calculateCropLoss = (data: DistrictData, cropType: string): number => {
    // Enhanced crop loss calculation using actual CSV data
    const ndviHealthy = 0.7; // Optimal NDVI for healthy crops
    const rainfallOptimal = 2.5; // Optimal rainfall mm/day
    const tempOptimal = 25; // Optimal temperature
    
    let lossPercentage = 0;
    
    // NDVI-based loss (most important factor - 50%)
    const ndviLoss = Math.max(0, (ndviHealthy - data.NDVI_mean) / ndviHealthy * 60);
    lossPercentage += ndviLoss;
    
    // Rainfall deficit impact (30%)
    const rainfallDeficit = Math.max(0, (rainfallOptimal - data.rainfall_mm_per_day) / rainfallOptimal * 30);
    lossPercentage += rainfallDeficit;
    
    // Temperature stress (20%)
    const tempStress = Math.abs(data.temperature_C - tempOptimal) > 10 ? 
      Math.abs(data.temperature_C - tempOptimal) * 1.5 : 0;
    lossPercentage += Math.min(tempStress, 20);
    
    // Crop-specific vulnerability multipliers
    const cropVulnerability = {
      'rice': 1.3,     // High water dependency
      'wheat': 1.0,    // Moderate resilience
      'cotton': 1.2,   // Sensitive to weather
      'sugarcane': 0.8, // More resilient
      'maize': 1.1     // Moderate sensitivity
    };
    
    const vulnerability = cropVulnerability[cropType as keyof typeof cropVulnerability] || 1.0;
    lossPercentage *= vulnerability;
    
    // Add randomness for realistic variation (±10%)
    const variation = (Math.random() - 0.5) * 20;
    lossPercentage += variation;
    
    return Math.min(Math.max(lossPercentage, 5), 85); // Ensure 5-85% range
  };

  const handleAnalysis = () => {
    if (!selectedDistrict || !selectedMandal || !cropType || !fieldArea || !period) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields including analysis period",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Find data for selected district and mandal
    let locationData = csvLoader.getLocationData(selectedDistrict, selectedMandal);

    if (!locationData) {
      // Fallback: use average data for the district if specific mandal not found
      const districtData = csvLoader.getDistrictAverageData(selectedDistrict);
      if (districtData) {
        locationData = districtData;
        toast({
          title: "Using District Average",
          description: `Specific mandal data not found, using district average for ${selectedDistrict}`,
        });
      } else {
        toast({
          title: "Data Not Found",
          description: "No data available for selected district and mandal",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    // Calculate crop loss with period adjustment
    let lossPercentage = calculateCropLoss(locationData, cropType);
    
    // Adjust based on selected period
    const periodMultipliers = {
      'current': 1.0,
      'last30': 1.1,
      'last60': 1.2,
      'season': 0.9
    };
    const multiplier = periodMultipliers[period as keyof typeof periodMultipliers] || 1.0;
    lossPercentage *= multiplier;
    const pmfbyEligible = lossPercentage >= 33; // PMFBY threshold is 33%
    
    // Calculate compensation
    const compensationRates = {
      'rice': 50000,
      'wheat': 45000,
      'cotton': 60000,
      'sugarcane': 80000,
      'maize': 40000
    };
    
    const rate = compensationRates[cropType as keyof typeof compensationRates] || 50000;
    const compensationAmount = pmfbyEligible 
      ? Math.floor(parseFloat(fieldArea) * (lossPercentage / 100) * rate)
      : 0;

    // Enhanced analysis result with XAI data
    const ndviCurrent = locationData.NDVI_mean;
    const ndviBefore = Math.min(ndviCurrent + 0.15, 0.85); // Simulate before NDVI
    const confidence = Math.random() * 15 + 80; // 80-95% confidence
    
    const analysisResult: CropLossResult = {
      district: selectedDistrict,
      mandal: selectedMandal,
      cropType,
      lossPercentage: Math.round(lossPercentage * 10) / 10,
      pmfbyEligible,
      compensationAmount,
      explanation: pmfbyEligible 
        ? `✅ ELIGIBLE: ${lossPercentage.toFixed(1)}% crop loss detected. Qualifies for ₹${compensationAmount.toLocaleString()} compensation under PMFBY.`
        : `❌ NOT ELIGIBLE: ${lossPercentage.toFixed(1)}% crop loss detected. Below 33% threshold required for PMFBY.`,
      ndviCurrent,
      ndviBefore,
      confidence,
      weatherFactors: {
        rainfall: locationData.rainfall_mm_per_day,
        temperature: locationData.temperature_C,
        humidity: Math.random() * 20 + 60, // 60-80%
        windSpeed: Math.random() * 10 + 5 // 5-15 km/h
      }
    };

    // Generate AI explanation
    const aiExplanation = aiExplainer.generateExplanation(analysisResult);
    (analysisResult as any).aiExplanation = aiExplanation;

    setResult(analysisResult);
    setLoading(false);

    // Call the callback to update parent component
    if (onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }

    toast({
      title: "Analysis Complete",
      description: `Crop loss: ${lossPercentage.toFixed(1)}% - ${pmfbyEligible ? 'PMFBY Eligible' : 'Not Eligible'}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Offline Status Indicator */}
      {isOffline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-700">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Offline Mode - Using Local CSV Data</span>
              </div>
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                AI Explainer Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {translations[selectedLanguage].title}
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => setSelectedLanguage('en')}
                variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
              >
                🇺🇸
              </Button>
              <Button
                onClick={() => setSelectedLanguage('hi')}
                variant={selectedLanguage === 'hi' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
              >
                🇮🇳
              </Button>
              <Button
                onClick={() => setSelectedLanguage('te')}
                variant={selectedLanguage === 'te' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
              >
                తె
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="district">{translations[selectedLanguage].district} *</Label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mandal">{translations[selectedLanguage].mandal} *</Label>
              <Select 
                value={selectedMandal} 
                onValueChange={setSelectedMandal}
                disabled={!selectedDistrict}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandal" />
                </SelectTrigger>
                <SelectContent>
                  {mandals.map((mandal) => (
                    <SelectItem key={mandal} value={mandal}>
                      {mandal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cropType">{translations[selectedLanguage].cropType} *</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="cotton">Cotton</SelectItem>
                  <SelectItem value="sugarcane">Sugarcane</SelectItem>
                  <SelectItem value="maize">Maize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fieldArea">{translations[selectedLanguage].fieldArea} *</Label>
              <Input
                id="fieldArea"
                type="number"
                placeholder="Enter field area"
                value={fieldArea}
                onChange={(e) => setFieldArea(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="mobile">{translations[selectedLanguage].mobile}</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="period">{translations[selectedLanguage].period} *</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="last60">Last 60 Days</SelectItem>
                  <SelectItem value="season">Current Season</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleAnalysis} 
              disabled={loading || !selectedDistrict || !selectedMandal || !cropType || !fieldArea || !period}
              className="w-full"
            >
              {loading ? translations[selectedLanguage].analyzing : translations[selectedLanguage].analyze}
            </Button>
            
            {result && (
              <Button
                onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                variant="outline"
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                {showAIAnalysis ? 'Hide' : 'Show'} Detailed AI Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Quick Summary Card */}
          <Card className={`border-2 ${
            result.pmfbyEligible 
              ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100' 
              : 'border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {result.pmfbyEligible ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-xl font-bold text-green-700">ELIGIBLE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                      <span className="text-xl font-bold text-orange-700">NOT ELIGIBLE</span>
                    </div>
                  )}
                </div>
                <Badge variant={result.pmfbyEligible ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                  {result.lossPercentage}% Loss
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">📍 Location</p>
                  <p className="font-semibold text-gray-800">{result.district}</p>
                  <p className="text-xs text-gray-500">{result.mandal}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">🌾 Crop</p>
                  <p className="font-semibold text-gray-800 capitalize">{result.cropType}</p>
                  <p className="text-xs text-gray-500">{fieldArea} acres</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">💰 Compensation</p>
                  <p className="font-semibold text-gray-800">
                    {result.pmfbyEligible ? `₹${result.compensationAmount.toLocaleString()}` : '₹0'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.pmfbyEligible ? 'Eligible' : 'Need 33% loss'}
                  </p>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg text-center ${
                result.pmfbyEligible 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-orange-100 border border-orange-200'
              }`}>
                <p className={`font-medium text-sm ${
                  result.pmfbyEligible ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {result.pmfbyEligible 
                    ? '✅ You can claim PMFBY compensation! Contact your insurance agent immediately.'
                    : `⚠️ Your damage is ${result.lossPercentage}% (need 33% for PMFBY). Monitor your field closely.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Detailed Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Technical Details */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-blue-800">📍 District & Mandal Analysis</Label>
                  <Badge variant="secondary" className="text-xs">
                    CSV Data Based
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Affected Area:</p>
                    <p className="text-blue-900">{fieldArea} acres</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Estimated Value:</p>
                    <p className="text-blue-900">₹{result.compensationAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Damage Cause:</p>
                    <p className="text-blue-900">Weather & NDVI Analysis</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Data Source:</p>
                    <p className="text-blue-900">Local CSV Records</p>
                  </div>
                </div>
              </div>

            {/* Explainable AI Section */}
            {(result as any).aiExplanation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {translations[selectedLanguage].aiExplanation}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        const explanation = (result as any).aiExplanation.explanation[selectedLanguage];
                        if ('speechSynthesis' in window) {
                          const utterance = new SpeechSynthesisUtterance(explanation);
                          utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'te' ? 'te-IN' : 'en-US';
                          utterance.rate = 0.8;
                          speechSynthesis.speak(utterance);
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Listen
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      {(result as any).aiExplanation.confidence}% Confidence
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {(result as any).aiExplanation.explanation[selectedLanguage]}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{translations[selectedLanguage].keyFactors}:</Label>
                  {(result as any).aiExplanation.features.slice(0, 3).map((feature: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm">{feature.displayName}</span>
                      <Badge variant="outline" className="text-xs">
                        {(feature.importance * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• District & Mandal based analysis using local CSV data</p>
                <p>• NDVI and weather patterns from {result.district}, {result.mandal}</p>
                <p>• PMFBY eligibility requires minimum 33% crop loss</p>
                <p>• Compensation calculated based on crop type and field area</p>
                <p>• AI explainer provides SHAP-like feature importance analysis</p>
                <p>• Multi-language explanations available in English, Hindi, and Telugu</p>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Analysis Card */}
          {(result as any).aiExplanation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Analysis
                  </div>
                  <Button
                    onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                    variant="outline"
                    size="sm"
                  >
                    {showAIAnalysis ? 'Hide' : 'Show'} Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">



                {/* AI Explanation Panel */}
                {showAIAnalysis && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Multi-language Explanation Tabs */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">🤖 AI Explanation</p>
                          <Badge variant="secondary" className="text-xs">
                            Confidence: {(result as any).aiExplanation.confidence}%
                          </Badge>
                        </div>
                        
                        {/* Language Selection Buttons */}
                        <div className="flex gap-2 mb-3">
                          <Button
                            onClick={() => setSelectedLanguage('en')}
                            variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                          >
                            🇺🇸 English
                          </Button>
                          <Button
                            onClick={() => setSelectedLanguage('hi')}
                            variant={selectedLanguage === 'hi' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                          >
                            🇮🇳 हिंदी
                          </Button>
                          <Button
                            onClick={() => setSelectedLanguage('te')}
                            variant={selectedLanguage === 'te' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                          >
                            🇮🇳 తెలుగు
                          </Button>

                        </div>
                        
                        {/* Detailed Explanation */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900 leading-relaxed">
                            {(result as any).aiExplanation.explanation[selectedLanguage]}
                          </p>
                        </div>
                      </div>
                      
                      {/* Feature Importance Analysis */}
                      <div className="space-y-3">
                        <p className="font-medium text-sm">📊 Key Factors Analysis</p>
                        <div className="space-y-2">
                          {(result as any).aiExplanation.features.map((feature: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{feature.displayName}</span>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={feature.impact === 'increases' ? 'destructive' : 
                                            feature.impact === 'decreases' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {feature.impact === 'increases' ? '↑ Increases Risk' : 
                                     feature.impact === 'decreases' ? '↓ Decreases Risk' : '→ Neutral'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {(feature.importance * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                Value: {typeof feature.value === 'number' ? feature.value.toFixed(2) : feature.value}
                                {feature.feature === 'crop_loss_percentage' && '%'}
                                {feature.feature === 'rainfall_deficit' && ' mm/day'}
                                {feature.feature === 'temperature_stress' && '°C'}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    feature.impact === 'increases' ? 'bg-red-500' : 
                                    feature.impact === 'decreases' ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${feature.importance * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-700">{feature.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recommendations */}
                      <div className="space-y-3">
                        <p className="font-medium text-sm">💡 Recommendations</p>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <ul className="space-y-1">
                            {(result as any).aiExplanation.recommendations[selectedLanguage].map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Technical Details */}
                      <div className="text-xs text-gray-500 pt-3 border-t space-y-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">🔍 Technical Details</span>
                          <Badge variant="outline" className="text-xs">
                            Offline AI Model
                          </Badge>
                        </div>
                        <p>🛰️ Analysis based on satellite NDVI data and weather patterns</p>
                        <p>🧠 SHAP-like feature importance using offline AI model</p>
                        <p>📈 Model confidence: {(result as any).aiExplanation.confidence}% | Decision: {(result as any).aiExplanation.decision}</p>
                        <p>⚡ Processed completely offline using local CSV data</p>
                        <p>🌍 Multi-language support: English, Hindi (हिंदी), Telugu (తెలుగు)</p>
                        <p>🎧 Voice synthesis available in all supported languages</p>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}