// Google Cloud Geolocation API - Exact Location Service

interface GoogleCloudLocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  error?: string;
}

export class GoogleCloudLocationService {
  private static readonly API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  /**
   * Get exact location using Google Cloud Geolocation API
   */
  static async getExactLocation(): Promise<GoogleCloudLocationResult> {
    if (!this.API_KEY) {
      return { success: false, error: 'Google Maps API key not configured' };
    }
    
    try {
      const response = await fetch('/api/exact-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Server request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          address: data.address
        };
      }
      
      return { success: false, error: data.error || 'No location data received' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Location request failed' };
    }
  }
  
  /**
   * Get address from coordinates using Google Geocoding API
   */
  private static async getAddress(lat: number, lng: number): Promise<string | undefined> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    return undefined;
  }
}