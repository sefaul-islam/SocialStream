package com.example.SocialStream.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationResponseDTO {
    private List<RecommendedVideoDTO> recommendations;
    private String algorithm; // "collaborative_filtering", "trending", etc.
    private int totalResults;
}
