import asyncio
import httpx

async def run():
    async with httpx.AsyncClient(timeout=30.0) as client:
        user_id = "1694a849-8ad6-4025-b0a3-0f3b78eb21e2"
        res = await client.get(f"http://127.0.0.1:8001/api/users/{user_id}/dashboard")
        print("Status:", res.status_code)
        import json
        print(json.dumps(res.json().get('recent_anomalies', []), indent=2))

asyncio.run(run())
