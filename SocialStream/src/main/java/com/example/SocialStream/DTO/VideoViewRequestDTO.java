package com.example.SocialStream.DTO;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoViewRequestDTO {
    
    @NotNull(message = "Video ID is required")
    private Long videoId;
    
    @NotNull(message = "Watch duration is required")
    @Min(value = 0, message = "Watch duration cannot be negative")
    private Integer watchDuration; // in seconds
    
    @NotNull(message = "Watch percentage is required")
    @Min(value = 0, message = "Watch percentage cannot be negative")
    @Max(value = 100, message = "Watch percentage cannot exceed 100")
    private Double watchPercentage; // 0.0 to 100.0
}
