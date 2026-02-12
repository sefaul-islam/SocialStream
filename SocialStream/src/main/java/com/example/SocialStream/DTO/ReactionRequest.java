package com.example.SocialStream.DTO;

import com.example.SocialStream.enums.Reaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReactionRequest {
    private Long messageId;
    private Reaction reaction;
    private Long recipientId;
}
