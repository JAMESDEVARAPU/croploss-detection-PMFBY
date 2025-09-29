import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

export class OfflineSatelliteMapService {
  
  /**
   * Generate offline satellite map tiles for analysis
   */
  static generateOfflineMapTile(latitude: number, longitude: number, zoom: number = 16): string {
    try {
      // Create a canvas for offline map generation
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');
      
      // Generate map-like background
      this.drawMapBackground(ctx, latitude, longitude, zoom);
      
      // Add location marker
      this.drawLocationMarker(ctx, 256, 256);
      
      // Convert to base64 data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Offline map generation failed:', error);
      return this.generateFallbackMap(latitude, longitude);
    }
  }
  
  private static drawMapBackground(ctx: any, lat: number, lng: number, zoom: number) {
    // Create terrain-like background
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#8FBC8F');  // Light green center
    gradient.addColorStop(0.5, '#228B22'); // Forest green
    gradient.addColorStop(1, '#006400');   // Dark green edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add field patterns
    this.drawFieldPatterns(ctx);
    
    // Add coordinate info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 40);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Lat: ${lat.toFixed(4)}`, 15, 25);
    ctx.fillText(`Lng: ${lng.toFixed(4)}`, 15, 40);
  }
  
  private static drawFieldPatterns(ctx: any) {
    // Draw agricultural field patterns
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    
    // Horizontal field lines
    for (let y = 50; y < 512; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    
    // Vertical field lines
    for (let x = 50; x < 512; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    // Add some crop areas
    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
    ctx.fillRect(100, 100, 150, 100);
    ctx.fillRect(300, 200, 120, 80);
  }
  
  private static drawLocationMarker(ctx: any, x: number, y: number) {
    // Draw red location pin
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Pin shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  private static generateFallbackMap(latitude: number, longitude: number): string {
    // Simple fallback map without canvas
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="terrain" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#8FBC8F"/>
            <stop offset="50%" style="stop-color:#228B22"/>
            <stop offset="100%" style="stop-color:#006400"/>
          </radialGradient>
        </defs>
        <rect width="512" height="512" fill="url(#terrain)"/>
        <g stroke="#654321" stroke-width="1" opacity="0.5">
          ${Array.from({length: 15}, (_, i) => `<line x1="0" y1="${50 + i * 30}" x2="512" y2="${50 + i * 30}"/>`).join('')}
          ${Array.from({length: 12}, (_, i) => `<line x1="${50 + i * 40}" y1="0" x2="${50 + i * 40}" y2="512"/>`).join('')}
        </g>
        <rect x="100" y="100" width="150" height="100" fill="rgba(34,139,34,0.3)"/>
        <rect x="300" y="200" width="120" height="80" fill="rgba(34,139,34,0.3)"/>
        <circle cx="256" cy="256" r="8" fill="#FF0000"/>
        <rect x="10" y="10" width="200" height="40" fill="rgba(0,0,0,0.7)"/>
        <text x="15" y="25" fill="white" font-family="Arial" font-size="12">Lat: ${latitude.toFixed(4)}</text>
        <text x="15" y="40" fill="white" font-family="Arial" font-size="12">Lng: ${longitude.toFixed(4)}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  
  /**
   * Generate before/after comparison maps for offline analysis
   */
  static generateComparisonMaps(latitude: number, longitude: number, startDate: string, endDate: string) {
    const beforeMap = this.generateOfflineMapTile(latitude, longitude, 16);
    const afterMap = this.generateDamagedMapTile(latitude, longitude, 16);
    
    return {
      beforeImage: beforeMap,
      afterImage: afterMap,
      coordinates: { latitude, longitude },
      dateRange: { startDate, endDate },
      source: 'offline-generated'
    };
  }
  
  private static generateDamagedMapTile(latitude: number, longitude: number, zoom: number): string {
    try {
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');
      
      // Generate damaged crop background
      this.drawDamagedBackground(ctx, latitude, longitude, zoom);
      this.drawLocationMarker(ctx, 256, 256);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      return this.generateFallbackDamagedMap(latitude, longitude);
    }
  }
  
  private static drawDamagedBackground(ctx: any, lat: number, lng: number, zoom: number) {
    // Create damaged terrain background
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#DEB887');  // Burlywood center (damaged)
    gradient.addColorStop(0.5, '#CD853F'); // Peru (moderate damage)
    gradient.addColorStop(1, '#8B4513');   // Saddle brown (severe damage)
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add damaged field patterns
    this.drawDamagedFieldPatterns(ctx);
    
    // Add coordinate info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 40);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Lat: ${lat.toFixed(4)}`, 15, 25);
    ctx.fillText(`Lng: ${lng.toFixed(4)}`, 15, 40);
  }
  
  private static drawDamagedFieldPatterns(ctx: any) {
    // Draw damaged field patterns
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    
    // Irregular damaged field lines
    for (let y = 50; y < 512; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 10 - 5);
      ctx.lineTo(512, y + Math.random() * 10 - 5);
      ctx.stroke();
    }
    
    // Add damaged crop areas
    ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
    ctx.fillRect(100, 100, 150, 100);
    ctx.fillRect(300, 200, 120, 80);
    
    // Add some bare patches
    ctx.fillStyle = 'rgba(210, 180, 140, 0.6)';
    ctx.fillRect(120, 120, 50, 30);
    ctx.fillRect(320, 220, 40, 25);
  }
  
  private static generateFallbackDamagedMap(latitude: number, longitude: number): string {
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="damaged" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#DEB887"/>
            <stop offset="50%" style="stop-color:#CD853F"/>
            <stop offset="100%" style="stop-color:#8B4513"/>
          </radialGradient>
        </defs>
        <rect width="512" height="512" fill="url(#damaged)"/>
        <g stroke="#8B4513" stroke-width="1" opacity="0.5">
          ${Array.from({length: 15}, (_, i) => `<line x1="0" y1="${50 + i * 30}" x2="512" y2="${50 + i * 30}"/>`).join('')}
        </g>
        <rect x="100" y="100" width="150" height="100" fill="rgba(139,69,19,0.4)"/>
        <rect x="300" y="200" width="120" height="80" fill="rgba(139,69,19,0.4)"/>
        <rect x="120" y="120" width="50" height="30" fill="rgba(210,180,140,0.6)"/>
        <circle cx="256" cy="256" r="8" fill="#FF0000"/>
        <rect x="10" y="10" width="200" height="40" fill="rgba(0,0,0,0.7)"/>
        <text x="15" y="25" fill="white" font-family="Arial" font-size="12">Lat: ${latitude.toFixed(4)}</text>
        <text x="15" y="40" fill="white" font-family="Arial" font-size="12">Lng: ${longitude.toFixed(4)}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}