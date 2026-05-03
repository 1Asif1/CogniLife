import asyncio
import pandas as pd
from services.ml_service import ml_service

async def run():
    user = {"id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2", "height": 180.0, "weight": 75.0}
    
    profile1 = {
        "screen_time": 2.0, "sleep_hours": 8.0, "activity_level": 4, "sitting_time": 2.0,
        "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 2000, "food_quality": 2,
        "late_night_usage": 0.0
    }
    
    profile2 = {
        "screen_time": 10.0, "sleep_hours": 4.0, "activity_level": 0, "sitting_time": 10.0,
        "inactivity_periods": 4, "meals_per_day": 1, "calorie_intake": 3500, "food_quality": 0,
        "late_night_usage": 4.0
    }
    
    # Get 26 features
    df1_full = ml_service._build_full_features(profile1, user)
    df2_full = ml_service._build_full_features(profile2, user)
    
    # The scaler expects 26 features. What order?
    scaler_features = ml_service.scaler.feature_names_in_
    
    df1_scaled_full = pd.DataFrame(ml_service.scaler.transform(df1_full[scaler_features]), columns=scaler_features)
    df2_scaled_full = pd.DataFrame(ml_service.scaler.transform(df2_full[scaler_features]), columns=scaler_features)
    
    expected_kmeans = list(ml_service.kmeans_model.feature_names_in_)
    
    for col in expected_kmeans:
        if col not in df1_scaled_full.columns: df1_scaled_full[col] = 0
        if col not in df2_scaled_full.columns: df2_scaled_full[col] = 0
        
    df1_scaled = df1_scaled_full[expected_kmeans]
    df2_scaled = df2_scaled_full[expected_kmeans]
    
    print("\nSCALED CLUSTERS:")
    print("Profile 1 (Healthy):", ml_service.kmeans_model.predict(df1_scaled)[0])
    print("Profile 2 (Unhealthy):", ml_service.kmeans_model.predict(df2_scaled)[0])

asyncio.run(run())
