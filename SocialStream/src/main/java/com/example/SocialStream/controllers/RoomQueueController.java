package com.example.SocialStream.controllers;

import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.entities.RoomQueue;
import com.example.SocialStream.services.RoomQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms/{roomId}/queue")
@RequiredArgsConstructor
public class RoomQueueController {

    private final RoomQueueService roomQueueService;

    /**
     * Get queue for a room
     */
    @GetMapping
    public ResponseEntity<List<RoomQueue>> getQueue(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<RoomQueue> queue = roomQueueService.getQueue(roomId, userDetails.getUserId());
        return ResponseEntity.ok(queue);
    }

    /**
     * Add video to queue
     */
    @PostMapping
    public ResponseEntity<RoomQueue> addToQueue(
            @PathVariable Long roomId,
            @RequestParam Long videoId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        RoomQueue queueItem = roomQueueService.addToQueue(roomId, videoId, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(queueItem);
    }

    /**
     * Remove video from queue (Host/Admin only)
     */
    @DeleteMapping("/{queueId}")
    public ResponseEntity<Map<String, String>> removeFromQueue(
            @PathVariable Long roomId,
            @PathVariable Long queueId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        roomQueueService.removeFromQueue(queueId, userDetails.getUserId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Video removed from queue successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Toggle vote on queue item
     */
    @PostMapping("/{queueId}/vote")
    public ResponseEntity<Map<String, Object>> toggleVote(
            @PathVariable Long roomId,
            @PathVariable Long queueId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Map<String, Object> result = roomQueueService.toggleVote(queueId, userDetails.getUserId());
        return ResponseEntity.ok(result);
    }

    /**
     * Check if user has voted
     */
    @GetMapping("/{queueId}/voted")
    public ResponseEntity<Map<String, Boolean>> hasVoted(
            @PathVariable Long roomId,
            @PathVariable Long queueId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        boolean hasVoted = roomQueueService.hasUserVoted(queueId, userDetails.getUserId());
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasVoted", hasVoted);
        return ResponseEntity.ok(response);
    }
}
