#!/usr/bin/env python
"""Debug script to test main.py startup"""

import sys
print("✓ Python started")

try:
    print("→ Importing fastapi...")
    from fastapi import FastAPI
    print("✓ FastAPI imported")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

try:
    print("→ Importing config...")
    from config.settings import settings
    print(f"✓ Config loaded (env={settings.api_environment})")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

try:
    print("→ Importing schemas...")
    from schemas.models import UserCreate, UserResponse
    print("✓ Schemas imported")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

try:
    print("→ Importing services...")
    from services.supabase_client import supabase_client
    from services.ml_service import ml_service
    print("✓ Services imported")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

try:
    print("→ Importing main module...")
    import importlib
    import traceback
    try:
        import main
        print("✓ Main module imported")
    except Exception as e:
        print(f"✗ Error during import: {e}")
        traceback.print_exc()
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("→ Checking if app exists...")
    print(f"   Main module contents: {dir(main)}")
    if hasattr(main, 'app'):
        app = main.app
        print(f"✓ App found: {app}")
    else:
        print("✗ 'app' not found in main module")
        print(f"   Available objects: {[x for x in dir(main) if not x.startswith('_')]}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All checks passed!")
print("You can now run: uvicorn main:app --reload")
