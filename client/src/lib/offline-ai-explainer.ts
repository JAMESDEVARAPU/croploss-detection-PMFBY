// Offline AI Explainer using SHAP-like feature importance calculation
export interface FeatureImportance {
  feature: string;
  displayName: string;
  value: number;
  importance: number;
  contribution: number;
  impact: 'increases' | 'decreases' | 'neutral';
  explanation: string;
  confidence: number;
}

export interface ExplanationResult {
  decision: 'eligible' | 'not_eligible';
  confidence: number;
  lossPercentage: number;
  features: FeatureImportance[];
  explanation: {
    en: string;
    hi: string;
    te: string;
  };
  recommendations: {
    en: string[];
    hi: string[];
    te: string[];
  };
}

export class OfflineAIExplainer {
  private baselineValues = {
    ndvi: 0.6,
    rainfall: 2.0,
    temperature: 28,
    humidity: 65,
    pmfbyThreshold: 33
  };

  // Calculate SHAP-like feature importance
  calculateFeatureImportance(analysisData: any): FeatureImportance[] {
    const {
      lossPercentage,
      ndviCurrent,
      ndviBefore,
      weatherFactors,
      cropType,
      pmfbyEligible
    } = analysisData;

    const features: FeatureImportance[] = [];

    // 1. Crop Loss Percentage (Primary Feature)
    const lossContribution = this.calculateLossContribution(lossPercentage, pmfbyEligible);
    features.push({
      feature: 'crop_loss_percentage',
      displayName: 'Crop Loss Percentage',
      value: lossPercentage,
      importance: 0.4, // Highest importance
      contribution: lossContribution,
      impact: lossPercentage >= this.baselineValues.pmfbyThreshold ? 'increases' : 'decreases',
      explanation: `${lossPercentage >= this.baselineValues.pmfbyThreshold ? 'Above' : 'Below'} PMFBY eligibility threshold of 33%`,
      confidence: 0.95
    });

    // 2. NDVI Change (Vegetation Health)
    const ndviChange = ((ndviBefore - ndviCurrent) / ndviBefore) * 100;
    const ndviContribution = this.calculateNDVIContribution(ndviCurrent, ndviBefore);
    features.push({
      feature: 'ndvi_decline',
      displayName: 'Vegetation Health Decline',
      value: ndviChange,
      importance: 0.25,
      contribution: ndviContribution,
      impact: ndviChange > 15 ? 'increases' : 'decreases',
      explanation: 'Satellite-based vegetation health deterioration analysis',
      confidence: 0.88
    });

    // 3. Current NDVI Status
    const currentNDVIContribution = this.calculateCurrentNDVIContribution(ndviCurrent);
    features.push({
      feature: 'current_ndvi',
      displayName: 'Current Vegetation Health',
      value: ndviCurrent,
      importance: 0.15,
      contribution: currentNDVIContribution,
      impact: ndviCurrent < this.baselineValues.ndvi ? 'increases' : 'decreases',
      explanation: 'Current vegetation health status from satellite imagery',
      confidence: 0.85
    });

    // 4. Rainfall Impact
    const rainfallContribution = this.calculateRainfallContribution(weatherFactors.rainfall);
    features.push({
      feature: 'rainfall_deficit',
      displayName: 'Rainfall Adequacy',
      value: weatherFactors.rainfall,
      importance: 0.12,
      contribution: rainfallContribution,
      impact: weatherFactors.rainfall < this.baselineValues.rainfall ? 'increases' : 'decreases',
      explanation: 'Rainfall adequacy for optimal crop growth',
      confidence: 0.80
    });

    // 5. Temperature Stress
    const tempContribution = this.calculateTemperatureContribution(weatherFactors.temperature);
    features.push({
      feature: 'temperature_stress',
      displayName: 'Temperature Stress',
      value: weatherFactors.temperature,
      importance: 0.08,
      contribution: tempContribution,
      impact: weatherFactors.temperature > 35 ? 'increases' : 'neutral',
      explanation: 'Temperature-induced crop stress analysis',
      confidence: 0.75
    });

    return features.sort((a, b) => b.importance - a.importance);
  }

  private calculateLossContribution(lossPercentage: number, pmfbyEligible: boolean): number {
    // Primary factor - distance from threshold
    const distanceFromThreshold = lossPercentage - this.baselineValues.pmfbyThreshold;
    return pmfbyEligible ? 
      Math.min(distanceFromThreshold / 100, 0.4) : 
      Math.max(distanceFromThreshold / 100, -0.4);
  }

