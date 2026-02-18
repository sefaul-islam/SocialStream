package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_likes",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"video_id", "user_id"})},
    indexes = {
        @Index(name = "idx_user_video", columnList = "user_id,video_id")
    })
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class VideoLike {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "is_liked", nullable = false)
    private Boolean isLiked; // true = like, false = dislike
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
