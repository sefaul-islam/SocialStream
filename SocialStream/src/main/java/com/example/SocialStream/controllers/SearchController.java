package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.services.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    /**
     * Search videos by title pattern (case-insensitive, contains match)
     * Example: GET /api/search/videos?title=action
     */
    @GetMapping("/videos")
    public ResponseEntity<List<VideoResponseDTO>> searchVideosByTitle(@RequestParam String title) {
        try {
            List<VideoResponseDTO> videos = searchService.searchVideosByTitlePattern(title);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Advanced search using custom patterns
     * Example: GET /api/search/videos/advanced?pattern=action%20movie
     */
    @GetMapping("/videos/advanced")
    public ResponseEntity<List<VideoResponseDTO>> advancedVideoSearch(@RequestParam String pattern) {
        try {
            List<VideoResponseDTO> videos = searchService.advancedVideoSearch(pattern);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Search for exact title match
     * Example: GET /api/search/videos/exact?title=The Matrix
     */
    @GetMapping("/videos/exact")
    public ResponseEntity<VideoResponseDTO> searchVideoByExactTitle(@RequestParam String title) {
        try {
            VideoResponseDTO video = searchService.searchVideoByExactTitle(title);
            if (video != null) {
                return ResponseEntity.ok(video);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
