export class RawSatelliteDisplayService {
  
  /**
   * Get raw satellite images for display in analysis UI
   */
  static getRawSatelliteImages(latitude: number, longitude: number, startDate?: string, endDate?: string) {
    const zoom = 16;
    const x = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    return {
      beforeImage: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
      afterImage: `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`,
      coordinates: { latitude, longitude, zoom },
      dateRange: { 
        startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0]
      }
    };
  }
}