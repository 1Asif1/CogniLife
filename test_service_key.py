#!/usr/bin/env python
"""Test with service role key to bypass RLS"""

from supabase import create_client
import uuid
import json

SUPABASE_URL = "https://geptqqykttygcbsrlxay.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcHRxcXlrdHR5Z2Nic3JseGF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI5NzQzNCwiZXhwIjoyMDkxODczNDM0fQ.Rnl0zUbWNkRFOATXJYyeXIV3HPruosyHzBBZAkQH1OQ"

client = create_client(SUPABASE_URL, SERVICE_KEY)

print("=" * 60)
print("Testing with Service Role Key (should bypass RLS)")
print("=" * 60)

# Test 1: Insert with service key
print("\n[TEST 1] Inserting with service role key...")
try:
    test_record = {
        "email": "service_test@test.com",
        "name": "Service Test User"
    }
    response = client.table("users").insert([test_record]).execute()
    print(f"✅ Insert successful!")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Insert with id using service key
print("\n[TEST 2] Inserting with id using service role key...")
try:
    test_record = {
        "id": str(uuid.uuid4()),
        "email": "service_test2@test.com",
        "name": "Service Test User 2"
    }
    response = client.table("users").insert([test_record]).execute()
    print(f"✅ Insert successful!")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Select to verify inserts
print("\n[TEST 3] Selecting all users...")
try:
    response = client.table("users").select("*").execute()
    print(f"✅ Select successful!")
    print(f"Records found: {len(response.data)}")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
