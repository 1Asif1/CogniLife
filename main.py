from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import List, Optional
from loguru import logger
import sys

# Import configuration
from config.settings import settings

# Import schemas
from schemas.models import (
    UserCreate, UserResponse,
    DailyLogCreate, DailyLogResponse,
    PredictionResponse, CompletePredictionResponse,
    AnomalyResponse, BehaviorClusterResponse, InsightsResponse,
    DashboardResponse, SuccessResponse, ErrorResponse
)

# Import services
from services.supabase_client import supabase_client
from services.ml_service import ml_service


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.log_level
)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info(" Starting CogniLife API")
    logger.info(f"Environment: {settings.api_environment}")
    logger.info(f"Supabase URL: {settings.supabase_url}")
    logger.info(" ML models loaded and ready")
    
    yield
    
    # Shutdown
    logger.info(" Shutting down CogniLife API")


# Initialize FastAPI app
app = FastAPI(
    title="CogniLife API",
    description="ML-powered health tracking and prediction API",
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ENDPOINTS ====================

@app.get("/", tags=["Health"])
async def root():
    """API health check"""
    return {
        "message": "CogniLife FastAPI is running! ",
        "version": "1.0.0",
        "status": "healthy",
        "environment": settings.api_environment
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "ml_models": "loaded",
        "supabase": "connected"
    }


# ==================== USER ENDPOINTS ====================

@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        # Check if user already exists
        existing_user = await supabase_client.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = await supabase_client.create_user(user_data.dict())
        
        logger.info(f"Created user: {user['email']}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = await supabase_client.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== DAILY LOG & PREDICTION ENDPOINT ====================

@app.post(
    "/api/logs/process",
    response_model=CompletePredictionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Logs and Predictions"]
)
async def process_daily_log(user_id: str, log_data: DailyLogCreate):
    """Process Daily Log and Generate Predictions"""
    try:
        logger.info(f"Processing daily log for user {user_id}")
        
        # Step 1: Get user data
        user = await supabase_client.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found"
            )
        
        # Step 2: Create daily log in Supabase
        daily_log = await supabase_client.create_daily_log(
            user_id=user_id,
            log_data=log_data.dict()
        )
        log_id = daily_log['id']
        logger.info(f"Created daily log {log_id}")
        
        # Step 3: Run ML predictions
        ml_results = ml_service.predict_health(
            user_data=user,
            log_data=log_data.dict()
        )
        logger.info(f"Generated predictions for log {log_id}")
        
        # Step 4: Save prediction results
        prediction = await supabase_client.save_prediction(
            user_id=user_id,
            log_id=log_id,
            predictions=ml_results['predictions']
        )
        logger.info(f"Saved prediction {prediction['id']}")
        
        # Step 5: Save anomaly detection results
        anomaly = await supabase_client.save_anomaly(
            user_id=user_id,
            log_id=log_id,
            anomaly_data=ml_results['anomaly']
        )
        logger.info(f"Saved anomaly detection")
        
        # Step 6: Save behavior cluster
        behavior_cluster = await supabase_client.save_behavior_cluster(
            user_id=user_id,
            log_id=log_id,
            cluster_data=ml_results['behavior_cluster']
        )
        logger.info(f"Saved behavior cluster")
        
        # Step 7: Save insights
        insights = await supabase_client.save_insights(
            user_id=user_id,
            log_id=log_id,
            insights_data=ml_results['insights']
        )
        logger.info(f"Saved insights")
        
        # Step 8: Return complete response
        return {
            "daily_log": daily_log,
            "prediction": prediction,
            "anomaly": anomaly,
            "behavior_cluster": behavior_cluster,
            "insights": insights
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing daily log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process daily log: {str(e)}"
        )


#QUERY ENDPOINTS

@app.get("/api/users/{user_id}/logs", response_model=List[DailyLogResponse], tags=["Logs"])
async def get_user_logs(user_id: str, limit: int = 30):
    """Get user's daily logs"""
    try:
        logs = await supabase_client.get_user_logs(user_id, limit)
        return logs
    except Exception as e:
        logger.error(f"Error getting logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/users/{user_id}/predictions", response_model=List[PredictionResponse], tags=["Predictions"])
async def get_user_predictions(user_id: str, limit: int = 30):
    """Get user's predictions"""
    try:
        predictions = await supabase_client.get_user_predictions(user_id, limit)
        return predictions
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/users/{user_id}/insights", response_model=List[InsightsResponse], tags=["Insights"])
async def get_user_insights(user_id: str, limit: int = 10):
    """Get user's AI insights"""
    try:
        insights = await supabase_client.get_user_insights(user_id, limit)
        return insights
    except Exception as e:
        logger.error(f"Error getting insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/users/{user_id}/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
async def get_dashboard(user_id: str):
    """Get comprehensive dashboard data"""
    try:
        dashboard_data = await supabase_client.get_dashboard_data(user_id)
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


#ERROR HANDLERS

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "Internal server error"}
    )


# RUN APPLICATION

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_environment == "development",
        log_level=settings.log_level.lower()
    )
from fastapi import FastAPI, HTTPException, Depends, status
