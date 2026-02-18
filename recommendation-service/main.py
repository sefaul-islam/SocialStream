from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import jwt
import base64
from datetime import datetime
import logging

from config import get_settings
from database import get_db, Video, Media
from models.collaborative_filtering import CollaborativeFilteringModel
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Movie Recommendation Service",
    description="Collaborative filtering recommendation microservice for SocialStream",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get settings
settings = get_settings()

# Global model instance
recommendation_model = CollaborativeFilteringModel(
    n_components=50,
    min_interactions=settings.min_interactions
)

# Try to load existing model on startup
@app.on_event("startup")
async def startup_event():
    """Load model on startup if exists"""
    logger.info("Starting recommendation service...")
    try:
        if recommendation_model.load_model(settings.model_path):
            logger.info("Loaded existing model successfully")
        else:
            logger.info("No existing model found. Training required.")
    except Exception as e:
        logger.error(f"Error during startup: {e}")

# Pydantic models for API
class VideoRecommendation(BaseModel):
    id: int
    title: str
    mediaUrl: str
    thumbnailUrl: Optional[str]
    durationInSeconds: int
    director: Optional[str]
    year: Optional[str]
    genre: Optional[str]
    rating: Optional[float]
    viewCount: int
    description: Optional[str]
    cast: Optional[List[str]]
    recommendationScore: float

class RecommendationResponse(BaseModel):
    recommendations: List[VideoRecommendation]
    algorithm: str
    totalResults: int

class TrainingRequest(BaseModel):
    days_lookback: int = 90

class TrainingResponse(BaseModel):
    success: bool
    message: str
    timestamp: str

