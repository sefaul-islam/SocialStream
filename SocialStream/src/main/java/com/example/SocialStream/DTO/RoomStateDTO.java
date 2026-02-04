package com.example.SocialStream.DTO;

import com.example.SocialStream.entities.RoomQueue;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomStateDTO {
    private Long roomId;
    private Long currentVideoId;
    private Double playbackPosition;
    private Boolean isPlaying;
    private String lastSyncTimestamp;
    private List<RoomQueue> queue;
    
    public RoomStateDTO(Long roomId) {
        this.roomId = roomId;
        this.currentVideoId = null;
        this.playbackPosition = 0.0;
        this.isPlaying = false;
        this.lastSyncTimestamp = null;
    }
}
