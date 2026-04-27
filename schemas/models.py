from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# ==================== USER MODELS ====================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    user_id: str
    email: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== DAILY LOG MODELS ====================

class DailyLogCreate(BaseModel):
    """Schema for creating a daily log"""
    screen_time: Optional[float] = 0
    late_night_usage: Optional[float] = 0
    sleep_hours: Optional[float] = 0
    activity_level: Optional[str] = "low"
    sitting_time: Optional[float] = 0
    inactivity_periods: Optional[int] = 0
    steps: Optional[int] = 0
    meals_per_day: Optional[int] = 3
    calorie_intake: Optional[int] = 0
    food_quality: Optional[int] = 1


class DailyLogResponse(BaseModel):
    """Schema for daily log response"""
    id: str
    user_id: str
    date: Optional[str] = None
    screen_time: Optional[float] = 0
    late_night_usage: Optional[float] = 0
    sleep_hours: Optional[float] = 0
    activity_level: Optional[str] = "low"
    sitting_time: Optional[float] = 0
    inactivity_periods: Optional[int] = 0
    steps: Optional[int] = 0
    meals_per_day: Optional[int] = 3
    calorie_intake: Optional[int] = 0
    food_quality: Optional[int] = 1
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== PREDICTION MODELS ====================

class PredictionResponse(BaseModel):
    """Schema for prediction response"""
    id: str
    user_id: str
    log_id: str
    fatigue: Optional[int] = None
    future_health_risk: Optional[int] = None
    diabetes_risk: Optional[int] = None
    anemia_risk: Optional[int] = None
    pcos_risk: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompletePredictionResponse(BaseModel):
    """Schema for complete prediction response with all related data"""
    daily_log: DailyLogResponse
    prediction: PredictionResponse
    anomaly: 'AnomalyResponse'
    behavior_cluster: 'BehaviorClusterResponse'
    insights: 'InsightsResponse'


# ==================== ANOMALY MODELS ====================

class AnomalyResponse(BaseModel):
    """Schema for anomaly detection response"""
    id: str
    user_id: str
    log_id: str
    anomaly_flag: int
    anomaly_score: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== BEHAVIOR CLUSTER MODELS ====================

class BehaviorClusterResponse(BaseModel):
    """Schema for behavior cluster response"""
    id: str
    user_id: str
    log_id: str
    cluster_id: int
    cluster_label: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== INSIGHTS MODELS ====================

class InsightsResponse(BaseModel):
    """Schema for AI insights response"""
    id: str
    user_id: str
    log_id: str
    summary: Optional[str] = None
    reasons: Optional[str] = None
    recommendations: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== DASHBOARD MODELS ====================

class DashboardResponse(BaseModel):
    """Schema for comprehensive dashboard response"""
    user: UserResponse
    recent_logs: List[DailyLogResponse]
    recent_predictions: List[PredictionResponse]
    recent_insights: List[InsightsResponse]
    recent_anomalies: Optional[List[AnomalyResponse]] = None
    recent_behavior_clusters: Optional[List[BehaviorClusterResponse]] = None
    summary_stats: Optional[Dict[str, Any]] = None


# ==================== SUCCESS & ERROR MODELS ====================

class SuccessResponse(BaseModel):
    """Schema for successful response"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Schema for error response"""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None


# Update forward references for circular imports
CompletePredictionResponse.model_rebuild()
