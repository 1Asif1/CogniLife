import asyncio
from services.supabase_client import supabase_client

async def main():
    try:
        data = supabase_client._execute(supabase_client.client_anon.table('users').select('user_id').limit(1))
        user_id = data[0]['user_id'] if data else None
        print('User ID:', user_id)
        if user_id:
            dash = await supabase_client.get_dashboard_data(user_id)
            print('Clusters count:', len(dash.get('recent_behavior_clusters', [])))
            print('Anomalies count:', len(dash.get('recent_anomalies', [])))
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
