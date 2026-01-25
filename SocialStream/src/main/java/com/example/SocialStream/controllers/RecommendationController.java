package com.example.SocialStream.controllers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.SocialStream.DTO.VideoRecommendationDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.repositories.VideoRepository;
import com.example.SocialStream.services.RecommendationService;
import com.example.SocialStream.utils.JwtUtil;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Get personalized recommendations for the authenticated user
     */
    @GetMapping("/for-you")
    public ResponseEntity<?> getForYouRecommendations(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "20") Integer limit,
            @RequestParam(defaultValue = "hybrid") String algorithm
    ) {
        try {
            // Extract user ID from JWT
            String token = authHeader.substring(7);
            Claims claims = jwtUtil.getClaims(token);
            Long userId = claims.get("id", Long.class);
            
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.emptyList());
            }

            // Get recommendations from Python service
            List<VideoRecommendationDTO> recommendations = recommendationService.getRecommendations(userId, limit, algorithm);

            if (recommendations.isEmpty()) {
                // Fallback to most viewed videos if no recommendations
                return getFallbackRecommendations(limit);
            }

            // Extract video IDs
            List<Long> videoIds = recommendations.stream()
                    .map(VideoRecommendationDTO::getVideoId)
                    .collect(Collectors.toList());

            // Fetch video details from database
            List<Video> videos = videoRepository.findAllById(videoIds);

            // Convert to response DTOs and preserve recommendation order
            Map<Long, Video> videoMap = videos.stream()
                    .collect(Collectors.toMap(Video::getId, v -> v));

            List<VideoResponseDTO> response = new ArrayList<>();
            for (VideoRecommendationDTO rec : recommendations) {
                Video video = videoMap.get(rec.getVideoId());
                if (video != null) {
                    VideoResponseDTO dto = convertToResponseDTO(video);
                    response.add(dto);
                }
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch recommendations: " + e.getMessage()));
        }
    }

    /**
     * Get trending videos
     */
    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingRecommendations(
            @RequestParam(defaultValue = "30") Integer limit
    ) {
        try {
            // Get trending from Python service
            List<VideoRecommendationDTO> trending = recommendationService.getTrending(limit);

            if (trending.isEmpty()) {
                // Fallback to most viewed videos
                return getFallbackRecommendations(limit);
            }

            // Extract video IDs
            List<Long> videoIds = trending.stream()
                    .map(VideoRecommendationDTO::getVideoId)
                    .collect(Collectors.toList());

            // Fetch video details
            List<Video> videos = videoRepository.findAllById(videoIds);

            // Convert to response DTOs
            List<VideoResponseDTO> response = videos.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch trending videos: " + e.getMessage()));
        }
    }

    /**
     * Fallback to most viewed videos when recommendation service is unavailable
     */
    private ResponseEntity<?> getFallbackRecommendations(Integer limit) {
        List<Video> videos = videoRepository.findAll().stream()
                .sorted((v1, v2) -> Long.compare(v2.getViewCount(), v1.getViewCount()))
                .limit(limit)
                .collect(Collectors.toList());

        List<VideoResponseDTO> response = videos.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Convert Video entity to VideoResponseDTO
     */
    private VideoResponseDTO convertToResponseDTO(Video video) {
        return new VideoResponseDTO(video);
    }
}
