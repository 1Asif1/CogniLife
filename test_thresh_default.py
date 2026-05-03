import asyncio
from services.ml_service import ml_service

async def run():
    user = {"id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2", "height": 180.0, "weight": 75.0}
    
    # Default log
    default = {
        "screen_time": 0.0, "sleep_hours": 7.0, "activity_level": 1, "sitting_time": 4.0,
        "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 0, "food_quality": 1,
        "late_night_usage": 0.0
    }
    
    fe = ml_service._build_full_features(default, user)
    
    print("Default Health Score:", fe['health_score'].iloc[0])
    print("Default Risk:", fe['lifestyle_risk'].iloc[0])

asyncio.run(run())
