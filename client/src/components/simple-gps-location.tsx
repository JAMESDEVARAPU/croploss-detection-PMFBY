import { useState } from "react";
import { MapPin, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimpleGPSLocationProps {
  onCoordinateSelect: (lat: number, lng: number) => void;
}

export function SimpleGPSLocation({ onCoordinateSelect }: SimpleGPSLocationProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      setLocation({ lat, lng, accuracy });
      onCoordinateSelect(lat, lng);
      
    } catch (error: any) {
      let errorMessage = 'GPS location failed. ';
      
      if (error.code === 1) {
        errorMessage += 'Please allow location access in your browser settings.';
      } else if (error.code === 2) {
        errorMessage += 'GPS signal not available. Try moving outdoors.';
      } else if (error.code === 3) {
        errorMessage += 'GPS timeout. Please enter coordinates manually or try again.';
      } else {
        errorMessage += 'Please enter coordinates manually.';
      }
      
      alert(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        data-testid="button-get-gps"
        onClick={handleGetLocation}
        disabled={isGettingLocation}
        className="flex items-center space-x-2"
      >
        {isGettingLocation ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        <span>{isGettingLocation ? 'Getting...' : 'Get GPS'}</span>
      </Button>

      {location && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-green-800">GPS Location Found</p>
              <p className="text-sm text-green-700">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
              <p className="text-xs text-green-600">
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}