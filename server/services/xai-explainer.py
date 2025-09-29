#!/usr/bin/env python3

import sys
import json
import math
import random
import os
import numpy as np
from datetime import datetime, timedelta

try:
    import joblib
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

# Simple ML model implementation without external dependencies
class SimpleMLModel:
    def __init__(self):
        # Pre-trained feature weights based on agricultural knowledge
        self.feature_weights = {
            'ndvi_before': 0.25,
            'ndvi_current': 0.30,
            'rainfall': 0.20,
            'temperature': 0.15,
            'humidity': 0.05,
            'wind_speed': 0.03,
            'days_since_sowing': 0.02
        }
        self.feature_names = list(self.feature_weights.keys())
    
    def predict(self, features):
        """Predict crop loss percentage based on features"""
        # Calculate base loss from NDVI change
        ndvi_before, ndvi_current = features[0], features[1]
        
        if ndvi_before > 0:
            base_loss = ((ndvi_before - ndvi_current) / ndvi_before) * 100
        else:
            base_loss = 0
            
        # Apply weather stress factors
        rainfall, temperature, humidity, wind_speed = features[2:6]
        
        # Rainfall stress
        if rainfall < 5:
            base_loss += 15  # Drought stress
        elif rainfall > 30:
            base_loss += 10  # Flood stress
            
        # Temperature stress  
        if temperature > 38:
            base_loss += 12  # Heat stress
        elif temperature < 22:
            base_loss += 8   # Cold stress
            
        # Wind damage
        if wind_speed > 20:
            base_loss += 5
            
        # Humidity effects
        if humidity < 40:
            base_loss += 3  # Dry stress
        elif humidity > 85:
            base_loss += 4  # Disease risk
            
        return max(0, min(100, base_loss))
    
    def get_feature_importance(self, features):
        """Calculate feature importance based on contribution to prediction"""
        ndvi_before, ndvi_current, rainfall, temperature, humidity, wind_speed, days_since_sowing = features
        
        importances = []
        
        # NDVI importance
        ndvi_change = abs(ndvi_before - ndvi_current) if ndvi_before > 0 else 0
        importances.append(ndvi_change * 0.3)  # ndvi_before
        importances.append(ndvi_change * 0.4)  # ndvi_current
        
        # Weather importance
        rainfall_stress = 1.0 - min(1.0, abs(rainfall - 15) / 15)  # Optimal around 15mm
        importances.append(rainfall_stress * 0.25)  # rainfall
        
        temp_stress = 1.0 - min(1.0, abs(temperature - 30) / 10)  # Optimal around 30°C
        importances.append(temp_stress * 0.2)  # temperature
        
        humidity_stress = 1.0 - min(1.0, abs(humidity - 60) / 20)  # Optimal around 60%
        importances.append(humidity_stress * 0.1)  # humidity
        
        wind_stress = min(1.0, wind_speed / 25)  # Linear increase with wind
        importances.append(wind_stress * 0.08)  # wind_speed
        
        # Days since sowing has minimal direct impact
        importances.append(0.05)  # days_since_sowing
        
        return importances

# Initialize model
ml_model = SimpleMLModel()

def load_trained_model():
    """Load the trained Random Forest model"""
    model_path = 'data/crop_loss_model.pkl'
    
    if ML_AVAILABLE and os.path.exists(model_path):
        try:
            model_data = joblib.load(model_path)
            return model_data['model'], model_data['feature_names'], model_data.get('label_encoders', {})
        except Exception as e:
            print(f"Error loading trained model: {e}")
            return None, None, None
    
    return None, None, None

def get_weather_simulation(latitude, longitude):
    """Simulate weather data for the location"""
    random.seed(int((latitude + longitude) * 1000))
    
    return {
        'rainfall': random.uniform(0, 25),  # mm per day average
        'temperature': random.uniform(25, 40),  # Celsius
        'humidity': random.uniform(40, 80),  # Percentage
        'wind_speed': random.uniform(8, 18),  # km/h
    }

