import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Globe, Users } from "lucide-react";

interface LocationOverviewProps {
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export function LocationOverview({ 
  village = "Unknown", 
  mandal = "Unknown", 
  district = "Unknown", 
  state = "Unknown",
  coordinates 
}: LocationOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Location Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Village</span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{village}</span>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mandal</span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Building className="h-3 w-3" />
                <span>{mandal}</span>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">District</span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{district}</span>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">State</span>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>{state}</span>
              </Badge>
            </div>
          </div>
          
          {coordinates && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">Latitude:</span>
                    <span className="ml-2 font-mono">{coordinates.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Longitude:</span>
                    <span className="ml-2 font-mono">{coordinates.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Administrative Hierarchy</h4>
                <div className="text-xs text-blue-700">
                  {village} → {mandal} → {district} → {state}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-3 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Location data obtained through reverse geocoding</p>
            <p>• Administrative boundaries may vary based on recent changes</p>
            <p>• Coordinates are in WGS84 decimal degrees format</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}