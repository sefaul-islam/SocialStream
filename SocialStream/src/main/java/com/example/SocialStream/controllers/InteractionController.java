package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.InteractionResponseDTO;
import com.example.SocialStream.DTO.SearchRequestDTO;
import com.example.SocialStream.DTO.VideoLikeRequestDTO;
import com.example.SocialStream.DTO.VideoViewRequestDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.services.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
public class InteractionController {
    
    private final InteractionService interactionService;

    @PostMapping("/view")
    public ResponseEntity<InteractionResponseDTO> recordVideoView(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VideoViewRequestDTO request) {
        try {
            InteractionResponseDTO response = interactionService.recordVideoView(
                userDetails.getUserId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new InteractionResponseDTO(e.getMessage(), false));
        }
    }

    @PostMapping("/like")
    public ResponseEntity<InteractionResponseDTO> recordVideoLike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VideoLikeRequestDTO request) {
        try {
            InteractionResponseDTO response = interactionService.recordVideoLike(
                userDetails.getUserId(), request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new InteractionResponseDTO(e.getMessage(), false));
        }
    }

    @DeleteMapping("/like/{videoId}")
    public ResponseEntity<InteractionResponseDTO> removeVideoLike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long videoId) {
        InteractionResponseDTO response = interactionService.removeVideoLike(
            userDetails.getUserId(), videoId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/search")
    public ResponseEntity<InteractionResponseDTO> recordSearch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SearchRequestDTO request) {
        try {
            InteractionResponseDTO response = interactionService.recordSearch(
                userDetails.getUserId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new InteractionResponseDTO(e.getMessage(), false));
        }
    }

    @GetMapping("/video/{videoId}/likes")
    public ResponseEntity<Long> getVideoLikeCount(@PathVariable Long videoId) {
        long likeCount = interactionService.getVideoLikeCount(videoId);
        return ResponseEntity.ok(likeCount);
    }

    @GetMapping("/video/{videoId}/dislikes")
    public ResponseEntity<Long> getVideoDislikeCount(@PathVariable Long videoId) {
        long dislikeCount = interactionService.getVideoDislikeCount(videoId);
        return ResponseEntity.ok(dislikeCount);
    }
}
