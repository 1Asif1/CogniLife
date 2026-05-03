import sys
import asyncio
from services.ml_service import ml_service

async def run():
    # predict_health takes kwargs matching the expected features.
    # In main.py, it's called with user data and log data
    
    user = {
        "id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2",
        "email": "test@test.com",
        "name": "Test",
        "age": 30,
        "gender": "Male",
        "height": 100.0,
        "weight": 40.0
    }
    
    log = {
        "id": "fc83dc97-464e-489f-86e1-b27ee2b1b89e",
        "user_id": "1694a849-8ad6-4025-b0a3-0f3b78eb21e2",
        "date": "2026-05-03",
        "screen_time": 7.63,
        "late_night_usage": 0.0,
        "sleep_hours": 7.0,
        "activity_level": 0,
        "sitting_time": 4.0,
        "inactivity_periods": 1,
        "steps": 0,
        "meals_per_day": 1,
        "calorie_intake": 20000,
        "food_quality": 0
    }
    
    res = ml_service.predict_health(log, user)
    print("Is Anomaly:", res['anomaly']['is_anomaly'])
    print("Anomaly Type:", res['anomaly']['anomaly_type'])

asyncio.run(run())
