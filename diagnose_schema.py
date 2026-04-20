#!/usr/bin/env python
"""Diagnose Supabase table schema"""

from supabase import create_client
import json

SUPABASE_URL = "https://geptqqykttygcbsrlxay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcHRxcXlrdHR5Z2Nic3JseGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTc0MzQsImV4cCI6MjA5MTg3MzQzNH0.lJwt4JvhAtcR8Gsl6n_467YXB3ME_2V2mqHl_WC6drc"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("Supabase Schema Diagnostics")
print("=" * 60)

# Test 1: Try to select all from users with limit 1
print("\n[TEST 1] Attempting to select from users table...")
try:
    response = client.table("users").select("*").limit(1).execute()
    print(f"✅ Query successful!")
    print(f"Status: {response.status_code if hasattr(response, 'status_code') else 'N/A'}")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Try to insert a minimal record
print("\n[TEST 2] Attempting to insert minimal record (email only)...")
try:
    test_record = {
        "email": "diagnostic@test.com"
    }
    response = client.table("users").insert([test_record]).execute()
    print(f"✅ Insert successful!")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Try to insert with id
print("\n[TEST 3] Attempting to insert with id...")
try:
    import uuid
    test_record = {
        "id": str(uuid.uuid4()),
        "email": "diagnostic2@test.com"
    }
    response = client.table("users").insert([test_record]).execute()
    print(f"✅ Insert successful!")
    print(f"Data: {json.dumps(response.data, indent=2, default=str)}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
