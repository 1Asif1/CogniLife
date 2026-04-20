from typing import Optional, List, Dict, Any
from loguru import logger
from config.settings import settings
from datetime import datetime
import uuid
from supabase import create_client


class SupabaseClient:
    """Client for Supabase database operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.url = settings.supabase_url
        self.key = settings.supabase_key
        self.client = None

        try:
            if not self.url or not self.key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

            self.client = create_client(self.url, self.key)
            logger.info("✅ Supabase client initialized")
            logger.info(f"   URL: {self.url}")
        except Exception as e:
            logger.error(f"❌ Error initializing Supabase: {e}")
            self.client = None

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
            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("users").select("*").eq("email", email).limit(1)
            )
            return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            logger.debug(f"Getting user: {user_id}")
            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("users").select("*").eq("id", user_id).limit(1)
            )
            return data[0] if data else None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            return None

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        try:
            logger.debug(f"Creating user with data: {user_data}")
            user_id = str(uuid.uuid4())
            user_record = {
                "id": user_id,
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "age": user_data.get("age"),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("users").insert(user_record).select("*")
            )
            logger.info(f"✅ Created user: {user_id}")
            return data[0] if data else user_record
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    async def create_daily_log(self, user_id: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a daily log entry"""
        try:
            logger.debug(f"Creating daily log for user {user_id}")
            log_record = {
                "user_id": user_id,
                "sleep_duration": log_data.get("sleep_duration", 0),
                "mood": log_data.get("mood", 5),
                "stress_level": log_data.get("stress_level", 5),
                "energy_level": log_data.get("energy_level", 5),
                "sleep_quality": log_data.get("sleep_quality", 5),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("daily_logs").insert(log_record).select("*")
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
                "health_risk_score": predictions.get("health_risk_score", 0),
                "fatigue_level": predictions.get("fatigue_level", 0),
                "stress_prediction": predictions.get("stress_prediction", 0),
                "sleep_quality_prediction": predictions.get("sleep_quality_prediction", 0),
                "anomaly_detected": predictions.get("anomaly_detected", False),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("predictions").insert(prediction_record).select("*")
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
                "is_anomaly": anomaly_data.get("is_anomaly", False),
                "anomaly_type": anomaly_data.get("anomaly_type", ""),
                "anomaly_score": anomaly_data.get("anomaly_score", 0),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("anomalies").insert(anomaly_record).select("*")
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
                "cluster_id": cluster_data.get("cluster_id", 0),
                "cluster_name": cluster_data.get("cluster_name", ""),
                "cluster_confidence": cluster_data.get("cluster_confidence", 0),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("behavior_clusters").insert(cluster_record).select("*")
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
                "insight_text": insights_data.get("insight_text", ""),
                "recommendation": insights_data.get("recommendation", ""),
                "priority": insights_data.get("priority", "low"),
                "created_at": datetime.utcnow().isoformat()
            }

            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("insights").insert(insight_record).select("*")
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
            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("daily_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting user logs: {e}")
            return []

    async def get_user_predictions(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get user's predictions"""
        try:
            logger.debug(f"Getting predictions for user {user_id}")
            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("predictions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting predictions: {e}")
            return []

    async def get_user_insights(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's insights"""
        try:
            logger.debug(f"Getting insights for user {user_id}")
            if self.client is None:
                raise RuntimeError("Supabase client not initialized")

            data = self._execute(
                self.client.table("insights").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            )
            return data or []
        except Exception as e:
            logger.error(f"Error getting insights: {e}")
            return []

    async def get_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            logger.debug(f"Getting dashboard data for user {user_id}")
            user = await self.get_user(user_id)
            recent_logs = await self.get_user_logs(user_id, limit=7)
            recent_predictions = await self.get_user_predictions(user_id, limit=7)
            recent_insights = await self.get_user_insights(user_id, limit=5)
            summary_stats = {}
            if recent_predictions:
                avg_health_risk = sum(p.get("health_risk_score", 0) for p in recent_predictions) / len(recent_predictions)
                avg_fatigue = sum(p.get("fatigue_level", 0) for p in recent_predictions) / len(recent_predictions)
                summary_stats = {
                    "avg_health_risk_score": avg_health_risk,
                    "avg_fatigue_level": avg_fatigue,
                    "total_anomalies": sum(1 for p in recent_predictions if p.get("anomaly_detected", False))
                }
            return {
                "user": user,
                "recent_logs": recent_logs,
                "recent_predictions": recent_predictions,
                "recent_insights": recent_insights,
                "summary_stats": summary_stats
            }
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                "user": None,
                "recent_logs": [],
                "recent_predictions": [],
                "recent_insights": [],
                "summary_stats": {}
            }


# Create singleton instance
supabase_client = SupabaseClient()
