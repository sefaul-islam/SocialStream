# Movie Recommendation System - Implementation Complete

## System Architecture

### Components
1. **Spring Boot Backend** - User interaction tracking and API gateway
2. **FastAPI Microservice** - ML-based recommendation engine
3. **MySQL Database** - Persistent storage for users, videos, and interactions
4. **Redis Cache** - High-performance caching for recommendations
5. **React Frontend** - User interface with recommendation display

### Recommendation Flow
```
User watches video → Spring Boot tracks interaction → MySQL stores data
                                 ↓
                     Daily scheduler (2 AM) triggers training
                                 ↓
                   FastAPI fetches data → Trains collaborative filtering model
                                 ↓
              User requests recommendations → FastAPI generates predictions
                                 ↓
                      Redis caches results → Frontend displays recommendations
```

## Setup Instructions

### 1. Database Setup
Create `.env` file in project root:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=socialstream
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000
FASTAPI_SERVICE_URL=http://localhost:8001
```

### 2. FastAPI Service Setup
```bash
cd SocialStream/recommendation-service
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run service
python main.py
# Or with uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Spring Boot Backend
```bash
cd SocialStream/SocialStream
# Make sure MySQL and Redis are running
./mvnw spring-boot:run
```

### 4. React Frontend
```bash
cd socialstreamfrontend
npm install
npm run dev
```

### 5. Using Docker (Optional)
```bash
# From project root
docker-compose up -d
```

## API Endpoints

### Spring Boot (Port 8080)

#### Interaction Tracking
- `POST /api/interactions/view` - Record video view
- `POST /api/interactions/like` - Record video like/dislike
- `DELETE /api/interactions/like/{videoId}` - Remove like/dislike
- `POST /api/interactions/search` - Record search query
- `GET /api/interactions/video/{videoId}/likes` - Get like count
- `GET /api/interactions/video/{videoId}/dislikes` - Get dislike count

#### Recommendations
- `GET /api/recommendations/for-you?limit=10` - Get personalized recommendations
- `GET /api/recommendations/trending?limit=10` - Get trending videos
- `POST /api/recommendations/train` - Manually trigger model training
- `DELETE /api/recommendations/cache/user` - Clear user cache
- `DELETE /api/recommendations/cache/all` - Clear all caches

### FastAPI (Port 8001)

- `GET /health` - Health check
- `GET /recommend/{user_id}?limit=10` - Get recommendations for user
- `GET /trending?limit=10` - Get trending videos
- `POST /train` - Train recommendation model (requires JWT auth)
- `GET /model/status` - Get model training status

## Interaction Tracking Integration

### Frontend Example - VideoPlayer Component
```javascript
import { recordVideoView, recordVideoLike } from '../../services/recommendationService';

// Track when user watches video
useEffect(() => {
  const videoElement = videoRef.current;
  
  const handleVideoEnd = () => {
    const watchDuration = Math.floor(videoElement.currentTime);
    const watchPercentage = (watchDuration / videoElement.duration) * 100;
    
    recordVideoView(videoId, watchDuration, watchPercentage);
  };
  
  videoElement.addEventListener('ended', handleVideoEnd);
  return () => videoElement.removeEventListener('ended', handleVideoEnd);
}, [videoId]);

// Track likes
const handleLike = async (isLiked) => {
  try {
    await recordVideoLike(videoId, isLiked);
  } catch (error) {
    console.error('Failed to record like:', error);
  }
};
```

## Model Training

### Automatic Training
- Runs daily at 2:00 AM via Spring Boot scheduler
- Uses last 90 days of interaction data
- Automatically saves trained model to disk

### Manual Training
```bash
# Via Spring Boot API (requires authentication)
curl -X POST http://localhost:8080/api/recommendations/train \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or directly to FastAPI
curl -X POST http://localhost:8001/train \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days_lookback": 90}'
```

## Collaborative Filtering Algorithm

### How It Works
1. **Data Collection**: Views, watch duration, likes/dislikes, searches
2. **Scoring System**:
   - Base view: 1.0 points
   - Watch percentage bonus: 0 to 2.0 points (based on % watched)
   - Like: +3.0 points
   - Dislike: -2.0 points
