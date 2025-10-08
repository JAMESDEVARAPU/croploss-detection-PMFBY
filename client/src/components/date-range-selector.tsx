import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function DateRangeSelector({ onDateRangeChange, initialStartDate, initialEndDate }: DateRangeSelectorProps) {
  const { language } = useLanguage();
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [validation, setValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });

  const translations = {
    en: {
      title: "Crop Loss Detection Period",
      beforeDate: "Before (Start Date)",
      afterDate: "After (End Date)",
      duration: "Duration",
      season: "Season",
      analysis: "Analysis",
      quickSelect: "Quick Select",
      months: "Months",
      year: "1 Year",
      seasonGuide: "Agricultural Season Guide",
      kharif: "Kharif (Jun-Oct): Monsoon crops - Rice, Cotton, Sugarcane",
      rabi: "Rabi (Nov-Apr): Winter crops - Wheat, Barley, Mustard",
      zaid: "Zaid (Apr-Jun): Summer crops - Fodder, Vegetables",
      analysisText: "Comparing crop health between these periods",
      days: "days"
    },
    hi: {
      title: "फसल हानि पहचान अवधि",
      beforeDate: "पहले (शुरुआती तारीख)",
      afterDate: "बाद (अंतिम तारीख)",
      duration: "अवधि",
      season: "मौसम",
      analysis: "विश्लेषण",
      quickSelect: "तुरंत चुनें",
      months: "महीने",
      year: "1 साल",
      seasonGuide: "कृषि मौसम गाइड",
      kharif: "खरीफ (जून-अक्तू): मानसून फसलें - धान, कपास, गन्ना",
      rabi: "रबी (नवं-अप्रैल): सर्दी फसलें - गेहूं, जौ, सरसों",
      zaid: "ज़ायद (अप्रैल-जून): गर्मी फसलें - चारा, सब्जियां",
      analysisText: "इन अवधियों के बीच फसल के स्वास्थ्य की तुलना",
      days: "दिन"
    },
    te: {
      title: "పంట నష్ట గుర్తింపు కాలం",
      beforeDate: "ముందు (ప్రారంభ తేదీ)",
      afterDate: "తర్వాత (అంతిమ తేదీ)",
      duration: "వారాలు",
      season: "ఋతువు",
      analysis: "విశ్లేషణ",
      quickSelect: "వేగంగా ఎంచుకోండి",
      months: "నెలలు",
      year: "1 సంవత్సరం",
      seasonGuide: "వ్యవసాయ ఋతువు గైడ్",
      kharif: "ఖరీఫ్ (జూన్-అక్టో): వర్ష పంటలు - వరి, పత్తి, చెరకు",
      rabi: "రబీ (నవం-ఏప్రిల్): శీతకాల పంటలు - గోధుమ, బార్లీ, ఆవాలు",
      zaid: "జాయిద్ (ఏప్రిల్-జూన్): వేసవి పంటలు - పశుమి, కూరగాయలు",
      analysisText: "ఈ కాలాల మధ్య పంట ఆరోగ్యాన్ని పోలించడం",
      days: "రోజులు"
    }
  };

  // Auto-set default date range (3 months apart)
  useEffect(() => {
    if (!initialStartDate && !initialEndDate) {
      const today = new Date();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const endDateStr = today.toISOString().split('T')[0];
      const startDateStr = threeMonthsAgo.toISOString().split('T')[0];
      
      setEndDate(endDateStr);
      setStartDate(startDateStr);
      onDateRangeChange(startDateStr, endDateStr);
    }
  }, [initialStartDate, initialEndDate, onDateRangeChange]);

  const validateDateRange = (start: string, end: string) => {
    if (!start || !end) {
      return { valid: false, message: 'Both start and end dates are required' };
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const now = new Date();

    if (startDateObj >= endDateObj) {
      return { valid: false, message: 'Start date must be before end date' };
    }

    if (endDateObj > now) {
      return { valid: false, message: 'End date cannot be in the future' };
    }

    const diffMonths = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + 
                      (endDateObj.getMonth() - startDateObj.getMonth());

    if (diffMonths < 1) {
      return { valid: false, message: 'Date range should be at least 1 month for meaningful crop analysis' };
    }

    if (diffMonths > 12) {
      return { valid: false, message: 'Date range should not exceed 12 months for accurate comparison' };
    }

    return { valid: true };
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newStartDate = type === 'start' ? value : startDate;
    const newEndDate = type === 'end' ? value : endDate;

    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }

    if (newStartDate && newEndDate) {
      const validation = validateDateRange(newStartDate, newEndDate);
      setValidation(validation);
      
      if (validation.valid) {
        onDateRangeChange(newStartDate, newEndDate);
      }
    }
  };

  const getDateRangeInfo = () => {
    if (!startDate || !endDate || !validation.valid) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30);

    return {
      days: diffDays,
      months: diffMonths,
      season: getSeason(start, end)
    };
  };

  const getSeason = (start: Date, end: Date) => {
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    
    // Indian agricultural seasons
    if ((startMonth >= 5 && startMonth <= 9) || (endMonth >= 5 && endMonth <= 9)) {
      return 'Kharif (Monsoon)';
    } else if ((startMonth >= 10 && startMonth <= 3) || (endMonth >= 10 && endMonth <= 3)) {
      return 'Rabi (Winter)';
    } else {
      return 'Zaid (Summer)';
    }
  };

  const setPresetRange = (months: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setMonth(today.getMonth() - months);
    
    const endDateStr = today.toISOString().split('T')[0];
    const startDateStr = pastDate.toISOString().split('T')[0];
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    const validation = validateDateRange(startDateStr, endDateStr);
    setValidation(validation);
    
    if (validation.valid) {
      onDateRangeChange(startDateStr, endDateStr);
    }
  };

  const dateInfo = getDateRangeInfo();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>{translations[language].title}</span>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() => (window as any).setLanguage?.('en')}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
            >
              🇺🇸
            </Button>
            <Button
              onClick={() => (window as any).setLanguage?.('hi')}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
            >
              🇮🇳
            </Button>
            <Button
              onClick={() => (window as any).setLanguage?.('te')}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
            >
              తె
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">{translations[language].beforeDate}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className={`mt-1 ${!validation.valid ? 'border-red-500' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">{translations[language].afterDate}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className={`mt-1 ${!validation.valid ? 'border-red-500' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Validation Message */}
        {!validation.valid && validation.message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validation.message}</AlertDescription>
          </Alert>
        )}


        {/* Preset Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">{translations[language].quickSelect}:</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange(3)}
              className="text-xs"
            >
              3 {translations[language].months}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange(6)}
              className="text-xs"
            >
              6 {translations[language].months}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange(9)}
              className="text-xs"
            >
              9 {translations[language].months}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange(12)}
              className="text-xs"
            >
              {translations[language].year}
            </Button>
          </div>
        </div>

        {/* Agricultural Season Info */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-2">{translations[language].seasonGuide}:</h4>
          <div className="text-xs text-green-700 space-y-1">
            <p><strong>{translations[language].kharif}</strong></p>
            <p><strong>{translations[language].rabi}</strong></p>
            <p><strong>{translations[language].zaid}</strong></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}