package com.example.SocialStream.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendedVideoDTO {
    private Long id;
    private String title;
    private String mediaUrl;
    private String thumbnailUrl;
    private int durationInSeconds;
    private String director;
    private String year;
    private String genre;
    private BigDecimal rating;
    private long viewCount;
    private String description;
    private List<String> cast;
    private LocalDateTime uploadedAt;
    private Double recommendationScore; // Score from recommendation model
}
