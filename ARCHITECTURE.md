# Movie Recommendation System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │   ForYou     │  │  VideoPlayer   │  │  MovieRecommendations  │ │
│  │  Component   │  │   Component    │  │      Component         │ │
│  └──────┬───────┘  └───────┬────────┘  └───────────┬────────────┘ │
│         │                  │                        │              │
│         └──────────────────┴────────────────────────┘              │
│                             │                                       │
│                recommendationService.js                            │
└───────────────────────────── ┬ ────────────────────────────────────┘
                               │ HTTP/REST
                               │
┌───────────────────────────── ┴ ────────────────────────────────────┐
│                    SPRING BOOT BACKEND                             │
│                                                                     │
│  ┌─────────────────────┐        ┌────────────────────────┐        │
│  │ InteractionController│       │RecommendationController│        │
│  └──────────┬───────────┘       └───────────┬────────────┘        │
│             │                               │                      │
│  ┌──────────┴────────────┐       ┌─────────┴────────────┐        │
│  │  InteractionService   │       │ RecommendationService│        │
│  │                       │       │   (with Redis cache) │        │
│  │ - recordVideoView()   │       │ - getPersonalized()  │        │
│  │ - recordVideoLike()   │       │ - getTrending()      │        │
│  │ - recordSearch()      │       │ - clearCache()       │        │
│  └──────────┬────────────┘       └────────┬─────┬───────┘        │
│             │                              │     │                │
│             │ Persist                      │     │ Call           │
│  ┌──────────┴────────────┐                │     │                │
│  │   MySQL Database      │◄───────────────┘     │                │
│  │                       │                      │                │
│  │ - video_views         │                 ┌────┴─────┐          │
│  │ - video_likes         │                 │  Redis   │          │
│  │ - search_history      │                 │  Cache   │          │
│  │ - videos              │                 └──────────┘          │
│  │ - users               │                                       │
│  └───────────────────────┘                                       │
│                                                                    │
│  ┌────────────────────────┐                                       │
│  │ RecommendationScheduler│   (Daily at 2 AM)                    │
│  │  @Scheduled(cron...)   │───────────┐                          │
│  └────────────────────────┘           │                          │
└──────────────────────────────────────│──────────────────────────┘
                                       │ HTTP POST
                                       │ /train
┌───────────────────────────────────── ┴ ────────────────────────────┐
│                    FASTAPI MICROSERVICE                             │
│                                                                     │
│  ┌────────────────────┐                                           │
│  │   FastAPI Routes   │                                           │
│  │                    │                                           │
│  │ GET  /health       │  Health check                            │
│  │ GET  /recommend/   │  Get recommendations                     │
│  │ GET  /trending     │  Get trending videos                     │
│  │ POST /train        │  Train model                             │
│  │ GET  /model/status │  Model info                              │
│  └─────────┬──────────┘                                           │
│            │                                                       │
│  ┌─────────┴─────────────────────────┐                           │
│  │  CollaborativeFilteringModel      │                           │
│  │                                   │                           │
│  │  prepare_data()                   │                           │
│  │    ├─ Fetch views, likes, searches│                           │
│  │    ├─ Calculate scores:           │                           │
│  │    │   • View: 1.0                │                           │
│  │    │   • Watch %: 0-2.0           │                           │
│  │    │   • Like: +3.0               │                           │
│  │    │   • Dislike: -2.0            │                           │
│  │    └─ Build user-item matrix      │                           │
│  │                                   │                           │
│  │  train()                          │                           │
│  │    ├─ TruncatedSVD (50 features)  │                           │
│  │    ├─ Matrix factorization        │                           │
│  │    └─ Save model to disk          │                           │
│  │                                   │                           │
│  │  predict_for_user()               │                           │
│  │    ├─ Get user feature vector     │                           │
│  │    ├─ Dot product with videos     │                           │
│  │    ├─ Filter watched videos       │                           │
│  │    └─ Return top N predictions    │                           │
│  │                                   │                           │
│  └───────────┬───────────────────────┘                           │
│              │                                                     │
│  ┌───────────┴─────────┐                                         │
│  │   MySQL Database    │  (Read-only access)                     │
│  │   (via SQLAlchemy)  │                                         │
│  └─────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Watches Video
```
┌─────────┐     watch video      ┌──────────┐
│  User   │───────────────────────▶│ Frontend │
└─────────┘                        └────┬─────┘
                                        │
                                        │ POST /api/interactions/view
                                        │ {videoId, watchDuration, watchPercentage}
                                        │
                                   ┌────▼────────┐
                                   │ Spring Boot │
                                   └────┬────────┘
                                        │
                                        │ Save to DB
                                        │
                                   ┌────▼────────┐
                                   │    MySQL    │
                                   │ video_views │
                                   │ video.view  │
                                   │   Count++   │
                                   └─────────────┘
```

### 2. Get Recommendations
```
┌─────────┐  request recs   ┌──────────┐  GET /api/recommendations/for-you
│  User   │────────────────▶│ Frontend │─────────────────┐
└─────────┘                 └──────────┘                 │
                                                         │
                            ┌────────────────────────────▼──────┐
                            │         Spring Boot               │
                            │  RecommendationService            │
                            └────┬───────────────────────┬──────┘
                                 │                       │
                          Check  │                       │ Call if
                          Cache  │                       │ cache miss
                                 │                       │
                            ┌────▼─────┐          ┌─────▼────────┐
                            │  Redis   │          │   FastAPI    │
                            │  Cache   │          │   /recommend │
                            └────┬─────┘          └─────┬────────┘
                                 │                      │
                          return │                load  │
                          cached │               model  │
                           data  │              predict │
                                 │                      │
                                 │              ┌───────▼─────┐
                                 │              │ Trained ML  │
                                 │              │    Model    │
                                 │              └───────┬─────┘
                                 │                      │
                                 │◀─────────────────────┘
                                 │        recommendations
                                 │
                            ┌────▼─────┐
                            │ Frontend │──────▶ Display to user
                            └──────────┘
```

