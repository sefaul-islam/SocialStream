# Movie Recommendation System - Quick Start Guide

## ✨ What's Been Built

A complete **collaborative filtering recommendation system** with:
- ✅ User interaction tracking (views, likes, searches)
- ✅ FastAPI machine learning microservice
- ✅ Automatic daily model training (2 AM)
- ✅ Redis-cached recommendations
- ✅ Real-time frontend integration
- ✅ Cold start handling with trending videos

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Environment
```bash
cd /home/sefa/Projects/Socialproject

# Copy and edit FastAPI environment file
cd SocialStream/recommendation-service
cp .env.example .env
# Edit .env with your database credentials:
# - DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET (must match Spring Boot)
cd ..
```

### Step 2: Start Services
```bash
# Automated startup script
./start-services.sh

# Or manually:
# 1. Start FastAPI
cd SocialStream/recommendation-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# 2. Start Spring Boot (new terminal)
cd ../SocialStream/SocialStream
./mvnw spring-boot:run

# 3. Start React frontend (new terminal)
cd ../../socialstreamfrontend
npm run dev
```

### Step 3: Test Recommendations
```bash
# Check services are running
curl http://localhost:8001/health        # FastAPI
curl http://localhost:8080/actuator/health  # Spring Boot (if enabled)

# Get trending videos (no auth needed)
curl http://localhost:8080/api/recommendations/trending?limit=5

# Record a video view (requires auth token)
curl -X POST http://localhost:8080/api/interactions/view \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoId": 1, "watchDuration": 120, "watchPercentage": 85.5}'

# Trigger manual model training
curl -X POST http://localhost:8080/api/recommendations/train \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Key Files Created

### Backend (Spring Boot)
```
SocialStream/src/main/java/com/example/SocialStream/
├── entities/
│   ├── VideoView.java           # Track video watches
│   ├── VideoLike.java           # Track likes/dislikes
│   └── SearchHistory.java       # Track searches
├── repositories/
│   ├── VideoViewRepository.java
│   ├── VideoLikeRepository.java
│   └── SearchHistoryRepository.java
├── services/
│   ├── InteractionService.java      # Handle user interactions
│   └── RecommendationService.java   # Call FastAPI & cache
├── controllers/
│   ├── InteractionController.java
│   └── RecommendationController.java
├── config/
│   ├── RecommendationScheduler.java # Daily training at 2 AM
│   └── RestTemplateConfig.java      # HTTP client config
└── DTO/
    ├── VideoViewRequestDTO.java
    ├── VideoLikeRequestDTO.java
    ├── SearchRequestDTO.java
    ├── InteractionResponseDTO.java
    ├── RecommendedVideoDTO.java
    └── RecommendationResponseDTO.java
```

### FastAPI Microservice
```
SocialStream/recommendation-service/
├── main.py                          # FastAPI app with endpoints
├── database.py                      # SQLAlchemy models
├── config.py                        # Configuration management
├── models/
│   └── collaborative_filtering.py   # ML recommendation model
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment template
└── Dockerfile                       # Container definition
```

### Frontend (React)
```
socialstreamfrontend/src/
├── services/
│   └── recommendationService.js     # Updated with tracking
└── Components/HomePage/
    ├── ForYou.jsx                   # Fetch recommendations
    └── MovieRecommendations.jsx     # Display recommendations
```

## 🔌 API Endpoints Reference

### Interaction Tracking (Spring Boot :8080)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/interactions/view` | Record video view | ✅ |
| POST | `/api/interactions/like` | Like/dislike video | ✅ |
| DELETE | `/api/interactions/like/{id}` | Remove like | ✅ |
| POST | `/api/interactions/search` | Record search | ✅ |

### Recommendations (Spring Boot :8080)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/recommendations/for-you` | Personalized recs | ✅ |
| GET | `/api/recommendations/trending` | Trending videos | ❌ |
| POST | `/api/recommendations/train` | Trigger training | ✅ |

### ML Service (FastAPI :8001)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | ❌ |
| GET | `/recommend/{user_id}` | Get recommendations | ❌ |
| GET | `/trending` | Trending videos | ❌ |
| POST | `/train` | Train model | ✅ |
| GET | `/model/status` | Model info | ❌ |

## 🧪 Testing the System

### 1. Initial Setup Test
```bash
# Verify FastAPI is accessible
curl http://localhost:8001/health
# Expected: {"status": "healthy", "model_trained": false, ...}

# Check Spring Boot
curl http://localhost:8080/api/recommendations/trending?limit=3
# Expected: JSON with trending videos
```

### 2. Interaction Tracking Test
```bash
# Login and get token (via frontend or API)
TOKEN="your_jwt_token_here"

# Watch a video
curl -X POST http://localhost:8080/api/interactions/view \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": 1,
    "watchDuration": 180,
    "watchPercentage": 95.0
  }'

# Like the video
curl -X POST http://localhost:8080/api/interactions/like \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": 1,
    "isLiked": true
  }'

# Search for content
curl -X POST http://localhost:8080/api/interactions/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "action movies"
  }'
```

