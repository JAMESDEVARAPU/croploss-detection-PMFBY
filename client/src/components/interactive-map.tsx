import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Crosshair } from "lucide-react";

interface InteractiveMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  showControls?: boolean;
}

export function InteractiveMap({ 
  latitude = 17.3850, 
  longitude = 78.4867, 
  zoom = 15,
  onLocationSelect,
  showControls = true
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [isDragging, setIsDragging] = useState(false);

  const renderMap = () => {
    if (!mapRef.current) return;

    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';

    // Create interactive map display
    const mapDiv = document.createElement('div');
    mapDiv.className = 'relative w-full h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-lg border overflow-hidden cursor-grab';
    
    // Dynamic background based on zoom level
    const bgIntensity = Math.min(currentZoom / 20, 1);
    mapDiv.style.backgroundImage = `
      radial-gradient(circle at ${50 + (currentLng - longitude) * 100}% ${50 - (currentLat - latitude) * 100}%, 
        rgba(34, 197, 94, ${0.3 * bgIntensity}) 0%, transparent 50%),
      radial-gradient(circle at ${30 + Math.sin(currentLng) * 20}% ${70 + Math.cos(currentLat) * 20}%, 
        rgba(59, 130, 246, ${0.2 * bgIntensity}) 0%, transparent 50%),
      linear-gradient(${currentLng * 2}deg, #f0f9ff 0%, #dcfce7 100%)
    `;

    // Add location marker
    const marker = document.createElement('div');
    marker.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20';
    marker.innerHTML = `
      <div class="flex flex-col items-center animate-bounce">
        <div class="w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div class="w-2 h-6 bg-red-500 transform rotate-45 origin-top"></div>
      </div>
    `;

    // Add crosshair for precision
    const crosshair = document.createElement('div');
    crosshair.className = 'absolute inset-0 pointer-events-none z-10';
    crosshair.innerHTML = `
      <div class="absolute top-1/2 left-0 right-0 h-px bg-red-300 opacity-50"></div>
      <div class="absolute left-1/2 top-0 bottom-0 w-px bg-red-300 opacity-50"></div>
    `;

    // Add grid overlay
    const gridSize = Math.max(10, 40 - currentZoom);
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'absolute inset-0 opacity-20 pointer-events-none';
    gridOverlay.style.backgroundImage = `
      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;

    // Add coordinates display
    const coordsDisplay = document.createElement('div');
    coordsDisplay.className = 'absolute bottom-3 left-3 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm font-mono';
    coordsDisplay.innerHTML = `
      <div>Lat: ${currentLat.toFixed(6)}</div>
      <div>Lng: ${currentLng.toFixed(6)}</div>
    `;

    // Add zoom display
    const zoomDisplay = document.createElement('div');
    zoomDisplay.className = 'absolute top-3 right-3 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm';
    zoomDisplay.textContent = `Zoom: ${currentZoom}x`;

    // Add scale indicator
    const scaleIndicator = document.createElement('div');
    scaleIndicator.className = 'absolute bottom-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded text-xs';
    const scaleKm = (100 / currentZoom).toFixed(1);
    scaleIndicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-10 h-1 bg-black"></div>
        <span>${scaleKm} km</span>
      </div>
    `;

    mapDiv.appendChild(gridOverlay);
    mapDiv.appendChild(crosshair);
    mapDiv.appendChild(marker);
    mapDiv.appendChild(coordsDisplay);
    mapDiv.appendChild(zoomDisplay);
    mapDiv.appendChild(scaleIndicator);

    // Add interaction handlers
    let startX = 0, startY = 0;
    let startLat = currentLat, startLng = currentLng;

    mapDiv.addEventListener('mousedown', (e) => {
      setIsDragging(true);
      startX = e.clientX;
      startY = e.clientY;
      startLat = currentLat;
      startLng = currentLng;
      mapDiv.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const sensitivity = 0.0001 * (20 / currentZoom);
      
      const newLat = startLat + deltaY * sensitivity;
      const newLng = startLng - deltaX * sensitivity;
      
      setCurrentLat(newLat);
      setCurrentLng(newLng);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        setIsDragging(false);
        mapDiv.style.cursor = 'grab';
        if (onLocationSelect) {
          onLocationSelect(currentLat, currentLng);
        }
      }
    });

    // Add click handler for precise location selection
    mapDiv.addEventListener('click', (e) => {
      if (isDragging) return;
      
      const rect = mapDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const sensitivity = 0.001 * (20 / currentZoom);
      const newLat = currentLat + (0.5 - y / rect.height) * sensitivity;
      const newLng = currentLng + (x / rect.width - 0.5) * sensitivity;
      
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      
      if (onLocationSelect) {
        onLocationSelect(newLat, newLng);
      }
    });

    // Add wheel zoom
    mapDiv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(5, Math.min(25, currentZoom + zoomDelta));
      setCurrentZoom(newZoom);
    });

    mapContainer.appendChild(mapDiv);
  };

  useEffect(() => {
    renderMap();
  }, [currentZoom, currentLat, currentLng, isDragging]);

  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(25, prev + 2));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(5, prev - 2));
  };

  const handleReset = () => {
    setCurrentLat(latitude);
    setCurrentLng(longitude);
    setCurrentZoom(zoom);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Interactive Field Map</span>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Crosshair className="h-3 w-3" />
            <span>Interactive</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={mapRef} className="w-full">
          {/* Map will be rendered here */}
        </div>
        
        {showControls && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="flex items-center space-x-1"
              >
                <ZoomIn className="h-4 w-4" />
                <span>Zoom In</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="flex items-center space-x-1"
              >
                <ZoomOut className="h-4 w-4" />
                <span>Zoom Out</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              Drag to pan • Scroll to zoom • Click to select
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Drag the map to explore different areas</p>
          <p>• Use mouse wheel or zoom buttons to change zoom level</p>
          <p>• Click anywhere to set precise field location</p>
          <p>• Red marker shows the selected field coordinates</p>
        </div>
      </CardContent>
    </Card>
  );
}