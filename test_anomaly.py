import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.ml_service import ml_service

log_data = {
    "sleep_hours": 7,
    "screen_time": 2,
    "late_night_usage": 0,
    "activity_level": 3,
    "food_quality": 1,
    "meals_per_day": 3,
    "calorie_intake": 1800,
    "sitting_time": 4,
    "inactivity_periods": 1
}

user_data = {
    "height": 170,
    "weight": 70,
    "gender": "Male"
}

res = ml_service.predict_health(user_data, log_data)
print("Prediction Results:", res['anomaly'])
