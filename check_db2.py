import asyncio
from services.supabase_client import supabase_client
async def run():
    users = supabase_client._execute(supabase_client.client_service.table('users').select('*'))
    print('Total users:', len(users) if users else 0)
    logs = supabase_client._execute(supabase_client.client_service.table('daily_logs').select('*'))
    print('Total logs:', len(logs) if logs else 0)
asyncio.run(run())
