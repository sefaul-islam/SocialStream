package com.example.SocialStream.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "room_state")
public class RoomState {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private Room room;

    @ManyToOne
    @JoinColumn(name = "current_video_id")
    private Video currentVideo;

    @Column(name = "playback_position", nullable = false)
    private Double playbackPosition = 0.0; // in seconds

    @Column(name = "is_playing", nullable = false)
    private Boolean isPlaying = false;

    @Column(name = "last_sync_timestamp", nullable = false)
    private LocalDateTime lastSyncTimestamp;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        lastSyncTimestamp = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
