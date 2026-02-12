package com.example.SocialStream.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorDTO {
    private Long senderId;
    private String senderName;
    private boolean isTyping;
}
