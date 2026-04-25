import asyncio
from services.supabase_client import supabase_client
async def run():
    users = supabase_client._execute(supabase_client.client_service.table('users').select('*').limit(1))
    print('Users:', len(users) if users else 0)
    if not users: return
    print('User:', users[0])
    uid = users[0].get('id') or users[0].get('user_id')
    print('User ID:', uid)
    dash = await supabase_client.get_dashboard_data(uid)
    print('Recent anomalies:', len(dash['recent_anomalies']))
    if dash['recent_anomalies']:
        print('Anomaly 0:', dash['recent_anomalies'][0])
    print('Recent behaviors:', len(dash['recent_behavior_clusters']))
    if dash['recent_behavior_clusters']:
        print('Behavior 0:', dash['recent_behavior_clusters'][0])

asyncio.run(run())
