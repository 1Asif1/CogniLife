from typing import Dict, Any, List
from loguru import logger
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import os


class MLService:
    """Service for machine learning predictions and analysis"""
    
    def __init__(self):
        """Initialize ML service and load models"""
        logger.info("Initializing ML Service...")
        
        # Get model paths
        model_dir = Path(__file__).parent.parent / "models"
        feature_engineering_dir = model_dir / "feature_engineering"
        
        self.scaler = None
        self.features = None
        
        try:
            # Load scaler
            scaler_path = feature_engineering_dir / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✅ Scaler loaded from {scaler_path}")
            else:
                logger.warning(f"⚠️ Scaler not found at {scaler_path}")
            
            # Load feature names
            features_path = feature_engineering_dir / "features.pkl"
            if features_path.exists():
                self.features = joblib.load(features_path)
                logger.info(f"✅ Features loaded from {features_path}")
            else:
                logger.warning(f"⚠️ Features not found at {features_path}")
            
            logger.info("✅ ML Service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing ML models: {e}")
            logger.warning("Falling back to placeholder predictions")
    
    def predict_health(self, user_data: Dict[str, Any], log_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate health predictions and insights
        
        Args:
            user_data: User profile data
            log_data: Daily log data
        
        Returns:
            Dictionary containing predictions, anomalies, behavior clusters, and insights
        """
        try:
            logger.info("Running health predictions")
            
            # Extract features from log data
            sleep_duration = log_data.get("sleep_duration", 0)
            stress_level = log_data.get("stress_level", 5)
            mood = log_data.get("mood", 5)
            energy_level = log_data.get("energy_level", 5)
            sleep_quality = log_data.get("sleep_quality", 5)
            
            # Calculate prediction scores
            health_risk_score = self._calculate_health_risk(log_data)
            fatigue_level = self._calculate_fatigue(sleep_duration, energy_level)
            stress_prediction = stress_level / 10.0
            sleep_quality_prediction = sleep_quality / 10.0
            
            # Detect anomalies
            is_anomaly, anomaly_type, anomaly_score = self._detect_anomaly(log_data)
            
            # Perform behavior clustering
            cluster_id, cluster_name, behavior_pattern = self._perform_clustering(log_data)
            
            # Generate insights
            insights_data = self._generate_insights(log_data, health_risk_score)
            
            return {
                "predictions": {
                    "health_risk_score": round(health_risk_score, 3),
                    "fatigue_level": round(fatigue_level, 3),
                    "stress_prediction": round(stress_prediction, 3),
                    "sleep_quality_prediction": round(sleep_quality_prediction, 3),
                    "anomaly_detected": is_anomaly
                },
                "anomaly": {
                    "is_anomaly": is_anomaly,
                    "anomaly_type": anomaly_type,
                    "anomaly_score": round(anomaly_score, 3),
                    "description": f"Detected {anomaly_type} pattern" if is_anomaly else "Normal health pattern"
                },
                "behavior_cluster": {
                    "cluster_id": cluster_id,
                    "cluster_name": cluster_name,
                    "cluster_confidence": 0.85,
                    "behavior_pattern": behavior_pattern
                },
                "insights": insights_data
            }
        except Exception as e:
            logger.error(f"Error in health prediction: {e}")
            raise
    
    def _calculate_health_risk(self, log_data: Dict[str, Any]) -> float:
        """Calculate health risk score (0-1)"""
        stress_level = log_data.get("stress_level", 5) / 10.0
        sleep_quality = log_data.get("sleep_quality", 5) / 10.0
        energy_level = log_data.get("energy_level", 5) / 10.0
        
        # Risk calculation: high stress + poor sleep + low energy = high risk
        risk = (stress_level * 0.4) + ((1 - sleep_quality) * 0.3) + ((1 - energy_level) * 0.3)
        return min(1.0, max(0.0, risk))
    
    def _calculate_fatigue(self, sleep_duration: float, energy_level: int) -> float:
        """Calculate fatigue level (0-1)"""
        # Ideal sleep is 7-9 hours
        if 7 <= sleep_duration <= 9:
            sleep_score = 0.0
        else:
            sleep_score = abs(sleep_duration - 8) / 8
        
        energy_score = 1 - (energy_level / 10.0)
        
        fatigue = (sleep_score * 0.5) + (energy_score * 0.5)
        return min(1.0, max(0.0, fatigue))
    
    def _detect_anomaly(self, log_data: Dict[str, Any]) -> tuple:
        """Detect if the log data contains anomalies"""
        stress_level = log_data.get("stress_level", 5)
        sleep_duration = log_data.get("sleep_duration", 0)
        mood = log_data.get("mood", 5)
        
        # Anomaly detection logic
        anomaly_type = None
        anomaly_score = 0.0
        is_anomaly = False
        
        if stress_level > 8:
            is_anomaly = True
            anomaly_type = "high_stress"
            anomaly_score = min(1.0, (stress_level - 8) / 2)
        elif sleep_duration < 3:
            is_anomaly = True
            anomaly_type = "severe_sleep_deprivation"
            anomaly_score = 0.9
        elif mood < 2:
            is_anomaly = True
            anomaly_type = "severe_mood_decline"
            anomaly_score = 0.85
        else:
            anomaly_score = 0.1
        
        return is_anomaly, anomaly_type, anomaly_score
    
    def _perform_clustering(self, log_data: Dict[str, Any]) -> tuple:
        """Perform behavior clustering and return cluster info"""
        mood = log_data.get("mood", 5)
        energy = log_data.get("energy_level", 5)
        
        # Clustering based on mood and energy combinations
        if mood >= 7 and energy >= 7:
            cluster_id = 0
            cluster_name = "High Energy Positive"
            pattern = "Active and motivated"
        elif mood >= 7 and energy < 7:
            cluster_id = 1
            cluster_name = "Positive but Tired"
            pattern = "Good mood despite fatigue"
        elif mood < 7 and energy >= 7:
            cluster_id = 2
            cluster_name = "Energetic but Unhappy"
            pattern = "Active but struggling emotionally"
        else:
            cluster_id = 3
            cluster_name = "Low Energy Negative"
            pattern = "Fatigued and low mood"
        
        return cluster_id, cluster_name, pattern
    
    def _generate_insights(self, log_data: Dict[str, Any], health_risk_score: float) -> Dict[str, Any]:
        """Generate AI insights and recommendations"""
        stress_level = log_data.get("stress_level", 5)
        sleep_duration = log_data.get("sleep_duration", 0)
        mood = log_data.get("mood", 5)
        energy_level = log_data.get("energy_level", 5)
        
        # Generate insight text and recommendations
        insights_list = []
        recommendations = []
        priority = "low"
        
        if health_risk_score > 0.7:
            priority = "high"
            insights_list.append("Your health indicators suggest elevated risk")
            recommendations.append("Consider consulting a healthcare professional")
        elif health_risk_score > 0.5:
            priority = "medium"
            insights_list.append("Your health metrics show moderate concern")
            recommendations.append("Monitor your health closely over the next few days")
        else:
            insights_list.append("Your health indicators are within normal range")
            recommendations.append("Continue with your current healthy habits")
        
        if stress_level > 7:
            recommendations.append("Try stress-reduction techniques like meditation or exercise")
        
        if sleep_duration < 6:
            recommendations.append("Aim for 7-9 hours of sleep per night")
        
        if mood < 4:
            recommendations.append("Consider reaching out to friends or family for support")
        
        if energy_level < 4:
            recommendations.append("Increase physical activity and improve diet")
        
        return {
            "insight_text": "; ".join(insights_list),
            "recommendation": recommendations[0] if recommendations else "Keep monitoring your health",
            "priority": priority,
            "generated_at": None
        }


# Create singleton instance
ml_service = MLService()
