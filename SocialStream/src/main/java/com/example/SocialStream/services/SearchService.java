package com.example.SocialStream.services;

import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.repositories.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final VideoRepository videoRepository;

    /**
     * Search videos by title containing the given pattern (case-insensitive)
     * @param titlePattern The pattern to search for in video titles
     * @return List of VideoResponseDTO matching the pattern
     */
    public List<VideoResponseDTO> searchVideosByTitlePattern(String titlePattern) {
        return videoRepository.findByTitleContainingIgnoreCase(titlePattern)
            .stream()
            .map(VideoResponseDTO::new)
            .toList();
    }

    /**
     * Advanced search using custom query pattern
     * @param pattern The search pattern
     * @return List of VideoResponseDTO matching the pattern
     */
    public List<VideoResponseDTO> advancedVideoSearch(String pattern) {
        return videoRepository.searchByTitlePattern(pattern)
            .stream()
            .map(VideoResponseDTO::new)
            .toList();
    }

    /**
     * Search videos by exact title match
     * @param title The exact title to search for
     * @return VideoResponseDTO if found
     */
    public VideoResponseDTO searchVideoByExactTitle(String title) {
        return videoRepository.findByTitle(title)
            .map(VideoResponseDTO::new)
            .orElse(null);
    }
}