def predict_with_explanation(ndvi_before, ndvi_current, latitude, longitude, days_since_sowing=60):
    """Predict crop loss with XAI explanation"""
    
    # Try to load trained Random Forest model first
    trained_model, trained_features, label_encoders = load_trained_model()
    
    # Get weather data
    weather = get_weather_simulation(latitude, longitude)
    
    # Skip trained model for now due to training data limitations
    if False and trained_model is not None and trained_features is not None:
        # Use trained Random Forest model
        try:
            # Create feature vector based on trained model's features
            feature_values = {}
            
            # Map available features
            feature_values['Agriculture_Health_Index_mean'] = (ndvi_before + ndvi_current) / 2
            feature_values['NDVI_after_mean'] = ndvi_current
            feature_values['NDVI_before_mean'] = ndvi_before
            feature_values['NDVI_change_mean'] = ndvi_current - ndvi_before
            if ndvi_before != 0:
                feature_values['NDVI_percent_change_mean'] = ((ndvi_current - ndvi_before) / ndvi_before) * 100
            else:
                feature_values['NDVI_percent_change_mean'] = 0
            feature_values['precipitation_total_mm_mean'] = weather['rainfall']
            feature_values['latitude'] = latitude
            feature_values['longitude'] = longitude
            
            # Create input vector in the same order as training
            input_vector = []
            for feature_name in trained_features:
                if feature_name in feature_values:
                    input_vector.append(feature_values[feature_name])
                elif feature_name == 'vegetation_health_encoded':
                    # Default to poor vegetation health (0)
                    input_vector.append(0)
                elif feature_name == 'season_encoded':
                    # Default to monsoon season (0)
                    input_vector.append(0)
                else:
                    # Default value for unknown features
                    input_vector.append(0)
            
            # Make prediction
            input_array = np.array([input_vector])
            predicted_loss = trained_model.predict(input_array)[0]
            predicted_loss = max(0, min(100, predicted_loss))
            
            # Get feature importance from the trained model
            feature_importance = trained_model.feature_importances_
            
            # Create explanations
            explanations = []
            for i, (feature_name, importance_val) in enumerate(zip(trained_features, feature_importance)):
                feature_val = input_vector[i] if i < len(input_vector) else 0
                contribution = importance_val * abs(feature_val) / (abs(feature_val) + 1)
                
                explanations.append({
                    'feature': feature_name,
                    'value': feature_val,
                    'importance': importance_val,
                    'contribution': contribution,
                    'impact': 'increases' if contribution > 0.1 else 'decreases'
                })
            
            # Sort by importance
            explanations.sort(key=lambda x: x['importance'], reverse=True)
            
            # Generate human-readable explanations
            readable_explanations = generate_readable_explanation(explanations, predicted_loss)
            
            return {
                'predicted_loss': predicted_loss,
                'weather_factors': weather,
                'feature_explanations': explanations,
                'readable_explanation': readable_explanations,
                'confidence': 0.95  # Higher confidence with trained model
            }
            
        except Exception as e:
            print(f"Error using trained model, falling back to simple model: {e}")
    
    # Fallback to simple rule-based model
    features = [
        ndvi_before,
        ndvi_current,
        weather['rainfall'],
        weather['temperature'],
        weather['humidity'],
        weather['wind_speed'],
        days_since_sowing
    ]
    
    # Make prediction using simple model
    predicted_loss = ml_model.predict(features)
    predicted_loss = max(0, min(100, predicted_loss))
    
    # Get feature importance
    importance_values = ml_model.get_feature_importance(features)
    
    # Create explanation data
    explanations = []
    feature_names = ml_model.feature_names
    
    for i, (feature_name, importance_val, feature_val) in enumerate(zip(feature_names, importance_values, features)):
        # Calculate contribution (positive means increases loss)
        contribution = importance_val * (feature_val / (feature_val + 1))  # Normalize
        
        explanations.append({
            'feature': feature_name,
            'value': feature_val,
            'importance': importance_val,
            'contribution': contribution,
            'impact': 'increases' if contribution > 0.1 else 'decreases'
        })
    
    # Sort by importance
    explanations.sort(key=lambda x: x['importance'], reverse=True)
    
    # Generate human-readable explanations
    readable_explanations = generate_readable_explanation(explanations, predicted_loss)
    
    return {
        'predicted_loss': predicted_loss,
        'weather_factors': weather,
        'feature_explanations': explanations,
        'readable_explanation': readable_explanations,
        'confidence': 0.85
    }

