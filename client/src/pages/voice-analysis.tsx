import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Radio } from "lucide-react";
import { ConversationalVoiceAssistant } from "@/components/conversational-voice-assistant";
import backgroundImage from "@assets/seva_1759926468291.jpg";

interface VoiceAnalysisProps {
  user: any;
}

export default function VoiceAnalysis({ user }: VoiceAnalysisProps) {
  const handleVoiceAnalysisComplete = async (data: any) => {
    console.log('Voice analysis completed:', data);
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
