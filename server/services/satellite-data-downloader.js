import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

export class SatelliteDataDownloader {
  constructor() {
    this.downloadDir = path.join(process.cwd(), 'data', 'raw-satellite-images');
    this.ensureDownloadDirectory();
  }

  ensureDownloadDirectory() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  async downloadIndianAgriculturalData() {
    const locations = [
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
      { name: 'Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' }
    ];

    console.log('🛰️ Starting satellite data download for Indian agricultural regions...');
    
    for (const location of locations) {
      try {
        await this.downloadLocationData(location);
        console.log(`✅ Downloaded data for ${location.name}, ${location.state}`);
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Failed to download ${location.name}:`, error);
      }
    }
    
    console.log('🎯 Satellite data download completed!');
  }

  async downloadLocationData(location) {
    const zoom = 16;
    const { x, y } = this.latLngToTile(location.lat, location.lng, zoom);
    
    const locationDir = path.join(this.downloadDir, `${location.name}_${location.state}`);
    if (!fs.existsSync(locationDir)) {
      fs.mkdirSync(locationDir, { recursive: true });
    }

    const sources = [
      {
        name: 'ESRI_Before',
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
        filename: `${location.name}_before_esri.jpg`
      },
      {
        name: 'Google_After', 
        url: `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${zoom}`,
        filename: `${location.name}_after_google.jpg`
      }
    ];

    for (const source of sources) {
      const filePath = path.join(locationDir, source.filename);
      await this.downloadImage(source.url, filePath);
    }

    const metadata = {
      location: location.name,
      state: location.state,
      coordinates: { lat: location.lat, lng: location.lng },
      tileCoords: { x, y, zoom },
      downloadDate: new Date().toISOString(),
      sources: sources.map(s => ({ name: s.name, filename: s.filename }))
    };
    
    fs.writeFileSync(
      path.join(locationDir, 'metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
  }

  downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        fileStream.on('error', reject);
      });
      
      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  latLngToTile(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  }

  async generateCSVFromDownloads() {
    const csvPath = path.join(process.cwd(), 'data', 'satellite-images-downloaded.csv');
    let csvContent = 'latitude,longitude,district,state,beforeImage,afterImage\n';
    
    const locationDirs = fs.readdirSync(this.downloadDir);
    
    for (const locationDir of locationDirs) {
      const locationPath = path.join(this.downloadDir, locationDir);
      const metadataPath = path.join(locationPath, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        
        const beforeImage = path.join(locationPath, `${metadata.location}_before_esri.jpg`);
        const afterImage = path.join(locationPath, `${metadata.location}_after_google.jpg`);
        
        if (fs.existsSync(beforeImage) && fs.existsSync(afterImage)) {
          csvContent += `${metadata.coordinates.lat},${metadata.coordinates.lng},${metadata.location},${metadata.state},${beforeImage},${afterImage}\n`;
        }
      }
    }
    
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📄 Generated CSV: ${csvPath}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}