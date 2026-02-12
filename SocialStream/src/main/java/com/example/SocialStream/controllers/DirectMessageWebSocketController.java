package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.DirectMessageDTO;
import com.example.SocialStream.DTO.ReactionRequest;
import com.example.SocialStream.DTO.SendMessageRequestDTO;
import com.example.SocialStream.DTO.TypingIndicatorDTO;
import com.example.SocialStream.entities.DirectMessage;
import com.example.SocialStream.exceptions.InvalidOperationException;
import com.example.SocialStream.repositories.FriendRepository;
import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.services.DirectMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class DirectMessageWebSocketController {

    private final DirectMessageService directMessageService;
    private final UserRepository userRepository;
    private final FriendRepository friendRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle real-time message sending via WebSocket
     */
    @MessageMapping("/dm/send")
    public void handleSendMessage(@Payload Map<String, Object> payload, Principal principal) {
        try {
            Long senderId = getUserIdFromPrincipal(principal);
            Long recipientId = ((Number) payload.get("recipientId")).longValue();
            String content = (String) payload.get("content");

            // Create DTO and send message
            SendMessageRequestDTO dto = new SendMessageRequestDTO();
            dto.setRecipientId(recipientId);
            dto.setContent(content);

            DirectMessageDTO message = directMessageService.sendMessage(senderId, dto);

            // Broadcast to recipient
            String recipientDestination = "/queue/" + recipientId + "/messages";
            messagingTemplate.convertAndSend(recipientDestination, (Object) message);
            
            // Confirm to sender
            String senderDestination = "/queue/" + senderId + "/sent";
            messagingTemplate.convertAndSend(senderDestination, (Object) message);

        } catch (InvalidOperationException e) {
            // Send error back to sender
            Long senderId = getUserIdFromPrincipal(principal);
            String errorDestination = "/queue/" + senderId + "/errors";
            messagingTemplate.convertAndSend(errorDestination, (Object) Map.of("error", e.getMessage()));
        }
    }

    /**
     * Handle typing indicator
     */
    @MessageMapping("/dm/typing")
    public void handleTypingIndicator(@Payload Map<String, Object> payload, Principal principal) {
        try {
            Long senderId = getUserIdFromPrincipal(principal);
            Long recipientId = ((Number) payload.get("recipientId")).longValue();
            Boolean isTyping = (Boolean) payload.get("isTyping");

            // Validate friendship before broadcasting typing indicator
            if (!friendRepository.areFriends(senderId, recipientId)) {
                return; // Silently ignore if not friends
            }

            // Get sender name
            String senderName = userRepository.findById(senderId)
                    .map(user -> user.getUsername())
                    .orElse("Unknown");

            // Create typing indicator DTO
            TypingIndicatorDTO indicator = new TypingIndicatorDTO(senderId, senderName, isTyping);

            // Broadcast to recipient only (not persisted)
            String typingDestination = "/queue/" + recipientId + "/typing";
            messagingTemplate.convertAndSend(typingDestination, (Object) indicator);

        } catch (Exception e) {
            // Silently ignore typing indicator errors
        }
    }

    @MessageMapping("/dm/reaction")
    public void handleReaction(@Payload ReactionRequest reactionRequest, Principal principal) {
        try {
            Long senderId = getUserIdFromPrincipal(principal);

            // Persist the reaction
            DirectMessageDTO updatedMessage = directMessageService.addReaction(
                    reactionRequest.getMessageId(),
                    senderId,
                    reactionRequest.getReaction()
            );

            // Determine the other participant
            Long recipientId = updatedMessage.getSenderId().equals(senderId)
                    ? updatedMessage.getRecipientId()
                    : updatedMessage.getSenderId();

            // Notify recipient in real-time
            String recipientDestination = "/queue/" + recipientId + "/reaction";
            messagingTemplate.convertAndSend(recipientDestination, (Object) updatedMessage);

            // Confirm back to sender
            String senderDestination = "/queue/" + senderId + "/reaction";
            messagingTemplate.convertAndSend(senderDestination, (Object) updatedMessage);

        } catch (Exception e) {
            Long senderId = getUserIdFromPrincipal(principal);
            String errorDestination = "/queue/" + senderId + "/errors";
            messagingTemplate.convertAndSend(errorDestination, (Object) Map.of("error", e.getMessage()));
        }
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
