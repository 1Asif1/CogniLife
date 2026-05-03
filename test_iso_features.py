import asyncio
from services.ml_service import ml_service
import pandas as pd

async def run():
    user = {
        "id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2",
        "email": "test@test.com",
        "name": "Test",
        "age": 30,
        "gender": "Male",
        "height": 180.0,
        "weight": 75.0
    }
    log = {
        "id": "fc83dc97-464e-489f-86e1-b27ee2b1b89e",
        "user_id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2",
        "date": "2026-05-03",
        "screen_time": 2.0,
        "late_night_usage": 0.0,
        "sleep_hours": 8.0,
        "activity_level": 4,
        "sitting_time": 2.0,
        "inactivity_periods": 0,
        "steps": 10000,
        "meals_per_day": 3,
        "calorie_intake": 2000,
        "food_quality": 2
    }
    
    full_features = ml_service._build_full_features(log, user)
    expected = list(ml_service.isolation_forest_model.feature_names_in_)
    df_model = full_features.copy()
    
    missing = []
    for col in expected:
        if col not in df_model.columns:
            df_model[col] = 0
            missing.append(col)
            
    print("Missing columns filled with 0:", missing)
    print("\ndf_model features:")
    for col in expected:
        print(f"{col}: {df_model[col].iloc[0]}")

asyncio.run(run())
