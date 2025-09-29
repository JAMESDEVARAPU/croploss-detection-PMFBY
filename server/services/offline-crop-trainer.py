#!/usr/bin/env python3
"""
Offline Crop Loss Prediction Model Trainer
Trains ML model on CSV data for coordinate-based predictions
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import json
import os
import sys
from datetime import datetime

class CropLossTrainer:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.model = None
        self.scaler = StandardScaler()
        self.crop_encoder = LabelEncoder()
        self.mandal_encoder = LabelEncoder()
        self.village_encoder = LabelEncoder()
        self.feature_columns = []
        
    def load_and_prepare_data(self):
        """Load CSV data and prepare features"""
        print("Loading CSV data...")
        df = pd.read_csv(self.csv_path)
        
        # Convert date to datetime and extract features
        df['Date'] = pd.to_datetime(df['Date'])
        df['Month'] = df['Date'].dt.month
        df['Day'] = df['Date'].dt.day
        
        # Encode categorical variables
        df['Crop_Encoded'] = self.crop_encoder.fit_transform(df['Crop_Variety'])
        df['Mandal_Encoded'] = self.mandal_encoder.fit_transform(df['Mandal'])
        df['Village_Encoded'] = self.village_encoder.fit_transform(df['Village'])
        
        # Calculate crop loss based on NDVI decline
        # Lower NDVI indicates higher crop stress/loss
        df['Crop_Loss_Percentage'] = np.maximum(0, (0.8 - df['NDVI_Value']) * 100)
        
        # Add weather stress indicators
        df['Heat_Stress'] = (df['Temperature_Max_C'] > 35).astype(int)
        df['Drought_Stress'] = (df['Rainfall_mm'] < 5).astype(int)
        df['High_Wind_Stress'] = (df['Wind_Speed_kmh'] > 20).astype(int)
        
        # Feature engineering
        df['Temp_Range'] = df['Temperature_Max_C'] - df['Temperature_Min_C']
        df['Avg_Temp'] = (df['Temperature_Max_C'] + df['Temperature_Min_C']) / 2
        
        # Define feature columns
        self.feature_columns = [
            'NDVI_Value', 'Temperature_Min_C', 'Temperature_Max_C', 
            'Humidity_Percent', 'Rainfall_mm', 'Wind_Speed_kmh',
            'Month', 'Day', 'Crop_Encoded', 'Mandal_Encoded', 'Village_Encoded',
            'Heat_Stress', 'Drought_Stress', 'High_Wind_Stress',
            'Temp_Range', 'Avg_Temp'
        ]
        
        return df
    
    def train_model(self, df):
        """Train the crop loss prediction model"""
        print("Training model...")
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['Crop_Loss_Percentage']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"MSE: {mse:.2f}")
        print(f"R2 Score: {r2:.2f}")
        
        return {
            'mse': mse,
            'r2_score': r2,
            'feature_importance': dict(zip(self.feature_columns, self.model.feature_importances_))
        }
    
    def save_model(self, output_dir):
        """Save trained model and encoders"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save model
        joblib.dump(self.model, os.path.join(output_dir, 'crop_loss_model.pkl'))
        joblib.dump(self.scaler, os.path.join(output_dir, 'scaler.pkl'))
        joblib.dump(self.crop_encoder, os.path.join(output_dir, 'crop_encoder.pkl'))
        joblib.dump(self.mandal_encoder, os.path.join(output_dir, 'mandal_encoder.pkl'))
        joblib.dump(self.village_encoder, os.path.join(output_dir, 'village_encoder.pkl'))
        
        # Save metadata
        metadata = {
            'feature_columns': self.feature_columns,
            'crop_classes': self.crop_encoder.classes_.tolist(),
            'mandal_classes': self.mandal_encoder.classes_.tolist(),
            'village_classes': self.village_encoder.classes_.tolist(),
            'trained_at': datetime.now().isoformat()
        }
        
        with open(os.path.join(output_dir, 'model_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Model saved to {output_dir}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python offline-crop-trainer.py <csv_file_path>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    output_dir = os.path.join(os.path.dirname(csv_path), 'trained_model')
    
    trainer = CropLossTrainer(csv_path)
    
    # Load and prepare data
    df = trainer.load_and_prepare_data()
    print(f"Loaded {len(df)} records")
    
    # Train model
    performance = trainer.train_model(df)
    
    # Save model
    trainer.save_model(output_dir)
    
    print("\nTraining completed successfully!")
    print(f"Model files saved in: {output_dir}")

if __name__ == "__main__":
    main()