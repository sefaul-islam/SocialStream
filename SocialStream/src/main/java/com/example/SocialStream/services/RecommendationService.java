package com.example.SocialStream.services;

import com.example.SocialStream.DTO.RecommendationResponseDTO;
import com.example.SocialStream.DTO.RecommendedVideoDTO;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.repositories.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RestTemplate restTemplate;
    private final VideoRepository videoRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${fastapi.service.url:http://localhost:8001}")
    private String fastApiUrl;

    private static final String RECOMMENDATION_CACHE_PREFIX = "recommendations:";
    private static final String TRENDING_CACHE_KEY = "recommendations:trending";
    private static final long CACHE_TTL_HOURS = 1;

    /**
     * Get personalized recommendations for a user
     */
    public RecommendationResponseDTO getPersonalizedRecommendations(Long userId, int limit) {
        String cacheKey = RECOMMENDATION_CACHE_PREFIX + userId + ":" + limit;
        
        // Try to get from cache first
        RecommendationResponseDTO cached = getFromCache(cacheKey);
        if (cached != null) {
            log.info("Returning cached recommendations for user {}", userId);
            return cached;
        }

        try {
            // Call FastAPI recommendation service
            String url = fastApiUrl + "/recommend/" + userId + "?limit=" + limit;
            log.info("Calling FastAPI recommendation service: {}", url);
            
            ResponseEntity<RecommendationResponseDTO> response = restTemplate.getForEntity(
                url, RecommendationResponseDTO.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                RecommendationResponseDTO recommendations = response.getBody();
                
                // Cache the results
                saveToCache(cacheKey, recommendations);
                
                return recommendations;
            } else {
                log.warn("FastAPI returned non-successful status: {}", response.getStatusCode());
                return getTrendingRecommendations(limit);
            }
        } catch (Exception e) {
            log.error("Error calling FastAPI recommendation service: {}", e.getMessage(), e);
            // Fallback to trending recommendations
            return getTrendingRecommendations(limit);
        }
    }

    /**
     * Get trending videos (fallback for cold start or service failure)
     */
    public RecommendationResponseDTO getTrendingRecommendations(int limit) {
        // Try to get from cache first
        RecommendationResponseDTO cached = getFromCache(TRENDING_CACHE_KEY + ":" + limit);
        if (cached != null) {
            log.info("Returning cached trending recommendations");
            return cached;
        }

        try {
            // Try to get from FastAPI first
            String url = fastApiUrl + "/trending?limit=" + limit;
            log.info("Calling FastAPI trending endpoint: {}", url);
            
            ResponseEntity<RecommendationResponseDTO> response = restTemplate.getForEntity(
                url, RecommendationResponseDTO.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                RecommendationResponseDTO trending = response.getBody();
                saveToCache(TRENDING_CACHE_KEY + ":" + limit, trending);
                return trending;
            }
        } catch (Exception e) {
            log.warn("FastAPI trending endpoint unavailable, using local fallback: {}", e.getMessage());
        }

        // Fallback: Get videos sorted by popularity (viewCount * rating)
        List<Video> videos = videoRepository.findAll();
        
        List<RecommendedVideoDTO> recommendedVideos = videos.stream()
            .sorted((v1, v2) -> {
                double score1 = calculatePopularityScore(v1);
                double score2 = calculatePopularityScore(v2);
                return Double.compare(score2, score1);
            })
            .limit(limit)
            .map(this::convertToRecommendedVideoDTO)
            .collect(Collectors.toList());

        RecommendationResponseDTO response = new RecommendationResponseDTO(
            recommendedVideos, 
            "trending_fallback", 
            recommendedVideos.size()
        );
        
        saveToCache(TRENDING_CACHE_KEY + ":" + limit, response);
        return response;
    }

    /**
     * Calculate popularity score for a video
     */
    private double calculatePopularityScore(Video video) {
        double viewScore = video.getViewCount();
        double ratingScore = video.getRating() != null ? video.getRating().doubleValue() : 5.0;
        
        // Weight views and rating
        return (viewScore * 0.7) + (ratingScore * 0.3 * 100);
    }

    /**
     * Convert Video entity to RecommendedVideoDTO
     */
    private RecommendedVideoDTO convertToRecommendedVideoDTO(Video video) {
        RecommendedVideoDTO dto = new RecommendedVideoDTO();
        dto.setId(video.getId());
        dto.setTitle(video.getTitle());
        dto.setMediaUrl(video.getMediaurl());
        dto.setThumbnailUrl(video.getThumbnailurl());
        dto.setDurationInSeconds(video.getDuration());
        dto.setDirector(video.getDirector());
        dto.setYear(video.getYear());
        dto.setGenre(video.getGenre());
        dto.setRating(video.getRating());
        dto.setViewCount(video.getViewCount());
        dto.setDescription(video.getDescription());
        dto.setUploadedAt(video.getUploadedAt());
        dto.setRecommendationScore(calculatePopularityScore(video));
        
        if (video.getCast() != null && !video.getCast().isEmpty()) {
            dto.setCast(List.of(video.getCast().split(",")));
        } else {
            dto.setCast(new ArrayList<>());
        }
        
        return dto;
    }

    /**
     * Get from Redis cache
     */
    @SuppressWarnings("unchecked")
    private RecommendationResponseDTO getFromCache(String key) {
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof RecommendationResponseDTO) {
                return (RecommendationResponseDTO) cached;
            }
        } catch (Exception e) {
            log.warn("Error reading from cache: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Save to Redis cache
     */
    private void saveToCache(String key, RecommendationResponseDTO value) {
        try {
            redisTemplate.opsForValue().set(key, value, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Error saving to cache: {}", e.getMessage());
        }
    }

    /**
     * Clear cache for a specific user
     */
    public void clearUserCache(Long userId) {
        try {
            String pattern = RECOMMENDATION_CACHE_PREFIX + userId + ":*";
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            log.info("Cleared recommendation cache for user {}", userId);
        } catch (Exception e) {
            log.warn("Error clearing user cache: {}", e.getMessage());
        }
    }

    /**
     * Clear all recommendation caches
     */
    public void clearAllCaches() {
        try {
            String pattern = RECOMMENDATION_CACHE_PREFIX + "*";
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            log.info("Cleared all recommendation caches");
        } catch (Exception e) {
            log.warn("Error clearing all caches: {}", e.getMessage());
        }
    }
}
