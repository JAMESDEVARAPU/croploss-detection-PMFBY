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
      const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${this.API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.location) {
        const address = await this.getAddress(data.location.lat, data.location.lng);
        
        return {
          success: true,
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy || 100,
          address
        };
      }
      
      return { success: false, error: 'No location data received' };
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
  
  /**
   * Optimized GPS with multiple attempts and accuracy improvement
   */
  private static async tryOptimizedGPS(): Promise<GoogleMapsLocationResult> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'GPS not supported' });
        return;
      }
      
      let bestResult: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      const tryGPS = () => {
        attempts++;
        console.log(`🛰️ GPS attempt ${attempts}/${maxAttempts}`);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const currentResult = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            
            // Keep the most accurate result
            if (!bestResult || currentResult.accuracy < bestResult.accuracy) {
              bestResult = currentResult;
            }
            
            // If accuracy is excellent or max attempts reached, return result
            if (currentResult.accuracy <= 10 || attempts >= maxAttempts) {
              // Try to get address
              const address = await this.reverseGeocode(bestResult.latitude, bestResult.longitude);
              
              resolve({
                success: true,
                latitude: bestResult.latitude,
                longitude: bestResult.longitude,
                accuracy: bestResult.accuracy,
                address: address
              });
            } else {
              // Try again for better accuracy
              setTimeout(tryGPS, 2000);
            }
          },
          (error) => {
            if (attempts >= maxAttempts) {
              if (bestResult) {
                resolve({
                  success: true,
                  latitude: bestResult.latitude,
                  longitude: bestResult.longitude,
                  accuracy: bestResult.accuracy
                });
              } else {
                resolve({ success: false, error: error.message });
              }
            } else {
              setTimeout(tryGPS, 1000);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      };
      
      tryGPS();
    });
  }
  
  /**
   * Network-based location using lower accuracy GPS
   */
  private static async tryNetworkLocation(): Promise<GoogleMapsLocationResult> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const address = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
          
          resolve({
            success: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: address
          });
        },
        (error) => {
          resolve({ success: false, error: error.message });
        },
        {
          enableHighAccuracy: false, // Use network location
          timeout: 10000,
          maximumAge: 300000 // Allow 5 minute old location
        }
      );
    });
  }
  
  /**
   * IP-based geolocation as final fallback
   */
  private static async tryIPGeolocation(): Promise<GoogleMapsLocationResult> {
    try {
      // Try multiple IP geolocation services
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://ipinfo.io/json'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          let lat, lng;
          
          if (service.includes('ipapi.co')) {
            lat = data.latitude;
            lng = data.longitude;
          } else if (service.includes('ip-api.com')) {
            lat = data.lat;
            lng = data.lon;
          } else if (service.includes('ipinfo.io')) {
            const [latStr, lngStr] = (data.loc || '').split(',');
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
          }
          
          if (lat && lng) {
            const address = await this.reverseGeocode(lat, lng);
            
            return {
              success: true,
              latitude: lat,
              longitude: lng,
              accuracy: 10000, // City-level accuracy
              address: address
            };
          }
        } catch (error) {
          console.log(`IP service ${service} failed:`, error);
          continue;
        }
      }
      
      return { success: false, error: 'All IP geolocation services failed' };
      
    } catch (error) {
      return { success: false, error: 'IP geolocation failed' };
    }
  }
  
  /**
   * Reverse geocoding to get address from coordinates
   */
  private static async reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
    if (!this.API_KEY) return undefined;
    
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
      console.error('Reverse geocoding failed:', error);
    }
    
    return undefined;
  }
  
  /**
   * Gather location data for Google Geolocation API
   */
  private static async gatherLocationData(): Promise<{
    wifiAccessPoints: any[];
    cellTowers: any[];
  }> {
    // In a real mobile app, this would scan for actual WiFi networks and cell towers
    // For web, we simulate this data or use available network information
    
    const wifiAccessPoints: any[] = [];
    const cellTowers: any[] = [];
    
    // Try to get network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Simulate WiFi access point data
        wifiAccessPoints.push({
          macAddress: '00:00:00:00:00:00', // Placeholder
          signalStrength: -50,
          channel: 6
        });
      }
    }
    
    return { wifiAccessPoints, cellTowers };
  }
  
  /**
   * Continuous location tracking with Google Maps-like behavior
   */
  static watchEnhancedLocation(
    callback: (result: GoogleMapsLocationResult) => void,
    options: {
      highAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    } = {}
  ): number | null {
    
    if (!navigator.geolocation) {
      callback({ success: false, error: 'Geolocation not supported' });
      return null;
    }
    
    const watchOptions: PositionOptions = {
      enableHighAccuracy: options.highAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 30000
    };
    
    return navigator.geolocation.watchPosition(
      async (position) => {
        const address = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        
        callback({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: address,
          method: 'GPS Watch'
        });
      },
      (error) => {
        callback({ success: false, error: error.message });
      },
      watchOptions
    );
  }
  
  /**
   * Get location with address information
   */
  static async getLocationWithAddress(): Promise<GoogleMapsLocationResult> {
    const result = await this.getEnhancedLocation();
    
    if (result.success && result.latitude && result.longitude && !result.address) {
      result.address = await this.reverseGeocode(result.latitude, result.longitude);
    }
    
    return result;
  }
}