### 3. Model Training Test
```bash
# Trigger training (need multiple interactions first)
curl -X POST http://localhost:8001/train \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days_lookback": 90}'

# Check model status
curl http://localhost:8001/model/status
# Expected: {"trained": true, "n_users": X, "n_videos": Y, ...}
```

### 4. Recommendation Test
```bash
# Get personalized recommendations
curl http://localhost:8080/api/recommendations/for-you?limit=5 \
  -H "Authorization: Bearer $TOKEN"

# Response format:
# {
#   "recommendations": [...],
#   "algorithm": "collaborative_filtering",
#   "totalResults": 5
# }
```

## 🎯 How It Works

### Interaction Flow
```
User watches video
    ↓
Frontend calls /api/interactions/view
    ↓
Spring Boot saves to MySQL
    ↓
viewCount incremented on video
```

### Recommendation Flow
```
User requests recommendations
    ↓
Spring Boot checks Redis cache
    ↓ (cache miss)
Spring Boot calls FastAPI
    ↓
FastAPI loads trained model
    ↓
Model predicts scores for unwatched videos
    ↓
Top N videos returned
    ↓
Spring Boot caches in Redis (1 hour TTL)
    ↓
Frontend displays recommendations
```

### Training Flow
```
Scheduler triggers at 2 AM daily
    ↓
Spring Boot calls FastAPI /train
    ↓
FastAPI fetches last 90 days of data
    ↓
Calculate interaction scores:
  - View: 1.0 points
  - Watch %: 0-2.0 bonus
  - Like: +3.0
  - Dislike: -2.0
    ↓
Build user-item matrix
    ↓
Apply SVD (50 components)
    ↓
Save model to disk
    ↓
Clear all caches
```

## 🔧 Configuration Options

### application.properties (Spring Boot)
```properties
# FastAPI service URL
fastapi.service.url=http://localhost:8001

# Database
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}

# Redis
spring.data.redis.host=127.0.0.1
spring.data.redis.port=6379

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
```

### .env (FastAPI)
```bash
# Database
DB_HOST=localhost
DB_NAME=socialstream
DB_USER=your_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost

# JWT (must match Spring Boot)
JWT_SECRET=your_jwt_secret

# Model
MODEL_PATH=./models/collaborative_filtering_model.pkl
MIN_INTERACTIONS=5
```

## 🐳 Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f recommendation-service

# Stop services
docker-compose down
```

## 📊 Monitoring

### Check Service Health
```bash
# FastAPI
watch -n 5 'curl -s http://localhost:8001/health | jq'

# Model status
watch -n 30 'curl -s http://localhost:8001/model/status | jq'
```

### View Logs
```bash
# FastAPI logs
tail -f SocialStream/recommendation-service/fastapi.log

# Spring Boot logs
tail -f springboot.log

# Both
tail -f springboot.log SocialStream/recommendation-service/fastapi.log
```

### Database Queries
```sql
-- Check tracked interactions
SELECT COUNT(*) FROM video_views;
SELECT COUNT(*) FROM video_likes;
SELECT COUNT(*) FROM search_history;

-- Top viewed videos
SELECT v.id, m.title, v.view_count 
FROM video v 
JOIN media m ON v.id = m.id 
ORDER BY v.view_count DESC 
LIMIT 10;

-- Most active users
SELECT user_id, COUNT(*) as views 
FROM video_views 
GROUP BY user_id 
ORDER BY views DESC 
LIMIT 10;
```

## ⚠️ Common Issues

### FastAPI won't start
- Check Python version: `python3 --version` (need 3.11+)
- Install dependencies: `pip install -r requirements.txt`
- Check .env file exists and has correct DB credentials

### No recommendations returned
- Ensure model is trained: `curl http://localhost:8001/model/status`
- Check sufficient interaction data exists
- Try trending endpoint: `/api/recommendations/trending`

### Spring Boot can't connect to FastAPI
- Verify FastAPI is running: `curl http://localhost:8001/health`
- Check `fastapi.service.url` in application.properties
- Check firewall/network settings

### Database errors
- Verify MySQL is running: `mysql -u USER -p -e "SHOW DATABASES;"`
- Check credentials match in both .env files
- Run Spring Boot once to auto-create tables

## 🎁 Next Steps

1. **Add more interactions**: Track video shares, playlist adds, etc.
2. **Improve model**: Try hybrid filtering (content + collaborative)
3. **Add explanations**: Show why videos were recommended
4. **Real-time training**: Use streaming instead of daily batches
5. **A/B testing**: Compare different algorithms
6. **User preferences**: Let users set favorite genres
7. **Diversity**: Ensure recommendations span multiple genres

## 📞 Need Help?

See the full documentation: [RECOMMENDATION_SYSTEM_README.md](RECOMMENDATION_SYSTEM_README.md)

---
**Status**: ✅ Ready to Use
**Created**: February 17, 2026
