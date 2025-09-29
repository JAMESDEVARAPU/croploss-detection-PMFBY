// Geolocation utilities for accurate location detection

export interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Get current location with high accuracy
 */
export function getCurrentLocation(options: GeolocationOptions = {}): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation is not supported by this browser'
      });
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0 // Force fresh location
    };

    // Try multiple times for better accuracy
    let attempts = 0;
    const maxAttempts = 3;
    const locations: LocationResult[] = [];

    const tryGetLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            success: true,
            latitude: parseFloat(position.coords.latitude.toFixed(8)),
            longitude: parseFloat(position.coords.longitude.toFixed(8)),
            accuracy: position.coords.accuracy
          };
          
          locations.push(result);
          attempts++;

          // If accuracy is good enough or max attempts reached
          if (position.coords.accuracy <= 50 || attempts >= maxAttempts) {
            // Return the most accurate location
            const bestLocation = locations.reduce((best, current) => 
              (current.accuracy && best.accuracy && current.accuracy < best.accuracy) ? current : best
            );
            resolve(bestLocation);
          } else {
            // Try again for better accuracy
            setTimeout(tryGetLocation, 1000);
          }
        },
        (error) => {
          attempts++;
          
          if (attempts >= maxAttempts || locations.length > 0) {
            if (locations.length > 0) {
              // Return best available location
              const bestLocation = locations.reduce((best, current) => 
                (current.accuracy && best.accuracy && current.accuracy < best.accuracy) ? current : best
              );
              resolve(bestLocation);
            } else {
              let errorMessage = 'Unable to get location';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location access denied by user';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
              }

              resolve({
                success: false,
                error: errorMessage
              });
            }
          } else {
            // Try again
            setTimeout(tryGetLocation, 1000);
          }
        },
        defaultOptions
      );
    };

    tryGetLocation();
  });
}

/**
 * Watch location changes (useful for mobile users moving around fields)
 */
export function watchLocation(
  callback: (result: LocationResult) => void,
  options: GeolocationOptions = {}
): number | null {
  if (!navigator.geolocation) {
    callback({
      success: false,
      error: 'Geolocation is not supported by this browser'
    });
    return null;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 30000
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        success: true,
        latitude: parseFloat(position.coords.latitude.toFixed(6)),
        longitude: parseFloat(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      let errorMessage = 'Unable to watch location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }

      callback({
        success: false,
        error: errorMessage
      });
    },
    defaultOptions
  );
}

/**
 * Stop watching location
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if coordinates are within India (enhanced validation)
 */
export function isLocationInIndia(latitude: number, longitude: number): boolean {
  // India's precise bounding box
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
 * Validate GPS coordinates accuracy
 */
export function validateGPSAccuracy(accuracy: number): {
  isAccurate: boolean;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
} {
  if (accuracy <= 5) {
    return {
      isAccurate: true,
      level: 'excellent',
      message: 'Excellent GPS accuracy (±5m)'
    };
  } else if (accuracy <= 15) {
    return {
      isAccurate: true,
      level: 'good', 
      message: 'Good GPS accuracy (±15m)'
    };
  } else if (accuracy <= 100) {
    return {
      isAccurate: false,
      level: 'fair',
      message: 'Fair GPS accuracy (±100m) - Consider retrying'
    };
  } else if (accuracy <= 1000) {
    return {
      isAccurate: false,
      level: 'poor',
      message: `Poor GPS accuracy (±${Math.round(accuracy)}m) - Switching to offline mode`
    };
  } else {
    return {
      isAccurate: false,
      level: 'poor',
      message: `Very poor GPS accuracy (±${Math.round(accuracy/1000)}km) - Using offline data`
    };
  }
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get location accuracy description
 */
export function getAccuracyDescription(accuracy: number): string {
  if (accuracy <= 3) return 'Excellent (±3m)';
  if (accuracy <= 5) return 'Very Good (±5m)';
  if (accuracy <= 10) return 'Good (±10m)';
  if (accuracy <= 20) return 'Fair (±20m)';
  if (accuracy <= 50) return 'Poor (±50m)';
  return 'Very Poor (±' + Math.round(accuracy) + 'm)';
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(latitude).toFixed(6)}°${latDir}, ${Math.abs(longitude).toFixed(6)}°${lonDir}`;
}

/**
 * Get location permission status
 */
export async function getLocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (!navigator.permissions) {
    return 'unsupported';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    return 'unsupported';
  }
}

/**
 * Get location from offline CSV data when GPS is unavailable
 */
export async function getOfflineLocation(): Promise<LocationResult> {
  try {
    // Try to get location from offline CSV data
    const response = await fetch('/api/offline-location');
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 100 // Estimated accuracy for offline data
      };
    }
  } catch (error) {
    console.error('Offline location error:', error);
  }
  
  return {
    success: false,
    error: 'Offline location data not available'
  };
}

/**
 * Get location with offline fallback
 */
export async function getLocationWithFallback(): Promise<LocationResult> {
  // First try GPS
  const gpsResult = await getCurrentLocation();
  
  if (gpsResult.success) {
    return gpsResult;
  }
  
  // Fallback to offline data
  console.log('GPS failed, trying offline location...');
  return await getOfflineLocation();
}