import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

interface SatelliteImageData {
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  beforeImage: string;
  afterImage: string;
}

export class OfflineRawImagesService {
  private static imageData: SatelliteImageData[] = [];
  private static isLoaded = false;

  static async loadImageData() {
    if (this.isLoaded) return;

    try {
      const csvPath = path.join(process.cwd(), 'data', 'satellite-images.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.warn('⚠️ Satellite images CSV not found');
        return;
      }

      this.imageData = await this.readImageCSV(csvPath);
      this.isLoaded = true;
      console.log(`✅ Loaded ${this.imageData.length} satellite image records`);
    } catch (error) {
      console.error('❌ Failed to load satellite images:', error);
    }
  }

  private static async loadGEEImageData(): Promise<SatelliteImageData[] | null> {
    try {
      const geeCsvPath = path.join(process.cwd(), 'data', 'satellite-images-gee.csv');
      
      if (!fs.existsSync(geeCsvPath)) {
        return null;
      }

      return await this.readImageCSV(geeCsvPath);
    } catch (error) {
      console.error('Error loading GEE image data:', error);
      return null;
    }
  }

  private static readImageCSV(filePath: string): Promise<SatelliteImageData[]> {
    return new Promise((resolve, reject) => {
      const results: SatelliteImageData[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.push({
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            district: row.district,
            state: row.state,
            beforeImage: row.beforeImage,
            afterImage: row.afterImage
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  static async getRawSatelliteImages(latitude: number, longitude: number) {
    await this.loadImageData();

    // Try GEE data first
    const geeData = await this.loadGEEImageData();
    if (geeData && geeData.length > 0) {
      let match = geeData.find(img => 
        Math.abs(img.latitude - latitude) < 0.01 && 
        Math.abs(img.longitude - longitude) < 0.01
      );
      
      if (!match) {
        match = geeData.reduce((nearest, current) => {
          const nearestDist = this.calculateDistance(latitude, longitude, nearest.latitude, nearest.longitude);
          const currentDist = this.calculateDistance(latitude, longitude, current.latitude, current.longitude);
          return currentDist < nearestDist ? current : nearest;
        });
      }
      
      if (match) {
        return {
          beforeImage: match.beforeImage,
          afterImage: match.afterImage,
          coordinates: { latitude: match.latitude, longitude: match.longitude },
          location: `${match.district}, ${match.state}`,
          source: 'gee-satellite-images',
          instant: true
        };
      }
    }

    // Fallback to regular CSV data
    let match = this.imageData?.find(img => 
      Math.abs(img.latitude - latitude) < 0.01 && 
      Math.abs(img.longitude - longitude) < 0.01
    );

    if (!match && this.imageData && this.imageData.length > 0) {
      match = this.imageData.reduce((nearest, current) => {
        const nearestDist = this.calculateDistance(latitude, longitude, nearest.latitude, nearest.longitude);
        const currentDist = this.calculateDistance(latitude, longitude, current.latitude, current.longitude);
        return currentDist < nearestDist ? current : nearest;
      });
    }

    if (match) {
      return {
        beforeImage: match.beforeImage,
        afterImage: match.afterImage,
        coordinates: { latitude: match.latitude, longitude: match.longitude },
        location: `${match.district}, ${match.state}`,
        source: 'offline-raw-images',
        instant: true
      };
    }

    return null;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}