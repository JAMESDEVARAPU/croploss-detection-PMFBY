import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useLanguage } from "../hooks/use-language";

interface InteractiveMapProps {
  latitude?: number;
  longitude?: number;
  onCoordinateSelect: (lat: number, lng: number) => void;
}

export function InteractiveMap({ latitude, longitude, onCoordinateSelect }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // In a real implementation, this would integrate with Leaflet or Google Maps
    // For now, we'll create a simple clickable map simulation
    
    const handleMapClick = (event: MouseEvent) => {
      if (!mapRef.current) return;
      
      const rect = mapRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert click position to approximate coordinates (simplified)
      // In real implementation, this would be handled by the mapping library
      const lat = 17.3850 + ((rect.height / 2 - y) / rect.height) * 2;
      const lng = 78.4867 + ((x - rect.width / 2) / rect.width) * 2;
      
      onCoordinateSelect(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
    };

    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener("click", handleMapClick);
      return () => mapElement.removeEventListener("click", handleMapClick);
    }
  }, [onCoordinateSelect]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <MapPin className="h-5 w-5 text-secondary" />
        <h3 className="text-md font-medium text-gray-900">{t("interactiveMap")}</h3>
      </div>
      
      <div
        ref={mapRef}
        data-testid="interactive-map"
        className="map-container rounded-lg border cursor-crosshair bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        {/* Map background simulation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-8 h-8 bg-green-600 rounded-full"></div>
          <div className="absolute top-12 right-8 w-6 h-6 bg-yellow-600 rounded-full"></div>
          <div className="absolute bottom-8 left-12 w-10 h-10 bg-green-700 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 bg-brown-600 rounded-full"></div>
        </div>
        
        {latitude && longitude ? (
          <div className="text-center text-primary bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
            <p className="text-xs text-gray-600">{t("clickMap")}</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-white bg-opacity-90 p-4 rounded-lg shadow-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">{t("clickMap")}</p>
            <p className="text-xs text-gray-400">{t("enterManually")}</p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span>{t("mapHelp")}</span>
      </div>
    </div>
  );
}
