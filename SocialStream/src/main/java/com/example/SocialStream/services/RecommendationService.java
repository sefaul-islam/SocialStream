package com.example.SocialStream.services;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.SocialStream.DTO.RecommendationResponseDTO;
import com.example.SocialStream.DTO.VideoInteractionDTO;
import com.example.SocialStream.DTO.VideoRecommendationDTO;

@Service
public class RecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${recommendation.service.url:http://localhost:8000}")
    private String recommendationServiceUrl;

    /**
     * Log a video interaction to the recommendation service asynchronously
     */
    @Async
    public void logInteraction(VideoInteractionDTO interaction) {
        try {
            String url = recommendationServiceUrl + "/api/recommendations/interactions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<VideoInteractionDTO> request = new HttpEntity<>(interaction, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully logged interaction for user {} on video {}", 
                    interaction.getUserId(), interaction.getVideoId());
            } else {
                logger.warn("Failed to log interaction: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error logging interaction to recommendation service", e);
            // Don't throw exception - this is async and shouldn't affect main flow
        }
    }

    /**
     * Get personalized recommendations for a user
     */
    public List<VideoRecommendationDTO> getRecommendations(Long userId, Integer limit, String algorithm) {
        try {
            String url = String.format("%s/api/recommendations/user/%d?limit=%d&algorithm=%s&exclude_watched=true",
                recommendationServiceUrl, userId, limit, algorithm);
            
            ResponseEntity<RecommendationResponseDTO> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                RecommendationResponseDTO.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                logger.info("Retrieved {} recommendations for user {}", 
                    response.getBody().getRecommendations().size(), userId);
                return response.getBody().getRecommendations();
            }
            
            return Collections.emptyList();
        } catch (Exception e) {
            logger.error("Error fetching recommendations for user {}", userId, e);
            return Collections.emptyList();
        }
    }

    /**
     * Get trending videos
     */
    public List<VideoRecommendationDTO> getTrending(Integer limit) {
        try {
            String url = String.format("%s/api/recommendations/trending?limit=%d",
                recommendationServiceUrl, limit);
            
            ResponseEntity<VideoRecommendationDTO[]> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                VideoRecommendationDTO[].class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<VideoRecommendationDTO> trending = Arrays.asList(response.getBody());
                logger.info("Retrieved {} trending videos", trending.size());
                return trending;
            }
            
            return Collections.emptyList();
        } catch (Exception e) {
            logger.error("Error fetching trending videos", e);
            return Collections.emptyList();
        }
    }
}
