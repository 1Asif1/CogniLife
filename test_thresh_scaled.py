import asyncio
from services.ml_service import ml_service
import pandas as pd

async def run():
    user = {"id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2", "height": 180.0, "weight": 75.0}
    
    profiles = {
        "Extreme": {"screen_time": 15.0, "sleep_hours": 2.0, "activity_level": 0, "sitting_time": 12.0, "inactivity_periods": 5, "meals_per_day": 1, "calorie_intake": 20000, "food_quality": 0, "late_night_usage": 5.0},
        "Mild": {"screen_time": 6.0, "sleep_hours": 5.0, "activity_level": 2, "sitting_time": 8.0, "inactivity_periods": 3, "meals_per_day": 2, "calorie_intake": 2800, "food_quality": 1, "late_night_usage": 2.0},
        "Default": {"screen_time": 0.0, "sleep_hours": 7.0, "activity_level": 1, "sitting_time": 4.0, "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 0, "food_quality": 1, "late_night_usage": 0.0},
        "Normal": {"screen_time": 2.0, "sleep_hours": 8.0, "activity_level": 4, "sitting_time": 2.0, "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 2000, "food_quality": 2, "late_night_usage": 0.0}
    }
    
    for name, prof in profiles.items():
        fe = ml_service._build_full_features(prof, user) # NOW THIS IS SCALED!
        print(f"--- {name} SCALED ---")
        print("Health Score:", fe['health_score'].iloc[0])
        print("Lifestyle Risk:", fe['lifestyle_risk'].iloc[0])
        print("Severely Unhealthy Logic (Score < 0.35 or Risk > 2.0):", (fe['health_score'].iloc[0] < 0.35) or (fe['lifestyle_risk'].iloc[0] > 2.0))

asyncio.run(run())
