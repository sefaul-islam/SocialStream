package com.example.SocialStream.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryDTO {
    private Long friendId;
    private String friendName;
    private String friendProfilePicture;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Integer unreadCount;
}
