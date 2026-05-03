import sys
import os
import asyncio
from httpx import AsyncClient

async def run():
    async with AsyncClient() as client:
        user_id = "1694a849-8ad6-4025-b0a3-0f3b78eb21e2"
        res = await client.get(f"http://127.0.0.1:8001/api/users/{user_id}/dashboard")
        print("Status:", res.status_code)
        dash = res.json()
        if 'recent_anomalies' in dash:
            print("Anomalies:", dash['recent_anomalies'])
        else:
            print("Response keys:", dash.keys())

asyncio.run(run())
