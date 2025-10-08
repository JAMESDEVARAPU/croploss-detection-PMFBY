import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisResults } from "@/components/analysis-results";
import { XAIExplanationEnhanced } from "@/components/xai-explanation-enhanced";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { CropAnalysis } from "@shared/schema";

export default function AnalysisDetail() {
  const [match, params] = useRoute("/analysis/:id");
  const { language } = useLanguage();
  const analysisId = params?.id;

  const { data: analysis, isLoading, error } = useQuery<CropAnalysis>({
    queryKey: ['/api/crop-analysis', analysisId],
    enabled: !!analysisId,
  });

  const handleBack = () => {
    window.close();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading analysis...' : 
             language === 'hi' ? 'विश्लेषण लोड हो रहा है...' : 
             'విశ్లేషణ లోడ్ అవుతోంది...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">
              {language === 'en' ? 'Analysis Not Found' : 
               language === 'hi' ? 'विश्लेषण नहीं मिला' : 
               'విశ్లేషణ కనుగొనబడలేదు'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {language === 'en' ? 'The requested analysis could not be found.' : 
               language === 'hi' ? 'अनुरोधित विश्लेषण नहीं मिल सका।' : 
               'అభ్యర్థించిన విశ్లేషణ కనుగొనబడలేదు.'}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Go Back' : 
               language === 'hi' ? 'वापस जाएं' : 
               'వెనక్కి వెళ్ళండి'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Back' : 
               language === 'hi' ? 'वापस' : 
               'వెనక్కి'}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {language === 'en' ? 'Crop Loss Analysis' : 
               language === 'hi' ? 'फसल नुकसान विश्लेषण' : 
               'పంట నష్ట విశ్లేషణ'}
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalysisResults 
          analysis={analysis} 
          isLoading={false} 
        />
        
        {analysis?.lossPercentage && (
          <div className="mt-8">
            <XAIExplanationEnhanced analysis={analysis} />
          </div>
        )}
      </main>
    </div>
  );
}
