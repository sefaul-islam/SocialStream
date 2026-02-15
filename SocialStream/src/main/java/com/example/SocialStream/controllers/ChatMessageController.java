package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.ChatMessageDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.services.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Room Chat Messages
 * Handles HTTP requests for fetching and managing room chat messages
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class ChatMessageController {
    
    private final ChatMessageService chatMessageService;

    /**
     * Get paginated chat messages for a room
     * @param roomId Room ID
     * @param userDetails Authenticated user details
     * @param page Page number (default: 0)
     * @param size Page size (default: 50)
     * @return Paginated list of chat messages with reactions
     */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<Page<ChatMessageDTO>> getRoomMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Page<ChatMessageDTO> messages = chatMessageService.getRoomMessages(
                roomId, 
                userDetails.getUserId(), 
                page, 
                size
        );
        return ResponseEntity.ok(messages);
    }

    /**
     * Get recent chat messages for a room (last 50 messages)
     * Optimized endpoint for initial chat load
     * @param roomId Room ID
     * @param userDetails Authenticated user details
     * @return List of recent chat messages with reactions
     */
    @GetMapping("/{roomId}/messages/recent")
    public ResponseEntity<List<ChatMessageDTO>> getRecentMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<ChatMessageDTO> messages = chatMessageService.getRecentRoomMessages(
                roomId, 
                userDetails.getUserId()
        );
        return ResponseEntity.ok(messages);
    }
}