  private calculateNDVIContribution(current: number, before: number): number {
    const decline = (before - current) / before;
    return decline > 0.15 ? decline * 0.3 : decline * -0.2;
  }

  private calculateCurrentNDVIContribution(current: number): number {
    const deviation = this.baselineValues.ndvi - current;
    return deviation > 0 ? deviation * 0.25 : deviation * -0.15;
  }

  private calculateRainfallContribution(rainfall: number): number {
    const deficit = this.baselineValues.rainfall - rainfall;
    return deficit > 0 ? deficit * 0.1 : deficit * -0.05;
  }

  private calculateTemperatureContribution(temperature: number): number {
    const stress = temperature - 35;
    return stress > 0 ? stress * 0.02 : 0;
  }

  // Generate comprehensive explanation
  generateExplanation(analysisData: any): ExplanationResult {
    const features = this.calculateFeatureImportance(analysisData);
    const { lossPercentage, pmfbyEligible, compensationAmount, cropType, district, mandal } = analysisData;
    
    const decision = pmfbyEligible ? 'eligible' : 'not_eligible';
    const confidence = this.calculateOverallConfidence(features);

    const explanations = {
      en: this.generateEnglishExplanation(analysisData, features),
      hi: this.generateHindiExplanation(analysisData, features),
      te: this.generateTeluguExplanation(analysisData, features)
    };

    const recommendations = {
      en: this.generateEnglishRecommendations(analysisData, features),
      hi: this.generateHindiRecommendations(analysisData, features),
      te: this.generateTeluguRecommendations(analysisData, features)
    };

    return {
      decision,
      confidence,
      lossPercentage,
      features,
      explanation: explanations,
      recommendations
    };
  }

  private calculateOverallConfidence(features: FeatureImportance[]): number {
    const weightedConfidence = features.reduce((sum, feature) => 
      sum + (feature.confidence * feature.importance), 0
    );
    return Math.round(weightedConfidence * 100);
  }

  private generateEnglishExplanation(data: any, features: FeatureImportance[]): string {
    const { lossPercentage, pmfbyEligible, compensationAmount, cropType, district, mandal } = data;
    const topFeature = features[0];
    
    if (pmfbyEligible) {
      return `Your ${cropType} crop in ${district}, ${mandal} qualifies for PMFBY compensation. Our AI analysis shows ${lossPercentage.toFixed(1)}% crop loss, primarily driven by ${topFeature.displayName.toLowerCase()}. The model identified ${features.length} key factors contributing to this decision, with ${topFeature.displayName.toLowerCase()} being the most significant (${(topFeature.importance * 100).toFixed(0)}% importance). You are eligible for ₹${compensationAmount.toLocaleString()} compensation based on the severity of crop damage detected through satellite imagery and weather analysis.`;
    } else {
      return `Your ${cropType} crop in ${district}, ${mandal} shows ${lossPercentage.toFixed(1)}% loss, which is below the 33% PMFBY threshold. Our AI analysis examined ${features.length} factors, with ${topFeature.displayName.toLowerCase()} being the primary consideration (${(topFeature.importance * 100).toFixed(0)}% importance). While satellite imagery shows some crop stress, the overall damage level doesn't meet the insurance eligibility criteria. The model's confidence in this assessment is ${this.calculateOverallConfidence(features)}%.`;
    }
  }

  private generateHindiExplanation(data: any, features: FeatureImportance[]): string {
    const { lossPercentage, pmfbyEligible, compensationAmount, cropType, district, mandal } = data;
    const topFeature = features[0];
    
    if (pmfbyEligible) {
      return `${district}, ${mandal} में आपकी ${cropType} फसल PMFBY मुआवजे के लिए योग्य है। हमारे AI विश्लेषण से ${lossPercentage.toFixed(1)}% फसल हानि दिखाई गई है, जो मुख्यतः ${topFeature.displayName.toLowerCase()} के कारण है। मॉडल ने ${features.length} मुख्य कारकों की पहचान की है, जिसमें ${topFeature.displayName.toLowerCase()} सबसे महत्वपूर्ण है (${(topFeature.importance * 100).toFixed(0)}% महत्व)। उपग्रह इमेजरी और मौसम विश्लेषण के आधार पर आप ₹${compensationAmount.toLocaleString()} मुआवजे के हकदार हैं।`;
    } else {
      return `${district}, ${mandal} में आपकी ${cropType} फसल में ${lossPercentage.toFixed(1)}% हानि है, जो 33% PMFBY सीमा से कम है। हमारे AI विश्लेषण ने ${features.length} कारकों की जांच की, जिसमें ${topFeature.displayName.toLowerCase()} प्राथमिक विचार है (${(topFeature.importance * 100).toFixed(0)}% महत्व)। जबकि उपग्रह इमेजरी कुछ फसल तनाव दिखाती है, समग्र नुकसान का स्तर बीमा पात्रता मानदंडों को पूरा नहीं करता।`;
    }
  }

