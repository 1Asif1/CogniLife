import asyncio
from services.ml_service import ml_service

async def run():
    user = {"id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2", "height": 180.0, "weight": 75.0}
    
    # Mildly unhealthy day
    mild = {
        "screen_time": 6.0, "sleep_hours": 5.0, "activity_level": 2, "sitting_time": 8.0,
        "inactivity_periods": 3, "meals_per_day": 2, "calorie_intake": 2800, "food_quality": 1,
        "late_night_usage": 2.0
    }
    
    fe_mild = ml_service._build_full_features(mild, user)
    
    print("Mild Health Score:", fe_mild['health_score'].iloc[0])
    print("Mild Risk:", fe_mild['lifestyle_risk'].iloc[0])

asyncio.run(run())
