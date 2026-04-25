import asyncio
import uuid
from services.supabase_client import supabase_client
from datetime import datetime

async def test_save():
    try:
        # Get a real user first to avoid FK error
        users = supabase_client._execute(supabase_client.client_anon.table('users').select('*').limit(1))
        if not users:
            print("No users found")
            return
        
        user_id = users[0].get('user_id') or users[0].get('id')
        print(f"Testing with user_id: {user_id}")
        
        # Create a dummy log
        log_data = {
            "screen_time": 1.0,
            "sleep_hours": 8.0,
            "activity_level": "low"
        }
        log = await supabase_client.create_daily_log(user_id, log_data)
        log_id = log['id']
        print(f"Created dummy log: {log_id}")
        
        # Try saving prediction
        preds = {
            "fatigue": 10,
            "future_health_risk": 20,
            "diabetes_risk": 5,
            "anemia_risk": 2,
            "pcos_risk": 0
        }
        print("Saving prediction...")
        saved_pred = await supabase_client.save_prediction(user_id, log_id, preds)
        print("Saved prediction:", saved_pred)
        
        # Try saving insights
        insights = {
            "summary": "Test summary",
            "reasons": "Test reasons",
            "recommendations": "Test recommendations"
        }
        print("Saving insights...")
        saved_insights = await supabase_client.save_insights(user_id, log_id, insights)
        print("Saved insights:", saved_insights)
        
    except Exception as e:
        print("Error during test_save:", e)

if __name__ == "__main__":
    asyncio.run(test_save())
