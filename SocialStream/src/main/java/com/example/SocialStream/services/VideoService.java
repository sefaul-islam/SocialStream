package com.example.SocialStream.services;

import com.example.SocialStream.DTO.CreateVideoDTO;
import com.example.SocialStream.DTO.VideoResponseDTO;
import com.example.SocialStream.entities.Video;
import com.example.SocialStream.repositories.VideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VideoService {

    @Autowired
    private VideoRepository videoRepository;

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
}


