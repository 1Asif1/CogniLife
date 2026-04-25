import asyncio
from services.supabase_client import supabase_client
from datetime import datetime

async def test_repro():
    user_id = 'e96ca794-ab4c-4a7e-931a-785391bc7eec'
    cols = {
        'screen_time': 6.4,
        'late_night_usage': 0.0,
        'sleep_hours': 6.7,
        'sitting_time': 15.1,
        'inactivity_periods': 7,
        'steps': 6279,
        'meals_per_day': 3,
        'calorie_intake': 1500
    }
    
    for col_name, col_val in cols.items():
        try:
            print(f"Testing column: {col_name} with value {col_val}")
            record = {
                'user_id': user_id,
                'date': '2026-04-25',
                col_name: col_val
            }
            supabase_client._execute(supabase_client.client_service.table('daily_logs').upsert(record, on_conflict='user_id, date'))
            print(f"Column {col_name} OK")
        except Exception as e:
            print(f"Column {col_name} FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_repro())
