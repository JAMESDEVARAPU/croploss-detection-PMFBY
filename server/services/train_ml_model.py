#!/usr/bin/env python3

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
from datetime import datetime

def load_and_preprocess_data(csv_path):
    """Load CSV data and preprocess it for ML training"""
    print(f"Loading data from {csv_path}...")
    
    # Load the CSV data
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} records")
    
    # Display basic info about the dataset
    print("\nDataset columns:")
    for col in df.columns:
        print(f"  - {col}")
    
    # Clean and prepare features
    feature_columns = [
        'Agriculture_Health_Index_mean',
        'NDVI_after_mean', 
        'NDVI_before_mean',
        'NDVI_change_mean',
        'NDVI_percent_change_mean',
        'precipitation_total_mm_mean',
        'latitude',
        'longitude'
    ]
    
    # Handle missing values and -9999 placeholder values
    for col in feature_columns:
        if col in df.columns:
            # Replace -9999 with NaN and then with column mean
            df[col] = df[col].replace(-9999, np.nan)
            df[col] = df[col].fillna(df[col].mean())
    
    # Create target variable (loss percentage)
    # Use existing loss_percentage if available, otherwise derive from NDVI change
    if 'loss_percentage' in df.columns:
        df['loss_percentage_target'] = df['loss_percentage']
    else:
        # Calculate loss percentage from NDVI percent change
        df['loss_percentage_target'] = np.abs(df['NDVI_percent_change_mean']).fillna(0)
    
    # Ensure loss percentage is within reasonable bounds
    df['loss_percentage_target'] = np.clip(df['loss_percentage_target'], 0, 100)
    
    # Encode categorical variables if they exist
    label_encoders = {}
    if 'vegetation_health' in df.columns:
        le = LabelEncoder()
        df['vegetation_health_encoded'] = le.fit_transform(df['vegetation_health'].astype(str))
        label_encoders['vegetation_health'] = le
        feature_columns.append('vegetation_health_encoded')
    
    if 'season' in df.columns:
        le = LabelEncoder()
        df['season_encoded'] = le.fit_transform(df['season'].astype(str))
        label_encoders['season'] = le
        feature_columns.append('season_encoded')
    
    # Select final features that are available
    available_features = [col for col in feature_columns if col in df.columns]
    
    X = df[available_features]
    y = df['loss_percentage_target']
    
    print(f"\nUsing {len(available_features)} features:")
    for feature in available_features:
        print(f"  - {feature}")
    
    return X, y, available_features, label_encoders

def train_random_forest_model(X, y, feature_names):
    """Train Random Forest model for crop loss prediction"""
    print("\nTraining Random Forest model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    # Evaluate model
    train_pred = rf_model.predict(X_train)
    test_pred = rf_model.predict(X_test)
    
    train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print(f"Model Performance:")
    print(f"  Train RMSE: {train_rmse:.2f}")
    print(f"  Test RMSE: {test_rmse:.2f}")
    print(f"  Train R²: {train_r2:.3f}")
    print(f"  Test R²: {test_r2:.3f}")
    
    # Feature importance
    importance_dict = dict(zip(feature_names, rf_model.feature_importances_))
    sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\nFeature Importance:")
    for feature, importance in sorted_importance:
        print(f"  {feature}: {importance:.3f}")
    
    return rf_model, {
        'train_rmse': train_rmse,
        'test_rmse': test_rmse,
        'train_r2': train_r2,
        'test_r2': test_r2,
        'feature_importance': importance_dict
    }

def save_model(model, feature_names, label_encoders, metrics, model_path='data/crop_loss_model.pkl'):
    """Save the trained model and metadata"""
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'label_encoders': label_encoders,
        'metrics': metrics,
        'training_date': datetime.now().isoformat(),
        'model_version': '1.0.0'
    }
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # Save model
    joblib.dump(model_data, model_path)
    print(f"\nModel saved to {model_path}")
    
    # Save model info as JSON
    info_path = model_path.replace('.pkl', '_info.json')
    model_info = {
        'feature_names': feature_names,
        'metrics': metrics,
        'training_date': model_data['training_date'],
        'model_version': model_data['model_version'],
        'model_type': 'RandomForestRegressor'
    }
    
    with open(info_path, 'w') as f:
        json.dump(model_info, f, indent=2)
    
    print(f"Model info saved to {info_path}")

def main():
    """Main training pipeline"""
    csv_path = 'data/crop_loss_training_data.csv'
    
    if not os.path.exists(csv_path):
        print(f"Error: Training data not found at {csv_path}")
        print("Please ensure the CSV file is in the data directory.")
        return
    
    try:
        # Load and preprocess data
        X, y, feature_names, label_encoders = load_and_preprocess_data(csv_path)
        
        # Train model
        model, metrics = train_random_forest_model(X, y, feature_names)
        
        # Save model
        save_model(model, feature_names, label_encoders, metrics)
        
        print("\n✓ Model training completed successfully!")
        print("The model is now ready for offline crop loss prediction.")
        
    except Exception as e:
        print(f"Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()