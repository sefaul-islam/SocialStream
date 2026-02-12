package com.example.SocialStream.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequestDTO {
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    private String content;
}
