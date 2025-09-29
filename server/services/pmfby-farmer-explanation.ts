export class PMFBYFarmerExplanationService {
  
  static generateFarmerFriendlyExplanation(
    lossPercentage: number,
    eligible: boolean,
    cropType: string,
    language: 'en' | 'hi' | 'te' = 'en'
  ): string {
    
    const explanations = {
      en: {
        eligible: {
          title: "✅ GOOD NEWS - You are eligible for PMFBY compensation!",
          reason: `Your crop loss is ${lossPercentage.toFixed(1)}%, which is above the minimum 33% required for ${cropType} crops.`,
          nextSteps: "Next steps:\n1. Submit your claim within 72 hours\n2. Keep your land documents ready\n3. Take photos of damaged crops\n4. Contact your local agriculture officer",
          compensation: "You will receive compensation based on the sum insured for your crop area."
        },
        notEligible: {
          title: "❌ Unfortunately, you are not eligible for PMFBY compensation",
          reason: `Your crop loss is ${lossPercentage.toFixed(1)}%, which is below the minimum 33% threshold required for ${cropType} crops.`,
          advice: "What you can do:\n1. Focus on crop recovery measures\n2. Apply organic fertilizers to boost growth\n3. Ensure proper irrigation\n4. Monitor for pest/disease issues",
          future: "Keep monitoring your crops. If loss increases above 33%, you may become eligible."
        }
      },
      hi: {
        eligible: {
          title: "✅ खुशखबरी - आप PMFBY मुआवजे के लिए पात्र हैं!",
          reason: `आपकी फसल की हानि ${lossPercentage.toFixed(1)}% है, जो ${cropType} फसल के लिए आवश्यक न्यूनतम 33% से अधिक है।`,
          nextSteps: "अगले कदम:\n1. 72 घंटे के भीतर अपना दावा जमा करें\n2. अपने भूमि दस्तावेज तैयार रखें\n3. क्षतिग्रस्त फसल की तस्वीरें लें\n4. अपने स्थानीय कृषि अधिकारी से संपर्क करें",
          compensation: "आपको अपने फसल क्षेत्र के लिए बीमित राशि के आधार पर मुआवजा मिलेगा।"
        },
        notEligible: {
          title: "❌ दुर्भाग्य से, आप PMFBY मुआवजे के लिए पात्र नहीं हैं",
          reason: `आपकी फसल की हानि ${lossPercentage.toFixed(1)}% है, जो ${cropType} फसल के लिए आवश्यक न्यूनतम 33% सीमा से कम है।`,
          advice: "आप क्या कर सकते हैं:\n1. फसल सुधार के उपायों पर ध्यान दें\n2. विकास बढ़ाने के लिए जैविक उर्वरक डालें\n3. उचित सिंचाई सुनिश्चित करें\n4. कीट/रोग की समस्याओं की निगरानी करें",
          future: "अपनी फसल की निगरानी करते रहें। यदि हानि 33% से अधिक हो जाती है, तो आप पात्र हो सकते हैं।"
        }
      },
      te: {
        eligible: {
          title: "✅ శుభవార్త - మీరు PMFBY పరిహారానికి అర్హులు!",
          reason: `మీ పంట నష్టం ${lossPercentage.toFixed(1)}%, ఇది ${cropType} పంటలకు అవసరమైన కనీస 33% కంటే ఎక్కువ.`,
          nextSteps: "తదుపరి దశలు:\n1. 72 గంటల్లో మీ దావా సమర్పించండి\n2. మీ భూమి పత్రాలను సిద్ధంగా ఉంచండి\n3. దెబ్బతిన్న పంటల ఫోటోలు తీయండి\n4. మీ స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి",
          compensation: "మీ పంట ప్రాంతానికి బీమా చేసిన మొత్తం ఆధారంగా మీకు పరిహారం లభిస్తుంది."
        },
        notEligible: {
          title: "❌ దురదృష్టవశాత్తు, మీరు PMFBY పరిహారానికి అర్హులు కాదు",
          reason: `మీ పంట నష్టం ${lossPercentage.toFixed(1)}%, ఇది ${cropType} పంటలకు అవసరమైన కనీస 33% థ్రెషోల్డ్ కంటే తక్కువ.`,
          advice: "మీరు చేయగలిగినవి:\n1. పంట పునరుద్ధరణ చర్యలపై దృష్టి పెట్టండి\n2. పెరుగుదలను పెంచడానికి సేంద్రీయ ఎరువులు వేయండి\n3. సరైన నీటిపారుదల నిర్ధారించండి\n4. కీటకాలు/వ్యాధుల సమస్యలను పర్యవేక్షించండి",
          future: "మీ పంటలను పర్యవేక్షించడం కొనసాగించండి. నష్టం 33% కంటే ఎక్కువైతే, మీరు అర్హులు కావచ్చు."
        }
      }
    };

    const msgs = explanations[language];
    const category = eligible ? msgs.eligible : msgs.notEligible;
    
    let explanation = category.title + "\n\n";
    explanation += category.reason + "\n\n";
    
    if (eligible) {
      explanation += category.nextSteps + "\n\n";
      explanation += category.compensation;
    } else {
      explanation += category.advice + "\n\n";
      explanation += category.future;
    }
    
    return explanation;
  }
}