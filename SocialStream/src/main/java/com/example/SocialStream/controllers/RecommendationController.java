package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.RecommendationResponseDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.config.RecommendationScheduler;
import com.example.SocialStream.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    
    private final RecommendationService recommendationService;
    private final RecommendationScheduler recommendationScheduler;

    @GetMapping("/for-you")
    public ResponseEntity<RecommendationResponseDTO> getPersonalizedRecommendations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            RecommendationResponseDTO recommendations = 
                recommendationService.getPersonalizedRecommendations(userDetails.getUserId(), limit);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            // Fallback to trending if personalized fails
            return ResponseEntity.ok(recommendationService.getTrendingRecommendations(limit));
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<RecommendationResponseDTO> getTrendingRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        RecommendationResponseDTO recommendations = 
            recommendationService.getTrendingRecommendations(limit);
        return ResponseEntity.ok(recommendations);
    }

    @DeleteMapping("/cache/user")
    public ResponseEntity<String> clearUserCache(@AuthenticationPrincipal CustomUserDetails userDetails) {
        recommendationService.clearUserCache(userDetails.getUserId());
        return ResponseEntity.ok("User recommendation cache cleared");
    }

    @DeleteMapping("/cache/all")
    public ResponseEntity<String> clearAllCaches() {
        recommendationService.clearAllCaches();
        return ResponseEntity.ok("All recommendation caches cleared");
    }

    @PostMapping("/train")
    public ResponseEntity<String> triggerTraining() {
        recommendationScheduler.triggerManualTraining();
        return ResponseEntity.ok("Model training triggered");
    }
}
