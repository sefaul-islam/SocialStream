package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.ChatMessage;
import com.example.SocialStream.enums.Reaction;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageDTO {
    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String message;
    private LocalDateTime sentAt;
    private Reaction reaction;

    public ChatMessageDTO(ChatMessage chatMessage) {
        this.id = chatMessage.getId();
        this.roomId = chatMessage.getRoom().getId();
        this.senderId = chatMessage.getSender().getId();
        this.senderName = chatMessage.getSender().getUsername();
        this.senderAvatar = chatMessage.getSender().getProfilePictureUrl();
        this.message = chatMessage.getMessage();
        this.sentAt = chatMessage.getSentAt();
        this.reaction = chatMessage.getReaction();
    }
}
