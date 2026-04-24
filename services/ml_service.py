from typing import Dict, Any, List
from loguru import logger
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import os
import sys


class MLService:
    """Service for machine learning predictions and analysis"""

    # Target columns the multi-output model predicts
    TARGET_COLS = ["Fatigue", "FutureHealthRisk", "DiabetesRisk", "AnemiaRisk", "PCOSRisk"]
    LABEL_MAP = {0: "Low", 1: "Medium", 2: "High"}

    def __init__(self):
        """Initialize ML service and load models"""
        logger.info("Initializing ML Service...")

        model_dir = Path(__file__).parent.parent / "models"
        feature_engineering_dir = model_dir / "feature_engineering"
        prediction_dir = model_dir / "prediction"

        self.scaler = None
        self.features = None
        self.xgb_model = None
        self.shap_explainers = None
        self.fe_func = None

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

            # Load XGBoost multi-output model
            xgb_path = prediction_dir / "multi_output_xgb_model.pkl"
            if xgb_path.exists():
                self.xgb_model = joblib.load(xgb_path)
                logger.info(f"✅ XGBoost model loaded ({len(self.xgb_model.estimators_)} targets)")
            else:
                logger.warning(f"⚠️ XGBoost model not found at {xgb_path}")

            # Load feature engineering function
            fe_dir = str(feature_engineering_dir)
            if fe_dir not in sys.path:
                sys.path.insert(0, fe_dir)
            from feature_engineering import feature_engineering as _fe
            self.fe_func = _fe
            logger.info("✅ Feature engineering function loaded")

            # Build SHAP explainers (one per target)
            if self.xgb_model is not None:
                import shap
                self.shap_explainers = []
                for i in range(len(self.TARGET_COLS)):
                    explainer = shap.TreeExplainer(self.xgb_model.estimators_[i])
                    self.shap_explainers.append(explainer)
                logger.info("✅ SHAP explainers ready")

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

    # ----------------------------------------------------------------
    # Real ML prediction + SHAP explanation
    # ----------------------------------------------------------------

    def _map_supabase_to_model_input(self, log_data: Dict[str, Any], user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Map Supabase daily_logs + user profile columns to the raw feature
        names expected by feature_engineering.py.
        """
        # activity_level: 'low'->0, 'moderate'->1, 'high'->2
        act_map = {"low": 0, "moderate": 1, "high": 2}
        act_raw = log_data.get("activity_level", "low")
        activity = act_map.get(str(act_raw).lower(), 0)

        meals = log_data.get("meals_per_day", 3)
        cal = log_data.get("calorie_intake", 1800)

        # DietQuality heuristic (0-2): based on meals & calorie range
        if meals >= 3 and 1500 <= cal <= 2500:
            diet_quality = 2
        elif meals >= 2 and 1200 <= cal <= 3000:
            diet_quality = 1
        else:
            diet_quality = 0

        height = float((user_data or {}).get("height", 170) or 170)
        weight = float((user_data or {}).get("weight", 70) or 70)
        gender_raw = str((user_data or {}).get("gender", "Male") or "Male")

        return {
            "ScreenTime": float(log_data.get("screen_time", 0) or 0),
            "SleepHours": float(log_data.get("sleep_hours", 7) or 7),
            "LateNightUsage": float(log_data.get("late_night_usage", 0) or 0),
            "ActivityLevel": activity,
            "DietQuality": diet_quality,
            "SittingTime": float(log_data.get("sitting_time", 4) or 4),
            "InactivityPeriods": int(log_data.get("inactivity_periods", 1) or 1),
            "MealsPerDay": int(meals),
            "CalorieIntake": int(cal),
            "Gender": gender_raw,
            "Height": height,
            "Weight": weight,
        }

    def predict_and_explain(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run feature engineering → XGBoost prediction → SHAP explanation.
        Returns per-target: prediction class, label, top-3 contributing features.
        """
        df = pd.DataFrame([user_input])
        df = self.fe_func(df)

        # Align columns with what the model was trained on
        expected_features = list(self.xgb_model.estimators_[0].feature_names_in_)
        for col in expected_features:
            if col not in df.columns:
                df[col] = 0
        df = df[expected_features]

        preds = self.xgb_model.predict(df)[0]

        results = {}
        for i, target in enumerate(self.TARGET_COLS):
            explainer = self.shap_explainers[i]
            shap_values = explainer(df, check_additivity=False)
            pred_class = int(preds[i])

            vals = shap_values.values[0, :, pred_class]
            feature_names = df.columns
            idx = np.argsort(np.abs(vals))[::-1][:3]
            top_features = [(str(feature_names[j]), float(vals[j])) for j in idx]

            results[target] = {
                "prediction": pred_class,
                "label": self.LABEL_MAP.get(pred_class, "Unknown"),
                "top_features": top_features,
            }
        return results

    # ----------------------------------------------------------------
    # Feature → human-readable suggestion mapping
    # ----------------------------------------------------------------
    _FEATURE_SUGGESTIONS = {
        "SleepHours": "Improve sleep to 7–8 hours nightly",
        "SleepScore": "Improve sleep to 7–8 hours nightly",
        "StressLevel": "Practice stress management (meditation, exercise)",
        "StressScore": "Practice stress management (meditation, exercise)",
        "ScreenTime": "Reduce screen time, especially at night",
        "DigitalLoad": "Reduce screen time, especially at night",
        "LateNightUsage": "Avoid screens after 11 PM",
        "LateNightImpact": "Avoid screens after 11 PM",
        "ActivityLevel": "Increase daily physical activity",
        "ActivityScore": "Increase daily physical activity",
        "DietQuality": "Improve diet quality (balanced nutrition)",
        "DietScore": "Improve diet quality (balanced nutrition)",
        "SedentaryIndex": "Reduce long sitting periods — take a walk every hour",
        "SittingTime": "Reduce long sitting periods — take a walk every hour",
        "CalorieIntake": "Maintain a balanced calorie intake",
        "CalorieBalance": "Maintain a balanced calorie intake",
        "MealsPerDay": "Eat regular, balanced meals throughout the day",
        "MealScore": "Eat regular, balanced meals throughout the day",
        "InactivityPeriods": "Break up prolonged inactivity with short walks",
        "BMI": "Work towards a healthy BMI through diet and exercise",
        "bmi_category": "Work towards a healthy BMI through diet and exercise",
        "dopamine_score": "Reduce instant-gratification habits (social media, late-night browsing)",
        "DopamineScore": "Reduce instant-gratification habits (social media, late-night browsing)",
        "lifestyle_risk": "Adopt a healthier overall lifestyle",
        "health_score": "Focus on improving your overall health score",
    }

    # Visual config per risk target
    _TARGET_UI = {
        "Fatigue": {"icon": "moon-outline", "color": "#3B82F6", "bgColor": "#EFF6FF"},
        "FutureHealthRisk": {"icon": "heart-outline", "color": "#EF4444", "bgColor": "#FEF2F2"},
        "DiabetesRisk": {"icon": "nutrition-outline", "color": "#F59E0B", "bgColor": "#FFFBEB"},
        "AnemiaRisk": {"icon": "water-outline", "color": "#EC4899", "bgColor": "#FDF2F8"},
        "PCOSRisk": {"icon": "fitness-outline", "color": "#8B5CF6", "bgColor": "#F5F3FF"},
    }

    def generate_action_plan(
        self,
        log_data: Dict[str, Any],
        prediction_data: Dict[str, Any] = None,
        insights_data: List[Dict[str, Any]] = None,
        user_data: Dict[str, Any] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generate prioritized action plan using the real XGBoost model + SHAP.
        Falls back to simple rules if the model is not loaded.
        """
        # --- fast fallback when model isn't available ---
        if self.xgb_model is None or self.fe_func is None or self.shap_explainers is None:
            logger.warning("ML model/SHAP not loaded – returning basic recommendations")
            return self._fallback_action_plan(log_data)

        try:
            raw_input = self._map_supabase_to_model_input(log_data, user_data)
            logger.info(f"Model input: {raw_input}")
            results = self.predict_and_explain(raw_input)
            logger.info(f"Prediction results: { {k: v['label'] for k, v in results.items()} }")
        except Exception as e:
            logger.error(f"ML prediction failed, falling back: {e}")
            return self._fallback_action_plan(log_data)

        # Convert SHAP results → UI recommendation cards
        recommendations: List[Dict[str, Any]] = []
        for target, data in results.items():
            pred_label = data["label"]  # Low / Medium / High
            pred_class = data["prediction"]

            # Only generate a card for Medium (1) or High (2) risk
            if pred_class == 0:
                continue

            priority = "CRITICAL" if pred_class == 2 else "HIGH"
            ui = self._TARGET_UI.get(target, {"icon": "alert-outline", "color": "#6B7280", "bgColor": "#F3F4F6"})

            # Build reasons and suggestions from SHAP top features
            reasons = []
            suggestions = []
            for feature, shap_val in data["top_features"]:
                direction = "increasing" if shap_val > 0 else "reducing"
                reasons.append(f"{feature} is {direction} the risk")
                suggestion = self._FEATURE_SUGGESTIONS.get(feature)
                if suggestion and suggestion not in suggestions:
                    suggestions.append(suggestion)

            description = f"Risk level: {pred_label}. " + "; ".join(reasons) + "."
            impact = "; ".join(suggestions[:2]) if suggestions else "Monitor closely"

            recommendations.append({
                "id": target.lower(),
                "title": f"{target.replace('Risk', ' Risk').replace('Future', 'Future ')} — {pred_label}",
                "description": description,
                "priority": priority,
                "impact": impact,
                "icon": ui["icon"],
                "color": ui["color"],
                "bgColor": ui["bgColor"],
            })

        # Sort: CRITICAL first
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))
        return recommendations

    # ----------------------------------------------------------------
    # Fallback (simple rules) when model isn't loaded
    # ----------------------------------------------------------------
    def _fallback_action_plan(self, log_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        recs = []
        screen = log_data.get("screen_time", 0) or 0
        sleep = log_data.get("sleep_hours", 7) or 7
        if float(screen) > 3:
            recs.append({"id": "screen", "title": "Reduce screen time", "description": f"Screen time is {screen}h. Try to keep it under 3h.", "priority": "HIGH", "impact": "Better sleep & focus", "icon": "phone-portrait-outline", "color": "#EF4444", "bgColor": "#FEF2F2"})
        if float(sleep) < 6:
            recs.append({"id": "sleep", "title": "Improve sleep duration", "description": f"You slept {sleep}h. Aim for 7-8h.", "priority": "HIGH", "impact": "Reduce fatigue", "icon": "moon-outline", "color": "#3B82F6", "bgColor": "#EFF6FF"})
        if not recs:
            recs.append({"id": "good", "title": "Looking good!", "description": "Your data looks healthy. Keep up the good work!", "priority": "LOW", "impact": "Maintain your habits", "icon": "checkmark-circle-outline", "color": "#10B981", "bgColor": "#F0FDF4"})
        return recs


# Create singleton instance
ml_service = MLService()