### 3. Model Training (Daily)
```
┌──────────────────┐  Cron: 2 AM daily
│     Scheduler    │
│ @Scheduled(...) │
└────────┬─────────┘
         │
         │ POST /train
         │ Authorization: Bearer JWT
         │
    ┌────▼─────────────┐
    │     FastAPI      │
    │   /train         │
    └────┬─────────────┘
         │
         │ 1. Fetch last 90 days of data
         │
    ┌────▼─────────────┐
    │      MySQL       │
    │  - video_views   │
    │  - video_likes   │
    │  - search_hist   │
    └────┬─────────────┘
         │
         │ 2. Calculate interaction scores
         │
    ┌────▼─────────────┐
    │  Prepare Data    │
    │  User-Item       │
    │  Matrix          │
    └────┬─────────────┘
         │
         │ 3. Train SVD model
         │
    ┌────▼─────────────┐
    │  Matrix          │
    │  Factorization   │
    │  (50 features)   │
    └────┬─────────────┘
         │
         │ 4. Save model
         │
    ┌────▼─────────────┐
    │  model.pkl       │
    │  (disk storage)  │
    └──────────────────┘
         │
         │ 5. Clear all caches
         │
    ┌────▼─────────────┐
    │     Redis        │
    │  Clear cache     │
    └──────────────────┘
```

## Component Responsibilities

### Frontend (React)
- **Purpose**: User interface and interaction capture
- **Key Actions**:
  - Display video recommendations
  - Track user interactions (views, likes, searches)
  - Call backend APIs
- **Tech**: React, Axios

### Spring Boot Backend
- **Purpose**: Business logic, authentication, API gateway
- **Key Actions**:
  - Authenticate users (JWT)
  - Record interactions to database
  - Proxy requests to FastAPI
  - Cache recommendations in Redis
  - Schedule daily model training
- **Tech**: Spring Boot 4.0, MySQL, Redis, RestTemplate

### FastAPI Microservice
- **Purpose**: Machine learning and recommendations
- **Key Actions**:
  - Train collaborative filtering model
  - Generate personalized recommendations
  - Serve trending videos
  - Manage model lifecycle
- **Tech**: FastAPI, scikit-learn, pandas, SQLAlchemy

### MySQL Database
- **Purpose**: Persistent data storage
- **Stores**:
  - Users and videos metadata
  - Interaction history (views, likes, searches)
  - Video popularity metrics

### Redis Cache
- **Purpose**: High-performance caching
- **Caches**:
  - User recommendations (1 hour TTL)
  - Trending videos
- **Benefits**: Reduces load on ML service, faster response times

## Scoring Algorithm

### Interaction Weights
```
Final Score = Base Score + Watch Bonus + Like/Dislike Score

Where:
  Base Score       = 1.0  (for any view)
  Watch Bonus      = (watch_percentage / 100) × 2.0
  Like Score       = +3.0 (if liked)
  Dislike Score    = -2.0 (if disliked)
```

### Example Calculations
```
Scenario 1: User watches 50% of video
  Score = 1.0 + (50/100 × 2.0) = 2.0

Scenario 2: User watches 90% and likes
  Score = 1.0 + (90/100 × 2.0) + 3.0 = 5.8

Scenario 3: User watches 20% and dislikes
  Score = 1.0 + (20/100 × 2.0) - 2.0 = -0.6 → 0.0 (clipped)
```

## Collaborative Filtering Details

### Matrix Factorization (SVD)
```
User-Item Matrix (R):
           Video1  Video2  Video3  ...
User1      3.5     0       5.8     ...
User2      0       4.2     0       ...
User3      2.1     0       0       ...
...

Decompose into:
R ≈ U × V^T

Where:
  U = User features (n_users × 50)
  V = Video features (n_videos × 50)

Prediction for user i, video j:
  score(i,j) = U[i] · V[j]
```

### Cold Start Handling
```
IF user_id NOT IN trained_users:
    RETURN trending_videos
ELSE:
    RETURN collaborative_filtering_results
END IF

Trending score = (viewCount × 0.7) + (rating × 0.3 × 100)
```

## Performance Characteristics

### Response Times (Expected)
- Cached recommendations: ~10-50ms
- Uncached recommendations: ~100-300ms
- Model training: ~10-60 seconds (depends on data size)
- Interaction recording: ~50-200ms

### Scalability
- **Horizontal**: FastAPI is stateless, can scale independently
- **Vertical**: Model training benefits from more CPU cores
- **Database**: Read replicas recommended for analytics
- **Cache**: Redis can be clustered for high availability

### Resource Requirements
- **FastAPI**: 512MB RAM minimum, 1-2GB recommended
- **Spring Boot**: 512MB RAM minimum, 2GB recommended
- **MySQL**: 1GB RAM minimum
- **Redis**: 256MB RAM minimum

---
Created: February 17, 2026
