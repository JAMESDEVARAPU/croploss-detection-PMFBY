import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WakeWordContextType {
  isWakeWordActive: boolean;
  isListening: boolean;
  lastWakeWordTime: Date | null;
  startWakeWord: () => Promise<void>;
  stopWakeWord: () => Promise<void>;
  onWakeWordDetected: (callback: (detected: boolean) => void) => void;
}

const WakeWordContext = createContext<WakeWordContextType | undefined>(undefined);

interface WakeWordProviderProps {
  children: ReactNode;
}

export function WakeWordProvider({ children }: WakeWordProviderProps) {
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastWakeWordTime, setLastWakeWordTime] = useState<Date | null>(null);
  const [callbacks, setCallbacks] = useState<((detected: boolean) => void)[]>([]);

  const startWakeWord = async () => {
    try {
      const response = await fetch("/api/wakeword/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const result = await response.json();
      if (result.success) {
        setIsWakeWordActive(true);
      }
    } catch (error) {
      console.error("Failed to start wake word:", error);
      throw error;
    }
  };

  const stopWakeWord = async () => {
    try {
      const response = await fetch("/api/wakeword/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const result = await response.json();
      if (result.success) {
        setIsWakeWordActive(false);
        setIsListening(false);
      }
    } catch (error) {
      console.error("Failed to stop wake word:", error);
      throw error;
    }
  };

  const onWakeWordDetected = (callback: (detected: boolean) => void) => {
    setCallbacks(prev => [...prev, callback]);
  };

  // Status polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWakeWordActive) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/wakeword/status");
          const result = await response.json();
          
          if (result.success) {
            const wasListening = isListening;
            const nowListening = result.status.isListening;
            
            setIsListening(nowListening);
            
            // Trigger callbacks when wake word is detected
            if (!wasListening && nowListening) {
              setLastWakeWordTime(new Date());
              callbacks.forEach(callback => callback(true));
            } else if (wasListening && !nowListening) {
              callbacks.forEach(callback => callback(false));
            }
          }
        } catch (error) {
          console.error("Wake word status polling error:", error);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWakeWordActive, isListening, callbacks]);

  const value = {
    isWakeWordActive,
    isListening,
    lastWakeWordTime,
    startWakeWord,
    stopWakeWord,
    onWakeWordDetected,
  };

  return (
    <WakeWordContext.Provider value={value}>
      {children}
    </WakeWordContext.Provider>
  );
}

export function useWakeWord() {
  const context = useContext(WakeWordContext);
  if (context === undefined) {
    throw new Error("useWakeWord must be used within a WakeWordProvider");
  }
  return context;
}