import asyncio
from services.ml_service import ml_service
from services.supabase_client import supabase_client
import uuid

async def run():
    user = {"id": "72b2a6ad-255f-4416-bd71-c129b8a15f9e", "height": 180.0, "weight": 75.0}
    log_data = {
        "screen_time": 2.0, "sleep_hours": 8.0, "activity_level": 4, "sitting_time": 2.0,
        "inactivity_periods": 0, "meals_per_day": 3, "calorie_intake": 2000, "food_quality": 2,
        "late_night_usage": 0.0
    }
    
    fe = ml_service._build_full_features(log_data, user)
    print("Features built successfully.")
    
    iso_res = ml_service._detect_anomaly(log_data, fe)
    print("Iso Forest ran successfully. Result:", iso_res)
    
    kmeans_res = ml_service._perform_clustering(log_data, fe)
    print("KMeans ran successfully. Result:", kmeans_res)
    
    raw_input = ml_service._map_supabase_to_model_input(log_data, user)
    xgb_res = ml_service.predict_and_explain(raw_input)
    print("XGBoost ran successfully.")

asyncio.run(run())
