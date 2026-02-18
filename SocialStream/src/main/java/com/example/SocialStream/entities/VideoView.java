package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_views",
    indexes = {
        @Index(name = "idx_user_timestamp", columnList = "user_id,viewed_at"),
        @Index(name = "idx_video_timestamp", columnList = "video_id,viewed_at")
    })
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class VideoView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "watch_duration", nullable = false)
    private Integer watchDuration; // in seconds
    
    @Column(name = "watch_percentage", nullable = false)
    private Double watchPercentage; // 0.0 to 100.0
    
    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;
}
