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
    
    df1_full = ml_service._build_full_features(profile1, user)
    df2_full = ml_service._build_full_features(profile2, user)
    
    scaler_features = ml_service.scaler.feature_names_in_
    
    df1_scaled_full = pd.DataFrame(ml_service.scaler.transform(df1_full[scaler_features]), columns=scaler_features)
    df2_scaled_full = pd.DataFrame(ml_service.scaler.transform(df2_full[scaler_features]), columns=scaler_features)
    
    expected_iso = list(ml_service.isolation_forest_model.feature_names_in_)
    
    for col in expected_iso:
        if col not in df1_scaled_full.columns: df1_scaled_full[col] = 0
        if col not in df2_scaled_full.columns: df2_scaled_full[col] = 0
        if col not in df1_full.columns: df1_full[col] = 0
        if col not in df2_full.columns: df2_full[col] = 0
        
    df1_scaled = df1_scaled_full[expected_iso]
    df2_scaled = df2_scaled_full[expected_iso]
    df1_unscaled = df1_full[expected_iso]
    df2_unscaled = df2_full[expected_iso]
    
    print("\nUNSCALED ISOLATION FOREST:")
    print("Healthy:", ml_service.isolation_forest_model.predict(df1_unscaled)[0])
    print("Unhealthy:", ml_service.isolation_forest_model.predict(df2_unscaled)[0])

    print("\nSCALED ISOLATION FOREST:")
    print("Healthy:", ml_service.isolation_forest_model.predict(df1_scaled)[0])
    print("Unhealthy:", ml_service.isolation_forest_model.predict(df2_scaled)[0])

asyncio.run(run())