  private generateTeluguExplanation(data: any, features: FeatureImportance[]): string {
    const { lossPercentage, pmfbyEligible, compensationAmount, cropType, district, mandal } = data;
    const topFeature = features[0];
    
    if (pmfbyEligible) {
      return `${district}, ${mandal}లో మీ ${cropType} పంట PMFBY పరిహారానికి అర్హత పొందింది. మా AI విశ్లేషణ ${lossPercentage.toFixed(1)}% పంట నష్టాన్ని చూపిస్తుంది, ఇది ప్రధానంగా ${topFeature.displayName.toLowerCase()} వల్ల. మోడల్ ${features.length} ముఖ్య కారకాలను గుర్తించింది, వీటిలో ${topFeature.displayName.toLowerCase()} అత్యంత ముఖ్యమైనది (${(topFeature.importance * 100).toFixed(0)}% ప్రాముఖ్యత). ఉపగ్రహ చిత్రాలు మరియు వాతావరణ విశ్లేషణ ఆధారంగా మీరు ₹${compensationAmount.toLocaleString()} పరిహారానికి అర్హులు.`;
    } else {
      return `${district}, ${mandal}లో మీ ${cropType} పంటలో ${lossPercentage.toFixed(1)}% నష్టం ఉంది, ఇది 33% PMFBY పరిమితి కంటే తక్కువ. మా AI విశ్లేషణ ${features.length} కారకాలను పరిశీలించింది, వీటిలో ${topFeature.displayName.toLowerCase()} ప్రాథమిక పరిగణన (${(topFeature.importance * 100).toFixed(0)}% ప్రాముఖ్యత). ఉపగ్రహ చిత్రాలు కొంత పంట ఒత్తిడిని చూపిస్తున్నప్పటికీ, మొత్తం నష్ట స్థాయి బీమా అర్హత ప్రమాణాలను చేరుకోలేదు.`;
    }
  }

  private generateEnglishRecommendations(data: any, features: FeatureImportance[]): string[] {
    const recommendations: string[] = [];
    const { pmfbyEligible, lossPercentage } = data;

    if (pmfbyEligible) {
      recommendations.push("Submit PMFBY claim immediately with required documents");
      recommendations.push("Contact your insurance agent or nearest agriculture office");
      recommendations.push("Keep all crop cultivation records and receipts ready");
      recommendations.push("Take photographs of damaged crops as additional evidence");
    } else {
      recommendations.push("Monitor crop health regularly using satellite imagery");
      recommendations.push("Implement water conservation techniques if rainfall is low");
      recommendations.push("Consider crop insurance for future seasons");
      recommendations.push("Consult agricultural extension officer for crop management advice");
    }

    // Add specific recommendations based on top features
    const topFeature = features[0];
    if (topFeature.feature === 'rainfall_deficit') {
      recommendations.push("Install drip irrigation system to optimize water usage");
    } else if (topFeature.feature === 'temperature_stress') {
      recommendations.push("Use shade nets or mulching to reduce temperature stress");
    }

    return recommendations;
  }

  private generateHindiRecommendations(data: any, features: FeatureImportance[]): string[] {
    const recommendations: string[] = [];
    const { pmfbyEligible } = data;

    if (pmfbyEligible) {
      recommendations.push("आवश्यक दस्तावेजों के साथ तुरंत PMFBY दावा जमा करें");
      recommendations.push("अपने बीमा एजेंट या निकटतम कृषि कार्यालय से संपर्क करें");
      recommendations.push("सभी फसल खेती रिकॉर्ड और रसीदें तैयार रखें");
      recommendations.push("अतिरिक्त सबूत के रूप में क्षतिग्रस्त फसलों की तस्वीरें लें");
    } else {
      recommendations.push("उपग्रह इमेजरी का उपयोग करके नियमित रूप से फसल स्वास्थ्य की निगरानी करें");
      recommendations.push("यदि बारिश कम है तो जल संरक्षण तकनीकों को लागू करें");
      recommendations.push("भविष्य के मौसमों के लिए फसल बीमा पर विचार करें");
      recommendations.push("फसल प्रबंधन सलाह के लिए कृषि विस्तार अधिकारी से सलाह लें");
    }

    return recommendations;
  }

