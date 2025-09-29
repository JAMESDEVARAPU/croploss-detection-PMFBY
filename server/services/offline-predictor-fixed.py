#!/usr/bin/env python3
"""
Offline Crop Loss Predictor - Fixed Version
Uses trained model to predict crop loss based on coordinates and crop data
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import sys
from datetime import datetime
import argparse

class OfflineCropPredictor:
    def __init__(self, model_dir):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.crop_encoder = None
        self.mandal_encoder = None
        self.village_encoder = None
        self.metadata = None
        self.load_model()
    
    def load_model(self):
        """Load trained model and encoders"""
        try:
            self.model = joblib.load(os.path.join(self.model_dir, 'crop_loss_model.pkl'))
            self.scaler = joblib.load(os.path.join(self.model_dir, 'scaler.pkl'))
            self.crop_encoder = joblib.load(os.path.join(self.model_dir, 'crop_encoder.pkl'))
            self.mandal_encoder = joblib.load(os.path.join(self.model_dir, 'mandal_encoder.pkl'))
            self.village_encoder = joblib.load(os.path.join(self.model_dir, 'village_encoder.pkl'))
            
            with open(os.path.join(self.model_dir, 'model_metadata.json'), 'r') as f:
                self.metadata = json.load(f)
                
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            sys.exit(1)
    
    def predict_crop_loss(self, input_data):
        """Predict crop loss percentage"""
        try:
            # Prepare input features
            features = {}
            
            # Basic weather features
            features['NDVI_Value'] = float(input_data.get('ndvi_value', 0.5))
            features['Temperature_Min_C'] = float(input_data.get('temp_min', 22.0))
            features['Temperature_Max_C'] = float(input_data.get('temp_max', 30.0))
            features['Humidity_Percent'] = float(input_data.get('humidity', 75.0))
            features['Rainfall_mm'] = float(input_data.get('rainfall', 10.0))
            features['Wind_Speed_kmh'] = float(input_data.get('wind_speed', 15.0))
            
            # Date features
            current_date = datetime.now()
            features['Month'] = int(input_data.get('month', current_date.month))
            features['Day'] = int(input_data.get('day', current_date.day))
            
            # Encode categorical variables
            crop_variety = input_data.get('crop_variety', 'Rice')
            mandal = input_data.get('mandal', 'Abdullapurmet')
            village = input_data.get('village', 'Abdullapur')
            
            # Handle unknown categories
            try:
                features['Crop_Encoded'] = int(self.crop_encoder.transform([crop_variety])[0])
            except ValueError:
                features['Crop_Encoded'] = 0
            
            try:
                features['Mandal_Encoded'] = int(self.mandal_encoder.transform([mandal])[0])
            except ValueError:
                features['Mandal_Encoded'] = 0
            
            try:
                features['Village_Encoded'] = int(self.village_encoder.transform([village])[0])
            except ValueError:
                features['Village_Encoded'] = 0
            
            # Calculate stress indicators
            features['Heat_Stress'] = 1 if features['Temperature_Max_C'] > 35 else 0
            features['Drought_Stress'] = 1 if features['Rainfall_mm'] < 5 else 0
            features['High_Wind_Stress'] = 1 if features['Wind_Speed_kmh'] > 20 else 0
            
            # Additional features
            features['Temp_Range'] = features['Temperature_Max_C'] - features['Temperature_Min_C']
            features['Avg_Temp'] = (features['Temperature_Max_C'] + features['Temperature_Min_C']) / 2
            
            # Create feature array
            feature_array = np.array([features[col] for col in self.metadata['feature_columns']]).reshape(1, -1)
            
            # Scale features
            feature_array_scaled = self.scaler.transform(feature_array)
            
            # Predict
            prediction = float(self.model.predict(feature_array_scaled)[0])
            
            # Get feature importance for explanation
            feature_importance = {
                col: float(imp) for col, imp in zip(
                    self.metadata['feature_columns'], 
                    self.model.feature_importances_
                )
            }
            
            # Convert all numpy types to Python native types
            clean_features = {}
            for k, v in features.items():
                if isinstance(v, (np.integer, np.int64, np.int32)):
                    clean_features[k] = int(v)
                elif isinstance(v, (np.floating, np.float64, np.float32)):
                    clean_features[k] = float(v)
                else:
                    clean_features[k] = v
            
            return {
                'predicted_loss_percentage': max(0.0, min(100.0, prediction)),
                'confidence': min(95.0, 70.0 + abs(features['NDVI_Value'] - 0.5) * 50),
                'risk_level': 'High' if prediction > 30 else 'Medium' if prediction > 15 else 'Low',
                'feature_importance': feature_importance,
                'input_features': clean_features
            }
            
        except Exception as e:
            return {'error': f'Prediction failed: {str(e)}'}

def main():
    parser = argparse.ArgumentParser(description='Predict crop loss using trained model')
    parser.add_argument('--model-dir', required=True, help='Directory containing trained model')
    parser.add_argument('--latitude', type=float, required=True, help='Latitude coordinate')
    parser.add_argument('--longitude', type=float, required=True, help='Longitude coordinate')
    parser.add_argument('--crop', default='Rice', help='Crop variety')
    parser.add_argument('--ndvi', type=float, default=0.5, help='NDVI value')
    parser.add_argument('--temp-min', type=float, default=22.0, help='Minimum temperature')
    parser.add_argument('--temp-max', type=float, default=30.0, help='Maximum temperature')
    parser.add_argument('--humidity', type=float, default=75.0, help='Humidity percentage')
    parser.add_argument('--rainfall', type=float, default=10.0, help='Rainfall in mm')
    parser.add_argument('--wind-speed', type=float, default=15.0, help='Wind speed in km/h')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = OfflineCropPredictor(args.model_dir)
    
    # Prepare input data
    input_data = {
        'latitude': args.latitude,
        'longitude': args.longitude,
        'crop_variety': args.crop,
        'ndvi_value': args.ndvi,
        'temp_min': args.temp_min,
        'temp_max': args.temp_max,
        'humidity': args.humidity,
        'rainfall': args.rainfall,
        'wind_speed': args.wind_speed,
        'mandal': 'Abdullapurmet',
        'village': 'Abdullapur'
    }
    
    # Make prediction
    result = predictor.predict_crop_loss(input_data)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()