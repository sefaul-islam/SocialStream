package com.example.SocialStream.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisRoomStateService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ROOM_STATE_PREFIX = "room:state:";
    private static final long EXPIRATION_HOURS = 24; // Expire after 24 hours of inactivity

    /**
     * Get room state from Redis
     */
    public Map<String, Object> getRoomState(Long roomId) {
        try {
            String key = ROOM_STATE_PREFIX + roomId;
            @SuppressWarnings("unchecked")
            Map<String, Object> state = (Map<String, Object>) redisTemplate.opsForValue().get(key);
            
            if (state == null) {
                // Initialize default state
                state = new HashMap<>();
                state.put("roomId", roomId);
                state.put("currentVideoId", null);
                state.put("playbackPosition", 0.0);
                state.put("isPlaying", false);
                state.put("lastSyncTimestamp", LocalDateTime.now().toString());
                saveRoomState(roomId, state);
            }
            
            return state;
        } catch (Exception e) {
            log.warn("Redis unavailable, returning default state: {}", e.getMessage());
            return getDefaultState(roomId);
        }
    }

    /**
     * Save room state to Redis
     */
    public void saveRoomState(Long roomId, Map<String, Object> state) {
        try {
            String key = ROOM_STATE_PREFIX + roomId;
            state.put("lastSyncTimestamp", LocalDateTime.now().toString());
            redisTemplate.opsForValue().set(key, state, EXPIRATION_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            // Silently fail if Redis is unavailable - state is in memory
            log.debug("Redis unavailable: {}", e.getMessage());
        }
    }

    /**
     * Update playback position
     */
    public void updatePosition(Long roomId, Double position) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            state.put("playbackPosition", position);
            saveRoomState(roomId, state);
        } catch (Exception e) {
            log.warn("Failed to update position in Redis: {}", e.getMessage());
        }
    }

    /**
     * Update playing status
     */
    public void updatePlayingStatus(Long roomId, boolean isPlaying, Double position) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            state.put("isPlaying", isPlaying);
            state.put("playbackPosition", position);
            saveRoomState(roomId, state);
        } catch (Exception e) {
            log.warn("Failed to update playing status in Redis: {}", e.getMessage());
        }
    }

    /**
     * Update current video
     */
    public void updateCurrentVideo(Long roomId, Long videoId) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            state.put("currentVideoId", videoId);
            state.put("playbackPosition", 0.0);
            state.put("isPlaying", false);
            saveRoomState(roomId, state);
        } catch (Exception e) {
            log.warn("Failed to update current video in Redis: {}", e.getMessage());
        }
    }

    /**
     * Delete room state (when room is closed)
     */
    public void deleteRoomState(Long roomId) {
        try {
            String key = ROOM_STATE_PREFIX + roomId;
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Failed to delete room state from Redis: {}", e.getMessage());
        }
    }

    /**
     * Get current video ID
     */
    public Long getCurrentVideoId(Long roomId) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            Object videoId = state.get("currentVideoId");
            if (videoId == null) return null;
            if (videoId instanceof Number) {
                return ((Number) videoId).longValue();
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to get current video ID from Redis: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get playback position
     */
    public Double getPlaybackPosition(Long roomId) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            Object position = state.get("playbackPosition");
            if (position instanceof Number) {
                return ((Number) position).doubleValue();
            }
            return 0.0;
        } catch (Exception e) {
            log.warn("Failed to get playback position from Redis: {}", e.getMessage());
            return 0.0;
        }
    }

    /**
     * Check if video is playing
     */
    public Boolean isPlaying(Long roomId) {
        try {
            Map<String, Object> state = getRoomState(roomId);
            Object playing = state.get("isPlaying");
            return playing != null && (Boolean) playing;
        } catch (Exception e) {
            log.warn("Failed to get playing status from Redis: {}", e.getMessage());
            return false;
        }
    }

    private Map<String, Object> getDefaultState(Long roomId) {
        Map<String, Object> state = new HashMap<>();
        state.put("roomId", roomId);
        state.put("currentVideoId", null);
        state.put("playbackPosition", 0.0);
        state.put("isPlaying", false);
        state.put("lastSyncTimestamp", LocalDateTime.now().toString());
        return state;
    }
}