3. **Matrix Factorization**: SVD with 50 latent features
4. **Prediction**: Dot product of user and video feature vectors
5. **Filtering**: Exclude already-watched videos

### Cold Start Strategy
- New users: Get trending videos (sorted by viewCount × rating)
- New videos: Included in trending until enough interactions collected

## Database Schema

### New Tables
- `video_views`: user_id, video_id, watch_duration, watch_percentage, viewed_at
- `video_likes`: user_id, video_id, is_liked, created_at, updated_at
- `search_history`: user_id, query, searched_at

### Indexes
- Composite indexes on (user_id, timestamp) for efficient querying
- Unique constraint on (user_id, video_id) for video_likes

## Performance Optimization

### Caching Strategy
- Recommendations cached in Redis for 1 hour
- Cache keys: `recommendations:{user_id}:{limit}`
- Automatic cache invalidation on new training

### Scalability Considerations
- FastAPI is stateless and horizontally scalable
- Model file can be stored in shared storage (S3, NFS)
- Redis can be clustered for high availability
- Database read replicas for analytics queries

## Monitoring & Debugging

### Check Service Health
```bash
# FastAPI health
curl http://localhost:8001/health

# Model status
curl http://localhost:8001/model/status
```

### View Logs
```bash
# Spring Boot logs
tail -f SocialStream/logs/spring-boot.log

# FastAPI logs (if running with uvicorn)
# Logs output to console
```

## Troubleshooting

### Issue: No recommendations returned
**Solution**: Ensure model is trained and there's sufficient interaction data
```bash
curl http://localhost:8001/model/status
# If trained=false, trigger training manually
```

### Issue: FastAPI connection refused
**Solution**: Verify FastAPI is running and URL is correct in application.properties
```bash
# Check if service is running
curl http://localhost:8001/health
```

### Issue: Database connection errors
**Solution**: Verify MySQL credentials in .env files match
```bash
mysql -u YOUR_USER -p -e "SHOW DATABASES;"
```

## Future Enhancements

1. **Hybrid Recommendations**: Combine collaborative + content-based filtering
2. **Real-time Updates**: Stream interactions via Kafka for instant model updates
3. **A/B Testing**: Compare recommendation algorithms
4. **Diversity**: Ensure recommendations cover different genres
5. **Explainability**: Show why videos were recommended
6. **User Preferences**: Allow users to set genre preferences
7. **Performance Metrics**: Track click-through rates, watch time

## Files Created/Modified

### Backend (Spring Boot)
- Entities: `VideoView.java`, `VideoLike.java`, `SearchHistory.java`
- Repositories: `VideoViewRepository.java`, `VideoLikeRepository.java`, `SearchHistoryRepository.java`
- Services: `InteractionService.java`, `RecommendationService.java`
- Controllers: `InteractionController.java`, `RecommendationController.java`
- Config: `RecommendationScheduler.java`, `RestTemplateConfig.java`
- DTOs: `VideoViewRequestDTO.java`, `VideoLikeRequestDTO.java`, `SearchRequestDTO.java`, 
  `InteractionResponseDTO.java`, `RecommendedVideoDTO.java`, `RecommendationResponseDTO.java`

### FastAPI Microservice
- `main.py` - FastAPI application with endpoints
- `database.py` - SQLAlchemy models and database connection
- `config.py` - Configuration management
- `models/collaborative_filtering.py` - ML recommendation model
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variables template
- `Dockerfile` - Container definition

### Frontend (React)
- `services/recommendationService.js` - Updated with interaction tracking
- `Components/HomePage/ForYou.jsx` - Updated to fetch real recommendations
- `Components/HomePage/MovieRecommendations.jsx` - Updated to handle API data

### Configuration
- `application.properties` - Added FastAPI URL configuration
- `docker-compose.yml` - Multi-container orchestration
- `README.md` - This documentation

## Architecture Decisions

✅ **Collaborative Filtering over Content-Based**: Better at discovering non-obvious patterns
✅ **FastAPI Microservice**: Python ecosystem superior for ML, easier iteration
✅ **Daily Training**: Balances model freshness with computational cost
✅ **Redis Caching**: Reduces latency for frequent requests
✅ **JWT Shared Secret**: Reuses existing auth without service discovery overhead

---

**Status**: ✅ Implementation Complete
**Last Updated**: February 17, 2026
