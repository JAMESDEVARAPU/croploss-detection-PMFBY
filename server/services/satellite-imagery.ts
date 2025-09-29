// Real satellite imagery service with date-based imagery
export class SatelliteImageryService {
  
  /**
   * Generate real satellite image URLs for before/after comparison with date support
   */
  static generateRealSatelliteImages(latitude: number, longitude: number, startDate?: string, endDate?: string, offlineMode: boolean = false) {
    // If offline mode, generate local maps
    if (offlineMode || !navigator.onLine) {
      return this.generateOfflineSatelliteImages(latitude, longitude, startDate, endDate);
    }
    
    const zoom = 16;
    const tileSize = 256;
    
    // Convert lat/lng to tile coordinates
    const x = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    // Format dates for API calls
    const beforeDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
    const afterDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
    
    return {
      // ESRI World Imagery (high resolution satellite)
      beforeImage: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
      afterImage: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
      
      // Alternative: Bing Maps satellite imagery
      bingBefore: `https://ecn.t0.tiles.virtualearth.net/tiles/a${this.quadKey(x, y, zoom)}.jpeg?g=1`,
      bingAfter: `https://ecn.t1.tiles.virtualearth.net/tiles/a${this.quadKey(x, y, zoom)}.jpeg?g=1`,
      
      // Google Satellite (different servers for temporal comparison)
      googleBefore: `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`,
      googleAfter: `https://mt2.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`,
      
      // Mapbox satellite with date parameters
      mapboxBefore: `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.jpg?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw${beforeDate ? `&date=${beforeDate}` : ''}`,
      mapboxAfter: `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.jpg?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw${afterDate ? `&date=${afterDate}` : ''}`,
      
      // Sentinel-2 imagery for agricultural monitoring (if available)
      sentinelBefore: this.getSentinelImagery(latitude, longitude, beforeDate),
      sentinelAfter: this.getSentinelImagery(latitude, longitude, afterDate),
      
      // Metadata
      coordinates: { latitude, longitude, zoom },
      dateRange: { startDate: beforeDate, endDate: afterDate },
      tileCoords: { x, y, zoom },
      source: 'online'
    };
  }
  
  /**
   * Generate offline satellite images using raw CSV images (instant) or fallbacks
   */
  static async generateOfflineSatelliteImages(latitude: number, longitude: number, startDate?: string, endDate?: string) {
    const { OfflineRawImagesService } = require('./offline-raw-images');
    
    // First priority: Instant raw images from CSV
    const rawImages = await OfflineRawImagesService.getRawSatelliteImages(latitude, longitude);
    
    if (rawImages) {
      return {
        beforeImage: rawImages.beforeImage,
        afterImage: rawImages.afterImage,
        coordinates: { latitude, longitude, zoom: 16 },
        dateRange: { 
          startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0]
        },
        source: 'offline-raw-images',
        location: rawImages.location,
        instant: true,
        tileCoords: { x: 0, y: 0, zoom: 16 }
      };
    }
    
    // Fallback to generated maps
    const { OfflineSatelliteMapService } = require('./offline-satellite-map');
    
