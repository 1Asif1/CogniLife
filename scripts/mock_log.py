import asyncio
from services.supabase_client import supabase_client
from services.ml_service import ml_service

async def main():
    try:
        data = supabase_client._execute(supabase_client.client_anon.table('users').select('*').limit(1))
        user = data[0] if data else None
        uid = user['id'] if user else None
        print('User:', uid)
        
        if uid:
            log_data = {
                'sleep_hours': 4,
                'sleep_duration': 4,
                'stress_level': 9,
                'mood': 3,
                'energy_level': 2,
                'sleep_quality': 3,
                'screen_time': 10,
                'late_night_usage': 4,
                'inactivity_periods': 6,
                'sitting_time': 9,
                'activity_level': 'low'
            }
            log = await supabase_client.create_daily_log(uid, log_data)
            log_id = log.get('id') or log.get('log_id')
            print('Created log:', log_id)
            
            full_features = ml_service._build_full_features(log_data, user)
            is_anomaly, anomaly_type, anomaly_score = ml_service._detect_anomaly(log_data, full_features)
            await supabase_client.save_anomaly(uid, log_id, {
                'is_anomaly': is_anomaly,
                'anomaly_type': anomaly_type,
                'anomaly_score': anomaly_score
            })
            
            cluster_id, cluster_name, behavior_pattern = ml_service._perform_clustering(log_data, full_features)
            await supabase_client.save_behavior_cluster(uid, log_id, {
                'cluster_id': cluster_id,
                'cluster_name': cluster_name,
                'cluster_confidence': 0.85,
                'behavior_pattern': behavior_pattern
            })
            
            print('Mock data created!')
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
