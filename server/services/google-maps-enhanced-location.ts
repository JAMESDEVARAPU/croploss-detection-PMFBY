// Server-side Google Maps Enhanced Location Service
import https from 'https';
import http from 'http';

interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  method?: string;
  error?: string;
  address?: string;
}

export class GoogleMapsEnhancedLocationService {
  private static readonly API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  /**
   * Get enhanced location using Google Maps Geolocation API
   */
  static async getEnhancedLocation(): Promise<LocationResult> {
    console.log('🎯 Server: Starting enhanced Google Maps location detection...');
    
    // Method 1: Try Google Maps Geolocation API
    const googleApiResult = await this.tryGoogleGeolocationAPI();
    if (googleApiResult.success && googleApiResult.accuracy && googleApiResult.accuracy <= 100) {
      console.log('✅ Server: Google Geolocation API successful');
      return { ...googleApiResult, method: 'Google Geolocation API' };
    }
    
    // Method 2: Try IP-based geolocation
    const ipResult = await this.tryIPGeolocation();
    if (ipResult.success) {
      console.log('✅ Server: IP geolocation successful');
      return { ...ipResult, method: 'IP Geolocation' };
    }
    
    // Method 3: Fallback to default Indian location
    console.log('⚠️ Server: All methods failed, using default location');
    return {
      success: true,
      latitude: 20.5937,
      longitude: 78.9629,
      accuracy: 50000, // Country-level accuracy
      method: 'Default (India Center)',
      address: 'India'
    };
  }
  
  /**
   * Use Google Maps Geolocation API for server-side location
   */
  private static async tryGoogleGeolocationAPI(): Promise<LocationResult> {
    if (!this.API_KEY) {
      console.log('⚠️ Server: Google Maps API key not found');
      return { success: false, error: 'Google Maps API key not configured' };
    }
    
    try {
      const requestBody = JSON.stringify({
        considerIp: true,
        // For server-side, we can't get actual WiFi/cell data
        // but we can still use IP-based location
      });
      
      const result = await this.makeHttpsRequest(
        'www.googleapis.com',
        `/geolocation/v1/geolocate?key=${this.API_KEY}`,
        'POST',
        requestBody,
        { 'Content-Type': 'application/json' }
      );
      
      if (result.success && result.data) {
        const data = JSON.parse(result.data);
        
        if (data.location) {
          // Get address using reverse geocoding
          const address = await this.reverseGeocode(data.location.lat, data.location.lng);
          
          return {
            success: true,
            latitude: data.location.lat,
            longitude: data.location.lng,
            accuracy: data.accuracy || 1000,
            address: address
          };
        }
      }
      
      console.log('Server: Google Geolocation API response not successful');
      return { success: false, error: 'Google API request failed' };
      
    } catch (error) {
      console.error('Server: Google Geolocation API error:', error);
      return { success: false, error: 'Google API error' };
    }
  }
  
  /**
   * IP-based geolocation as fallback
   */
  private static async tryIPGeolocation(): Promise<LocationResult> {
    try {
      // Try multiple IP geolocation services
      const services = [
        { host: 'ipapi.co', path: '/json/' },
        { host: 'ip-api.com', path: '/json/' },
        { host: 'ipinfo.io', path: '/json' }
      ];
      
      for (const service of services) {
        try {
          const result = await this.makeHttpsRequest(service.host, service.path, 'GET');
          
          if (result.success && result.data) {
            const data = JSON.parse(result.data);
            
            let lat, lng, city, country;
            
            if (service.host.includes('ipapi.co')) {
              lat = data.latitude;
              lng = data.longitude;
              city = data.city;
              country = data.country_name;
            } else if (service.host.includes('ip-api.com')) {
              lat = data.lat;
              lng = data.lon;
              city = data.city;
              country = data.country;
            } else if (service.host.includes('ipinfo.io')) {
              const [latStr, lngStr] = (data.loc || '').split(',');
              lat = parseFloat(latStr);
              lng = parseFloat(lngStr);
              city = data.city;
              country = data.country;
            }
            
            if (lat && lng) {
              const address = city && country ? `${city}, ${country}` : country || 'Unknown';
              
              return {
                success: true,
                latitude: lat,
                longitude: lng,
                accuracy: 10000, // City-level accuracy
                address: address
              };
            }
          }
        } catch (error) {
          console.log(`Server: IP service ${service.host} failed:`, error);
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
      const result = await this.makeHttpsRequest(
        'maps.googleapis.com',
        `/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.API_KEY}`,
        'GET'
      );
      
      if (result.success && result.data) {
        const data = JSON.parse(result.data);
        if (data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      }
    } catch (error) {
      console.error('Server: Reverse geocoding failed:', error);
    }
    
    return undefined;
  }
  
  /**
   * Get location with address information
   */
  static async getLocationWithAddress(): Promise<LocationResult> {
    const result = await this.getEnhancedLocation();
    
    if (result.success && result.latitude && result.longitude && !result.address) {
      result.address = await this.reverseGeocode(result.latitude, result.longitude);
    }
    
    return result;
  }
  
  /**
   * Make HTTPS request helper
   */
  private static makeHttpsRequest(
    hostname: string,
    path: string,
    method: string = 'GET',
    data?: string,
    headers?: Record<string, string>
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    return new Promise((resolve) => {
      const options = {
        hostname,
        path,
        method,
        headers: {
          'User-Agent': 'CropLoss-Detection-PMFBY/1.0',
          ...headers
        }
      };
      
      const protocol = hostname.includes('localhost') ? http : https;
      const req = protocol.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: responseData });
          } else {
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
      
      if (data) {
        req.write(data);
      }
      
      req.end();
    });
  }
  
  /**
   * Validate if coordinates are within India
   */
  static isLocationInIndia(latitude: number, longitude: number): boolean {
    // India's bounding box
    const INDIA_BOUNDS = {
      north: 37.6,
      south: 6.4,
      east: 97.25,
      west: 68.7
    };
    
    return (
      latitude >= INDIA_BOUNDS.south &&
      latitude <= INDIA_BOUNDS.north &&
      longitude >= INDIA_BOUNDS.west &&
      longitude <= INDIA_BOUNDS.east
    );
  }
  
  /**
   * Get nearest Indian location if coordinates are outside India
   */
  static getNearestIndianLocation(latitude: number, longitude: number): LocationResult {
    if (this.isLocationInIndia(latitude, longitude)) {
      return {
        success: true,
        latitude,
        longitude,
        accuracy: 0,
        method: 'Validated Indian Location'
      };
    }
    
    // Return center of India if outside bounds
    return {
      success: true,
      latitude: 20.5937,
      longitude: 78.9629,
      accuracy: 50000,
      method: 'Corrected to India Center',
      address: 'India (Corrected Location)'
    };
  }
}