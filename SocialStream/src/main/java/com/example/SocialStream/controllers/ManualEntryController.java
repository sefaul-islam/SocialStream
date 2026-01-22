package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.CreateVideoDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.services.VideoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manual")
public class ManualEntryController {

    @Autowired
    private VideoService videoService;

    @PostMapping("/video")
    public ResponseEntity<VideoResponseDTO> createVideo(@Valid @RequestBody CreateVideoDTO createVideoDTO) {
        try {
            VideoResponseDTO videoResponse = videoService.createVideo(createVideoDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(videoResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<VideoResponseDTO> getVideoById(@PathVariable Long id) {
        try {
            VideoResponseDTO videoResponse = videoService.getVideoById(id);
            return ResponseEntity.ok(videoResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/video/title/{title}")
    public ResponseEntity<VideoResponseDTO> getVideoByTitle(@PathVariable String title) {
        try {
            VideoResponseDTO videoResponse = videoService.getVideoByTitle(title);
            return ResponseEntity.ok(videoResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