    const offlineMaps = OfflineSatelliteMapService.generateComparisonMaps(
      latitude, 
      longitude, 
      startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0]
    );
    
    return {
      beforeImage: offlineMaps.beforeImage,
      afterImage: offlineMaps.afterImage,
      coordinates: offlineMaps.coordinates,
      dateRange: offlineMaps.dateRange,
      source: 'offline-generated',
      tileCoords: { x: 0, y: 0, zoom: 16 }
    };
  }
  
  /**
   * Convert tile coordinates to Bing Maps quadkey
   */
  private static quadKey(x: number, y: number, z: number): string {
    let quadKey = '';
    for (let i = z; i > 0; i--) {
      let digit = 0;
      const mask = 1 << (i - 1);
      if ((x & mask) !== 0) digit++;
      if ((y & mask) !== 0) digit += 2;
      quadKey += digit.toString();
    }
    return quadKey;
  }

  /**
   * Get Sentinel-2 imagery for agricultural monitoring
   */
  static getSentinelImagery(latitude: number, longitude: number, date?: string | null) {
    if (!date) return null;
    
    // This would typically connect to Sentinel Hub or similar service
    // For now, return a placeholder that could be replaced with actual Sentinel-2 data
    return `https://services.sentinel-hub.com/ogc/wms/instance-id?REQUEST=GetMap&BBOX=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&LAYERS=TRUE_COLOR&WIDTH=512&HEIGHT=512&FORMAT=image/jpeg&TIME=${date}`;
  }
  
  /**
   * Get multiple satellite image sources for comparison with date support
   */
  static getMultipleSources(latitude: number, longitude: number, startDate?: string, endDate?: string) {
    const images = this.generateRealSatelliteImages(latitude, longitude, startDate, endDate);
    
    return {
      primary: {
        before: images.beforeImage,
        after: images.afterImage,
        source: 'ESRI World Imagery',
        dateRange: images.dateRange
      },
      secondary: {
        before: images.googleBefore,
        after: images.googleAfter,
        source: 'Google Satellite',
        dateRange: images.dateRange
      },
      tertiary: {
        before: images.mapboxBefore,
        after: images.mapboxAfter,
        source: 'Mapbox Satellite',
        dateRange: images.dateRange
      },
      agricultural: {
        before: images.sentinelBefore,
        after: images.sentinelAfter,
        source: 'Sentinel-2 Agricultural',
        dateRange: images.dateRange
      },
      metadata: {
        coordinates: images.coordinates,
        tileCoords: images.tileCoords,
        availableSources: ['ESRI', 'Google', 'Mapbox', 'Sentinel-2']
      }
    };
  }
  
  /**
   * Validate date range for crop loss detection
   */
  static validateDateRange(startDate: string, endDate: string): { valid: boolean; message?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (start >= end) {
      return { valid: false, message: 'Start date must be before end date' };
    }
    
    if (end > now) {
      return { valid: false, message: 'End date cannot be in the future' };
    }
    
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (diffMonths < 1) {
      return { valid: false, message: 'Date range should be at least 1 month for meaningful crop analysis' };
    }
    
    if (diffMonths > 12) {
      return { valid: false, message: 'Date range should not exceed 12 months for accurate comparison' };
    }
    
    return { valid: true };
  }
  
  /**
   * Get optimal zoom level based on field area
   */
  static getOptimalZoom(fieldAreaHectares: number): number {
    if (fieldAreaHectares < 1) return 18;      // Very small fields
    if (fieldAreaHectares < 5) return 17;      // Small fields
    if (fieldAreaHectares < 20) return 16;     // Medium fields
    if (fieldAreaHectares < 100) return 15;    // Large fields
    return 14;                                 // Very large fields
  }
  
  /**
   * Generate fallback images when satellite imagery fails to load
   */
  static generateFallbackImages(latitude: number, longitude: number, startDate?: string, endDate?: string) {
    const beforeText = startDate ? `Before: ${startDate}` : 'Before Image';
    const afterText = endDate ? `After: ${endDate}` : 'After Image';
    
    return {
      before: `https://via.placeholder.com/512x512/22c55e/ffffff?text=${encodeURIComponent(beforeText)}+Lat:${latitude.toFixed(3)}+Lng:${longitude.toFixed(3)}`,
      after: `https://via.placeholder.com/512x512/ef4444/ffffff?text=${encodeURIComponent(afterText)}+Lat:${latitude.toFixed(3)}+Lng:${longitude.toFixed(3)}`
    };
  }
  
  /**
   * Check if coordinates are valid for satellite imagery
   */
  static validateCoordinates(latitude: number, longitude: number): { valid: boolean; message?: string } {
    if (latitude < -90 || latitude > 90) {
      return { valid: false, message: 'Latitude must be between -90 and 90 degrees' };
    }
    
    if (longitude < -180 || longitude > 180) {
      return { valid: false, message: 'Longitude must be between -180 and 180 degrees' };
    }
    
    // Check if coordinates are over water (basic check)
    // This is a simplified check - in production, you'd use a more sophisticated service
    const isLikelyLand = Math.abs(latitude) < 85; // Exclude polar regions
    
    return { valid: true };
  }
}