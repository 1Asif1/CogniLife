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

    def generate_action_plan(self, log_data: Dict[str, Any], prediction_data: Dict[str, Any] = None, insights_data: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Generate prioritized action plan recommendations based on health data
        
        Args:
            log_data: Latest health log data
            prediction_data: ML prediction results
            insights_data: Historical insights
        
        Returns:
            List of actionable recommendations with priority levels
        """
        recommendations = []
        
        stress_level = log_data.get("stress_level", 5)
        sleep_duration = log_data.get("sleep_duration", 0)
        mood = log_data.get("mood", 5)
        energy_level = log_data.get("energy_level", 5)
        screen_time = log_data.get("screen_time_hours", 0)
        steps = log_data.get("steps", 0)
        
        # 1. Sleep & Screen Time Recommendation
        if sleep_duration < 7 or screen_time > 2:
            recommendations.append({
                "id": "reduce_screen_time",
                "title": "Reduce screen time after 11 PM",
                "description": f"Your screen usage ({screen_time:.1f}h) and sleep duration ({sleep_duration}h) suggest you should reduce evening screen time. Try reading or meditation instead.",
                "priority": "HIGH",
                "impact": "Improve sleep by 25%",
                "icon": "moon-outline",
                "color": "#3B82F6",
                "bgColor": "#EFF6FF",
                "expected_improvement": 0.25
            })
        
        # 2. Physical Activity Recommendation
        if steps < 10000:
            daily_deficit = 10000 - steps
            risk_reduction = min(0.15, (daily_deficit / 10000) * 0.3)
            recommendations.append({
                "id": "increase_steps",
                "title": "Increase daily steps to 10,000",
                "description": f"You're currently averaging {steps:.0f} steps. Small increases can significantly reduce diabetes and heart disease risk.",
                "priority": "HIGH",
                "impact": f"Reduce risk by {int(risk_reduction * 100)}%",
                "icon": "walk-outline",
                "color": "#10B981",
                "bgColor": "#F0FDF4",
                "expected_improvement": risk_reduction
            })
        
        # 3. App Time Limits Recommendation
        if screen_time > 3:
            addiction_reduction = min(0.30, (screen_time - 2) / 5 * 0.3)
            recommendations.append({
                "id": "app_limits",
                "title": "Set app time limits",
                "description": f"Social media usage is {screen_time:.1f} hours daily. Consider setting 2-hour daily limits.",
                "priority": "CRITICAL",
                "impact": f"Lower addiction by {int(addiction_reduction * 100)}%",
                "icon": "phone-portrait-outline",
                "color": "#EF4444",
                "bgColor": "#FEF2F2",
                "expected_improvement": addiction_reduction
            })
        
        # 4. Meditation Recommendation
        if stress_level > 5 or mood < 6:
            focus_improvement = (10 - stress_level) / 10 * 0.2
            recommendations.append({
                "id": "meditation",
                "title": "Practice 10-minute daily meditation",
                "description": "Meditation can help balance dopamine levels and reduce stress responses. Start with just 10 minutes daily.",
                "priority": "MEDIUM",
                "impact": f"Improve focus by {int(focus_improvement * 100)}%",
                "icon": "pulse-outline",
                "color": "#6366F1",
                "bgColor": "#EFF6FF",
                "expected_improvement": focus_improvement
            })
        
        # 5. Stress Management Recommendation
        if stress_level > 7:
            recommendations.append({
                "id": "stress_management",
                "title": "Increase stress management activities",
                "description": "Your stress level is elevated. Try yoga, breathing exercises, or counseling to manage stress better.",
                "priority": "CRITICAL",
                "impact": "Reduce stress by 40%",
                "icon": "water-outline",
                "color": "#8B5CF6",
                "bgColor": "#F5F3FF",
                "expected_improvement": 0.40
            })
        
        # 6. Nutrition & Energy Recommendation
        if energy_level < 5:
            recommendations.append({
                "id": "nutrition",
                "title": "Improve nutrition and hydration",
                "description": "Your low energy suggests you need better nutrition. Ensure balanced meals and proper hydration throughout the day.",
                "priority": "HIGH",
                "impact": "Boost energy by 35%",
                "icon": "nutrition-outline",
                "color": "#F59E0B",
                "bgColor": "#FFFBEB",
                "expected_improvement": 0.35
            })
        
        # 7. Mood Support Recommendation
        if mood < 4:
            recommendations.append({
                "id": "mood_support",
                "title": "Reach out for emotional support",
                "description": "Your mood is low. Consider talking to friends, family, or a mental health professional for support.",
                "priority": "CRITICAL",
                "impact": "Improve mood by 50%",
                "icon": "heart-outline",
                "color": "#EC4899",
                "bgColor": "#FDF2F8",
                "expected_improvement": 0.50
            })
        
        # Sort by priority (CRITICAL > HIGH > MEDIUM > LOW)
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))
        
        return recommendations


# Create singleton instance
ml_service = MLService()
