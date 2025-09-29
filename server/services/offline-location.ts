import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

interface LocationData {
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  cropType?: string;
  accuracy?: number;
}

export class OfflineLocationService {
  private locationData: LocationData[] = [];
  private isLoaded = false;

  async loadLocationData() {
    if (this.isLoaded) return;

    try {
      const csvPath = path.join(process.cwd(), 'data', 'location-data.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.warn('⚠️ Location CSV file not found, creating sample data...');
        await this.createSampleLocationData(csvPath);
      }

      this.locationData = await this.readCSVFile(csvPath);
      this.isLoaded = true;
      console.log(`✅ Loaded ${this.locationData.length} location records`);
    } catch (error) {
      console.error('❌ Failed to load location data:', error);
      this.createFallbackData();
    }
  }

  private async readCSVFile(filePath: string): Promise<LocationData[]> {
    return new Promise((resolve, reject) => {
      const results: LocationData[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.push({
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            district: row.district || 'Unknown',
            state: row.state || 'Unknown',
            cropType: row.cropType,
            accuracy: parseFloat(row.accuracy) || 10
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async createSampleLocationData(csvPath: string) {
    const sampleData = `latitude,longitude,district,state,cropType,accuracy
17.3850,78.4867,Hyderabad,Telangana,rice,5
28.6139,77.2090,Delhi,Delhi,wheat,8
19.0760,72.8777,Mumbai,Maharashtra,cotton,12
13.0827,80.2707,Chennai,Tamil Nadu,rice,6
22.5726,88.3639,Kolkata,West Bengal,rice,10
12.9716,77.5946,Bangalore,Karnataka,maize,15
23.0225,72.5714,Ahmedabad,Gujarat,cotton,7
26.9124,75.7873,Jaipur,Rajasthan,wheat,9
21.1458,79.0882,Nagpur,Maharashtra,cotton,11
15.2993,74.1240,Goa,Goa,rice,8`;

    const dir = path.dirname(csvPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(csvPath, sampleData);
    console.log('✅ Created sample location data file');
  }

  private createFallbackData() {
    this.locationData = [
      { latitude: 20.5937, longitude: 78.9629, district: 'Central India', state: 'India', accuracy: 50 }
    ];
    this.isLoaded = true;
  }

  async getNearestLocation(targetLat?: number, targetLng?: number): Promise<LocationData | null> {
    await this.loadLocationData();

    if (!targetLat || !targetLng) {
      // Return a random location from CSV
      const randomIndex = Math.floor(Math.random() * this.locationData.length);
      return this.locationData[randomIndex];
    }

    // Find nearest location
    let nearest = this.locationData[0];
    let minDistance = this.calculateDistance(targetLat, targetLng, nearest.latitude, nearest.longitude);

    for (const location of this.locationData) {
      const distance = this.calculateDistance(targetLat, targetLng, location.latitude, location.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }
    }

    return nearest;
  }

  async getLocationByDistrict(district: string): Promise<LocationData | null> {
    await this.loadLocationData();
    
    return this.locationData.find(loc => 
      loc.district.toLowerCase().includes(district.toLowerCase())
    ) || null;
  }

  async getAllLocations(): Promise<LocationData[]> {
    await this.loadLocationData();
    return this.locationData;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const offlineLocationService = new OfflineLocationService();