# JWT Authentication
def verify_jwt_token(authorization: Optional[str] = Header(None)) -> dict:
    """Verify JWT token from Spring Boot"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")

        # Decode the base64 JWT secret to match Spring Boot's key handling
        # Spring Boot uses Decoders.BASE64.decode(secret) to get raw key bytes
        decoded_secret = base64.b64decode(settings.jwt_secret)

        # Decode JWT
        payload = jwt.decode(
            token,
            decoded_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Helper function to get video details
def get_video_details(db: Session, video_id: int, score: float) -> Optional[VideoRecommendation]:
    """Fetch video details from database"""
    try:
        # Join Video and Media tables
        result = db.query(Video, Media).join(
            Media, Video.id == Media.id
        ).filter(Video.id == video_id).first()
        
        if not result:
            return None
        
        video, media = result
        
        cast_list = []
        if video.cast:
            cast_list = [c.strip() for c in video.cast.split(',')]
        
        return VideoRecommendation(
            id=video.id,
            title=media.title,
            mediaUrl=media.mediaurl if media.mediaurl else "",
            thumbnailUrl=media.thumbnailurl,
            durationInSeconds=media.duration,
            director=video.director,
            year=video.year,
            genre=video.genre,
            rating=float(video.rating) if video.rating else None,
            viewCount=video.view_count,
            description=video.description,
            cast=cast_list if cast_list else None,
            recommendationScore=score
        )
    except Exception as e:
        logger.error(f"Error fetching video {video_id}: {e}")
        return None

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_trained": recommendation_model.trained,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations for a user
    
    Args:
        user_id: User ID to generate recommendations for
        limit: Number of recommendations to return (default: 10)
    """
    try:
        logger.info(f"Generating recommendations for user {user_id}, limit={limit}")

        # Get recommendations from model
        raw_recommendations = recommendation_model.predict_for_user(user_id, top_n=limit * 2)

        # Fetch video details
        recommendations = []
        for rec in raw_recommendations:
            video_details = get_video_details(db, rec['video_id'], rec['score'])
            if video_details:
                recommendations.append(video_details)

            if len(recommendations) >= limit:
                break

        # Fallback: if model returned nothing, query DB directly
        if not recommendations:
            logger.info(f"No model recommendations for user {user_id}, falling back to DB query")
            results = db.query(Video, Media).join(
                Media, Video.id == Media.id
            ).order_by(Video.view_count.desc()).limit(limit).all()

            for video, media in results:
                cast_list = [c.strip() for c in video.cast.split(',')] if video.cast else []
                score = (video.view_count * 0.7) + (float(video.rating) * 0.3 * 100 if video.rating else 150)
                recommendations.append(VideoRecommendation(
                    id=video.id,
                    title=media.title or "Untitled",
                    mediaUrl=media.mediaurl or "",
                    thumbnailUrl=media.thumbnailurl,
                    durationInSeconds=media.duration or 0,
                    director=video.director,
                    year=video.year,
                    genre=video.genre,
                    rating=float(video.rating) if video.rating else None,
                    viewCount=video.view_count,
                    description=video.description,
                    cast=cast_list if cast_list else None,
                    recommendationScore=score
                ))

        algorithm = "collaborative_filtering" if recommendation_model.trained and user_id in recommendation_model.user_ids else "popularity"

        return RecommendationResponse(
            recommendations=recommendations,
            algorithm=algorithm,
            totalResults=len(recommendations)
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trending", response_model=RecommendationResponse)
async def get_trending(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get trending videos based on popularity

    Args:
        limit: Number of videos to return (default: 10)
    """
    try:
        logger.info(f"Getting trending videos, limit={limit}")

        # Get popular videos from model
        if not recommendation_model.video_popularity:
            # Calculate popularity if not already done
            recommendation_model.calculate_video_popularity(db)

        popular_videos = recommendation_model._get_popular_videos(top_n=limit * 2)

        # Fetch video details
        trending = []
        for rec in popular_videos:
            video_details = get_video_details(db, rec['video_id'], rec['score'])
            if video_details:
                trending.append(video_details)

            if len(trending) >= limit:
                break

        # Fallback: if no trending from popularity model, query DB directly
        if not trending:
            logger.info("No trending from popularity model, falling back to direct DB query")
            results = db.query(Video, Media).join(
                Media, Video.id == Media.id
            ).order_by(Video.view_count.desc()).limit(limit).all()

            for video, media in results:
                cast_list = [c.strip() for c in video.cast.split(',')] if video.cast else []
                score = (video.view_count * 0.7) + (float(video.rating) * 0.3 * 100 if video.rating else 150)
                trending.append(VideoRecommendation(
                    id=video.id,
                    title=media.title or "Untitled",
                    mediaUrl=media.mediaurl or "",
                    thumbnailUrl=media.thumbnailurl,
                    durationInSeconds=media.duration or 0,
                    director=video.director,
                    year=video.year,
                    genre=video.genre,
                    rating=float(video.rating) if video.rating else None,
                    viewCount=video.view_count,
                    description=video.description,
                    cast=cast_list if cast_list else None,
                    recommendationScore=score
                ))

        return RecommendationResponse(
            recommendations=trending,
            algorithm="trending",
            totalResults=len(trending)
        )
    except Exception as e:
        logger.error(f"Error getting trending videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train", response_model=TrainingResponse)
async def train_model(
    request: TrainingRequest,
    db: Session = Depends(get_db),
    token_payload: dict = Depends(verify_jwt_token)
):
    """
    Train the recommendation model
    
    Requires authentication with JWT token
    """
    try:
        logger.info(f"Starting model training with {request.days_lookback} days lookback")
        
        # Train the model
        recommendation_model.train(db, days_lookback=request.days_lookback)
        
        # Save the trained model
        recommendation_model.save_model(settings.model_path)
        
        return TrainingResponse(
            success=True,
            message=f"Model trained successfully with {request.days_lookback} days of data",
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error training model: {e}")
        return TrainingResponse(
            success=False,
            message=f"Training failed: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.get("/model/status")
async def get_model_status():
    """Get current model status"""
    return {
        "trained": recommendation_model.trained,
        "n_users": len(recommendation_model.user_ids) if recommendation_model.user_ids else 0,
        "n_videos": len(recommendation_model.video_ids) if recommendation_model.video_ids else 0,
        "n_popular_videos": len(recommendation_model.video_popularity),
        "model_path": settings.model_path
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
