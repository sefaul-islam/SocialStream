package com.example.SocialStream.controllers;

import com.example.SocialStream.DTO.ConversationSummaryDTO;
import com.example.SocialStream.DTO.DirectMessageDTO;
import com.example.SocialStream.DTO.SendMessageRequestDTO;
import com.example.SocialStream.auth.CustomUserDetails;
import com.example.SocialStream.enums.Reaction;
import com.example.SocialStream.services.DirectMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class DirectMessagesController {
    private final DirectMessageService directMessageService;

    @PostMapping("/send")
    public ResponseEntity<DirectMessageDTO> sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SendMessageRequestDTO dto) {
        DirectMessageDTO message = directMessageService.sendMessage(userDetails.getUserId(), dto);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/conversation/{friendId}")
    public ResponseEntity<Page<DirectMessageDTO>> getConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long friendId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DirectMessageDTO> messages = directMessageService.getChatHistoryByIds(
                userDetails.getUserId(), friendId, page, size);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/react/{messageId}")
    public ResponseEntity<DirectMessageDTO> addReaction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long messageId,
            @RequestParam Reaction reaction) {
        DirectMessageDTO message = directMessageService.addReaction(messageId, userDetails.getUserId(), reaction);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryDTO>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ConversationSummaryDTO> conversations = directMessageService.getConversations(userDetails.getUserId());
        return ResponseEntity.ok(conversations);
    }
}
