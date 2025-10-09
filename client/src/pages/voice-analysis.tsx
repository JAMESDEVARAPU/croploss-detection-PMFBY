import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Radio } from "lucide-react";
import { ConversationalVoiceAssistant } from "@/components/conversational-voice-assistant";
import { AnalysisResults } from "@/components/analysis-results";
import { XAIExplanationEnhanced } from "@/components/xai-explanation-enhanced";
import backgroundImage from "@assets/seva_1759926468291.jpg";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CropAnalysis } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface VoiceAnalysisProps {
  user: any;
}

export default function VoiceAnalysis({ user }: VoiceAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<CropAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/crop-analysis', {
        name: data.userName,
        mobileNumber: user.mobileNumber,
        latitude: data.latitude,
        longitude: data.longitude,
        fieldArea: data.fieldArea,
        cropType: 'rice',
      });
      return await response.json();
    },
    onSuccess: (data: CropAnalysis) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Your crop loss analysis is ready!",
      });
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleVoiceAnalysisComplete = async (data: any) => {
    console.log('Voice analysis completed:', data);
    setIsAnalyzing(true);
    analysisMutation.mutate(data);
  };

  return (
    <div 
      className="min-h-screen pb-20 relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white/85 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10">
        <header className="bg-white/95 backdrop-blur shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 space-x-3">
              <Mic className="text-green-600 h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">Voice-Guided Analysis</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Radio className="h-5 w-5 text-green-600" />
                <span>Voice Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConversationalVoiceAssistant
                user={user}
                onAnalysisComplete={handleVoiceAnalysisComplete}
              />
              
              {isAnalyzing && (
                <div className="mt-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Analyzing your field with satellite data...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {analysisResult && (
            <>
              <AnalysisResults analysis={analysisResult} />
              <XAIExplanationEnhanced analysis={analysisResult} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
