from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str
    db_user: str
    db_password: str
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    
    # Model
    model_path: str = "./models/collaborative_filtering_model.pkl"
    min_interactions: int = 5
    recommendation_threshold: float = 0.5
    
    # Service
    host: str = "0.0.0.0"
    port: int = 8001

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
