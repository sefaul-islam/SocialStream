package com.example.SocialStream.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.SocialStream.entities.Video;

import lombok.Data;

@Data
public class VideoResponseDTO {
    private Long id;
    private String mediaUrl;
    private String thumbnailUrl;
    private int durationInSeconds;
    private String title;
    private LocalDateTime uploadedAt;
    private String director;
    private long views;
    private String description;
    private BigDecimal rating;
    private List<String> cast;

    public VideoResponseDTO(Video video) {
        this.id=video.getId();
        this.mediaUrl=video.getMediaurl();
        this.thumbnailUrl=video.getThumbnailurl();
        this.durationInSeconds=video.getDuration();
        this.title=video.getTitle();
        this.uploadedAt=video.getUploadedAt();
        this.director=video.getDirector();
        this.views=video.getViewCount();
        this.description=video.getDescription();
        this.rating=video.getRating();
        if(video.getCast()!=null && !video.getCast().isEmpty()){
            this.cast=List.of(video.getCast().split(","));
        }

    }


}
