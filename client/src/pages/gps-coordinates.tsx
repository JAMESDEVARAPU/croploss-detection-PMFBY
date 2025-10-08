import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { EnhancedCoordinateInput } from "@/components/enhanced-coordinate-input";
import { useState } from "react";
import backgroundImage from "@assets/seva_1759926468291.jpg";

interface GpsCoordinatesProps {
  user: any;
}

export default function GpsCoordinates({ user }: GpsCoordinatesProps) {
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const handleAnalysisStart = (id: string) => {
    setAnalysisId(id);
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
              <MapPin className="text-green-600 h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">Krishirakshak</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="h-5 w-5 text-green-600" />
                <span>Crop Loss Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedCoordinateInput
                onAnalysisStart={handleAnalysisStart}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
