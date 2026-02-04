package com.example.SocialStream.services;

import com.example.SocialStream.entities.*;
import com.example.SocialStream.repositories.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomQueueService {

    private final RoomQueueRepository roomQueueRepository;
    private final VoteRepository voteRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisRoomStateService redisRoomStateService;

    /**
     * Add a video to the room queue
     */
    @Transactional
    public RoomQueue addToQueue(Long roomId, Long videoId, Long userId) {
        // Validate user is a member of the room
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        // Check if video already exists in queue
        if (roomQueueRepository.existsByRoomIdAndVideoId(roomId, videoId)) {
            throw new RuntimeException("Video already exists in queue");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get next position
        List<RoomQueue> existingQueue = roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
        int nextPosition = existingQueue.size() + 1;

        RoomQueue queueItem = new RoomQueue();
        queueItem.setRoom(room);
        queueItem.setVideo(video);
        queueItem.setAddedBy(user);
        queueItem.setPosition(nextPosition);
        queueItem.setTotalVotes(0);
        queueItem.setAddedAt(LocalDateTime.now());

        RoomQueue saved = roomQueueRepository.save(queueItem);
        
        // Add to Redis queue with initial vote count
        redisRoomStateService.addQueueItem(roomId, saved.getId(), 0);
        
        // Broadcast queue update to all room members with full queue data
        broadcastQueueUpdateWithData(roomId, "QUEUE_UPDATED");
        
        return saved;
    }

    /**
     * Remove a video from the queue (Host only)
     */
    @Transactional
    public void removeFromQueue(Long queueId, Long userId) {
        RoomQueue queueItem = roomQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue item not found"));

        // Validate user is host or admin
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(queueItem.getRoom().getId(), userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        if (member.getRole() != RoomMember.Role.HOST && member.getRole() != RoomMember.Role.ADMIN) {
            throw new RuntimeException("Only host or admin can remove items from queue");
        }

        Long roomId = queueItem.getRoom().getId();
        Long queueItemId = queueItem.getId();
        
        roomQueueRepository.delete(queueItem);
        
        // Remove from Redis queue
        redisRoomStateService.removeQueueItem(roomId, queueItemId);
        
        // Broadcast queue update to all room members with full queue data
        broadcastQueueUpdateWithData(roomId, "QUEUE_UPDATED");
    }

    /**
     * Toggle vote on a queue item (Real-time with Redis)
     */
    @Transactional
    public Map<String, Object> toggleVote(Long queueId, Long userId) {
        RoomQueue queueItem = roomQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue item not found"));

        // Validate user is a member
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(queueItem.getRoom().getId(), userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this room"));

        Long roomId = queueItem.getRoom().getId();
        
        // Toggle vote in Redis (real-time)
        boolean voteAdded = redisRoomStateService.toggleVote(roomId, queueId, userId);
        
        // Also update database for persistence (async-style, fire and forget)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (voteAdded) {
            // Add vote to database
            if (!voteRepository.existsByUserIdAndQueueItemId(userId, queueId)) {
                Vote vote = new Vote();
                vote.setUser(user);
                vote.setQueueItem(queueItem);
                vote.setVotedAt(LocalDateTime.now());
                voteRepository.save(vote);
                queueItem.setTotalVotes(queueItem.getTotalVotes() + 1);
                roomQueueRepository.save(queueItem);
            }
        } else {
            // Remove vote from database
            if (voteRepository.existsByUserIdAndQueueItemId(userId, queueId)) {
                voteRepository.deleteByUserIdAndQueueItemId(userId, queueId);
                queueItem.setTotalVotes(Math.max(0, queueItem.getTotalVotes() - 1));
                roomQueueRepository.save(queueItem);
            }
        }
        
        // Broadcast queue update with full data (no refetch needed)
        broadcastQueueUpdateWithData(roomId, "VOTE_UPDATED");
        
        // Return result
        Map<String, Object> result = new HashMap<>();
        result.put("voteAdded", voteAdded);
        result.put("totalVotes", redisRoomStateService.getQueueItemVotes(roomId, queueId));
        return result;
    }

    /**
     * Get queue for a room (ordered by votes DESC, then addedAt ASC)
     * Votes are loaded from Redis for real-time accuracy
     */
    public List<RoomQueue> getQueue(Long roomId, Long userId) {
        // Validate user is a member
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("User is not a member of this room");
        }

        List<RoomQueue> queue = roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
        
        // Get real-time votes from Redis
        Map<Long, Integer> redisVotes = redisRoomStateService.getQueueVotes(roomId);
        
        // Update queue items with Redis vote counts
        for (RoomQueue item : queue) {
            Integer redisVoteCount = redisVotes.get(item.getId());
            if (redisVoteCount != null) {
                item.setTotalVotes(redisVoteCount);
            }
        }
        
        // Re-sort by votes (descending) and then by addedAt (ascending)
        queue.sort((a, b) -> {
            int voteCompare = b.getTotalVotes().compareTo(a.getTotalVotes());
            if (voteCompare != 0) return voteCompare;
            return a.getAddedAt().compareTo(b.getAddedAt());
        });
        
        return queue;
    }
    
    /**
     * Initialize Redis queue from database (called when room is first accessed)
     */
    public void initializeRedisQueue(Long roomId) {
        List<RoomQueue> queue = roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
        Map<Long, Integer> queueVotes = new HashMap<>();
        
        for (RoomQueue item : queue) {
            queueVotes.put(item.getId(), item.getTotalVotes());
        }
        
        redisRoomStateService.initializeQueue(roomId, queueVotes);
    }

    /**
     * Check if user has voted on a queue item (check Redis first, fallback to DB)
     */
    public boolean hasUserVoted(Long queueId, Long userId) {
        // Get room ID from queue item
        RoomQueue queueItem = roomQueueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue item not found"));
        
        // Check Redis first for real-time data
        boolean votedInRedis = redisRoomStateService.hasUserVoted(queueItem.getRoom().getId(), queueId, userId);
        
        // If not in Redis, check database as fallback
        if (!votedInRedis) {
            return voteRepository.existsByUserIdAndQueueItemId(userId, queueId);
        }
        
        return votedInRedis;
    }

    /**
     * Broadcast queue update to all room members via WebSocket (legacy - simple notification)
     */
    private void broadcastQueueUpdate(Long roomId, String action) {
        Map<String, Object> message = new HashMap<>();
        message.put("action", action);
        message.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }
    
    /**
     * Broadcast queue update with full queue data (no refetch needed)
     */
    private void broadcastQueueUpdateWithData(Long roomId, String action) {
        // Get queue items from database
        List<RoomQueue> queue = roomQueueRepository.findByRoomIdOrderByTotalVotesDescAddedAtAsc(roomId);
        
        // Get real-time votes from Redis
        Map<Long, Integer> redisVotes = redisRoomStateService.getQueueVotes(roomId);
        
        // Update queue items with Redis vote counts
        for (RoomQueue item : queue) {
            Integer redisVoteCount = redisVotes.get(item.getId());
            if (redisVoteCount != null) {
                item.setTotalVotes(redisVoteCount);
            }
        }
        
        // Re-sort by votes (descending) and then by addedAt (ascending)
        queue.sort((a, b) -> {
            int voteCompare = b.getTotalVotes().compareTo(a.getTotalVotes());
            if (voteCompare != 0) return voteCompare;
            return a.getAddedAt().compareTo(b.getAddedAt());
        });
        
        Map<String, Object> message = new HashMap<>();
        message.put("action", action);
        message.put("queue", queue);
        message.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) message);
    }
    
    /**
     * Persist Redis votes back to database (called on room close or periodically)
     */
    @Transactional
    public void persistVotesToDatabase(Long roomId) {
        Map<Long, Integer> redisVotes = redisRoomStateService.getQueueVotes(roomId);
        
        for (Map.Entry<Long, Integer> entry : redisVotes.entrySet()) {
            Long queueItemId = entry.getKey();
            Integer voteCount = entry.getValue();
            
            roomQueueRepository.findById(queueItemId).ifPresent(queueItem -> {
                queueItem.setTotalVotes(voteCount);
                roomQueueRepository.save(queueItem);
            });
        }
    }
}
