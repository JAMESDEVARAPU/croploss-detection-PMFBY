import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface LocationData {
  village: string;
  mandal: string;
  district: string;
  state: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
}

// Geocoding endpoint
router.get('/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Call Google Maps Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: apiKey,
        language: 'en'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: `Geocoding failed: ${response.data.status}` });
    }

    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ error: 'No location found for these coordinates' });
    }

    // Parse the result
    const result = response.data.results[0];
    const location = parseLocationData(result, latitude, longitude);

    res.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});

function parseLocationData(result: any, lat: number, lon: number): LocationData {
  let village = 'Unknown';
  let mandal = 'Unknown';
  let district = 'Unknown';
  let state = 'Unknown';

  // Extract address components
  for (const component of result.address_components || []) {
    const types = component.types || [];
    const name = component.long_name || '';

    // Village/Town
    if (types.includes('locality') || types.includes('sublocality')) {
      village = name;
    }
    // Mandal
    else if (types.includes('administrative_area_level_3') || types.includes('sublocality_level_1')) {
      mandal = name;
    }
    // District
    else if (types.includes('administrative_area_level_2')) {
      district = name;
    }
    // State
    else if (types.includes('administrative_area_level_1')) {
      state = name;
    }
  }

  return {
    village,
    mandal,
    district,
    state,
    formatted_address: result.formatted_address || '',
    latitude: lat,
    longitude: lon
  };
}

export default router;