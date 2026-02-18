package com.example.SocialStream.DTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoLikeRequestDTO {
    
    @NotNull(message = "Video ID is required")
    private Long videoId;
    
    @NotNull(message = "Like status is required")
    private Boolean isLiked; // true = like, false = dislike
}
