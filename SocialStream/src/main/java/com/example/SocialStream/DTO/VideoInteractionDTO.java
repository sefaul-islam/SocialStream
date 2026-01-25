package com.example.SocialStream.DTO;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoInteractionDTO {
    
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("video_id")
    private Long videoId;
    
    @JsonProperty("interaction_type")
    private String interactionType; // "view", "like", "share", "watch_duration"
    
    @JsonProperty("watch_duration")
    private Integer watchDuration; // in seconds
    
    @JsonProperty("completion_percentage")
    private Double completionPercentage;
    
    @JsonProperty("video_title")
    private String videoTitle;
    
    @JsonProperty("video_category")
    private String videoCategory;
    
    @JsonProperty("video_tags")
    private List<String> videoTags;
}
