from typing import Optional, List, Dict, Any
from loguru import logger
from config.settings import settings
from datetime import datetime
import uuid
from supabase import create_client


class SupabaseClient:
    """Client for Supabase database operations"""
    
    def __init__(self):
        """Initialize Supabase client with both anon and service keys"""
        self.url = settings.supabase_url
        self.anon_key = settings.supabase_key
        self.service_key = settings.supabase_service_key
        self.client_anon = None
        self.client_service = None

        try:
            if not self.url or not self.anon_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

            # Create anon client for reads
            self.client_anon = create_client(self.url, self.anon_key)
            
            # Create service client for writes (bypasses RLS)
            if self.service_key:
                self.client_service = create_client(self.url, self.service_key)
            else:
                self.client_service = self.client_anon
                
            logger.info("✅ Supabase client initialized")
            logger.info(f"   URL: {self.url}")
        except Exception as e:
            logger.error(f"❌ Error initializing Supabase: {e}")
            self.client_anon = None
            self.client_service = None

    def _execute(self, query):
        result = query.execute()
        if hasattr(result, "error") and result.error:
            error_message = getattr(result.error, "message", str(result.error))
            raise RuntimeError(error_message)
        return getattr(result, "data", None)

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email address"""
        try:
            logger.debug(f"Getting user by email: {email}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("users").select("*").eq("email", email).limit(1)
            )
            return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            logger.debug(f"Getting user: {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("users").select("*").eq("user_id", user_id).limit(1)
            )
            return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            raise

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        try:
            logger.debug(f"Creating user with data: {user_data}")
            user_record = {
                "email": user_data.get("email"),
                "name": user_data.get("name"),
            }

            if self.client_service is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client_service.table("users").insert([user_record])
            )
            created_user = data[0] if data else user_record
            user_id = created_user.get("user_id")
            logger.info(f"✅ Created user: {user_id}")
            return created_user
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def create_daily_log(self, user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a daily log entry"""
        try:
            logger.debug(f"Creating daily log for user {user_id}")
            log_record = {
                "user_id": user_id,
                "date": log_data.get("date", datetime.utcnow().date().isoformat()),
                "screen_time": log_data.get("screen_time", 0),
                "late_night_usage": int(log_data.get("late_night_usage", 0)),
                "sleep_hours": log_data.get("sleep_hours", 0),
                "activity_level": int(log_data.get("activity_level", 1)),
                "sitting_time": log_data.get("sitting_time", 0),
                "inactivity_periods": int(log_data.get("inactivity_periods", 0)),
                "steps": int(log_data.get("steps", 0)),
                "meals_per_day": int(log_data.get("meals_per_day", 1)),
                "calorie_intake": int(log_data.get("calorie_intake", 0)),
                "food_quality": int(log_data.get("food_quality", 1)),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client_service is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client_service.table("daily_logs").upsert(log_record, on_conflict="user_id, date")
            )
            created = data[0] if data else log_record
            logger.info(f"✅ Created daily log: {created.get('id', 'unknown')}")
            return created
        except Exception as e:
            logger.error(f"Error creating daily log: {e}")
            raise

    async def save_prediction(self, user_id: str, log_id: str, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Save prediction results"""
        try:
            logger.debug(f"Saving prediction for log {log_id}")
            prediction_record = {
                "user_id": user_id,
                "log_id": log_id,
                "fatigue": int(predictions.get("fatigue", 0)),
                "future_health_risk": int(predictions.get("future_health_risk", 0)),
                "diabetes_risk": int(predictions.get("diabetes_risk", 0)),
                "anemia_risk": int(predictions.get("anemia_risk", 0)),
                "pcos_risk": int(predictions.get("pcos_risk", 0)),
                "created_at": datetime.utcnow().isoformat()
            }

            # Manual upsert: check if exists, then update or insert
            existing = self._execute(
                self.client_service.table("predictions").select("id").eq("log_id", log_id).limit(1)
            )

            if existing:
                prediction_id = existing[0]['id']
                data = self._execute(
                    self.client_service.table("predictions").update(prediction_record).eq("id", prediction_id)
                )
            else:
                data = self._execute(
                    self.client_service.table("predictions").insert([prediction_record])
                )
            
            saved = data[0] if data else prediction_record
            logger.info(f"✅ Saved prediction: {saved.get('id', 'unknown')}")
            return saved
        except Exception as e:
            logger.error(f"Error saving prediction: {e}")
            raise

    async def save_anomaly(self, user_id: str, log_id: str, anomaly_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save anomaly detection results"""
        try:
            logger.debug(f"Saving anomaly for log {log_id}")
            anomaly_record = {
                "user_id": user_id,
                "log_id": log_id,
                "anomaly_flag": 1 if anomaly_data.get("is_anomaly", False) else 0,
                "anomaly_score": float(anomaly_data.get("anomaly_score", 0)),
                "created_at": datetime.utcnow().isoformat()
            }

            # Manual upsert
            existing = self._execute(
                self.client_service.table("anomalies").select("id").eq("log_id", log_id).limit(1)
            )

            if existing:
                anomaly_id = existing[0]['id']
                data = self._execute(
                    self.client_service.table("anomalies").update(anomaly_record).eq("id", anomaly_id)
                )
            else:
                data = self._execute(
                    self.client_service.table("anomalies").insert([anomaly_record])
                )
            
            saved = data[0] if data else anomaly_record
            logger.info(f"✅ Saved anomaly: {saved.get('id', 'unknown')}")
            return saved
        except Exception as e:
            logger.error(f"Error saving anomaly: {e}")
            raise

    async def save_behavior_cluster(self, user_id: str, log_id: str, cluster_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save behavior cluster results"""
        try:
            logger.debug(f"Saving behavior cluster for log {log_id}")
            cluster_record = {
                "user_id": user_id,
                "log_id": log_id,
                "cluster_id": int(cluster_data.get("cluster_id", 0)),
                "cluster_label": cluster_data.get("cluster_name", ""),
                "created_at": datetime.utcnow().isoformat()
            }

            # Manual upsert
            existing = self._execute(
                self.client_service.table("behavior_clusters").select("id").eq("log_id", log_id).limit(1)
            )

            if existing:
                bc_id = existing[0]['id']
                data = self._execute(
                    self.client_service.table("behavior_clusters").update(cluster_record).eq("id", bc_id)
                )
            else:
                data = self._execute(
                    self.client_service.table("behavior_clusters").insert([cluster_record])
                )
            
            saved = data[0] if data else cluster_record
            logger.info(f"✅ Saved behavior cluster: {saved.get('id', 'unknown')}")
            return saved
        except Exception as e:
            logger.error(f"Error saving behavior cluster: {e}")
            raise

    async def save_insights(self, user_id: str, log_id: str, insights_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save AI insights"""
        try:
            logger.debug(f"Saving insights for log {log_id}")
            insight_record = {
                "user_id": user_id,
                "log_id": log_id,
                "summary": insights_data.get("summary", ""),
                "reasons": insights_data.get("reasons", ""),
                "recommendations": insights_data.get("recommendations", ""),
                "created_at": datetime.utcnow().isoformat()
            }

            # Manual upsert
            existing = self._execute(
                self.client_service.table("insights").select("id").eq("log_id", log_id).limit(1)
            )

            if existing:
                insight_id = existing[0]['id']
                data = self._execute(
                    self.client_service.table("insights").update(insight_record).eq("id", insight_id)
                )
            else:
                data = self._execute(
                    self.client_service.table("insights").insert([insight_record])
                )
            
            saved = data[0] if data else insight_record
            logger.info(f"✅ Saved insight: {saved.get('id', 'unknown')}")
            return saved
        except Exception as e:
            logger.error(f"Error saving insights: {e}")
            raise

    async def get_user_logs(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get user's daily logs"""
        try:
            logger.debug(f"Getting logs for user {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("daily_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting user logs: {e}")
            return []

    async def get_user_log_count(self, user_id: str) -> int:
        """Get the total number of daily logs for a user"""
        try:
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            # Use count option for efficiency
            result = client.table("daily_logs").select("id", count="exact").eq("user_id", user_id).execute()
            return result.count if hasattr(result, "count") else 0
        except Exception as e:
            logger.error(f"Error getting log count: {e}")
            return 0

    async def get_user_predictions(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get user's predictions"""
        try:
            logger.debug(f"Getting predictions for user {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("predictions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return []

    async def get_user_insights(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's insights"""
        try:
            logger.debug(f"Getting insights for user {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("insights").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting insights: {e}")
            return []

    async def get_user_anomalies(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's anomalies"""
        try:
            logger.debug(f"Getting anomalies for user {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("anomalies").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            
            if data:
                for row in data:
                    row["is_anomaly"] = bool(row.get("anomaly_flag", 0))
                    
            return data or []
        except Exception as e:
            logger.error(f"Error getting anomalies: {e}")
            return []

    async def get_user_behavior_clusters(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's behavior clusters"""
        try:
            logger.debug(f"Getting behavior clusters for user {user_id}")
            client = self.client_service or self.client_anon
            if client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                client.table("behavior_clusters").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting behavior clusters: {e}")
            return []

    async def get_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            logger.debug(f"Getting dashboard data for user {user_id}")
            user = await self.get_user(user_id)
            recent_logs = await self.get_user_logs(user_id, limit=7)
            recent_predictions = await self.get_user_predictions(user_id, limit=7)
            recent_insights = await self.get_user_insights(user_id, limit=5)
            recent_anomalies = await self.get_user_anomalies(user_id, limit=5)
            recent_behavior_clusters = await self.get_user_behavior_clusters(user_id, limit=5)
            
            # Suppress anomalies for new users (less than 3 logs)
            if len(recent_logs) < 3:
                for anomaly in recent_anomalies:
                    anomaly["is_anomaly"] = False
                    anomaly["anomaly_flag"] = 0
                logger.info(f"Anomalies suppressed in dashboard for user {user_id} due to low log count ({len(recent_logs)})")

            # Dynamically inject SHAP explanations for the most recent log
            if recent_logs:
                from services.ml_service import ml_service
                latest_log = recent_logs[0]
                
                if recent_anomalies and recent_anomalies[0].get("is_anomaly"):
                    recent_anomalies[0]["anomaly_type"] = ml_service.explain_anomaly(latest_log, user)
                    
                if recent_behavior_clusters:
                    cluster_id = recent_behavior_clusters[0].get("cluster_id", 0)
                    recent_behavior_clusters[0]["behavior_pattern"] = ml_service.explain_behavior(latest_log, user, cluster_id)
            
            summary_stats = {}
            if recent_predictions:
                avg_health_risk = sum(p.get("future_health_risk", 0) for p in recent_predictions) / len(recent_predictions)
                avg_fatigue = sum(p.get("fatigue", 0) for p in recent_predictions) / len(recent_predictions)
                summary_stats = {
                    "avg_health_risk_score": avg_health_risk,
                    "avg_fatigue_level": avg_fatigue,
                    "total_anomalies": sum(1 for a in recent_anomalies if a.get("is_anomaly", False)) if recent_anomalies else 0
                }
            return {
                "user": user,
                "recent_logs": recent_logs,
                "recent_predictions": recent_predictions,
                "recent_insights": recent_insights,
                "recent_anomalies": recent_anomalies,
                "recent_behavior_clusters": recent_behavior_clusters,
                "summary_stats": summary_stats
            }
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                "user": None,
                "recent_logs": [],
                "recent_predictions": [],
                "recent_insights": [],
                "recent_anomalies": [],
                "recent_behavior_clusters": [],
                "summary_stats": {}
            }


# Create singleton instance
supabase_client = SupabaseClient()
