package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.ChatMessageDTO;
import com.example.SocialStream.DTO.SendRoomMessageDTO;
import com.example.SocialStream.enums.Reaction;
import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.services.ChatMessageService;
import com.example.SocialStream.services.PlaybackSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final PlaybackSyncService playbackSyncService;
    private final ChatMessageService chatMessageService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle play command from host
     */
    @MessageMapping("/room/{roomId}/play")
    public void handlePlay(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        Double currentPosition = ((Number) payload.get("position")).doubleValue();
        
        playbackSyncService.play(roomId, userId, currentPosition);
    }

    /**
     * Handle pause command from host
     */
    @MessageMapping("/room/{roomId}/pause")
    public void handlePause(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        Double currentPosition = ((Number) payload.get("position")).doubleValue();
        
        playbackSyncService.pause(roomId, userId, currentPosition);
    }

    /**
     * Handle seek command from host
     */
    @MessageMapping("/room/{roomId}/seek")
    public void handleSeek(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        Double position = ((Number) payload.get("position")).doubleValue();
        
        playbackSyncService.seek(roomId, userId, position);
    }

    /**
     * Handle video change command from host
     */
    @MessageMapping("/room/{roomId}/changeVideo")
    public void handleChangeVideo(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        Long videoId = ((Number) payload.get("videoId")).longValue();
        
        playbackSyncService.changeVideo(roomId, userId, videoId);
    }

    /**
     * Handle periodic sync from host (every 30s for drift correction)
     */
    @MessageMapping("/room/{roomId}/sync")
    public void handleSync(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        Double currentPosition = ((Number) payload.get("position")).doubleValue();
        
        playbackSyncService.syncPosition(roomId, userId, currentPosition);
    }

    /**
     * Handle member joining room
     */
    @MessageMapping("/room/{roomId}/join")
    public void handleMemberJoin(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        
        playbackSyncService.memberJoined(roomId, userId);
    }

    /**
     * Handle member leaving room
     */
    @MessageMapping("/room/{roomId}/leave")
    public void handleMemberLeave(
            @DestinationVariable Long roomId,
            @Payload Map<String, Object> payload,
            Principal principal) {
        
        Long userId = getUserIdFromPrincipal(principal);
        
        playbackSyncService.memberLeft(roomId, userId);
    }

    /**
     * Handle room messaging
     */
    @MessageMapping("/room/{roomId}/message")
    public void handleMessage(@DestinationVariable Long roomId,
                              @Payload Map<String, Object> payload,
                              Principal principal) {
        Long userId = getUserIdFromPrincipal(principal);
        String messageContent = (String) payload.get("message");

        // Create DTO and send message
        SendRoomMessageDTO dto = new SendRoomMessageDTO();
        dto.setMessage(messageContent);

        // Persist message via service
        ChatMessageDTO chatMessage = chatMessageService.sendMessage(userId, roomId, dto);

        // Broadcast message to all room members
        messagingTemplate.convertAndSend("/topic/room/" + roomId, chatMessage);
    }

    /**
     * Handle room message reactions
     */
    @MessageMapping("/room/{roomId}/reaction")
    public void handleReaction(@DestinationVariable Long roomId,
                               @Payload Map<String, Object> payload,
                               Principal principal) {
        Long userId = getUserIdFromPrincipal(principal);
        Long messageId = ((Number) payload.get("messageId")).longValue();
        String reactionStr = (String) payload.get("reaction");
        Reaction reaction = Reaction.valueOf(reactionStr);

        // Add reaction via service
        ChatMessageDTO updatedMessage = chatMessageService.addReaction(messageId, userId, reaction);

        // Broadcast updated message to all room members
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/reaction", updatedMessage);
    }
    /**
     * Extract user ID from JWT principal
     */
    private Long getUserIdFromPrincipal(Principal principal) {
        // Principal name should be the email from JWT
        String email = principal.getName();
        
        // Look up user by email to get ID
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
