package com.example.SocialStream.DTO;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponseDTO {
    
    @JsonProperty("user_id")
    private Long userId;
    
    private List<VideoRecommendationDTO> recommendations;
    
    private String algorithm;
    
    @JsonProperty("generated_at")
    private String generatedAt;
}
