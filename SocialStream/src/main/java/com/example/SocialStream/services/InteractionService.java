package com.example.SocialStream.services;

import com.example.SocialStream.DTO.InteractionResponseDTO;
import com.example.SocialStream.DTO.SearchRequestDTO;
import com.example.SocialStream.DTO.VideoLikeRequestDTO;
import com.example.SocialStream.DTO.VideoViewRequestDTO;
import com.example.SocialStream.entities.SearchHistory;
import com.example.SocialStream.entities.User;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.entities.VideoLike;
import com.example.SocialStream.entities.VideoView;
import com.example.SocialStream.repositories.SearchHistoryRepository;
import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.repositories.VideoLikeRepository;
import com.example.SocialStream.repositories.VideoRepository;
import com.example.SocialStream.repositories.VideoViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class InteractionService {

    @Autowired
    private VideoViewRepository videoViewRepository;

    @Autowired
    private VideoLikeRepository videoLikeRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public InteractionResponseDTO recordVideoView(Long userId, VideoViewRequestDTO request) {
        Video video = videoRepository.findById(request.getVideoId())
            .orElseThrow(() -> new RuntimeException("Video not found with id: " + request.getVideoId()));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        VideoView videoView = new VideoView();
        videoView.setVideo(video);
        videoView.setUser(user);
        videoView.setWatchDuration(request.getWatchDuration());
        videoView.setWatchPercentage(request.getWatchPercentage());
        videoView.setViewedAt(LocalDateTime.now());

        videoViewRepository.save(videoView);

        // Increment view count
        video.setViewCount(video.getViewCount() + 1);
        videoRepository.save(video);

        return new InteractionResponseDTO("Video view recorded successfully", true);
    }

    @Transactional
    public InteractionResponseDTO recordVideoLike(Long userId, VideoLikeRequestDTO request) {
        Video video = videoRepository.findById(request.getVideoId())
            .orElseThrow(() -> new RuntimeException("Video not found with id: " + request.getVideoId()));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Check if user already liked/disliked this video
        var existingLike = videoLikeRepository.findByVideoIdAndUserId(request.getVideoId(), userId);

        if (existingLike.isPresent()) {
            // Update existing like/dislike
            VideoLike videoLike = existingLike.get();
            videoLike.setIsLiked(request.getIsLiked());
            videoLike.setUpdatedAt(LocalDateTime.now());
            videoLikeRepository.save(videoLike);
            return new InteractionResponseDTO("Video like/dislike updated successfully", true);
        } else {
            // Create new like/dislike
            VideoLike videoLike = new VideoLike();
            videoLike.setVideo(video);
            videoLike.setUser(user);
            videoLike.setIsLiked(request.getIsLiked());
            videoLike.setCreatedAt(LocalDateTime.now());
            videoLikeRepository.save(videoLike);
            return new InteractionResponseDTO("Video like/dislike recorded successfully", true);
        }
    }

    @Transactional
    public InteractionResponseDTO removeVideoLike(Long userId, Long videoId) {
        var existingLike = videoLikeRepository.findByVideoIdAndUserId(videoId, userId);
        
        if (existingLike.isPresent()) {
            videoLikeRepository.delete(existingLike.get());
            return new InteractionResponseDTO("Video like/dislike removed successfully", true);
        } else {
            return new InteractionResponseDTO("No like/dislike found to remove", false);
        }
    }

    @Transactional
    public InteractionResponseDTO recordSearch(Long userId, SearchRequestDTO request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        SearchHistory searchHistory = new SearchHistory();
        searchHistory.setUser(user);
        searchHistory.setQuery(request.getQuery());
        searchHistory.setSearchedAt(LocalDateTime.now());

        searchHistoryRepository.save(searchHistory);

        return new InteractionResponseDTO("Search recorded successfully", true);
    }

    public long getVideoLikeCount(Long videoId) {
        return videoLikeRepository.countByVideoIdAndIsLiked(videoId, true);
    }

    public long getVideoDislikeCount(Long videoId) {
        return videoLikeRepository.countByVideoIdAndIsLiked(videoId, false);
    }
}
