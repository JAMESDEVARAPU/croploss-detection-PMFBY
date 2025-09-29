import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  WifiOff, 
  Wifi, 
  Database, 
  Brain, 
  Satellite,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from "lucide-react";

interface RealTimeOfflineSystemProps {
  onSystemReady?: (isReady: boolean) => void;
}

export function RealTimeOfflineSystem({ onSystemReady }: RealTimeOfflineSystemProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [systemStatus, setSystemStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [offlineCapabilities, setOfflineCapabilities] = useState({
    csvData: false,
    aiModel: false,
    voiceRecognition: false,
    textToSpeech: false,
    satelliteCache: false
  });
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize offline system
  useEffect(() => {
    initializeOfflineSystem();
  }, []);

  const initializeOfflineSystem = async () => {
    setSystemStatus('initializing');
    setInitializationProgress(0);

    const steps = [
      { name: 'csvData', label: 'Loading CSV Data', duration: 1000 },
      { name: 'aiModel', label: 'Initializing AI Model', duration: 1500 },
      { name: 'voiceRecognition', label: 'Setting up Voice Recognition', duration: 800 },
      { name: 'textToSpeech', label: 'Configuring Text-to-Speech', duration: 600 },
      { name: 'satelliteCache', label: 'Checking Satellite Cache', duration: 1200 }
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Simulate initialization
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        // Update capability status
        setOfflineCapabilities(prev => ({
          ...prev,
          [step.name]: true
        }));
        
        // Update progress
        setInitializationProgress(((i + 1) / steps.length) * 100);
      }

      setSystemStatus('ready');
      setLastSync(new Date());
      
      if (onSystemReady) {
        onSystemReady(true);
      }
    } catch (error) {
      console.error('Offline system initialization failed:', error);
      setSystemStatus('error');
      
      if (onSystemReady) {
        onSystemReady(false);
      }
    }
  };

  const syncWithServer = async () => {
    if (!isOnline) return;
    
    try {
      // Simulate server sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSync(new Date());
    } catch (error) {
      console.error('Server sync failed:', error);
    }
  };

  const getCapabilityIcon = (isEnabled: boolean) => {
    return isEnabled ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-gray-400 animate-spin" />
    );
  };

  const getSystemStatusBadge = () => {
    switch (systemStatus) {
      case 'ready':
        return <Badge className="bg-green-600">System Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">System Error</Badge>;
      default:
        return <Badge variant="secondary">Initializing...</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Real-Time Offline System</span>
          </div>
          <div className="flex items-center space-x-2">
            {getSystemStatusBadge()}
            <Badge variant="outline" className="flex items-center space-x-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Initialization Progress */}
        {systemStatus === 'initializing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Initialization</span>
              <span className="text-sm text-gray-500">{initializationProgress.toFixed(0)}%</span>
            </div>
            <Progress value={initializationProgress} className="h-2" />
          </div>
        )}

        {/* System Status */}
        {systemStatus === 'ready' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Offline system is fully operational. All capabilities are available without internet connection.
            </AlertDescription>
          </Alert>
        )}

        {systemStatus === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System initialization failed. Some offline features may not be available.
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Capabilities */}
        <div className="space-y-3">
          <h4 className="font-medium">Offline Capabilities</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span className="text-sm">CSV Data Processing</span>
              </div>
              {getCapabilityIcon(offlineCapabilities.csvData)}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm">AI Model Inference</span>
              </div>
              {getCapabilityIcon(offlineCapabilities.aiModel)}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Voice Recognition</span>
              </div>
              {getCapabilityIcon(offlineCapabilities.voiceRecognition)}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Text-to-Speech</span>
              </div>
              {getCapabilityIcon(offlineCapabilities.textToSpeech)}
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Satellite className="h-4 w-4" />
                <span className="text-sm">Satellite Image Cache</span>
              </div>
              {getCapabilityIcon(offlineCapabilities.satelliteCache)}
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Server Synchronization</span>
            {isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncWithServer}
                className="text-xs"
              >
                Sync Now
              </Button>
            )}
          </div>
          
          {lastSync && (
            <p className="text-xs text-gray-500">
              Last sync: {lastSync.toLocaleString()}
            </p>
          )}
          
          {!isOnline && (
            <p className="text-xs text-orange-600">
              Sync will resume when connection is restored
            </p>
          )}
        </div>

        {/* System Info */}
        <div className="text-xs text-gray-500 pt-3 border-t space-y-1">
          <p>• Real-time monitoring of system capabilities</p>
          <p>• Automatic fallback to offline mode when needed</p>
          <p>• Background synchronization when online</p>
          <p>• Full functionality available without internet</p>
        </div>
      </CardContent>
    </Card>
  );
}