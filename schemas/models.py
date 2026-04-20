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
    id: str
    email: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== DAILY LOG MODELS ====================

class DailyLogCreate(BaseModel):
    """Schema for creating a daily log"""
    sleep_duration: float
    sleep_quality: int  # 1-10
    mood: int  # 1-10
    energy_level: int  # 1-10
    stress_level: int  # 1-10
    exercise_minutes: int
    water_intake: float  # liters
    caffeine_intake: float  # mg
    notes: Optional[str] = None


class DailyLogResponse(BaseModel):
    """Schema for daily log response"""
    id: str
    user_id: str
    sleep_duration: float
    sleep_quality: int
    mood: int
    energy_level: int
    stress_level: int
    exercise_minutes: int
    water_intake: float
    caffeine_intake: float
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== PREDICTION MODELS ====================

class PredictionResponse(BaseModel):
    """Schema for prediction response"""
    id: str
    user_id: str
    log_id: str
    health_risk_score: float
    fatigue_level: float
    stress_prediction: float
    sleep_quality_prediction: float
    anomaly_detected: bool
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
    is_anomaly: bool
    anomaly_score: float
    anomaly_type: Optional[str] = None
    description: Optional[str] = None
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
    cluster_name: Optional[str] = None
    cluster_probability: float
    behavior_pattern: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== INSIGHTS MODELS ====================

class InsightsResponse(BaseModel):
    """Schema for AI insights response"""
    id: str
    user_id: str
    log_id: str
    insight_type: str
    insight_text: str
    confidence_score: float
    recommendations: Optional[List[str]] = None
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
