package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.services.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    @Autowired
    private VideoService videoService;

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
}
