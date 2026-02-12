package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.DirectMessage;
import com.example.SocialStream.enums.Reaction;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DirectMessageDTO {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String message;
    private LocalDateTime timestamp;
    private Reaction reaction;

    public DirectMessageDTO(DirectMessage directMessage) {
        this.id = directMessage.getId();
        this.senderId = directMessage.getSender().getId();
        this.senderName = directMessage.getSender().getUsername();
        this.recipientId = directMessage.getRecipient().getId();
        this.recipientName = directMessage.getRecipient().getUsername();
        this.message = directMessage.getContent();
        this.timestamp = directMessage.getSendTime();
        this.reaction = directMessage.getReaction();

    }
}