  private generateTeluguRecommendations(data: any, features: FeatureImportance[]): string[] {
    const recommendations: string[] = [];
    const { pmfbyEligible } = data;

    if (pmfbyEligible) {
      recommendations.push("అవసరమైన పత్రాలతో వెంటనే PMFBY దావా సమర్పించండి");
      recommendations.push("మీ బీమా ఏజెంట్ లేదా సమీప వ్యవసాయ కార్యాలయాన్ని సంప్రదించండి");
      recommendations.push("అన్ని పంట సాగు రికార్డులు మరియు రసీదులను సిద్ధంగా ఉంచండి");
      recommendations.push("అదనపు సాక్ష్యంగా దెబ్బతిన్న పంటల ఫోటోలు తీయండి");
    } else {
      recommendations.push("ఉపగ్రహ చిత్రాలను ఉపయోగించి క్రమం తప్పకుండా పంట ఆరోగ్యాన్ని పర్యవేక్షించండి");
      recommendations.push("వర్షపాతం తక్కువగా ఉంటే నీటి పరిరక్షణ పద్ధతులను అమలు చేయండి");
      recommendations.push("భవిష్యత్ సీజన్లకు పంట బీమాను పరిగణించండి");
      recommendations.push("పంట నిర్వహణ సలహా కోసం వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి");
    }

    return recommendations;
  }

  // Generate simple farmer-friendly explanation
  generateSimpleExplanation(data: any, language: 'en' | 'hi' | 'te' = 'en'): string {
    const { lossPercentage, pmfbyEligible, cropType } = data;
    
    const simpleExplanations = {
      en: {
        eligible: `Good news! Your ${cropType} crop has ${lossPercentage.toFixed(0)}% damage, which means you can get insurance money. The satellite pictures show your crop is not healthy enough, so the government will help you.`,
        notEligible: `Your ${cropType} crop has ${lossPercentage.toFixed(0)}% damage. This is not enough damage to get insurance money. You need at least 33% damage. Your crop is still mostly okay according to satellite pictures.`
      },
      hi: {
        eligible: `अच्छी खबर! आपकी ${cropType} फसल में ${lossPercentage.toFixed(0)}% नुकसान है, इसका मतलब आपको बीमा का पैसा मिल सकता है। उपग्रह की तस्वीरें दिखाती हैं कि आपकी फसल पर्याप्त स्वस्थ नहीं है, इसलिए सरकार आपकी मदद करेगी।`,
        notEligible: `आपकी ${cropType} फसल में ${lossPercentage.toFixed(0)}% नुकसान है। बीमा का पैसा पाने के लिए यह पर्याप्त नुकसान नहीं है। आपको कम से कम 33% नुकसान चाहिए। उपग्रह की तस्वीरों के अनुसार आपकी फसल अभी भी ज्यादातर ठीक है।`
      },
      te: {
        eligible: `మంచి వార్త! మీ ${cropType} పంటలో ${lossPercentage.toFixed(0)}% నష్టం ఉంది, అంటే మీరు బీమా డబ్బు పొందవచ్చు. ఉపగ్రహ చిత్రాలు మీ పంట తగినంత ఆరోగ్యంగా లేదని చూపిస్తున్నాయి, కాబట్టి ప్రభుత్వం మీకు సహాయం చేస్తుంది.`,
        notEligible: `మీ ${cropType} పంటలో ${lossPercentage.toFixed(0)}% నష్టం ఉంది. బీమా డబ్బు పొందడానికి ఇది తగినంత నష్టం కాదు. మీకు కనీసం 33% నష్టం అవసరం. ఉపగ్రహ చిత్రాల ప్రకారం మీ పంట ఇప్పటికీ చాలా వరకు బాగానే ఉంది.`
      }
    };

    const explanations = simpleExplanations[language];
    return pmfbyEligible ? explanations.eligible : explanations.notEligible;
  }
}