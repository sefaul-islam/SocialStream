package com.example.SocialStream.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.SocialStream.repositories.UserRepository;
import com.example.SocialStream.repositories.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlaybackSyncService {

    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisRoomStateService redisRoomStateService;

    /**
     * Initialize room state when room is created
     */
    public void initializeRoomState(Long roomId) {
        // Initialize in Redis only
        Map<String, Object> state = new HashMap<>();
        state.put("roomId", roomId);
        state.put("currentVideoId", null);
        state.put("playbackPosition", 0.0);
        state.put("isPlaying", false);
        redisRoomStateService.saveRoomState(roomId, state);
    }

    /**
     * Play video - Redis only, no database
     */
    public void play(Long roomId, Long userId, Double currentPosition) {
        // Update Redis cache only
        redisRoomStateService.updatePlayingStatus(roomId, true, currentPosition);
        
        // Broadcast to all clients
        Long videoId = redisRoomStateService.getCurrentVideoId(roomId);
        broadcastPlaybackEvent(roomId, "PLAY", currentPosition, videoId, userId);
    }

    /**
     * Pause video - Redis only, no database
     */
    public void pause(Long roomId, Long userId, Double currentPosition) {
        // Update Redis cache only
        redisRoomStateService.updatePlayingStatus(roomId, false, currentPosition);

        Long videoId = redisRoomStateService.getCurrentVideoId(roomId);
        broadcastPlaybackEvent(roomId, "PAUSE", currentPosition, videoId, userId);
    }

    /**
     * Seek to position - Redis only, no database
     */
    public void seek(Long roomId, Long userId, Double position) {
        // Update Redis cache only
        redisRoomStateService.updatePosition(roomId, position);

        Long videoId = redisRoomStateService.getCurrentVideoId(roomId);
        broadcastPlaybackEvent(roomId, "SEEK", position, videoId, userId);
    }

    /**
     * Change video - Redis only, no database
     */
    public void changeVideo(Long roomId, Long userId, Long videoId) {
        // Just validate video exists
        videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));

        // Update Redis cache only
        redisRoomStateService.updateCurrentVideo(roomId, videoId);

        broadcastPlaybackEvent(roomId, "CHANGE_VIDEO", 0.0, videoId, userId);
    }

    public void syncPosition(Long roomId, Long userId, Double currentPosition) {
        // Update Redis cache only
        redisRoomStateService.updatePosition(roomId, currentPosition);
        
        // Get video ID from Redis and broadcast
        Long videoId = redisRoomStateService.getCurrentVideoId(roomId);
        broadcastPlaybackEvent(roomId, "SYNC", currentPosition, videoId, userId);
    }

    /**
     * Handle member joining room - broadcast to all members
     */
    public void memberJoined(Long roomId, Long userId) {
        // Get user info
        var user = videoRepository.findById(userId)
                .map(v -> null); // Placeholder - we need UserRepository
        
        String username = userRepository.findById(userId)
                .map(u -> u.getUsername())
                .orElse("Unknown");
        
        // Broadcast member joined event
        Map<String, Object> message = new HashMap<>();
        message.put("action", "MEMBER_JOINED");
        message.put("userId", userId);
        message.put("username", username);
        message.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }

    /**
     * Handle member leaving room - broadcast to all members
     */
    public void memberLeft(Long roomId, Long userId) {
        String username = userRepository.findById(userId)
                .map(u -> u.getUsername())
                .orElse("Unknown");
        
        // Broadcast member left event
        Map<String, Object> message = new HashMap<>();
        message.put("action", "MEMBER_LEFT");
        message.put("userId", userId);
        message.put("username", username);
        message.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }

    /**
     * Broadcast playback event to all room members via WebSocket
     * Includes senderId so clients can ignore their own messages
     */
    private void broadcastPlaybackEvent(Long roomId, String action, Double position, Long videoId, Long senderId) {
        Map<String, Object> message = new HashMap<>();
        message.put("action", action);
        message.put("position", position);
        message.put("videoId", videoId);
        message.put("senderId", senderId);
        message.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }
}
