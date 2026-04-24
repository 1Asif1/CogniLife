from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings using Pydantic Settings"""
    
    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8001"))
    api_environment: str = os.getenv("API_ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS Configuration
    cors_origins: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:19006",  # Expo web
        "*"  # Allow all origins in development
    ]
    
    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # ML Model Configuration
    model_path: str = os.getenv("MODEL_PATH", "./models")
    use_gpu: bool = os.getenv("USE_GPU", "False").lower() == "true"
    
    # Feature Engineering Configuration
    features_path: str = os.getenv("FEATURES_PATH", "./features.pkl")
    scaler_path: str = os.getenv("SCALER_PATH", "./scaler.pkl")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Create settings instance
settings = Settings()
