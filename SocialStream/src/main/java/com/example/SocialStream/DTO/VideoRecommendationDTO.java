package com.example.SocialStream.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoRecommendationDTO {
    
    @JsonProperty("video_id")
    private Long videoId;
    
    private Double score;
    
    private String reason; // "similar_content", "popular", "collaborative", "trending"
    
    @JsonProperty("video_title")
    private String videoTitle;
    
    @JsonProperty("video_category")
    private String videoCategory;
}
