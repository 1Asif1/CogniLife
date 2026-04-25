import asyncio
from services.supabase_client import supabase_client

async def main():
    try:
        data = supabase_client._execute(supabase_client.client_anon.table('users').select('*').limit(1))
        user_id = data[0]['id'] if data else 'unknown'
        print('User ID:', user_id)
        if user_id != 'unknown':
            dash = await supabase_client.get_dashboard_data(user_id)
            print('Clusters:', dash.get('recent_behavior_clusters', []))
            print('Anomalies:', dash.get('recent_anomalies', []))
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
