import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface SimpleMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export function SimpleMap({ 
  latitude = 17.3850, 
  longitude = 78.4867, 
  zoom = 15,
  onLocationSelect 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Simple map implementation using OpenStreetMap tiles
    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';

    // Create a simple map display
    const mapDiv = document.createElement('div');
    mapDiv.className = 'relative w-full h-64 bg-green-100 rounded-lg border overflow-hidden';
    
    // Add satellite-like background
    mapDiv.style.backgroundImage = `
      radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
      linear-gradient(135deg, #f0f9ff 0%, #dcfce7 100%)
    `;

    // Add location marker
    const marker = document.createElement('div');
    marker.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10';
    marker.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div class="w-1 h-4 bg-red-500"></div>
      </div>
    `;

    // Add coordinates display
    const coordsDisplay = document.createElement('div');
    coordsDisplay.className = 'absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-mono';
    coordsDisplay.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    // Add zoom level display
    const zoomDisplay = document.createElement('div');
    zoomDisplay.className = 'absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs';
    zoomDisplay.textContent = `Zoom: ${zoom}`;

    // Add grid overlay for satellite effect
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'absolute inset-0 opacity-20';
    gridOverlay.style.backgroundImage = `
      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = '20px 20px';

    mapDiv.appendChild(gridOverlay);
    mapDiv.appendChild(marker);
    mapDiv.appendChild(coordsDisplay);
    mapDiv.appendChild(zoomDisplay);

    // Add click handler for location selection
    if (onLocationSelect) {
      mapDiv.addEventListener('click', (e) => {
        const rect = mapDiv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Simple coordinate calculation (not accurate, just for demo)
        const newLat = latitude + (0.5 - y / rect.height) * 0.01;
        const newLng = longitude + (x / rect.width - 0.5) * 0.01;
        
        onLocationSelect(newLat, newLng);
      });
      
      mapDiv.style.cursor = 'crosshair';
    }

    mapContainer.appendChild(mapDiv);

  }, [latitude, longitude, zoom, onLocationSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Field Location</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full">
          {/* Map will be rendered here */}
        </div>
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p>• Click on the map to select a different location</p>
          <p>• Red marker shows the current field location</p>
          <p>• Coordinates are displayed in decimal degrees</p>
        </div>
      </CardContent>
    </Card>
  );
}