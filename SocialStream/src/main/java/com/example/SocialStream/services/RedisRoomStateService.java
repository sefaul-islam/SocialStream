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
    private static final String ROOM_QUEUE_PREFIX = "room:queue:";
    private static final String ROOM_VOTES_PREFIX = "room:votes:";
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

    // ==================== Queue Vote Management ====================
    
    /**
     * Toggle vote for a queue item (add if not exists, remove if exists)
     * Returns true if vote was added, false if removed
     */
    public boolean toggleVote(Long roomId, Long queueItemId, Long userId) {
        try {
            String votesKey = ROOM_VOTES_PREFIX + roomId + ":" + userId;
            @SuppressWarnings("unchecked")
            Map<String, Boolean> userVotes = (Map<String, Boolean>) redisTemplate.opsForValue().get(votesKey);
            
            if (userVotes == null) {
                userVotes = new HashMap<>();
            }
            
            String queueItemKey = String.valueOf(queueItemId);
            boolean hasVoted = userVotes.containsKey(queueItemKey) && userVotes.get(queueItemKey);
            
            if (hasVoted) {
                // Remove vote
                userVotes.put(queueItemKey, false);
                decrementQueueVote(roomId, queueItemId);
                redisTemplate.opsForValue().set(votesKey, userVotes, EXPIRATION_HOURS, TimeUnit.HOURS);
                return false;
            } else {
                // Add vote
                userVotes.put(queueItemKey, true);
                incrementQueueVote(roomId, queueItemId);
                redisTemplate.opsForValue().set(votesKey, userVotes, EXPIRATION_HOURS, TimeUnit.HOURS);
                return true;
            }
        } catch (Exception e) {
            log.warn("Failed to toggle vote in Redis: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Increment vote count for a queue item
     */
    private void incrementQueueVote(Long roomId, Long queueItemId) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            redisTemplate.opsForZSet().incrementScore(queueKey, String.valueOf(queueItemId), 1.0);
            redisTemplate.expire(queueKey, EXPIRATION_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to increment queue vote: {}", e.getMessage());
        }
    }
    
    /**
     * Decrement vote count for a queue item
     */
    private void decrementQueueVote(Long roomId, Long queueItemId) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            redisTemplate.opsForZSet().incrementScore(queueKey, String.valueOf(queueItemId), -1.0);
            redisTemplate.expire(queueKey, EXPIRATION_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to decrement queue vote: {}", e.getMessage());
        }
    }
    
    /**
     * Get vote count for a specific queue item
     */
    public Integer getQueueItemVotes(Long roomId, Long queueItemId) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            Double score = redisTemplate.opsForZSet().score(queueKey, String.valueOf(queueItemId));
            return score != null ? score.intValue() : 0;
        } catch (Exception e) {
            log.warn("Failed to get queue item votes: {}", e.getMessage());
            return 0;
        }
    }
    
    /**
     * Get all queue items with their vote counts, sorted by votes (descending)
     */
    public Map<Long, Integer> getQueueVotes(Long roomId) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            // Get all items sorted by score descending
            var items = redisTemplate.opsForZSet().reverseRangeWithScores(queueKey, 0, -1);
            
            Map<Long, Integer> votes = new HashMap<>();
            if (items != null) {
                for (var item : items) {
                    Long queueItemId = Long.valueOf((String) item.getValue());
                    Integer voteCount = item.getScore() != null ? item.getScore().intValue() : 0;
                    votes.put(queueItemId, voteCount);
                }
            }
            return votes;
        } catch (Exception e) {
            log.warn("Failed to get queue votes: {}", e.getMessage());
            return new HashMap<>();
        }
    }
    
    /**
     * Check if user has voted for a queue item
     */
    public boolean hasUserVoted(Long roomId, Long queueItemId, Long userId) {
        try {
            String votesKey = ROOM_VOTES_PREFIX + roomId + ":" + userId;
            @SuppressWarnings("unchecked")
            Map<String, Boolean> userVotes = (Map<String, Boolean>) redisTemplate.opsForValue().get(votesKey);
            
            if (userVotes == null) {
                return false;
            }
            
            String queueItemKey = String.valueOf(queueItemId);
            return userVotes.containsKey(queueItemKey) && userVotes.get(queueItemKey);
        } catch (Exception e) {
            log.warn("Failed to check user vote: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Add queue item to Redis (when new video added to queue)
     */
    public void addQueueItem(Long roomId, Long queueItemId, Integer initialVotes) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            redisTemplate.opsForZSet().add(queueKey, String.valueOf(queueItemId), initialVotes.doubleValue());
            redisTemplate.expire(queueKey, EXPIRATION_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to add queue item to Redis: {}", e.getMessage());
        }
    }
    
    /**
     * Remove queue item from Redis
     */
    public void removeQueueItem(Long roomId, Long queueItemId) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            redisTemplate.opsForZSet().remove(queueKey, String.valueOf(queueItemId));
        } catch (Exception e) {
            log.warn("Failed to remove queue item from Redis: {}", e.getMessage());
        }
    }
    
    /**
     * Initialize queue in Redis from database
     */
    public void initializeQueue(Long roomId, Map<Long, Integer> queueVotes) {
        try {
            String queueKey = ROOM_QUEUE_PREFIX + roomId;
            // Clear existing queue
            redisTemplate.delete(queueKey);
            
            // Add all items with their vote counts
            for (Map.Entry<Long, Integer> entry : queueVotes.entrySet()) {
                redisTemplate.opsForZSet().add(queueKey, String.valueOf(entry.getKey()), entry.getValue().doubleValue());
            }
            
            redisTemplate.expire(queueKey, EXPIRATION_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to initialize queue in Redis: {}", e.getMessage());
        }
    }
    
    /**
     * Get user's votes for a room (for vote persistence)
     */
    public Map<Long, Boolean> getUserVotes(Long roomId, Long userId) {
        try {
            String votesKey = ROOM_VOTES_PREFIX + roomId + ":" + userId;
            @SuppressWarnings("unchecked")
            Map<String, Boolean> userVotes = (Map<String, Boolean>) redisTemplate.opsForValue().get(votesKey);
            
            if (userVotes == null) {
                return new HashMap<>();
            }
            
            Map<Long, Boolean> result = new HashMap<>();
            for (Map.Entry<String, Boolean> entry : userVotes.entrySet()) {
                result.put(Long.valueOf(entry.getKey()), entry.getValue());
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to get user votes: {}", e.getMessage());
            return new HashMap<>();
        }
    }
}
