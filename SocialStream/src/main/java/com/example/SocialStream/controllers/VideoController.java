package com.example.SocialStream.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.services.VideoService;
import com.example.SocialStream.utils.JwtUtil;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    @Autowired
    private VideoService videoService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/search")
    public ResponseEntity<List<VideoResponseDTO>> searchVideosByTitle(@RequestParam String title) {
        try {
            List<VideoResponseDTO> videos = videoService.searchVideosByTitle(title);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search/pattern")
    public ResponseEntity<List<VideoResponseDTO>> searchVideosByPattern(@RequestParam String pattern) {
        try {
            List<VideoResponseDTO> videos = videoService.searchVideosByPattern(pattern);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponseDTO> getVideoById(@PathVariable Long id) {
        try {
            VideoResponseDTO video = videoService.getVideoById(id);
            return ResponseEntity.ok(video);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/title/{title}")
    public ResponseEntity<VideoResponseDTO> getVideoByTitle(@PathVariable String title) {
        try {
            VideoResponseDTO video = videoService.getVideoByTitle(title);
            return ResponseEntity.ok(video);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Record a video view (requires authentication)
     * Counts as view if watched for at least 18 seconds
     */
    @PostMapping("/{videoId}/view")
    public ResponseEntity<?> recordView(
            @PathVariable Long videoId,
            @RequestBody Map<String, Integer> payload,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and get user ID
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            Claims claims = jwtUtil.getClaims(token);
            Long userId = claims.get("userId", Long.class);
            
            Integer watchDuration = payload.get("watchDuration");
            
            if (watchDuration == null || watchDuration < 18) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Watch duration must be at least 18 seconds"));
            }
            
            videoService.recordVideoView(videoId, userId, watchDuration);
            
            return ResponseEntity.ok(Map.of(
                "message", "View recorded successfully",
                "viewCounted", watchDuration >= 18
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Failed to record view: " + e.getMessage()));
        }
    }
    
    /**
     * Get view count for a video
     */
    @GetMapping("/{videoId}/views/count")
    public ResponseEntity<?> getViewCount(@PathVariable Long videoId) {
        try {
            Long viewCount = videoService.getVideoViewCount(videoId);
            return ResponseEntity.ok(Map.of("videoId", videoId, "viewCount", viewCount));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
