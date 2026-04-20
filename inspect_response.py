from supabase import create_client
import json

SUPABASE_URL = "https://geptqqykttygcbsrlxay.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcHRxcXlrdHR5Z2Nic3JseGF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI5NzQzNCwiZXhwIjoyMDkxODczNDM0fQ.Rnl0zUbWNkRFOATXJYyeXIV3HPruosyHzBBZAkQH1OQ"
client = create_client(SUPABASE_URL, SERVICE_KEY)
user_id = "d8f3fc1a-b146-4307-a94b-5bb4f4fcef83"
response = client.table("users").select("*").eq("user_id", user_id).execute()
print(type(response))
print(response)
print(json.dumps(response.__dict__, indent=2, default=str))
