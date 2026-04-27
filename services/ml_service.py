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
        self.kmeans_model = None
        self.isolation_forest_model = None
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

            # Load KMeans
            kmeans_path = model_dir / "behavioral" / "kmeans_model.pkl"
            if kmeans_path.exists():
                self.kmeans_model = joblib.load(kmeans_path)
                logger.info(f"✅ KMeans model loaded")

            # Load Isolation Forest
            iso_path = model_dir / "anomaly" / "isolation_forest_model.pkl"
            if iso_path.exists():
                self.isolation_forest_model = joblib.load(iso_path)
                logger.info(f"✅ Isolation Forest model loaded")

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
                logger.info("✅ XGBoost SHAP explainers ready")

            self.iso_explainer = None
            if self.isolation_forest_model is not None:
                import shap
                self.iso_explainer = shap.TreeExplainer(self.isolation_forest_model)
                logger.info("✅ Isolation Forest SHAP explainer ready")

            self.kmeans_explainer = None
            if self.kmeans_model is not None:
                import shap
                self.kmeans_explainer = shap.KernelExplainer(self.kmeans_model.predict, self.kmeans_model.cluster_centers_)
                logger.info("✅ KMeans SHAP explainer ready")

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
            sleep_hours = log_data.get("sleep_hours", 7)
            screen_time = log_data.get("screen_time", 2)
            late_night_usage = log_data.get("late_night_usage", 0)
            
            # Calculate prediction scores
            health_risk_score = self._calculate_health_risk(log_data)
            fatigue_level = self._calculate_fatigue(sleep_hours, 5) # Default energy 5
            stress_prediction = min(1.0, late_night_usage / 4.0)
            sleep_quality_prediction = min(1.0, sleep_hours / 8.0) if sleep_hours <= 8 else max(0.0, 1.0 - (sleep_hours - 8) / 4.0)
            
            # Extract full features for ML models
            try:
                full_features = self._build_full_features(log_data, user_data)
            except Exception as e:
                logger.warning(f"Failed to build full features, using fallback: {e}")
                full_features = None
            
            # Detect anomalies
            is_anomaly, anomaly_type, anomaly_score = self._detect_anomaly(log_data, full_features)
            
            # Perform behavior clustering
            cluster_id, cluster_name, behavior_pattern = self._perform_clustering(log_data, full_features)
            
            # Generate insights
            insights_data = self._generate_insights(log_data, health_risk_score)
            
            # Get actual XGBoost predictions for the new schema
            fatigue = 0
            future_health_risk = 0
            diabetes_risk = 0
            anemia_risk = 0
            pcos_risk = 0
            
            if self.xgb_model is not None and self.fe_func is not None:
                try:
                    raw_input = self._map_supabase_to_model_input(log_data, user_data)
                    results = self.predict_and_explain(raw_input)
                    
                    fatigue = results.get("Fatigue", {}).get("prediction", 0)
                    future_health_risk = results.get("FutureHealthRisk", {}).get("prediction", 0)
                    diabetes_risk = results.get("DiabetesRisk", {}).get("prediction", 0)
                    anemia_risk = results.get("AnemiaRisk", {}).get("prediction", 0)
                    pcos_risk = results.get("PCOSRisk", {}).get("prediction", 0)
                except Exception as e:
                    logger.error(f"Error getting XGBoost predictions: {e}")

            return {
                "predictions": {
                    "fatigue": int(fatigue),
                    "future_health_risk": int(future_health_risk),
                    "diabetes_risk": int(diabetes_risk),
                    "anemia_risk": int(anemia_risk),
                    "pcos_risk": int(pcos_risk)
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
        """Calculate health risk score (0-1) using new schema fields"""
        late_night = log_data.get("late_night_usage", 0) / 4.0
        sleep = log_data.get("sleep_hours", 7)
        screen = log_data.get("screen_time", 2) / 10.0
        
        # Risk factors
        sleep_risk = 0.0
        if sleep < 6: sleep_risk = 0.4
        elif sleep < 7: sleep_risk = 0.2
        elif sleep > 9: sleep_risk = 0.2
        
        late_night_risk = min(0.4, late_night)
        screen_risk = min(0.2, screen)
        
        risk = sleep_risk + late_night_risk + screen_risk
        return min(1.0, max(0.0, risk))
    
    def _calculate_fatigue(self, sleep_hours: float, energy_level: int = 5) -> float:
        """Calculate fatigue level (0-1)"""
        # Ideal sleep is 7-9 hours
        if 7 <= sleep_hours <= 9:
            sleep_score = 0.0
        else:
            sleep_score = min(1.0, abs(sleep_hours - 8) / 4.0)
        
        # If we don't have energy_level, we use a middle ground
        energy_score = 1 - (energy_level / 10.0)
        
        fatigue = (sleep_score * 0.6) + (energy_score * 0.4)
        return min(1.0, max(0.0, fatigue))
    
    def _detect_anomaly(self, log_data: Dict[str, Any], full_features: pd.DataFrame = None) -> tuple:
        """Detect if the log data contains anomalies"""
        
        if self.isolation_forest_model is not None and full_features is not None:
            expected = list(self.isolation_forest_model.feature_names_in_)
            df_model = full_features.copy()
            for col in expected:
                if col not in df_model.columns:
                    df_model[col] = 0
            df_model = df_model[expected]
            
            pred = self.isolation_forest_model.predict(df_model)[0]
            is_anomaly = bool(pred == -1)
            score = self.isolation_forest_model.decision_function(df_model)[0]
            anomaly_score = max(0.0, min(1.0, 0.5 - score))
            
            anomaly_type = "Unusual Behavior Pattern" if is_anomaly else None
            return is_anomaly, anomaly_type, float(anomaly_score)
            
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
    
    def _perform_clustering(self, log_data: Dict[str, Any], full_features: pd.DataFrame = None) -> tuple:
        """Perform behavior clustering and return cluster info"""
        
        if self.kmeans_model is not None and full_features is not None:
            expected = list(self.kmeans_model.feature_names_in_)
            df_model = full_features.copy()
            for col in expected:
                if col not in df_model.columns:
                    df_model[col] = 0
            df_model = df_model[expected]
            
            cluster_id = int(self.kmeans_model.predict(df_model)[0])
            names = {
                0: "Balanced & Active",
                1: "High Stress & Sedentary",
                2: "Low Sleep & Fatigued",
                3: "High Energy & Productive"
            }
            patterns = {
                0: "Healthy mix of activity and rest",
                1: "High digital load and low activity",
                2: "Insufficient sleep affecting performance",
                3: "Highly active with good routines"
            }
            return cluster_id, names.get(cluster_id, f"Cluster {cluster_id}"), patterns.get(cluster_id, "Unknown pattern")
            
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
            "summary": "; ".join(insights_list),
            "recommendations": recommendations[0] if recommendations else "Keep monitoring your health",
            "reasons": f"Priority: {priority}",
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

        # DietQuality: use user-provided food_quality directly (0=Poor, 1=Average, 2=Good)
        diet_quality = int(log_data.get("food_quality", 1))

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

    def _build_full_features(self, log_data: Dict[str, Any], user_data: Dict[str, Any]) -> pd.DataFrame:
        """Build full features dataframe for Isolation Forest and KMeans"""
        raw_input = self._map_supabase_to_model_input(log_data, user_data)
        df = pd.DataFrame([raw_input])
        if self.fe_func:
            df_fe = self.fe_func(df)
        else:
            df_fe = df.copy()
            
        sleep_hours = float(log_data.get("sleep_hours", 7) or 7)
        activity_level = raw_input["ActivityLevel"]
        meals = raw_input["MealsPerDay"]
        cal = raw_input["CalorieIntake"]
        screen_time = raw_input["ScreenTime"]
        sitting_time = raw_input["SittingTime"]
        inactivity = raw_input["InactivityPeriods"]
        late_night = raw_input["LateNightUsage"]
        
        stress_level = (screen_time * 0.3 + late_night * 2 + (10 - sleep_hours) * 0.4 + inactivity * 0.3)
        stress_level = max(1, min(10, stress_level))
        
        df_fe['SleepScore'] = 1 - abs(sleep_hours - 7.5) / 7.5
        df_fe['ActivityScore'] = activity_level / 5
        df_fe['DietScore'] = meals / 5
        df_fe['StressScore'] = stress_level / 10
        df_fe['SedentaryIndex'] = (sitting_time + inactivity) / 20
        df_fe['DigitalLoad'] = screen_time
        
        df_fe['LateNightImpact'] = late_night * 0.5
        df_fe['CalorieBalance'] = 1 - abs(cal - 2000)/2000
        df_fe['MealScore'] = df_fe['DietScore']
        df_fe['DopamineScore'] = (screen_time * 0.4 + late_night * 2 + stress_level * 0.3 + (10 - sleep_hours) * 0.3)
        df_fe['FatigueIndex'] = (1 - df_fe['SleepScore']) * 0.6 + df_fe['StressScore'] * 0.4
        df_fe['DietQuality'] = raw_input["DietQuality"]
        
        return df_fe

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

    def explain_anomaly(self, log_data: Dict[str, Any], user_data: Dict[str, Any]) -> str:
        """Dynamically generate SHAP explanation for anomaly using Isolation Forest"""
        if self.isolation_forest_model is None or self.iso_explainer is None:
            return "Unusual Behavior Pattern"
        try:
            df_fe = self._build_full_features(log_data, user_data)
            expected = list(self.isolation_forest_model.feature_names_in_)
            for col in expected:
                if col not in df_fe.columns:
                    df_fe[col] = 0
            df_model = df_fe[expected]
            
            shap_values = self.iso_explainer.shap_values(df_model)
            # For Isolation Forest, negative scores mean anomaly.
            # SHAP values that are NEGATIVE push the score towards anomaly.
            vals = shap_values[0]
            feature_names = df_model.columns
            # Get features with the most negative impact
            idx = np.argsort(vals)[:2] 
            
            reasons = []
            for j in idx:
                if vals[j] < -0.01: # only consider if it significantly pulled score down
                    feat_name = feature_names[j]
                    suggestion = self._FEATURE_SUGGESTIONS.get(feat_name, f"Unusual {feat_name}")
                    if suggestion not in reasons:
                        reasons.append(suggestion)
            
            if reasons:
                return "Anomaly driven by: " + " and ".join(reasons)
            return "Unusual Behavior Pattern Detected"
        except Exception as e:
            logger.error(f"Error explaining anomaly: {e}")
            return "Unusual Behavior Pattern"

    def explain_behavior(self, log_data: Dict[str, Any], user_data: Dict[str, Any], cluster_id: int) -> str:
        """Dynamically generate SHAP explanation for behavior cluster"""
        if self.kmeans_model is None or self.kmeans_explainer is None:
            names = {0: "Balanced & Active", 1: "High Stress & Sedentary", 2: "Low Sleep & Fatigued", 3: "High Energy & Productive"}
            return names.get(cluster_id, "Unknown pattern")
            
        try:
            df_fe = self._build_full_features(log_data, user_data)
            expected = list(self.kmeans_model.feature_names_in_)
            for col in expected:
                if col not in df_fe.columns:
                    df_fe[col] = 0
            df_model = df_fe[expected]
            
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                shap_values = self.kmeans_explainer.shap_values(df_model)
                
            # For KMeans shap_values, it might return a list of arrays (one for each cluster) or a single array
            # If it's a list, get the one for the assigned cluster
            if isinstance(shap_values, list):
                vals = shap_values[cluster_id][0]
            else:
                vals = shap_values[0]
                
            feature_names = df_model.columns
            # Features that push the sample towards THIS cluster are positive SHAP values (or absolute largest)
            # For KMeans explainer, positive SHAP value means it pushes the output (cluster probability or distance) higher
            idx = np.argsort(np.abs(vals))[::-1][:3]
            
            reasons = []
            for j in idx:
                feat_name = feature_names[j]
                if "Score" in feat_name or "Index" in feat_name or "Time" in feat_name or "Hours" in feat_name:
                    direction = "High" if df_model[feat_name].iloc[0] > self.kmeans_model.cluster_centers_[cluster_id][j] else "Low"
                    reasons.append(f"{direction} {feat_name}")
            
            if reasons:
                return "Key drivers: " + ", ".join(reasons)
            return "General healthy behavior"
        except Exception as e:
            logger.error(f"Error explaining behavior: {e}")
            return "Behavior pattern analysis unavailable"


# Create singleton instance
ml_service = MLService()

