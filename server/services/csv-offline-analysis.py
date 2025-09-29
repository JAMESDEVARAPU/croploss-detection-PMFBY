import os
import pandas as pd
from datetime import datetime, timedelta
import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth (km)"""
    R = 6371  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def load_offline_data():
    """Load CSV agricultural data for offline analysis"""
    csv_path = os.path.join(os.path.dirname(__file__), '../data/Ranga_Reddy_REAL_Villages_Agricultural_Data_2025.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Offline data CSV not found at {csv_path}")
    df = pd.read_csv(csv_path, parse_dates=['Date'])
    return df

def find_nearest_village_data(df, latitude, longitude, crop_type, date):
    """Find nearest village data for given location, crop type, and date"""
    village_coords = {
        'Chevella': (17.2, 78.1),
        'Manchal': (17.1, 78.2),
        'Shankarpalle': (17.3, 78.0),
    }
    date_range_start = date - timedelta(days=7)
    date_range_end = date + timedelta(days=7)
    filtered = df[
        (df['Crop_Variety'].str.lower() == crop_type.lower()) &
        (df['Date'] >= date_range_start) &
        (df['Date'] <= date_range_end)
    ]
    if filtered.empty:
        return None

    filtered['Distance'] = filtered['Village'].apply(
        lambda v: haversine_distance(latitude, longitude, *village_coords.get(v, (0,0)))
    )
    nearest = filtered.loc[filtered['Distance'].idxmin()]
    return nearest

def analyze_crop_loss_offline(latitude, longitude, crop_type, field_area):
    """Analyze crop loss using offline CSV data"""
    try:
        df = load_offline_data()
        today = datetime.now()
        nearest_data = find_nearest_village_data(df, latitude, longitude, crop_type, today)
        if nearest_data is None:
            return {
                'success': False,
                'error': 'No matching offline data found for location, crop, and date'
            }
        ndvi_value = nearest_data['NDVI_Value']
        healthy_ndvi_threshold = 0.6
        loss_percentage = max(0, (healthy_ndvi_threshold - ndvi_value) / healthy_ndvi_threshold * 100)
        temp_max = nearest_data['Temperature_Max_C']
        rainfall = nearest_data['Rainfall_mm']
        humidity = nearest_data['Humidity_Percent']
        if temp_max > 35:
            loss_percentage += 5
        if rainfall < 10:
            loss_percentage += 5
        if humidity < 30:
            loss_percentage += 3
        loss_percentage = min(loss_percentage, 100)
        confidence = 80 + (5 - abs((today - nearest_data['Date']).days))  # Adjust confidence by data recency
        damage_cause = "Healthy"
        if loss_percentage > 40:
            damage_cause = "Severe Stress"
        elif loss_percentage > 25:
            damage_cause = "Moderate Stress"
        elif loss_percentage > 10:
            damage_cause = "Minor Stress"
        affected_area = field_area * (loss_percentage / 100)
        crop_values = {
            'rice': 40000,
            'wheat': 35000,
            'cotton': 60000,
            'sugarcane': 80000,
            'maize': 30000
        }
        base_value = crop_values.get(crop_type.lower(), 40000)
        estimated_value = affected_area * base_value
        return {
            'success': True,
            'ndvi_value': float(ndvi_value),
            'loss_percentage': float(loss_percentage),
            'confidence': float(confidence),
            'affected_area': float(affected_area),
            'estimated_value': float(estimated_value),
            'damage_cause': damage_cause,
            'data_source': 'offline_csv',
            'location': nearest_data['Village'],
            'date': nearest_data['Date'].strftime('%Y-%m-%d')
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
