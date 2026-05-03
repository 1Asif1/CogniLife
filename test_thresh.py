import asyncio
from services.ml_service import ml_service

async def run():
    user = {"id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2", "height": 180.0, "weight": 75.0}
    
    extreme = {
        "screen_time": 15.0, "sleep_hours": 2.0, "activity_level": 0, "sitting_time": 12.0,
        "inactivity_periods": 5, "meals_per_day": 1, "calorie_intake": 20000, "food_quality": 0,
        "late_night_usage": 5.0
    }
    
    normal = {
        "screen_time": 2.0, "sleep_hours": 8.0, "activity_level": 4, "sitting_time": 2.0,
        "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 2000, "food_quality": 2,
        "late_night_usage": 0.0
    }
    
    fe_extreme = ml_service._build_full_features(extreme, user)
    fe_normal = ml_service._build_full_features(normal, user)
    
    print("Extreme Health Score:", fe_extreme['health_score'].iloc[0])
    print("Extreme Risk:", fe_extreme['lifestyle_risk'].iloc[0])
    
    print("Normal Health Score:", fe_normal['health_score'].iloc[0])
    print("Normal Risk:", fe_normal['lifestyle_risk'].iloc[0])

asyncio.run(run())