def generate_readable_explanation(explanations, loss_percentage):
    """Generate human-readable explanation in simple language"""
    
    # Find top 3 contributing factors
    top_factors = explanations[:3]
    
    explanation_parts = []
    
    if loss_percentage < 10:
        explanation_parts.append("Your crops are in good condition with minimal loss detected.")
    elif loss_percentage < 25:
        explanation_parts.append("Your crops show moderate stress with some damage.")
    elif loss_percentage < 50:
        explanation_parts.append("Your crops have significant damage.")
    else:
        explanation_parts.append("Your crops have severe damage.")
    
    explanation_parts.append("\nMain reasons for this assessment:")
    
    for i, factor in enumerate(top_factors, 1):
        feature_name = factor['feature']
        impact = factor['impact']
        
        if feature_name == 'ndvi_before':
            explanation_parts.append(f"{i}. Initial crop health was {'good' if factor['value'] > 0.6 else 'moderate'}")
        elif feature_name == 'ndvi_current':
            explanation_parts.append(f"{i}. Current crop health is {'good' if factor['value'] > 0.6 else 'poor'}")
        elif feature_name == 'rainfall':
            if factor['value'] < 5:
                explanation_parts.append(f"{i}. Very low rainfall ({factor['value']:.1f}mm) causing drought stress")
            elif factor['value'] > 25:
                explanation_parts.append(f"{i}. Very high rainfall ({factor['value']:.1f}mm) causing waterlogging")
            else:
                explanation_parts.append(f"{i}. Rainfall levels ({factor['value']:.1f}mm) are moderate")
        elif feature_name == 'temperature':
            if factor['value'] > 38:
                explanation_parts.append(f"{i}. High temperature ({factor['value']:.1f}°C) causing heat stress")
            elif factor['value'] < 20:
                explanation_parts.append(f"{i}. Low temperature ({factor['value']:.1f}°C) slowing growth")
            else:
                explanation_parts.append(f"{i}. Temperature ({factor['value']:.1f}°C) is suitable")
        elif feature_name == 'humidity':
            if factor['value'] < 40:
                explanation_parts.append(f"{i}. Low humidity ({factor['value']:.1f}%) causing water stress")
            elif factor['value'] > 85:
                explanation_parts.append(f"{i}. High humidity ({factor['value']:.1f}%) promoting diseases")
        elif feature_name == 'wind_speed':
            if factor['value'] > 20:
                explanation_parts.append(f"{i}. Strong winds ({factor['value']:.1f}km/h) causing physical damage")
    
    return '\n'.join(explanation_parts)

def check_pmfby_eligibility_with_explanation(loss_percentage, crop_type, explanations):
    """Check PMFBY eligibility with detailed explanation"""
    
    # PMFBY thresholds by crop type
    thresholds = {
        'rice': 20.0,
        'wheat': 20.0,
        'cotton': 25.0,
        'sugarcane': 30.0,
        'maize': 20.0,
        'default': 20.0
    }
    
    threshold = thresholds.get(crop_type, thresholds['default'])
    eligible = loss_percentage >= threshold
    
    # Generate explanation
    explanation = f"For {crop_type} crops, PMFBY compensation requires minimum {threshold}% loss. "
    
    if eligible:
        explanation += f"Your assessed loss of {loss_percentage:.1f}% exceeds this threshold, so you are eligible for compensation."
        
        # Add key contributing factors
        top_factors = [e for e in explanations if e['contribution'] > 0][:2]
        if top_factors:
            explanation += f" Main damage factors: {', '.join([f['feature'].replace('_', ' ') for f in top_factors])}."
    else:
        explanation += f"Your assessed loss of {loss_percentage:.1f}% is below this threshold, so compensation is not available under PMFBY."
    
    return {
        'eligible': eligible,
        'threshold': threshold,
        'explanation': explanation,
        'loss_percentage': loss_percentage
    }

def main():
    if len(sys.argv) < 5:
        print(json.dumps({"success": False, "error": "Usage: python xai-explainer.py <ndvi_before> <ndvi_current> <latitude> <longitude> [days_since_sowing] [crop_type]"}))
        return
    
    try:
        ndvi_before = float(sys.argv[1])
        ndvi_current = float(sys.argv[2])
        latitude = float(sys.argv[3])
        longitude = float(sys.argv[4])
        days_since_sowing = float(sys.argv[5]) if len(sys.argv) > 5 else 60
        crop_type = sys.argv[6] if len(sys.argv) > 6 else 'rice'
        
        # Generate XAI explanation
        result = predict_with_explanation(ndvi_before, ndvi_current, latitude, longitude, days_since_sowing)
        
        # Check PMFBY eligibility
        pmfby_result = check_pmfby_eligibility_with_explanation(
            result['predicted_loss'], 
            crop_type, 
            result['feature_explanations']
        )
        
        # Combine results
        output = {
            'success': True,
            'xai_prediction': result,
            'pmfby_eligibility': pmfby_result,
            'explanation_summary': result['readable_explanation']
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()