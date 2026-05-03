import asyncio
import httpx
import json

async def run():
    payload = {
        "date": "2026-05-04",
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
    async with httpx.AsyncClient() as client:
        user_id = "1694a849-8ad6-4025-b0a3-0f3b78eb21e2"
        res = await client.post(f"http://127.0.0.1:8001/api/logs/process?user_id={user_id}", json=payload)
        print("Status:", res.status_code)
        print("Anomaly Response:")
        try:
            print(json.dumps(res.json().get('anomaly'), indent=2))
        except:
            print(res.text)

asyncio.run(run())
