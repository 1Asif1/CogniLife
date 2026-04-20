#!/usr/bin/env python
"""Test CogniLife API endpoints with Supabase integration"""

import requests
import json
import time

BASE_URL = 'http://localhost:8000'
TIMESTAMP = int(time.time() * 1000)  # Use timestamp for unique emails

print("=" * 60)
print("CogniLife API - Supabase Integration Test")
print("=" * 60)

# Test 1: Create a new user
print('\n[TEST 1] Creating a new user...')
user_data = {
    'email': f'test_{TIMESTAMP}@cognilife.com',
    'name': 'Test User',
    'age': 28,
    'height': 175,
    'weight': 70
}

try:
    response = requests.post(f'{BASE_URL}/api/users', json=user_data)
    print(f'Status Code: {response.status_code}')
    
    if response.status_code == 201:
        result = response.json()
        user_id = result['user_id']
        print(f'✅ User created successfully')
        print(f'   User ID: {user_id}')
        print(f'   Name: {result["name"]}')
        print(f'   Email: {result["email"]}')
        
        # Test 2: Get user by ID
        print('\n[TEST 2] Retrieving user from Supabase...')
        response = requests.get(f'{BASE_URL}/api/users/{user_id}')
        print(f'Status Code: {response.status_code}')
        
        if response.status_code == 200:
            user = response.json()
            print(f'✅ User retrieved from Supabase')
            print(f'   Name: {user["name"]}')
            print(f'   Age: {user["age"]}')
            
            # Test 3: Create a daily log with predictions
            print('\n[TEST 3] Creating daily log with ML predictions...')
            log_data = {
                'sleep_duration': 7.5,
                'mood': 7,
                'stress_level': 4,
                'energy_level': 8,
                'sleep_quality': 8
            }
            response = requests.post(f'{BASE_URL}/api/users/{user_id}/logs', json=log_data)
            print(f'Status Code: {response.status_code}')
            
            if response.status_code == 200:
                result = response.json()
                log_id = result['log']['id']
                prediction = result['prediction']
                
                print(f'✅ Daily log created with predictions')
                print(f'   Log ID: {log_id}')
                print(f'   Predictions:')
                print(f'      Health Risk Score: {prediction["health_risk_score"]:.2f}')
                print(f'      Fatigue Level: {prediction["fatigue_level"]:.2f}')
                print(f'      Stress Prediction: {prediction["stress_prediction"]:.2f}')
                print(f'      Sleep Quality Pred: {prediction["sleep_quality_prediction"]:.2f}')
                print(f'      Anomaly Detected: {prediction["anomaly_detected"]}')
                
                # Test 4: Get user logs
                print('\n[TEST 4] Retrieving user logs...')
                response = requests.get(f'{BASE_URL}/api/users/{user_id}/logs')
                print(f'Status Code: {response.status_code}')
                
                if response.status_code == 200:
                    logs = response.json()
                    print(f'✅ Retrieved {len(logs)} log(s) from Supabase')
                    
                    # Test 5: Get predictions
                    print('\n[TEST 5] Retrieving predictions...')
                    response = requests.get(f'{BASE_URL}/api/users/{user_id}/predictions')
                    print(f'Status Code: {response.status_code}')
                    
                    if response.status_code == 200:
                        predictions = response.json()
                        print(f'✅ Retrieved {len(predictions)} prediction(s) from Supabase')
                        
                        print('\n' + '=' * 60)
                        print('✅ ALL TESTS PASSED!')
                        print('=' * 60)
                        print('\nSummary:')
                        print(f'  - User created and retrieved from Supabase')
                        print(f'  - Daily log submitted and stored')
                        print(f'  - ML predictions generated and saved')
                        print(f'  - Data persisted across API calls')
                        print(f'\nBackend is fully operational with Supabase!')
                    else:
                        print(f'Error retrieving predictions: {response.text}')
            else:
                print(f'Error creating log: {response.text}')
        else:
            print(f'Error retrieving user: {response.text}')
    else:
        print(f'Error creating user: {response.text}')
        
except Exception as e:
    print(f'Error: {e}')
    print('Make sure the FastAPI server is running on http://localhost:8000')
