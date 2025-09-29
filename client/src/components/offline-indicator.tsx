import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, Database, Signal } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function OfflineIndicator() {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCapable, setOfflineCapable] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if service worker is available for offline capability
    if ('serviceWorker' in navigator) {
      setOfflineCapable(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusText = () => {
    if (isOnline) {
      return {
        'en': 'Online - Full features available',
        'hi': 'ऑनलाइन - सभी सुविधाएं उपलब्ध',
        'te': 'ఆన్‌లైన్ - అన్ని ఫీచర్లు అందుబాటులో'
      }[language] || 'Online - Full features available';
    } else {
      return {
        'en': 'Offline - Local analysis available',
        'hi': 'ऑफलाइन - स्थानीय विश्लेषण उपलब्ध',
        'te': 'ఆఫ్‌లైన్ - స్థానిక విశ్లేషణ అందుబాటులో'
      }[language] || 'Offline - Local analysis available';
    }
  };

  const getOfflineFeatures = () => {
    return {
      'en': [
        'Local ML crop damage prediction',
        'PMFBY eligibility checking',
        'Voice commands (no internet needed)',
        'Cached weather data',
        'XAI explanations in local language'
      ],
      'hi': [
        'स्थानीय ML फसल नुकसान भविष्यवाणी',
        'PMFBY पात्रता जांच',
        'वॉयस कमांड (इंटरनेट की आवश्यकता नहीं)',
        'कैश्ड मौसम डेटा',
        'स्थानीय भाषा में XAI व्याख्या'
      ],
      'te': [
        'స్థానిక ML పంట నష్ట అంచనా',
        'PMFBY అర్హత తనిఖీ',
        'వాయిస్ కమాండ్లు (ఇంటర్నెట్ అవసరం లేదు)',
        'కాష్ చేసిన వాతావరణ డేటా',
        'స్థానిక భాషలో XAI వివరణలు'
      ]
    }[language] || [
      'Local ML crop damage prediction',
      'PMFBY eligibility checking', 
      'Voice commands (no internet needed)',
      'Cached weather data',
      'XAI explanations in local language'
    ];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="text-xs">{getStatusText()}</span>
        </Badge>
        
        {offlineCapable && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Database className="h-3 w-3" />
            <span className="text-xs">
              {language === 'hi' ? 'ऑफलाइन सक्षम' : 
               language === 'te' ? 'ఆఫ్‌లైన్ సామర్థ్యం' : 
               'Offline Capable'}
            </span>
          </Badge>
        )}
      </div>

      {!isOnline && (
        <Alert>
          <Signal className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-medium">
                {language === 'hi' ? 'ऑफलाइन मोड में उपलब्ध सुविधाएं:' :
                 language === 'te' ? 'ఆఫ్‌లైన్ మోడ్‌లో అందుబాటులో ఉన్న ఫీచర్లు:' :
                 'Features available in offline mode:'}
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                {getOfflineFeatures().map((feature, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}