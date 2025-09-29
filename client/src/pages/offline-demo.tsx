import { RealTimeOfflineSystem } from "@/components/real-time-offline-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Zap } from "lucide-react";

export function OfflineDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            Real-Time Offline Crop Analysis System
            <Badge variant="secondary" className="ml-auto">
              <WifiOff className="h-3 w-3 mr-1" />
              Live Processing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>🎤 Real-time voice recognition with instant processing</p>
            <p>🧠 Live AI explanations with feature importance analysis</p>
            <p>📊 Immediate PMFBY eligibility determination</p>
            <p>🌐 Works completely offline using browser APIs</p>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time System */}
      <RealTimeOfflineSystem />
    </div>
  );
}