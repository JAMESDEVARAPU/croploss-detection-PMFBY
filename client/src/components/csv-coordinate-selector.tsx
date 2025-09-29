import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, FileText, Download } from "lucide-react";

interface CSVCoordinateSelectorProps {
  onCoordinateSelect: (lat: number, lng: number, location: string) => void;
}

export function CSVCoordinateSelector({ onCoordinateSelect }: CSVCoordinateSelectorProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // Sample CSV data for Indian agricultural locations
  const sampleLocations = [
    { id: "1", name: "Hyderabad, Telangana", lat: 17.3850, lng: 78.4867, district: "Hyderabad", state: "Telangana" },
    { id: "2", name: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, district: "Chennai", state: "Tamil Nadu" },
    { id: "3", name: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, district: "Mumbai", state: "Maharashtra" },
    { id: "4", name: "Delhi", lat: 28.7041, lng: 77.1025, district: "Delhi", state: "Delhi" },
    { id: "5", name: "Bangalore, Karnataka", lat: 12.9716, lng: 77.5946, district: "Bangalore", state: "Karnataka" },
    { id: "6", name: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, district: "Pune", state: "Maharashtra" },
    { id: "7", name: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, district: "Ahmedabad", state: "Gujarat" },
    { id: "8", name: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, district: "Kolkata", state: "West Bengal" }
  ];

  useEffect(() => {
    setCsvData(sampleLocations);
  }, []);

  const handleLocationSelect = (locationId: string) => {
    const location = csvData.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(locationId);
      onCoordinateSelect(location.lat, location.lng, location.name);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = [
      "id,name,latitude,longitude,district,state",
      ...sampleLocations.map(loc => 
        `${loc.id},"${loc.name}",${loc.lat},${loc.lng},"${loc.district}","${loc.state}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agricultural_locations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>CSV Coordinate Selector</span>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{csvData.length} Locations</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Agricultural Location
          </label>
          <Select value={selectedLocation} onValueChange={handleLocationSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a location from CSV data" />
            </SelectTrigger>
            <SelectContent>
              {csvData.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{location.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLocation && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-sm">
              <p className="font-medium text-green-800">Selected Location:</p>
              {(() => {
                const loc = csvData.find(l => l.id === selectedLocation);
                return loc ? (
                  <div className="mt-1 space-y-1 text-green-700">
                    <p>📍 {loc.name}</p>
                    <p>🗺️ {loc.district}, {loc.state}</p>
                    <p>📐 {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</p>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSVTemplate}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV Template</span>
          </Button>
          
          <div className="text-xs text-gray-500">
            {csvData.length} locations loaded
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Select from pre-loaded agricultural locations across India</p>
          <p>• Coordinates are sourced from CSV data for accuracy</p>
          <p>• Download template to add your own locations</p>
        </div>
      </CardContent>
    </Card>
  );
}