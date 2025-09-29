import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  Mic, 
  Volume2, 
  Activity,
  Circle
} from "lucide-react";

interface WakeWordIndicatorProps {
  isActive?: boolean;
  isListening?: boolean;
  lastWakeWord?: string;
  detectionCount?: number;
}

export function WakeWordIndicator({ 
  isActive = false, 
  isListening = false, 
  lastWakeWord = "",
  detectionCount = 0 
}: WakeWordIndicatorProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isListening) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-64 shadow-lg border-2 border-yellow-200 bg-yellow-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Wake Word Active</span>
            </div>
            <div className="flex items-center space-x-1">
              {isListening ? (
                <Activity className={`h-3 w-3 text-green-600 ${pulseAnimation ? 'animate-pulse' : ''}`} />
              ) : (
                <Circle className="h-3 w-3 text-gray-400" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            {/* Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status:</span>
              <Badge 
                variant={isListening ? "default" : "secondary"} 
                className="text-xs"
              >
                {isListening ? "Listening" : "Standby"}
              </Badge>
            </div>

            {/* Detection Count */}
            {detectionCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Detections:</span>
                <span className="text-xs font-medium">{detectionCount}</span>
              </div>
            )}

            {/* Last Wake Word */}
            {lastWakeWord && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Last:</span>
                <span className="text-xs font-medium">"{lastWakeWord}"</span>
              </div>
            )}

            {/* Visual Indicator */}
            <div className="flex items-center space-x-2 pt-2 border-t border-yellow-200">
              <Mic className="h-3 w-3 text-yellow-600" />
              <div className="flex-1 h-1 bg-yellow-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-yellow-500 transition-all duration-300 ${
                    isListening ? 'w-full animate-pulse' : 'w-0'
                  }`}
                />
              </div>
              <Volume2 className="h-3 w-3 text-yellow-600" />
            </div>
          </div>

          {/* Quick Help */}
          <div className="mt-2 pt-2 border-t border-yellow-200">
            <p className="text-xs text-yellow-700">
              Say wake word + command
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}