package com.example.SocialStream.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.SocialStream.DTO.CreateVideoDTO;
import com.example.SocialStream.DTO.VideoInteractionDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.entities.VideoView;
import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.repositories.VideoRepository;
import com.example.SocialStream.repositories.VideoViewRepository;

@Service
public class VideoService {

    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private VideoViewRepository videoViewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RecommendationService recommendationService;

    @Transactional
    public VideoResponseDTO createVideo(CreateVideoDTO createVideoDTO) {
        Video video = new Video();

        // Set Media properties (inherited from parent)
        video.setMediaurl(createVideoDTO.getMediaUrl());
        video.setThumbnailurl(createVideoDTO.getThumbnailUrl());
        video.setDuration(createVideoDTO.getDurationInSeconds());
        video.setTitle(createVideoDTO.getTitle());
        video.setUploadedAt(LocalDateTime.now());

        // Set Video-specific properties
        video.setDirector(createVideoDTO.getDirector());
        video.setYear(createVideoDTO.getYear());
        video.setViewCount(0); // Initialize view count to 0
        video.setDescription(createVideoDTO.getDescription());
        video.setRating(createVideoDTO.getRating());
        video.setCast(createVideoDTO.getCast());

        // Save the video (this will save to both media and video tables due to inheritance)
        Video savedVideo = videoRepository.save(video);

        return new VideoResponseDTO(savedVideo);
    }

    public VideoResponseDTO getVideoById(Long id) {
        Video video = videoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Video not found with id: " + id));
        return new VideoResponseDTO(video);
    }

    public VideoResponseDTO getVideoByTitle(String title) {
        Video video = videoRepository.findByTitle(title)
            .orElseThrow(() -> new RuntimeException("Video not found with title: " + title));
        return new VideoResponseDTO(video);
    }

    public List<VideoResponseDTO> searchVideosByTitle(String titlePattern) {
        List<Video> videos = videoRepository.findByTitleContainingIgnoreCase(titlePattern);
        return videos.stream()
            .map(VideoResponseDTO::new)
            .toList();
    }

    public List<VideoResponseDTO> searchVideosByPattern(String pattern) {
        List<Video> videos = videoRepository.searchByTitlePattern(pattern);
        return videos.stream()
            .map(VideoResponseDTO::new)
            .toList();
    }
    
    /**
     * Record a video view and increment view count if eligible
     * Only counts as view if watched for at least 18 seconds and not viewed in last 24 hours
     */
    @Transactional
    public void recordVideoView(Long videoId, Long userId, Integer watchDuration) {
        // Validate minimum watch duration (18 seconds)
        if (watchDuration < 18) {
            return; // Don't count as view
        }
        
        // Check if user already viewed this video in last 24 hours
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        Optional<VideoView> recentView = videoViewRepository.findRecentView(userId, videoId, twentyFourHoursAgo);
        
        if (recentView.isPresent()) {
            return; // Already counted as view in last 24 hours
        }
        
        // Fetch video and user
        Video video = videoRepository.findById(videoId)
            .orElseThrow(() -> new RuntimeException("Video not found with id: " + videoId));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Calculate completion percentage
        double completionPercentage = (double) watchDuration / video.getDuration() * 100;
        
        // Create and save video view record
        VideoView videoView = new VideoView();
        videoView.setUser(user);
        videoView.setVideo(video);
        videoView.setWatchDuration(watchDuration);
        videoView.setCompletionPercentage(completionPercentage);
        videoViewRepository.save(videoView);
        
        // Increment video view count
        video.setViewCount(video.getViewCount() + 1);
        videoRepository.save(video);
        
        // Log interaction to recommendation service asynchronously
        try {
            VideoInteractionDTO interaction = new VideoInteractionDTO();
            interaction.setUserId(userId);
            interaction.setVideoId(videoId);
            interaction.setInteractionType("view");
            interaction.setWatchDuration(watchDuration);
            interaction.setCompletionPercentage(completionPercentage);
            interaction.setVideoTitle(video.getTitle());
            // TODO: Add category and tags fields to Video entity for better recommendations
            interaction.setVideoCategory(null);
            interaction.setVideoTags(null);
            
            recommendationService.logInteraction(interaction);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to log interaction to recommendation service: " + e.getMessage());
        }
    }
    
    /**
     * Get user's watch history
     */
    public List<VideoView> getUserWatchHistory(Long userId) {
        return videoViewRepository.findByUserId(userId);
    }
    
    /**
     * Get total view count for a video
     */
    public Long getVideoViewCount(Long videoId) {
        return videoViewRepository.countByVideoId(videoId);
    }
}


