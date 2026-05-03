# <p align="center"><img src="assets/images/logo_cognilife.png" alt="CogniLife Logo" width="200"/></p>

# <p align="center">CogniLife: AI-Powered Health Ecosystem</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20Native%20%2F%20Expo-61DAFB?logo=react&logoColor=black" alt="Frontend"/>
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white" alt="Backend"/>
  <img src="https://img.shields.io/badge/Database-Supabase%20%2F%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white" alt="Database"/>
  <img src="https://img.shields.io/badge/ML-XGBoost%20%2F%20SHAP-orange?logo=scikit-learn&logoColor=white" alt="ML"/>
</p>

---

## 🌟 Overview

**CogniLife** is a cutting-edge, mobile-first health ecosystem that leverages state-of-the-art Machine Learning to provide personalized health insights, risk predictions, and behavioral analysis. By integrating native device tracking (Screen Time) with user-logged health metrics (Diet, Sleep, Activity), CogniLife empowers users to understand the "why" behind their health patterns and take proactive steps toward a better lifestyle.

## ✨ Key Features

- 📱 **Native Health Tracking**: Automatically captures screen time and app usage patterns via custom Android native modules.
- 🧠 **Advanced ML Predictions**: Predicts risks for **Fatigue, Diabetes, Anemia, PCOS, and Future Health Risks** using a Multi-Output XGBoost model.
- 🔍 **AI-Driven Explainability**: Uses **SHAP (SHapley Additive exPlanations)** to show exactly which factors (e.g., high screen time, low sleep) are driving your risk scores.
- ⚠️ **Anomaly Detection**: Identifies unusual health patterns or sudden declines using **Isolation Forest** algorithms.
- 📊 **Behavioral Clustering**: Groups users into personas (e.g., "High Stress & Sedentary") using **K-Means Clustering** to provide tailored advice.
- 📋 **Personalized Action Plans**: Generates dynamic, prioritized recommendations based on real-time ML analysis.
- 🔐 **Secure & Seamless**: Integrated with **Supabase Auth** and real-time database synchronization.

## 🛠️ Tech Stack

### Frontend (Mobile App)
- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **UI Components**: [Lucide React Native](https://lucide.dev/), [Expo Vector Icons](https://icons.expo.fyi/)
- **Charts**: [React Native Chart Kit](https://github.com/indie-it/react-native-chart-kit)
- **Native Integration**: Custom Android Module for Screen Time stats.

### Backend (API & ML)
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Machine Learning**: XGBoost, Scikit-learn, Pandas, NumPy
- **Explainability**: SHAP
- **Logging**: Loguru

### Cloud & Database
- **Auth & DB**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Storage**: Real-time data sync with Supabase JS & Python SDKs.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Expo Go](https://expo.dev/client) app on your Android device (for frontend testing)

### 1. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
# Run the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Run the Expo project
npm start
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
API_ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["*"]
```

## 📂 Project Structure

```text
├── android/            # Native Android code & screen time modules
├── app/                # Expo Router screens (Tabs, Auth, Onboarding)
├── assets/             # Images, logos, and splash screens
├── components/         # Reusable UI components
├── services/           # Backend logic (ML Service, Supabase Client)
├── models/             # Pre-trained ML model binaries (.pkl)
├── schemas/            # Pydantic & TypeScript data models
├── main.py             # FastAPI entry point
└── package.json        # Frontend dependencies
```

## 📈 ML Architecture

The CogniLife ML engine follows a 3-layer analysis pipeline:
1.  **Feature Engineering**: Raw logs are transformed into 26 specialized features (e.g., Dopamine Score, Sedentary Index).
2.  **Risk Prediction**: A Multi-Output XGBoost model predicts five distinct health targets simultaneously.
3.  **Explanation Layer**: SHAP values are calculated to provide human-readable "reasons" for every prediction, ensuring the AI is never a black box.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
<p align="center">Built for a healthier future.</p>